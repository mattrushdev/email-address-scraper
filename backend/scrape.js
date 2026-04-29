const axios = require('axios');
const cheerio = require('cheerio');
const findEmails = require('./findEmails');
const findLinks = require('./findLinks');

async function scrape(inputUrl, maxDepth, res, state) {
  const visitedUrls = new Set();
  const foundEmails = new Set();

  const parsedInputUrl = new URL(inputUrl);
  const inputDomain = parsedInputUrl.hostname;
  const inputPath = parsedInputUrl.pathname;

  // Queue stores objects: { url, depth }
  const queue = [{ url: inputUrl, depth: 1 }];

  while (queue.length > 0) {
    const current = queue.shift();
    const currentUrl = current.url;
    const currentDepth = current.depth;

    if (state && state.aborted) {
      console.log('Client aborted connection. Stopping scrape.');
      break;
    }

    if (visitedUrls.has(currentUrl)) {
      continue;
    }

    visitedUrls.add(currentUrl);

    try {
      // Send a status update if requested, or just proceed
      console.log(`Scraping: ${currentUrl} at depth ${currentDepth}`);

      const response = await axios.get(currentUrl, {
        timeout: 10000, // 10 seconds timeout
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      });

      // Use the final response URL in case of redirects
      const finalUrl = response.request?.res?.responseUrl || currentUrl;
      if (!visitedUrls.has(finalUrl)) {
        visitedUrls.add(finalUrl);
      }

      const html = response.data;
      const $ = cheerio.load(html);

      // STEP 2: Extract emails
      const pageEmails = findEmails($);

      // STEP 3: Process emails, if unique, send to frontend
      for (const email of pageEmails) {
        const cleanEmail = email.toLowerCase().trim();
        if (cleanEmail && !foundEmails.has(cleanEmail)) {
          foundEmails.add(cleanEmail);

          res.write(`event: email\ndata: ${JSON.stringify({
            email: cleanEmail,
            sourceUrl: finalUrl
          })}\n\n`);

          // Force a flush depending on the environment, typically `res.flush()` isn't on standard express without compression
          if (res.flush) {
            res.flush();
          }
        }
      }

      // STEP 4: Next depth setup
      if (currentDepth < maxDepth) {
        const pageLinks = findLinks($, finalUrl, inputDomain, inputPath);

        for (const nextUrl of pageLinks) {
          if (!visitedUrls.has(nextUrl)) {
            // Avoid adding duplicates to the queue prematurely
            queue.push({ url: nextUrl, depth: currentDepth + 1 });
          }
        }
      }

    } catch (err) {
      const errorMessage = err.response ? `${err.response.status} ${err.response.statusText}` : err.message;
      console.error(`Failed to scrape ${currentUrl}:`, errorMessage);
      res.write(`event: error\ndata: ${JSON.stringify({ message: `Failed to scrape ${currentUrl}: ${errorMessage}` })}\n\n`);
      if (res.flush) res.flush();
      // We do not stop the whole process if one URL fails, we just continue.
    }
  }
}

module.exports = scrape;
