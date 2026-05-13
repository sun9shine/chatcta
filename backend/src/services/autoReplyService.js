const axios = require('axios');
const Bot = require('../models/Bot');
const Page = require('../models/Page');
const Message = require('../models/Message');
const Comment = require('../models/Comment');
const PlatformConfig = require('../models/PlatformConfig');

class AutoReplyService {
  // Send message via platform API
  async sendMessage(page, recipientId, content, imageUrl = null) {
    try {
      switch (page.platform) {
        case 'facebook':
        case 'instagram':
          return await this._sendFBMessage(page, recipientId, content, imageUrl);
        case 'telegram':
          return await this._sendTelegramMessage(page, recipientId, content, imageUrl);
        case 'whatsapp':
          return await this._sendWhatsAppMessage(page, recipientId, content, imageUrl);
        default:
          console.log(`Platform ${page.platform} send not implemented`);
      }
    } catch (err) {
      console.error('Send message error:', err.message);
    }
  }

  async _sendFBMessage(page, recipientId, content, imageUrl) {
    const body = { recipient: { id: recipientId }, message: imageUrl
      ? { attachment: { type: 'image', payload: { url: imageUrl, is_reusable: true } } }
      : { text: content }
    };
    await axios.post(`https://graph.facebook.com/v18.0/me/messages?access_token=${page.accessToken}`, body);
  }

  async _sendTelegramMessage(page, chatId, content, imageUrl) {
    const token = page.accessToken;
    if (imageUrl) {
      await axios.post(`https://api.telegram.org/bot${token}/sendPhoto`, { chat_id: chatId, photo: imageUrl, caption: content });
    } else {
      await axios.post(`https://api.telegram.org/bot${token}/sendMessage`, { chat_id: chatId, text: content });
    }
  }

  async _sendWhatsAppMessage(page, to, content, imageUrl) {
    const config = await PlatformConfig.findOne({ platform: 'whatsapp' });
    const token = page.accessToken || config?.accessToken;
    const phoneId = page.pageId;
    const body = imageUrl
      ? { messaging_product: 'whatsapp', to, type: 'image', image: { link: imageUrl, caption: content } }
      : { messaging_product: 'whatsapp', to, type: 'text', text: { body: content } };
    await axios.post(`https://graph.facebook.com/v18.0/${phoneId}/messages`, body, {
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
    });
  }

  // Reply to a Facebook/Instagram comment
  async replyToComment(page, commentId, content) {
    try {
      await axios.post(`https://graph.facebook.com/v18.0/${commentId}/comments?access_token=${page.accessToken}`, { message: content });
    } catch (err) {
      console.error('Comment reply error:', err.message);
    }
  }

  // Process incoming comment - find matching bot and respond
  async processComment(pageDoc, commentData) {
    const bots = await Bot.find({
      userId: pageDoc.userId,
      isActive: true,
      platform: { $in: [pageDoc.platform, 'all'] },
      type: { $in: ['comment_reply', 'post_dm'] },
      $or: [
        { allPosts: true },
        { targetPosts: commentData.postId }
      ]
    });

    for (const bot of bots) {
      // Check triggers
      if (bot.triggers.length > 0) {
        const matched = bot.triggers.some(t => {
          const text = t.caseSensitive ? commentData.content : commentData.content?.toLowerCase();
          const kw = t.caseSensitive ? t.keyword : t.keyword?.toLowerCase();
          if (t.matchType === 'exact') return text === kw;
          if (t.matchType === 'contains') return text?.includes(kw);
          if (t.matchType === 'starts_with') return text?.startsWith(kw);
          if (t.matchType === 'regex') return new RegExp(kw).test(text);
          return false;
        });
        if (!matched) continue;
      }

      for (const action of bot.actions) {
        // ── Build the replies list to send ─────────────────────────────────
        // If action has a replies array (new multi-reply mode), use it.
        // Otherwise fall back to the legacy single message.
        let repliesToSend = [];

        if (action.replies && action.replies.length > 0) {
          // Only send enabled replies, sorted by order
          repliesToSend = action.replies
            .filter(r => r.isEnabled !== false)
            .sort((a, b) => (a.order || 0) - (b.order || 0));
        } else {
          // Legacy mode: single reply built from action fields
          repliesToSend = [{
            message:      action.message,
            imageUrl:     action.imageUrl,
            linkUrl:      action.linkUrl,
            linkText:     action.linkText,
            delay:        action.delay || 0,
            delayEnabled: (action.delay || 0) > 0,
            isEnabled:    true
          }];
        }

        // ── Send each reply in sequence ────────────────────────────────────
        for (const reply of repliesToSend) {
          let content = reply.message || '';

          // AI response (only on first reply if AI is enabled)
          if (bot.useAI && bot.aiPrompt && !content) {
            content = await this.getAIResponse(bot.aiPrompt, commentData.content);
          }

          // Append link if provided
          if (reply.linkUrl) {
            const linkLabel = reply.linkText || reply.linkUrl;
            content = content
              ? `${content}\n\n${linkLabel}\n${reply.linkUrl}`
              : `${linkLabel}\n${reply.linkUrl}`;
          }

          // Apply delay only when delayEnabled = true
          if (reply.delayEnabled && reply.delay > 0) {
            await new Promise(r => setTimeout(r, reply.delay * 1000));
          }

          if (action.type === 'comment') {
            await this.replyToComment(pageDoc, commentData.commentId, content);
            await Comment.findOneAndUpdate(
              { commentId: commentData.commentId },
              {
                'reply.sent':   true,
                'reply.content': content,
                'reply.sentAt': new Date(),
                'reply.botId':  bot._id
              }
            );
          } else if (action.type === 'dm') {
            await this.sendMessage(pageDoc, commentData.senderId, content, reply.imageUrl);
            await Message.create({
              userId:      pageDoc.userId,
              pageId:      pageDoc._id,
              platform:    pageDoc.platform,
              type:        'outgoing',
              recipientId: commentData.senderId,
              content,
              imageUrl:    reply.imageUrl,
              isAutoReply: true,
              botId:       bot._id,
              status:      'sent',
              sentAt:      new Date()
            });
          }
        } // end replies loop
      } // end actions loop

      // Update bot stats
      bot.stats.totalReplies += 1; bot.stats.lastRun = new Date();
      await bot.save();
    }
  }

  // AI Response using OpenAI
  async getAIResponse(systemPrompt, userMessage) {
    try {
      if (!process.env.OPENAI_API_KEY) return userMessage;
      const { OpenAI } = require('openai');
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
      const resp = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage }
        ],
        max_tokens: 300
      });
      return resp.choices[0].message.content;
    } catch (err) {
      console.error('AI Error:', err.message);
      return userMessage;
    }
  }
}

module.exports = new AutoReplyService();
