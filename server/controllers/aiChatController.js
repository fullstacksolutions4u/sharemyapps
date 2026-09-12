const aiChatService = require('../services/aiChat.service');

exports.aiChat = async (req, res) => {
  const { messages = [] } = req.body;

  if (!messages.length) {
    return res.status(400).json({ message: 'messages array is required' });
  }

  try {
    const stream = await aiChatService.getChatStream(messages);

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    for await (const chunk of stream) {
      const text = chunk.choices[0]?.delta?.content;
      if (text) {
        res.write(`data: ${JSON.stringify({ text })}\n\n`);
      }
    }

    res.write('data: [DONE]\n\n');
    res.end();
  } catch (err) {
    if (!res.headersSent) {
      const status = err.status || 500;
      res.status(status).json({ message: err.message });
    } else {
      res.write(`data: ${JSON.stringify({ error: err.message })}\n\n`);
      res.end();
    }
  }
};
