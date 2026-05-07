import React, { useState } from "react";
import { Search, BookOpen, Code2, Layers, ArrowRight } from "lucide-react";

export default function WebbyDocs() {
  const [query, setQuery] = useState("");

  return (
    <div className="flex h-screen bg-[#04070f] text-gray-100">
      {/* Sidebar */}
      <aside className="w-72 bg-[#080d1a] border-r border-white/10 p-6 flex flex-col">
        <div className="mb-6">
          <h1 className="text-xl font-semibold flex items-center gap-2">
            <span className="w-2 h-2 bg-emerald-400 rounded-full" /> Webby Docs
          </h1>
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="flex items-center gap-2 bg-black/40 border border-white/10 rounded-lg px-3 py-2">
            <Search size={16} className="text-gray-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search docs..."
              className="bg-transparent outline-none text-sm w-full"
            />
          </div>
        </div>

        {/* Nav - Fixed: replaced <a> with buttons for non-navigation items */}
        <nav className="text-sm space-y-6 overflow-y-auto">
          <div>
            <p className="text-xs text-gray-500 uppercase mb-2">Getting Started</p>
            <button className="block py-1 text-gray-300 hover:text-white w-full text-left">Introduction</button>
            <button className="block py-1 text-gray-300 hover:text-white w-full text-left">Quick Start</button>
          </div>

          <div>
            <p className="text-xs text-gray-500 uppercase mb-2">Core Concepts</p>
            <button className="block py-1 text-gray-300 hover:text-white w-full text-left">Scraping Jobs</button>
            <button className="block py-1 text-gray-300 hover:text-white w-full text-left">LLM Parsing</button>
            <button className="block py-1 text-gray-300 hover:text-white w-full text-left">Exports</button>
          </div>

          <div>
            <p className="text-xs text-gray-500 uppercase mb-2">Developer</p>
            <button className="block py-1 text-gray-300 hover:text-white w-full text-left">API Reference</button>
            <button className="block py-1 text-gray-300 hover:text-white w-full text-left">Architecture</button>
          </div>
        </nav>

        <div className="mt-auto pt-6 text-xs text-gray-500">© 2026 Webby</div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-y-auto">
        {/* Top Bar */}
        <div className="sticky top-0 z-10 bg-[#04070f]/80 backdrop-blur border-b border-white/10 px-10 py-4 flex justify-between items-center">
          <h2 className="text-sm text-gray-400">Documentation</h2>
          <button className="text-sm bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg flex items-center gap-2">
            Get API Key <ArrowRight size={14} />
          </button>
        </div>

        <div className="px-10 py-10 max-w-5xl">
          {/* Header */}
          <div className="mb-10">
            <h1 className="text-4xl font-bold mb-3">Webby Documentation</h1>
            <p className="text-gray-400 text-lg">
              Production-ready web scraping with AI-powered parsing and structured data pipelines.
            </p>
          </div>

          {/* Cards */}
          <div className="grid md:grid-cols-3 gap-4 mb-12">
            {[
              { title: "Quick Start", icon: BookOpen, desc: "Run your first scraping job" },
              { title: "API Reference", icon: Code2, desc: "Integrate Webby programmatically" },
              { title: "Architecture", icon: Layers, desc: "Understand system design" },
            ].map((item, i) => {
              const Icon = item.icon;
              return (
                <div key={i} className="bg-[#080d1a] border border-white/10 p-5 rounded-2xl hover:border-blue-500/40 transition">
                  <Icon size={18} className="mb-3 text-blue-400" />
                  <h3 className="font-semibold mb-1">{item.title}</h3>
                  <p className="text-sm text-gray-400">{item.desc}</p>
                </div>
              );
            })}
          </div>

          {/* Content */}
          <section className="mb-12">
            <h2 className="text-2xl font-semibold mb-3">Introduction</h2>
            <p className="text-gray-400 leading-relaxed">
              Webby is an AI-enhanced scraping system that combines browser automation, proxy management,
              and large language models to transform unstructured web content into structured datasets.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-semibold mb-3">Quick Start</h2>
            <div className="bg-black/60 border border-white/10 rounded-xl p-4 text-sm overflow-x-auto">
              <pre>{`# Clone repo
 git clone https://github.com/your-repo/webby

# Install frontend
 cd client && npm install && npm run dev

# Run backend
 cd backend && pip install -r requirements.txt
 uvicorn main:app --reload`}</pre>
            </div>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-semibold mb-3">API Example</h2>
            <div className="bg-black/60 border border-white/10 rounded-xl p-4 text-sm overflow-x-auto">
              <pre>{`POST /api/jobs
{
  "url": "https://example.com",
  "fields": ["title", "price"]
}`}</pre>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">Architecture</h2>
            <ul className="text-gray-400 list-disc ml-5 space-y-1">
              <li>Frontend: React + Tailwind</li>
              <li>Backend: FastAPI</li>
              <li>Scraper: Selenium</li>
              <li>AI: LLM (GPT / Ollama)</li>
            </ul>
          </section>
        </div>
      </main>
    </div>
  );
}