const cheerio = require('cheerio');

function findEmails($) {
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
  const pageEmails = new Set();

  // Match on each text node
  $('body').find('*:not(script, style, noscript, iframe)').contents().each((i, el) => {
    // nodeType 3 is a raw text node
    if (el.nodeType === 3) {
      const text = $(el).text();
      const matches = text.match(emailRegex);
      if (matches) {
        matches.forEach(email => pageEmails.add(email.trim()));
      }
    }
  });

  // Also look for mailto links directly in case the text doesn't show them cleanly
  $('a[href^="mailto:"]').each((_, el) => {
    const href = $(el).attr('href');
    if (href) {
      const email = href.replace('mailto:', '').split('?')[0].trim();
      if (email) pageEmails.add(email);
    }
  });

  return Array.from(pageEmails);
}

module.exports = findEmails;
