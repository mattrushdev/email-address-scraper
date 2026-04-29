function findLinks($, finalUrl, inputDomain, inputPath) {
  const pageLinks = [];
  $('a[href]').each((_, el) => {
    const href = $(el).attr('href');
    if (!href || href.startsWith('javascript:') || href.startsWith('#')) return;

    try {
      // Resolve relative URLs using the final URL
      const resolvedUrl = new URL(href, finalUrl);

      // Validate: Must be same domain and under the same path constraint
      if (resolvedUrl.hostname === inputDomain && resolvedUrl.pathname.startsWith(inputPath)) {
        // Filter out non-HTML file extensions to avoid binary files/images
        const nonHtmlExtensions = /\.(pdf|jpg|jpeg|png|gif|svg|zip|tar|gz|exe|dmg|mp4|mp3|wav|doc|docx|xls|xlsx|ppt|pptx|xml|json)$/i;
        if (nonHtmlExtensions.test(resolvedUrl.pathname)) {
          return;
        }

        // Standardize by removing fragments
        resolvedUrl.hash = '';
        pageLinks.push(resolvedUrl.href);
      }
    } catch (e) {
      // Ignore invalid URLs
    }
  });
  return pageLinks;
}

module.exports = findLinks;
