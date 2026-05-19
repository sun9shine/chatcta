const axios = require('axios');
const Bot = require('../models/Bot');
const Page = require('../models/Page');
const Message = require('../models/Message');
const Comment = require('../models/Comment');
const PlatformConfig = require('../models/PlatformConfig');
const AIConfig = require('../models/AIConfig');

class AutoReplyService {

  // ═══════════════════════════════════════════════════════════════════════════
  // SECTION 1 — SEND API (real platform APIs, not simulation)
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * sendMessage — send a DM/reply via the appropriate platform API
   * @param {Object} page       — Page document (has pageId, accessToken, platform)
   * @param {string} recipientId
   * @param {string} content
   * @param {string|null} imageUrl
   */
  async sendMessage(page, recipientId, content, imageUrl = null) {
    try {
      switch (page.platform) {
        case 'facebook':
        case 'instagram':
          return await this._fbSendAPI(page, recipientId, content, imageUrl);
        case 'whatsapp':
          return await this._waSendAPI(page, recipientId, content, imageUrl);
        case 'telegram':
          return await this._tgSendAPI(page, recipientId, content, imageUrl);
        case 'tiktok':
          console.log('[AutoReply] TikTok DM send not yet available via public API');
          break;
        default:
          console.warn('[AutoReply] Unknown platform:', page.platform);
      }
    } catch (err) {
      console.error(`[AutoReply] sendMessage error (${page.platform}):`, err.response?.data || err.message);
    }
  }

  // ── Facebook / Instagram Send API ────────────────────────────────────────
  async _fbSendAPI(page, recipientId, content, imageUrl) {
    const token = page.accessToken;
    if (!token) throw new Error('Missing page access token');

    const body = {
      recipient: { id: recipientId },
      message: imageUrl
        ? { attachment: { type: 'image', payload: { url: imageUrl, is_reusable: true } } }
        : { text: content }
    };

    const resp = await axios.post(
      `https://graph.facebook.com/v18.0/me/messages`,
      body,
      { params: { access_token: token }, headers: { 'Content-Type': 'application/json' } }
    );
    console.log(`[AutoReply] FB/IG DM sent to ${recipientId} → message_id: ${resp.data.message_id}`);
    return resp.data;
  }

