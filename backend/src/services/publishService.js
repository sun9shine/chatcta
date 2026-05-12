const axios = require('axios');

class PublishService {
  async publishToPages(pages, content, imageUrl) {
    const results = { success: 0, failed: 0, details: [] };
    for (const page of pages) {
      try {
        await this.publishToPage(page, content, imageUrl);
        results.success++;
        results.details.push({ pageId: page._id, pageName: page.pageName, status: 'success' });
      } catch (err) {
        results.failed++;
        results.details.push({ pageId: page._id, pageName: page.pageName, status: 'failed', error: err.message });
      }
    }
    return results;
  }

  async publishToPage(page, content, imageUrl) {
    switch (page.platform) {
      case 'facebook':
        return await this._publishFacebook(page, content, imageUrl);
      case 'instagram':
        return await this._publishInstagram(page, content, imageUrl);
      case 'telegram':
        return await this._publishTelegram(page, content, imageUrl);
      case 'whatsapp':
        // WhatsApp doesn't support bulk publishing
        break;
    }
  }

  async _publishFacebook(page, content, imageUrl) {
    if (imageUrl) {
      await axios.post(`https://graph.facebook.com/v18.0/${page.pageId}/photos?access_token=${page.accessToken}`, { url: imageUrl, caption: content });
    } else {
      await axios.post(`https://graph.facebook.com/v18.0/${page.pageId}/feed?access_token=${page.accessToken}`, { message: content });
    }
  }

  async _publishInstagram(page, content, imageUrl) {
    if (imageUrl) {
      const mediaResp = await axios.post(`https://graph.facebook.com/v18.0/${page.pageId}/media?image_url=${imageUrl}&caption=${encodeURIComponent(content)}&access_token=${page.accessToken}`);
      await axios.post(`https://graph.facebook.com/v18.0/${page.pageId}/media_publish?creation_id=${mediaResp.data.id}&access_token=${page.accessToken}`);
    }
  }

  async _publishTelegram(page, content, imageUrl) {
    const token = page.accessToken;
    const chatId = page.metadata?.chatId;
    if (!chatId) return;
    if (imageUrl) {
      await axios.post(`https://api.telegram.org/bot${token}/sendPhoto`, { chat_id: chatId, photo: imageUrl, caption: content });
    } else {
      await axios.post(`https://api.telegram.org/bot${token}/sendMessage`, { chat_id: chatId, text: content });
    }
  }
}

module.exports = new PublishService();
