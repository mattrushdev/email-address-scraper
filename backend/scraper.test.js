const axios = require('axios');
const { scrape } = require('./scraper');

jest.mock('axios');

describe('Scraper Logic', () => {
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

  it('scrapes emails from parsed HTML string', async () => {
    axios.get.mockResolvedValue({
      request: { res: { responseUrl: 'https://example.com' } },
      data: `<html><body><a href="mailto:test@example.com">Contact</a><p>Another email: plain@domain.org</p></body></html>`
    });

    await scrape('https://example.com', 1, mockRes, mockState);
    
    // We expect two emails to be written to the SSE stream payload
    expect(mockRes.write).toHaveBeenCalledTimes(2);
    expect(mockRes.write).toHaveBeenCalledWith(expect.stringContaining('test@example.com'));
    expect(mockRes.write).toHaveBeenCalledWith(expect.stringContaining('plain@domain.org'));
  });

  it('emits error event via SSE if axios fetching fails', async () => {
    axios.get.mockRejectedValue(new Error('Network Error'));

    await scrape('https://invalid.url', 1, mockRes, mockState);

    expect(mockRes.write).toHaveBeenCalledWith(expect.stringContaining('event: error'));
    expect(mockRes.write).toHaveBeenCalledWith(expect.stringContaining('Network Error'));
  });
});