  // ── WhatsApp Cloud API Send ───────────────────────────────────────────────
  async _waSendAPI(page, to, content, imageUrl) {
    const cfg = await PlatformConfig.findOne({ platform: 'whatsapp' });
    const token = page.accessToken || cfg?.accessToken;
    const phoneId = page.pageId;
    if (!token || !phoneId) throw new Error('Missing WhatsApp token or phoneId');

    const body = imageUrl
      ? { messaging_product: 'whatsapp', to, type: 'image', image: { link: imageUrl, caption: content } }
      : { messaging_product: 'whatsapp', to, type: 'text', text: { body: content } };

    const resp = await axios.post(
      `https://graph.facebook.com/v18.0/${phoneId}/messages`,
      body,
      { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } }
    );
    console.log(`[AutoReply] WA message sent to ${to}`);
    return resp.data;
  }

  // ── Telegram Bot API Send ─────────────────────────────────────────────────
  async _tgSendAPI(page, chatId, content, imageUrl) {
    const token = page.accessToken;
    if (!token) throw new Error('Missing Telegram bot token');

    const url = `https://api.telegram.org/bot${token}`;
    if (imageUrl) {
      const resp = await axios.post(`${url}/sendPhoto`, { chat_id: chatId, photo: imageUrl, caption: content });
      return resp.data;
    } else {
      const resp = await axios.post(`${url}/sendMessage`, { chat_id: chatId, text: content, parse_mode: 'HTML' });
      return resp.data;
    }
  }

  // ── Facebook/Instagram — comment reply ───────────────────────────────────
  async replyToComment(page, commentId, content) {
    const token = page.accessToken;
    if (!token) { console.error('[AutoReply] Missing token for comment reply'); return; }
    try {
      await axios.post(
        `https://graph.facebook.com/v18.0/${commentId}/comments`,
        { message: content },
        { params: { access_token: token } }
      );
      console.log(`[AutoReply] Comment reply sent → commentId: ${commentId}`);
    } catch (err) {
      console.error('[AutoReply] replyToComment error:', err.response?.data || err.message);
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SECTION 2 — AI ENGINE (uses admin-configured AIConfig, not OPENAI_API_KEY)
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * getAIResponse — call the configured AI model (from admin AI settings)
   * Falls back to legacy OPENAI_API_KEY env var if no admin config found.
   */
  async getAIResponse(botSystemPrompt, userMessage) {
    try {
      // 1. Try admin-configured AI model
      const aiCfg = await AIConfig.findOne({ globalEnabled: true });
      if (aiCfg && aiCfg.models && aiCfg.models.length > 0) {
        // Find default model or first enabled
        const model = aiCfg.models.find(m => m.isDefault && m.isEnabled)
          || aiCfg.models.find(m => m.isEnabled);

        if (model && model.apiKey) {
          const baseUrl = model.baseUrl || 'https://api.openai.com/v1';
          const systemPrompt = botSystemPrompt || model.systemPrompt || 'You are a helpful assistant.';
          const resp = await axios.post(
            `${baseUrl}/chat/completions`,
            {
              model: model.model || 'gpt-3.5-turbo',
              messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userMessage }
              ],
              max_tokens: model.maxTokens || 300,
              temperature: model.temperature || 0.7
            },
            { headers: { Authorization: `Bearer ${model.apiKey}`, 'Content-Type': 'application/json' }, timeout: 15000 }
          );
          return resp.data.choices[0].message.content;
        }
      }

      // 2. Fallback: legacy OPENAI_API_KEY env var
      if (process.env.OPENAI_API_KEY) {
        const { OpenAI } = require('openai');
        const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
        const resp = await openai.chat.completions.create({
          model: 'gpt-3.5-turbo',
          messages: [
            { role: 'system', content: botSystemPrompt || 'You are a helpful assistant.' },
            { role: 'user', content: userMessage }
          ],
          max_tokens: 300
        });
        return resp.choices[0].message.content;
      }

      console.warn('[AutoReply] No AI configured. Returning null.');
      return null;
    } catch (err) {
      console.error('[AutoReply] AI error:', err.message);
      return null;
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SECTION 3 — AUTOMATION LOGIC
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * _buildMessageContent — assemble final text from reply object
   */
  _buildContent(reply, aiContent) {
    let content = aiContent || reply.message || '';
    if (reply.linkUrl) {
      const label = reply.linkText || reply.linkUrl;
      content = content ? `${content}\n\n${label}\n${reply.linkUrl}` : `${label}\n${reply.linkUrl}`;
    }
    return content;
  }

  /**
   * _processReplies — send each reply in the replies[] array in sequence
   */
  async _processReplies(replies, actionType, page, commentData, bot) {
    const enabled = [...replies]
      .filter(r => r.isEnabled !== false)
      .sort((a, b) => (a.order || 0) - (b.order || 0));

    for (const reply of enabled) {
      let content = reply.message || '';

      // AI reply
      if (bot.useAI) {
        const aiText = await this.getAIResponse(bot.aiPrompt, commentData.content);
        if (aiText) content = this._buildContent(reply, aiText);
        else content = this._buildContent(reply, content);
      } else {
        content = this._buildContent(reply, content);
      }

      if (!content) continue;

      // Optional delay
      if (reply.delayEnabled && reply.delay > 0) {
        console.log(`[AutoReply] Waiting ${reply.delay}s before next reply...`);
        await new Promise(resolve => setTimeout(resolve, reply.delay * 1000));
      }

      // Execute action
      // Ensure stats object exists
      if (!bot.stats) bot.stats = { totalReplies: 0, totalDMs: 0 };

      if (actionType === 'comment' && commentData.commentId) {
        await this.replyToComment(page, commentData.commentId, content);
        await Comment.findOneAndUpdate(
          { commentId: commentData.commentId },
          { 'reply.sent': true, 'reply.content': content, 'reply.sentAt': new Date(), 'reply.botId': bot._id }
        );
        bot.stats.totalReplies = (bot.stats.totalReplies || 0) + 1;
      } else if (actionType === 'dm' && commentData.senderId) {
        await this.sendMessage(page, commentData.senderId, content, reply.imageUrl);
        await Message.create({
          userId: page.userId, pageId: page._id, platform: page.platform,
          type: 'outgoing', recipientId: commentData.senderId, content,
          imageUrl: reply.imageUrl, isAutoReply: true, botId: bot._id, status: 'sent', sentAt: new Date()
        });
        bot.stats.totalDMs = (bot.stats.totalDMs || 0) + 1;
      }
    }
  }

  /**
   * processComment — main entry point from webhooks
   * Finds all matching bots for this page + event, then runs automation
   */
  async processComment(pageDoc, commentData) {
    if (!pageDoc || !commentData) return;

    // Validate page has access token before attempting any replies
    if (!pageDoc.accessToken) {
      console.warn(`[AutoReply] Page "${pageDoc.pageName || pageDoc.pageId}" has no accessToken — skipping`);
      return;
    }

    console.log(`[AutoReply] Processing event on ${pageDoc.platform} | page: ${pageDoc.pageName || pageDoc.pageId} | content: "${commentData.content?.slice(0, 50)}"`);

    // ── Find matching bots ─────────────────────────────────────────────────
    const bots = await Bot.find({
      userId: pageDoc.userId,
      isActive: true,
      platform: { $in: [pageDoc.platform, 'all'] }
    });

    if (bots.length === 0) {
      console.log('[AutoReply] No active bots found for this page/platform');
      return;
    }

    for (const bot of bots) {
      try {
        // ── Post filter ──────────────────────────────────────────────────
        const postMatches = bot.allPosts || (bot.targetPosts || []).includes(commentData.postId);

        // ── Run standard actions ─────────────────────────────────────────
        if (postMatches && ['comment_reply', 'dm_reply', 'post_dm', 'keyword', 'ai'].includes(bot.type)) {

          // Keyword trigger check
          if ((bot.triggers || []).length > 0) {
            const matched = bot.triggers.some(t => {
              const text = t.caseSensitive ? (commentData.content || '') : (commentData.content || '').toLowerCase();
              const kw = t.caseSensitive ? (t.keyword || '') : (t.keyword || '').toLowerCase();
              if (t.matchType === 'exact')       return text === kw;
              if (t.matchType === 'contains')    return text.includes(kw);
              if (t.matchType === 'starts_with') return text.startsWith(kw);
              if (t.matchType === 'regex')       { try { return new RegExp(kw).test(text); } catch { return false; } }
              return false;
            });
            if (!matched) { console.log(`[AutoReply] Bot "${bot.name}" — trigger not matched, skipping`); continue; }
          }

          for (const action of (bot.actions || [])) {
            let repliesToSend;

            if (action.replies && action.replies.length > 0) {
              // New multi-reply mode
              repliesToSend = action.replies;
            } else {
              // Legacy single message
              repliesToSend = [{
                message:      action.message || '',
                imageUrl:     action.imageUrl || '',
                linkUrl:      action.linkUrl || '',
                linkText:     action.linkText || '',
                delay:        action.delay || 0,
                delayEnabled: (action.delay || 0) > 0,
                isEnabled:    true,
                order:        0
              }];
            }

            if (repliesToSend.some(r => r.message || r.linkUrl) || bot.useAI) {
              await this._processReplies(repliesToSend, action.type, pageDoc, commentData, bot);
            }
          }
        }

        // ── Post-Comment DM rules ────────────────────────────────────────
        for (const rule of (bot.postCommentDMs || [])) {
          if (!rule.isEnabled) continue;
          if (rule.pageId?.toString() !== pageDoc._id?.toString()) continue;
          if (rule.postId && rule.postId !== commentData.postId) continue;

          // Optional keyword filter on DM rules
          if ((rule.keywords || []).length > 0) {
            const text = (commentData.content || '').toLowerCase();
            const kws = (rule.keywords || []).map(k => k.toLowerCase());
            const matched = rule.matchAll ? kws.every(k => text.includes(k)) : kws.some(k => text.includes(k));
            if (!matched) continue;
          }

          console.log(`[AutoReply] Post-comment DM rule triggered for bot "${bot.name}"`);
          await this._processReplies(rule.replies || [], 'dm', pageDoc, commentData, bot);
        }

        bot.stats.lastRun = new Date();
        await bot.save();

      } catch (err) {
        console.error(`[AutoReply] Error processing bot "${bot.name}":`, err.message);
      }
    }
  }
}

module.exports = new AutoReplyService();
