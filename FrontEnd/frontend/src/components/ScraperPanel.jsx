import { useState } from 'react';
import { scrapingService } from '../api';
import { Play, Loader, AlertCircle, CheckCircle } from 'lucide-react';

export default function ScraperPanel() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [parseDescription, setParseDescription] = useState('');
  const [parsing, setParsing] = useState(false);
  const [parsedResult, setParsedResult] = useState(null);

  const handleScrape = async () => {
    if (!url) return;
    
    setLoading(true);
    setError(null);
    setResult(null);
    
    try {
      const data = await scrapingService.scrapeUrl(url, false);
      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleParse = async () => {
    if (!result?.cleaned_content || !parseDescription) return;
    
    setParsing(true);
    setParsedResult(null);
    
    try {
      const data = await scrapingService.parseContent(
        result.cleaned_content,
        parseDescription
      );
      setParsedResult(data.result);
    } catch (err) {
      setError(err.message);
    } finally {
      setParsing(false);
    }
  };

  return (
    <div className="scraper-panel">
      <div className="section-header">
        <h3>Web Scraper Test</h3>
        <p>Test the scraping functionality manually</p>
      </div>

      {/* URL Input */}
      <div className="form-group">
        <label className="form-label">Target URL</label>
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            type="url"
            className="form-input"
            placeholder="https://example.com"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            style={{ flex: 1 }}
          />
          <button 
            className="btn-primary" 
            onClick={handleScrape}
            disabled={loading || !url}
          >
            {loading ? <Loader size={16} className="spinning" /> : <Play size={16} />}
            Scrape
          </button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="error-alert">
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      {/* Scraping Result */}
      {result && (
        <div className="result-section">
          <div className="success-alert">
            <CheckCircle size={16} />
            <span>Successfully scraped! Content length: {result.content_length} characters</span>
          </div>
          
          <div className="form-group">
            <label className="form-label">Parse Description</label>
            <textarea
              className="form-input"
              rows="3"
              placeholder="Describe what you want to extract from the content..."
              value={parseDescription}
              onChange={(e) => setParseDescription(e.target.value)}
            />
            <button 
              className="btn-primary" 
              onClick={handleParse}
              disabled={parsing || !parseDescription}
              style={{ marginTop: 8 }}
            >
              {parsing ? <Loader size={16} className="spinning" /> : 'Parse with AI'}
            </button>
          </div>

          {/* Parsed Result */}
          {parsedResult && (
            <div className="parsed-result">
              <h4>Parsed Result:</h4>
              <pre style={{ 
                background: '#f5f5f5', 
                padding: 12, 
                borderRadius: 6,
                overflow: 'auto',
                maxHeight: 400
              }}>
                {typeof parsedResult === 'object' 
                  ? JSON.stringify(parsedResult, null, 2)
                  : parsedResult}
              </pre>
            </div>
          )}

          {/* Raw Content Preview */}
          <details>
            <summary style={{ cursor: 'pointer', marginTop: 16 }}>
              View raw scraped content
            </summary>
            <pre style={{ 
              background: '#f5f5f5', 
              padding: 12, 
              borderRadius: 6,
              overflow: 'auto',
              maxHeight: 300,
              fontSize: 12,
              marginTop: 8
            }}>
              {result.cleaned_content.substring(0, 2000)}
              {result.cleaned_content.length > 2000 && '\n\n... (truncated)'}
            </pre>
          </details>
        </div>
      )}
    </div>
  );
}