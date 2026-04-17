import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import App from './App';

describe('Email Scraper App', () => {
  beforeEach(() => {
    // Mock EventSource since it does not exist in JS DOM natively
    global.mockEventSourceCall = vi.fn();
    global.EventSource = class {
      constructor(url) {
        global.mockEventSourceCall(url);
        this.url = url;
      }
      addEventListener = vi.fn();
      close = vi.fn();
    };
  });

  it('renders correctly with expected inputs initially available', () => {
    render(<App />);
    expect(screen.getByText('Email Scraper')).toBeInTheDocument();
    
    // Check elements exist
    const urlInput = screen.getByPlaceholderText('https://example.com');
    expect(urlInput).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Start search/i })).toBeInTheDocument();
  });

  it('allows the user to type a valid target URL', () => {
    render(<App />);
    const urlInput = screen.getByPlaceholderText('https://example.com');
    
    fireEvent.change(urlInput, { target: { value: 'https://testdomain.com' } });
    expect(urlInput.value).toBe('https://testdomain.com');
  });

  it('swaps the Search button to a Cancel button and activates loader when searching', () => {
    render(<App />);
    const urlInput = screen.getByPlaceholderText('https://example.com');
    const searchButton = screen.getByRole('button', { name: /Start search/i });

    // Inputs must be filled prior to searching hitting truth limits
    fireEvent.change(urlInput, { target: { value: 'https://testdomain.com' } });
    fireEvent.click(searchButton);

    // After clicking Search, it should swap out to a cancel button properly referencing the DOM switch natively
    expect(screen.getByRole('button', { name: /Cancel search/i })).toBeInTheDocument();
    
    // Check if searching logic triggers Event Source
    expect(global.mockEventSourceCall).toHaveBeenCalledWith(expect.stringContaining('url=https%3A%2F%2Ftestdomain.com'));
  });
});
