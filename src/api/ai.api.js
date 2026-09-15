import client from './client';

export const aiApi = {
  // WhatsApp Parchi / Grocery List Text Parsing
  parseParchi: async (rawText) => {
    const res = await client.post('/ai/parse-parchi', { raw_text: rawText });
    return res.data?.data || res.data;
  },

  // Visual Product Scanner via Base64 Image
  scanProduct: async (imageBase64) => {
    const res = await client.post('/ai/scan-product', { image_base64: imageBase64 });
    return res.data?.data || res.data;
  },

  // Merchant Copilot
  merchantCopilot: async (prompt) => {
    const res = await client.post('/ai/merchant-copilot', { prompt });
    return res.data?.data || res.data;
  },
};
