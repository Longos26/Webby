import { useState } from 'react';

export default function ScraperUI({ onJobComplete }) {
  const [url, setUrl] = useState('');
  const [parseDescription, setParseDescription] = useState('');
  const [domContent, setDomContent] = useState('');
  const [parsedResult, setParsedResult] = useState('');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState('input'); // input | scraped | parsing | result

  const handleScrape = async () => {
    if (!url) return alert("Please enter a URL");

    setLoading(true);
    try {
      const res = await fetch('http://localhost:8000/api/scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url })
      });

      const data = await res.json();
      setDomContent(data.cleaned_content || data.body_content);
      setStep('scraped');
    } catch (err) {
      alert("Failed to scrape: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleParse = async () => {
    if (!domContent || !parseDescription) return;

    setLoading(true);
    try {
      const res = await fetch('http://localhost:8000/api/parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dom_content: domContent,
          parse_description: parseDescription
        })
      });

      const data = await res.json();
      setParsedResult(data.result);
      setStep('result');

      onJobComplete?.();
    } catch (err) {
      alert("Parsing failed: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="scraper-ui">
      <div className="form-group">
        <label>Target Website URL</label>
        <input
          type="url"
          className="form-input"
          placeholder="https://example.com"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
        />
      </div>

      <button 
        className="btn-primary" 
        onClick={handleScrape}
        disabled={loading || !url}
      >
        {loading ? 'Scraping...' : 'Scrape Website'}
      </button>

      {step === 'scraped' && (
        <>
          <div className="form-group">
            <label>What do you want to extract?</label>
            <textarea
              className="form-input"
              rows={4}
              placeholder="Extract all product names, prices, and images"
              value={parseDescription}
              onChange={(e) => setParseDescription(e.target.value)}
            />
          </div>

          <button 
            className="btn-primary" 
            onClick={handleParse}
            disabled={loading || !parseDescription}
          >
            {loading ? 'Parsing with AI...' : 'Parse with AI'}
          </button>

          {domContent && (
            <details>
              <summary>View Raw Scraped Content (first 500 chars)</summary>
              <pre>{domContent.substring(0, 500)}...</pre>
            </details>
          )}
        </>
      )}

      {step === 'result' && parsedResult && (
        <div className="result-box">
          <h3>Extraction Result</h3>
          <pre>{parsedResult}</pre>
          <button className="btn-primary" onClick={() => window.print()}>
            Save Result
          </button>
        </div>
      )}
    </div>
  );
}