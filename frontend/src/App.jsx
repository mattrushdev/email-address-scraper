import React, { useState, useEffect, useRef } from 'react';
import { Search, X, Loader2, Mail, AlertTriangle, Link as LinkIcon, Database, Copy, Check } from 'lucide-react';

function App() {
  const [url, setUrl] = useState('');
  const [depth, setDepth] = useState(1);
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState([]);
  const [errors, setErrors] = useState([]);
  const [copied, setCopied] = useState(false);

  const eventSourceRef = useRef(null);
  const resultsContainerRef = useRef(null);

  // Auto-scroll to bottom of results when new ones arrive
  useEffect(() => {
    if (resultsContainerRef.current && typeof resultsContainerRef.current.scrollTo === 'function') {
      const { scrollHeight, clientHeight } = resultsContainerRef.current;
      resultsContainerRef.current.scrollTo({
        top: scrollHeight - clientHeight,
        behavior: 'smooth'
      });
    }
  }, [results]);

  const handleSearch = (e) => {
    e?.preventDefault();
    if (!url || isSearching) return;

    // Reset state
    setResults([]);
    setErrors([]);
    setCopied(false);
    setIsSearching(true);

    // Create new SSE connection
    // We proxy /api to the backend in Vite, but construct the full query here
    const encodedUrl = encodeURIComponent(url);
    eventSourceRef.current = new EventSource(`/api/scrape?url=${encodedUrl}&maxDepth=${depth}`);

    eventSourceRef.current.addEventListener('email', (e) => {
      const data = JSON.parse(e.data);
      setResults(prev => [...prev, data]);
    });

    eventSourceRef.current.addEventListener('error', (e) => {
      // It might be a custom error from the backend or a network issue
      if (e.data) {
        try {
          const data = JSON.parse(e.data);
          setErrors(prev => [...prev, data.message || 'An unexpected error occurred during scraping.']);
        } catch (err) {
          setErrors(prev => [...prev, 'A connection error occurred.']);
        }
      } else {
        // We received an error event but no data, might be connection refused/dropped
        if (eventSourceRef.current.readyState === EventSource.CLOSED) {
          setErrors(prev => [...prev, 'Connection to the server was closed unexpectedly.']);
        } else {
          // just ignore some intermediate connection drops if it reconnects
        }
      }

      // Do NOT stop search if it's a non-fatal error event from us, continue searching
    });

    eventSourceRef.current.addEventListener('done', () => {
      handleCancel();
    });
  };

  const handleCancel = () => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    setIsSearching(false);
  };

  const handleCopy = () => {
    if (results.length === 0) return;
    const textToCopy = results.map(r => `${r.email} - URL: ${r.sourceUrl}`).join('\n');
    navigator.clipboard.writeText(textToCopy).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, []);

  return (
    <div className="min-h-screen p-4 flex flex-col items-center justify-center select-none font-sans">
      <div className="w-full max-w-4xl bg-white/70 backdrop-blur-md shadow-xl rounded-3xl p-8 border border-white/40 flex flex-col h-[85vh]">

        {/* Header */}
        <div className="mb-8 text-center flex flex-col items-center">
          <div className="bg-indigo-100 p-3 rounded-full inline-block mb-3 shadow-inner">
            <Database className="w-8 h-8 text-indigo-500" />
          </div>
          <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600 tracking-tight">
            Email Scraper
          </h1>
          <p className="text-sm text-gray-500 mt-2 font-medium">Extract email addresses efficiently up to 5 levels deep</p>
        </div>

        {/* Searching Indicator */}
        <div className={`transition-all duration-300 overflow-hidden flex justify-center items-center h-8 mb-4 ${isSearching ? 'opacity-100' : 'opacity-0'}`}>
          <Loader2 className="w-5 h-5 text-indigo-500 animate-spin mr-2" />
          <span className="text-sm font-semibold text-indigo-600 tracking-wide animate-pulse">Searching in progress...</span>
        </div>

        {/* Inputs */}
        <form onSubmit={handleSearch} className="space-y-6 bg-white/50 p-6 rounded-2xl border border-white/60 shadow-sm relative z-10 transition-all">

          <div className="flex flex-col sm:relative sm:flex-row gap-3 sm:gap-0">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <LinkIcon className={`w-5 h-5 ${isSearching ? 'text-gray-300' : 'text-indigo-400'}`} />
              </div>
              <input
                type="text"
                className={`block w-full pl-11 py-3.5 rounded-xl border-2 bg-white/90 text-gray-800 placeholder-gray-400 focus:outline-none transition-all ${isSearching
                  ? 'border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed'
                  : 'border-indigo-100 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-400/20 shadow-inner'
                  } sm:pr-[110px]`}
                placeholder="https://example.com"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                disabled={isSearching}
                aria-label="URL to scrape"
                required
              />
            </div>

            <div className="flex sm:absolute sm:inset-y-0 sm:right-2 items-center">
              {isSearching ? (
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleCancel();
                  }}
                  className="w-full sm:w-auto bg-red-50 hover:bg-red-100 text-red-600 px-4 py-2 rounded-lg font-semibold flex items-center justify-center transition-colors border border-red-200 shadow-sm"
                  aria-label="Cancel search"
                >
                  <X className="w-4 h-4 mr-1 stroke-[3]" /> Cancel
                </button>
              ) : (
                <button
                  type="submit"
                  className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-lg font-semibold flex items-center justify-center transition-all shadow-md active:scale-95"
                  aria-label="Start search"
                >
                  <Search className="w-4 h-4 mr-1.5 stroke-[2.5]" /> Search
                </button>
              )}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <label htmlFor="depth-slider" className="text-sm font-bold text-gray-700 flex items-center">
              Max Depth
              <span className="ml-2 px-2.5 py-0.5 bg-indigo-100 text-indigo-700 rounded-md text-xs font-black shadow-sm">
                LEVEL {depth}
              </span>
            </label>
            <input
              id="depth-slider"
              type="range"
              min="1"
              max="5"
              step="1"
              value={depth}
              onChange={(e) => setDepth(parseInt(e.target.value))}
              disabled={isSearching}
              className={`w-full sm:w-2/3 h-2 rounded-lg appearance-none cursor-pointer ${isSearching ? 'bg-gray-200' : 'bg-indigo-200 accent-indigo-600'
                }`}
              aria-label="Set maximum scrape depth"
            />
          </div>
        </form>

        {/* Output Space */}
        <div className="flex-1 flex flex-col mt-6 overflow-hidden rounded-2xl bg-white/80 border border-gray-100 shadow-inner relative">

          <div className="bg-gray-50 border-b border-gray-100 px-6 py-3 flex flex-col sm:flex-row items-center sm:justify-between gap-3 sm:gap-0 z-10 shadow-sm">
            <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider">Results Found</h3>
            <div className="flex items-center space-x-3 w-full sm:w-auto justify-center sm:justify-end">
              {results.length > 0 && (
                <button
                  onClick={handleCopy}
                  className="flex items-center text-xs font-semibold text-rose-700 bg-rose-100 hover:bg-rose-200 px-3 py-1 rounded-full transition-colors active:scale-95"
                  aria-label="Copy results to clipboard"
                >
                  {copied ? <Check className="w-3.5 h-3.5 mr-1" /> : <Copy className="w-3.5 h-3.5 mr-1" />}
                  {copied ? 'Copied!' : 'Copy List'}
                </button>
              )}
              <span className="bg-indigo-100 text-indigo-700 py-1 px-3 rounded-full text-xs font-black shadow-sm">
                {results.length} Emails
              </span>
            </div>
          </div>

          <div
            ref={resultsContainerRef}
            className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar p-6 space-y-3 relative"
          >
            {results.length === 0 && !isSearching && errors.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center text-gray-400 opacity-60">
                <Mail className="w-16 h-16 mb-4 text-gray-300" strokeWidth={1} />
                <p className="text-sm font-medium text-center">Ready to extract missing links.</p>
                <p className="text-xs mt-1">Enter a URL to begin scraping</p>
              </div>
            )}

            {results.map((res, index) => (
              <div
                key={index}
                className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl bg-white border border-gray-100 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] hover:shadow-md transition-shadow group animate-in fade-in slide-in-from-bottom-2 duration-300 ease-out"
              >
                <div className="flex items-center text-gray-800 font-semibold text-sm truncate pr-4 max-w-full sm:max-w-[45%]">
                  <div className="w-8 h-8 rounded-full bg-brand-pastel-rose text-rose-500 flex items-center justify-center mr-3 shrink-0">
                    <Mail className="w-4 h-4" />
                  </div>
                  <a href={`mailto:${res.email}`} className="truncate hover:text-indigo-600 hover:underline transition-colors">
                    {res.email}
                  </a>
                </div>
                <div className="mt-2 sm:mt-0 flex items-center text-xs text-blue-500 hover:text-blue-600 truncate bg-brand-pastel-blue px-3 py-1.5 rounded-lg w-fit ml-11 sm:ml-0 group-hover:bg-blue-100 transition-colors cursor-pointer" title={res.sourceUrl}>
                  <LinkIcon className="w-3 h-3 mr-1.5 shrink-0" />
                  <a href={res.sourceUrl} target="_blank" rel="noopener noreferrer" className="truncate hover:underline">
                    {res.sourceUrl}
                  </a>
                </div>
              </div>
            ))}
          </div>

        </div>

        {/* Errors Box */}
        {errors.length > 0 && (
          <div className="mt-4 bg-red-50 border-l-4 border-red-500 p-4 rounded-lg flex items-start animate-in fade-in slide-in-from-top-2 shadow-sm max-h-40 overflow-y-auto custom-scrollbar">
            <AlertTriangle className="w-5 h-5 text-red-500 mr-3 shrink-0 mt-0.5" />
            <div className="flex-1">
              <h4 className="text-sm font-bold text-red-800">Scraping Errors ({errors.length})</h4>
              <ul className="text-sm text-red-600 mt-1 list-disc pl-4 space-y-1">
                {errors.map((err, i) => (
                  <li key={i}>{err}</li>
                ))}
              </ul>
            </div>
            <button onClick={() => setErrors([])} className="text-red-400 hover:text-red-600 transition-colors ml-4 shrink-0">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

      </div>
    </div>
  );
}

export default App;
