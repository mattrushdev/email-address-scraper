const request = require('supertest');
const app = require('./server');

// Mock the scraper so we don't actually hit the web during API endpoint tests
jest.mock('./scraper', () => ({
  scrape: jest.fn(async (url, depth, res, state) => {
    res.write(`event: email\ndata: ${JSON.stringify({ email: 'test@example.com', sourceUrl: url })}\n\n`);
  })
}));

describe('GET /api/scrape', () => {
  it('returns 400 if URL is missing', async () => {
    const response = await request(app).get('/api/scrape?maxDepth=1');
    expect(response.status).toBe(400);
    expect(response.body.error).toBe('URL is required');
  });

  it('returns 400 if maxDepth is invalid', async () => {
    const response = await request(app).get('/api/scrape?url=example.com&maxDepth=10');
    expect(response.status).toBe(400);
    expect(response.body.error).toBe('maxDepth must be a number between 1 and 5');
  });

  it('streams data correctly when valid parameters are provided', async () => {
    const response = await request(app).get('/api/scrape?url=example.com&maxDepth=2');
    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toContain('text/event-stream');
    
    // Supertest interprets SSE streaming output as raw text payload body
    expect(response.text).toContain('event: email');
    expect(response.text).toContain('test@example.com');
    expect(response.text).toContain('event: done');
  });
});
