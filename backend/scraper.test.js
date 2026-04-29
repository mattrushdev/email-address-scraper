const axios = require('axios');
const cheerio = require('cheerio');
const { scrape } = require('./scraper');
const findEmails = require('./findEmails');
const findLinks = require('./findLinks');

jest.mock('axios');

describe('Scraper Module Refactored', () => {
  describe('findEmails', () => {
    it('extracts emails from text nodes and mailto links', () => {
      const html = `
        <html>
          <body>
            <div>test@example.com</div>
            <a href="mailto:link@example.com">Email us</a>
            <script>const email = "ignore@me.com";</script>
            <style>.email { content: "css@ignore.com"; }</style>
          </body>
        </html>
      `;
      const $ = cheerio.load(html);
      const emails = findEmails($);
      expect(emails).toContain('test@example.com');
      expect(emails).toContain('link@example.com');
      expect(emails).not.toContain('ignore@me.com');
      expect(emails).not.toContain('css@ignore.com');
    });
  });

  describe('findLinks', () => {
    it('extracts and resolves valid links within the same domain and path', () => {
      const html = `
        <html>
          <body>
            <a href="/about">About</a>
            <a href="https://example.com/contact">Contact</a>
            <a href="https://other.com">External</a>
            <a href="#fragment">Fragment</a>
          </body>
        </html>
      `;
      const $ = cheerio.load(html);
      const links = findLinks($, 'https://example.com/', 'example.com', '/');
      expect(links).toContain('https://example.com/about');
      expect(links).toContain('https://example.com/contact');
      expect(links).not.toContain('https://other.com');
      expect(links).not.toContain('https://example.com/#fragment');
    });
  });

  describe('scrape', () => {
    let mockRes;
    let mockState;

    beforeEach(() => {
      mockRes = {
        write: jest.fn(),
        flush: jest.fn()
      };
      mockState = { aborted: false };
      jest.clearAllMocks();
    });

    it('aborts immediately if state.aborted is true', async () => {
      mockState.aborted = true;
      await scrape('https://example.com', 1, mockRes, mockState);
      expect(axios.get).not.toHaveBeenCalled();
      expect(mockRes.write).not.toHaveBeenCalled();
    });

    it('scrapes emails and follows links', async () => {
      axios.get.mockResolvedValue({
        request: { res: { responseUrl: 'https://example.com' } },
        data: `<html><body><a href="mailto:test@example.com">Contact</a></body></html>`
      });

      await scrape('https://example.com', 1, mockRes, mockState);
      
      expect(mockRes.write).toHaveBeenCalledWith(expect.stringContaining('test@example.com'));
      expect(mockRes.write).toHaveBeenCalledWith(expect.stringContaining('event: email'));
    });

    it('emits error event via SSE if axios fetching fails', async () => {
      axios.get.mockRejectedValue(new Error('Network Error'));

      await scrape('https://invalid.url', 1, mockRes, mockState);

      expect(mockRes.write).toHaveBeenCalledWith(expect.stringContaining('event: error'));
      expect(mockRes.write).toHaveBeenCalledWith(expect.stringContaining('Network Error'));
    });
  });
});
