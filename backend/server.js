const express = require('express');
const cors = require('cors');
const { scrape } = require('./scraper');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());

app.get('/api/scrape', async (req, res) => {
  let { url, maxDepth } = req.query;

  if (!url) {
    return res.status(400).json({ error: 'URL is required' });
  }

  // Sanitize and ensure URL starts with http(s)
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    url = 'https://' + url;
  }

  let validatedUrl;
  try {
    validatedUrl = new URL(url);
  } catch (e) {
    return res.status(400).json({ error: 'Invalid URL provided' });
  }

  let depth = parseInt(maxDepth, 10);
  if (isNaN(depth) || depth < 1 || depth > 5) {
    return res.status(400).json({ error: 'maxDepth must be a number between 1 and 5' });
  }

  // Setup SSE
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive'
  });

  const state = { aborted: false };
  req.on('close', () => {
    state.aborted = true;
  });

  try {
    await scrape(url, depth, res, state);
    res.write('event: done\ndata: {}\n\n');
  } catch (error) {
    console.error('Scraping error:', error);
    res.write(`event: error\ndata: ${JSON.stringify({ message: error.message || 'An unexpected error occurred' })}\n\n`);
  } finally {
    res.end();
  }
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

module.exports = app;
