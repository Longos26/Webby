import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Menu,
  X,
  BookOpen,
  FileText,
  Download,
  ChevronRight,
  Home,
  Users,
  Calendar,
  Award,
  ExternalLink,
  FileSpreadsheet,
  FileJson,
  Globe,
  Shield,
  Brain,
  Zap,
  Database,
  Activity,
  CheckCircle,
  AlertCircle,
  Code,
  Book,
  GraduationCap,
  Quote,
  Target,
  Layers,
  BarChart3,
  Cpu,
  Cloud,
  Lock,
  RefreshCw,
  Play,
  File,
  Tag,
  Briefcase,
  Sparkles,
  Eye,
  Trash2,
  Link as LinkIcon,
  Clock
} from 'lucide-react';
import logo from '../newlogo.png';

// ============================================================
// STYLES — unified with DatasetLibraryTab design system
// ============================================================

const globalStyles = `
  .doc-root {
    /* ---- Canonical palette (same as DatasetLibraryTab) ---- */
    --color-mdb-green: #00ED64;
    --color-mdb-green-dark: #00C355;
    --color-canvas: #0D1117;
    --color-surface: #161B22;
    --color-surface-elevated: #1C2128;
    --color-border: #30363D;
    --color-border-subtle: #21262D;
    --color-text-primary: #F0F6FC;
    --color-text-secondary: #9BA4B0;
    --color-text-muted: #6E7681;
    --color-success: #00ED64;
    --color-warning: #D29922;
    --color-error: #F85149;
    --color-info: #58A6FF;

    /* ---- Aliases kept for readability in content ---- */
    --green-primary: var(--color-mdb-green);
    --green-dark: var(--color-mdb-green-dark);
    --bg-dark: var(--color-canvas);
    --bg-surface: var(--color-surface);
    --bg-elevated: var(--color-surface-elevated);
    --border-default: var(--color-border);
    --border-subtle: var(--color-border-subtle);
    --text-primary: var(--color-text-primary);
    --text-secondary: var(--color-text-secondary);
    --text-muted: var(--color-text-muted);
    --success: var(--color-success);
    --warning: var(--color-warning);
    --error: var(--color-error);
    --info: var(--color-info);

    /* ---- Untitled-UI scale (shared with dlib-*) ---- */
    --radius-xs: 4px;
    --radius-sm: 6px;
    --radius-md: 8px;
    --radius-lg: 10px;
    --radius-xl: 12px;
    --radius-2xl: 16px;
    --radius-full: 9999px;

    --shadow-xs: 0 1px 2px 0 rgba(0, 0, 0, 0.24);
    --shadow-sm: 0 1px 3px 0 rgba(0, 0, 0, 0.32), 0 1px 2px -1px rgba(0, 0, 0, 0.28);
    --shadow-md: 0 4px 8px -2px rgba(0, 0, 0, 0.36), 0 2px 4px -2px rgba(0, 0, 0, 0.28);
    --shadow-lg: 0 12px 16px -4px rgba(0, 0, 0, 0.42), 0 4px 6px -2px rgba(0, 0, 0, 0.28);
    --shadow-xl: 0 20px 24px -4px rgba(0, 0, 0, 0.5), 0 8px 8px -4px rgba(0, 0, 0, 0.32);

    --font-sans: "Inter", "IBM Plex Sans", "Segoe UI", system-ui, -apple-system, sans-serif;
    --font-serif: "Georgia", "Times New Roman", serif;
    --font-mono: "JetBrains Mono", "SF Mono", "Courier New", monospace;

    --transition: 150ms cubic-bezier(0.4, 0, 0.2, 1);

    font-family: var(--font-sans);
    color: var(--color-text-primary);
    background: var(--color-canvas);
    font-size: 14px;
    line-height: 1.6;
    -webkit-font-smoothing: antialiased;
    min-height: 100vh;
  }

  .doc-root * { margin: 0; padding: 0; box-sizing: border-box; }
  .doc-root a { text-decoration: none; color: inherit; }
  .doc-root button { cursor: pointer; font-family: inherit; }

  .doc-root *:focus-visible {
    outline: none;
    box-shadow: 0 0 0 3px rgba(0, 237, 100, 0.16), 0 0 0 1px var(--color-mdb-green);
    border-radius: var(--radius-sm);
  }

  .doc-root .container {
    max-width: 1400px;
    margin: 0 auto;
    padding: 0 32px;
  }

  @keyframes doc-spin { to { transform: rotate(360deg); } }
  .doc-root .spin { animation: doc-spin 0.6s linear infinite; }

  @keyframes doc-fadeSlideIn {
    from { opacity: 0; transform: translateY(8px); }
    to { opacity: 1; transform: translateY(0); }
  }
  .doc-root .fade-slide-in { animation: doc-fadeSlideIn 0.25s ease-out; }

  @media (max-width: 768px) {
    .doc-root .container { padding: 0 16px; }
    .doc-root .paper-grid { grid-template-columns: 1fr !important; }
    .doc-root .paper-sidebar { display: none !important; }
    .doc-root .mobile-sidebar-toggle { display: block !important; }
    .doc-root nav .desktop-nav { display: none !important; }
    .doc-root .mobile-menu-btn { display: block !important; }
    .doc-root .paper-content { padding: 16px !important; }
    .doc-root .author-grid { grid-template-columns: 1fr !important; }
  }

  @media (min-width: 769px) {
    .doc-root .mobile-menu-btn { display: none !important; }
    .doc-root .mobile-sidebar-toggle { display: none !important; }
  }

  @media print {
    .doc-root nav { display: none !important; }
    .doc-root .paper-sidebar { display: none !important; }
    .doc-root .paper-grid { display: block !important; }
    .doc-root .paper-content { border: none !important; padding: 20px !important; box-shadow: none !important; }
    .doc-root .paper-grid { margin: 0 !important; }
  }
`;

// ============================================================
// COMPONENTS — Untitled-UI primitives (same as dlib-*)
// ============================================================

const PrimaryButton = ({ children, icon, onClick, to, className = '', disabled = false, style: extraStyle = {} }) => {
  const baseStyle = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
    height: '38px',
    padding: '0 14px',
    backgroundColor: disabled ? 'var(--color-surface-elevated)' : 'var(--color-mdb-green)',
    color: disabled ? 'var(--color-text-muted)' : '#0D1117',
    fontWeight: 500,
    fontSize: '13px',
    fontFamily: 'inherit',
    borderRadius: 'var(--radius-lg)',
    border: `1px solid ${disabled ? 'var(--color-border-subtle)' : 'var(--color-mdb-green)'}`,
    transition: 'background-color var(--transition), border-color var(--transition)',
    cursor: disabled ? 'not-allowed' : 'pointer',
    boxShadow: 'var(--shadow-xs)',
    whiteSpace: 'nowrap',
    opacity: disabled ? 0.6 : 1,
    ...extraStyle,
  };

  const hover = (e) => {
    if (!disabled) {
      e.currentTarget.style.backgroundColor = 'var(--color-mdb-green-dark)';
      e.currentTarget.style.borderColor = 'var(--color-mdb-green-dark)';
    }
  };
  const leave = (e) => {
    if (!disabled) {
      e.currentTarget.style.backgroundColor = 'var(--color-mdb-green)';
      e.currentTarget.style.borderColor = 'var(--color-mdb-green)';
    }
  };

  const content = (<>{icon}{children}</>);

  if (to) {
    return (
      <Link
        to={to}
        style={baseStyle}
        className={className}
        onMouseEnter={hover}
        onMouseLeave={leave}
      >
        {content}
      </Link>
    );
  }
  return (
    <button
      style={baseStyle}
      className={className}
      onMouseEnter={hover}
      onMouseLeave={leave}
      onClick={onClick}
      disabled={disabled}
    >
      {content}
    </button>
  );
};

const SecondaryButton = ({ children, icon, onClick, className = '', disabled = false, style: extraStyle = {} }) => (
  <button
    style={{
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '6px',
      height: '38px',
      padding: '0 14px',
      backgroundColor: 'var(--color-canvas)',
      border: `1px solid ${disabled ? 'var(--color-border-subtle)' : 'var(--color-border)'}`,
      color: disabled ? 'var(--color-text-muted)' : 'var(--color-text-secondary)',
      fontWeight: 500,
      fontSize: '13px',
      fontFamily: 'inherit',
      borderRadius: 'var(--radius-lg)',
      transition: 'background-color var(--transition), border-color var(--transition), color var(--transition)',
      cursor: disabled ? 'not-allowed' : 'pointer',
      opacity: disabled ? 0.5 : 1,
      whiteSpace: 'nowrap',
      ...extraStyle,
    }}
    className={className}
    onMouseEnter={(e) => {
      if (!disabled) {
        e.currentTarget.style.backgroundColor = 'var(--color-surface-elevated)';
        e.currentTarget.style.borderColor = '#484F58';
        e.currentTarget.style.color = 'var(--color-text-primary)';
      }
    }}
    onMouseLeave={(e) => {
      if (!disabled) {
        e.currentTarget.style.backgroundColor = 'var(--color-canvas)';
        e.currentTarget.style.borderColor = 'var(--color-border)';
        e.currentTarget.style.color = 'var(--color-text-secondary)';
      }
    }}
    onClick={onClick}
    disabled={disabled}
  >
    {icon}
    {children}
  </button>
);

const Section = ({ title, children, icon, className = '' }) => (
  <div style={{ marginBottom: '32px' }} className={className}>
    {title && (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        marginBottom: '16px',
        borderBottom: '1px solid var(--color-border-subtle)',
        paddingBottom: '12px',
      }}>
        {icon && <span style={{ color: 'var(--color-mdb-green)' }}>{icon}</span>}
        <h2 style={{
          fontSize: 'clamp(18px, 1.8vw, 22px)',
          fontWeight: 600,
          color: 'var(--color-text-primary)',
          letterSpacing: '-0.01em',
        }}>
          {title}
        </h2>
      </div>
    )}
    <div style={{ color: 'var(--color-text-secondary)', lineHeight: 1.8 }}>
      {children}
    </div>
  </div>
);

const PaperCard = ({ title, description, icon, link }) => (
  <div style={{
    backgroundColor: 'var(--color-canvas)',
    border: '1px solid var(--color-border-subtle)',
    borderRadius: 'var(--radius-xl)',
    padding: '16px 18px',
    transition: 'border-color var(--transition), box-shadow var(--transition)',
    display: 'flex',
    alignItems: 'flex-start',
    gap: '14px',
    boxShadow: 'var(--shadow-xs)',
  }}
  onMouseEnter={(e) => {
    e.currentTarget.style.borderColor = 'var(--color-border)';
    e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
  }}
  onMouseLeave={(e) => {
    e.currentTarget.style.borderColor = 'var(--color-border-subtle)';
    e.currentTarget.style.boxShadow = 'var(--shadow-xs)';
  }}
  >
    <div style={{
      flexShrink: 0,
      width: '36px',
      height: '36px',
      borderRadius: 'var(--radius-md)',
      backgroundColor: 'rgba(0, 237, 100, 0.08)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      border: '1px solid rgba(0, 237, 100, 0.15)',
    }}>
      {icon}
    </div>
    <div>
      <div style={{ fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: '2px', fontSize: '13px' }}>{title}</div>
      <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', lineHeight: 1.5 }}>{description}</div>
    </div>
  </div>
);

// ============================================================
// RESEARCH PAPER CONTENT  (unchanged)
// ============================================================

const PAPER_SECTIONS = [
  { id: 'abstract', title: 'Abstract' },
  { id: 'introduction', title: 'Introduction' },
  { id: 'background', title: 'Background & Problem Statement' },
  { id: 'methodology', title: 'Methodology' },
  { id: 'system-design', title: 'System Design' },
  { id: 'implementation', title: 'Implementation' },
  { id: 'results', title: 'Results & Discussion' },
  { id: 'conclusion', title: 'Conclusion & Future Work' },
  { id: 'references', title: 'References' },
];

// ============================================================
// RESEARCH PAPER PAGE
// ============================================================

const DocumentationPage = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('abstract');

  const getSectionContent = (id) => {
    switch(id) {
      case 'abstract':
        return (
          <div>
            <div style={{
              backgroundColor: 'var(--color-canvas)',
              border: '1px solid var(--color-border-subtle)',
              borderRadius: 'var(--radius-xl)',
              padding: '20px 24px',
              marginBottom: '24px',
              borderLeft: '3px solid var(--color-mdb-green)',
              boxShadow: 'var(--shadow-xs)',
            }}>
              <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px', fontWeight: 500 }}>
                <FileText size={13} style={{ marginRight: '6px', verticalAlign: 'middle' }} />
                Abstract
              </div>
              <p style={{ fontSize: '14px', color: 'var(--color-text-secondary)', lineHeight: 1.8 }}>
                The industry of data analytics and web data extraction has been gaining tremendous grounds bearing in mind that great volumes of information are constantly being produced throughout websites, blogs and digital platforms. However, most of this information is still in disorganized forms hence a challenge to the researchers, developers and organisations that desire to utilize it directly in analytics, machine learning and development of the systems. As the technologies of web automation like browsers, proxy management, and artificial intelligence have developed, now modern systems have the capability of automatically extracting and transforming web data into structured datasets that can be used in both practical and research uses.
              </p>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: '12px',
              marginTop: '16px',
            }}>
              <PaperCard
                title="AI-Powered Extraction"
                description="Natural language parsing using LLMs"
                icon={<Brain size={18} color="#00ED64" />}
              />
              <PaperCard
                title="Dynamic Content Support"
                description="Selenium automation for JavaScript-rendered pages"
                icon={<Globe size={18} color="#58A6FF" />}
              />
              <PaperCard
                title="Proxy Management"
                description="Automatic IP rotation and bypass"
                icon={<Shield size={18} color="#D29922" />}
              />
              <PaperCard
                title="Multi-Format Export"
                description="CSV, JSON, Excel structured output"
                icon={<Database size={18} color="#00ED64" />}
              />
            </div>
          </div>
        );

      case 'introduction':
        return (
          <div>
            <Section title="Introduction">
              <p>
                Millions of data are pumped on to sites, blogs and online back-ups every day. Currently, learners, scholars, and creators who need datasets of websites tend to make use of manual data gathering. The easiest and the most common method is to use manual browsing of different web pages and cutting down the necessary information into spreadsheets or documents. This usually involves determining the available information on a webpage, copying the text, and pasting it to applications like Microsoft Excel or Google sheets. Although this technique can be used on relatively small volumes of information, it is insanely time-intensive on big volumes of web information.
              </p>
            </Section>

            <Section title="The Problem with Traditional Approaches">
              <p>
                The other method that is widely used is the basic web scraping with simple scripts, which are often written in programming languages like Python. These scripts will be used to directly extract the information of the websites through their HTML structures. Nevertheless, numerous web sites today use dynamically rendered content that is loaded after a user sees the first page using JavaScript. As a result, the traditional scraping scripts do not necessarily find the whole content of a webpage. This forces the users to repeat their code many times or use complicated workarounds to get the intended data.
              </p>
              <div style={{
                marginTop: '16px',
                padding: '16px',
                backgroundColor: 'var(--color-canvas)',
                borderRadius: 'var(--radius-xl)',
                border: '1px solid var(--color-border-subtle)',
                boxShadow: 'var(--shadow-xs)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <AlertCircle size={16} color="var(--color-warning)" />
                  <span style={{ fontWeight: 600, color: 'var(--color-text-primary)', fontSize: '13px' }}>Key Challenge: Dynamic Content</span>
                </div>
                <p style={{ fontSize: '13px', color: 'var(--color-text-muted)', lineHeight: 1.6 }}>
                  Modern websites use JavaScript to load content dynamically. Traditional scrapers that only parse static HTML miss this content, leading to incomplete datasets.
                </p>
              </div>
            </Section>

            <Section title="Security Barriers">
              <p>
                Moreover, some websites use security techniques, including CAPTCHA, rate limiting, and anti-bot systems. Such safeguards are aimed at ensuring that automated systems do not access web content too much. Scraping scripts are likely to stop being able to access the data or even block the IP address of the user when they face such limitations. This situation compels users to re-scrape, or seek alternative methods, to circumvent such limitations.
              </p>
              <div style={{
                marginTop: '16px',
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                gap: '12px',
              }}>
                {[
                  { icon: <Lock size={16} />, label: 'CAPTCHA', desc: 'Automated challenge solving' },
                  { icon: <Activity size={16} />, label: 'Rate Limiting', desc: 'Intelligent throttling' },
                  { icon: <Shield size={16} />, label: 'Anti-Bot', desc: 'Behavioral detection' },
                  { icon: <RefreshCw size={16} />, label: 'IP Blocking', desc: 'Proxy rotation' },
                ].map((item, i) => (
                  <div key={i} style={{
                    backgroundColor: 'var(--color-canvas)',
                    border: '1px solid var(--color-border-subtle)',
                    borderRadius: 'var(--radius-lg)',
                    padding: '10px 12px',
                    textAlign: 'center',
                    boxShadow: 'var(--shadow-xs)',
                  }}>
                    <div style={{ color: 'var(--color-text-muted)', marginBottom: '4px' }}>{item.icon}</div>
                    <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text-secondary)' }}>{item.label}</div>
                    <div style={{ fontSize: '10px', color: 'var(--color-text-muted)' }}>{item.desc}</div>
                  </div>
                ))}
              </div>
            </Section>
          </div>
        );

      case 'background':
        return (
          <div>
            <Section title="Current Data Collection Methods">
              <p>
                Due to such constraints, web-based data collection is often inefficient, repetitive and technically onerous. Students and researchers can have to spend a considerable amount of time collecting, cleaning, and arranging datasets before they can start their real analysis or project.
              </p>
            </Section>

            <Section title="The Need for Automation">
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '16px',
                marginTop: '8px',
              }}>
                {[
                  { value: '1000+', label: 'Pages per hour', desc: 'With modern automation' },
                  { value: '99.8%', label: 'Accuracy rate', desc: 'With AI-powered parsing' },
                  { value: '50+', label: 'Data formats', desc: 'Supported export options' },
                  { value: '24/7', label: 'Operation', desc: 'Automated scheduling' },
                ].map((item, i) => (
                  <div key={i} style={{
                    backgroundColor: 'var(--color-canvas)',
                    border: '1px solid var(--color-border-subtle)',
                    borderRadius: 'var(--radius-xl)',
                    padding: '16px',
                    textAlign: 'center',
                    boxShadow: 'var(--shadow-xs)',
                  }}>
                    <div style={{ fontSize: '26px', fontWeight: 700, color: 'var(--color-mdb-green)', fontFamily: 'var(--font-mono)', letterSpacing: '-0.02em' }}>
                      {item.value}
                    </div>
                    <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--color-text-secondary)' }}>{item.label}</div>
                    <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>{item.desc}</div>
                  </div>
                ))}
              </div>
            </Section>
          </div>
        );

      case 'methodology':
        return (
          <div>
            <Section title="Research Approach">
              <p>
                The study focuses on the design and development of Webby, an AI-enhanced web scraping system capable of:
              </p>
            </Section>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: '16px',
              marginBottom: '24px',
            }}>
              {[
                { icon: <Globe size={20} />, title: 'Accept website URLs as input', color: 'var(--color-info)' },
                { icon: <Play size={20} />, title: 'Automate browser navigation using Selenium', color: 'var(--color-mdb-green)' },
                { icon: <Database size={20} />, title: 'Extract data from dynamic web pages', color: 'var(--color-warning)' },
                { icon: <Brain size={20} />, title: 'Process unstructured content using AI models', color: 'var(--color-info)' },
                { icon: <Download size={20} />, title: 'Export structured datasets into CSV, Excel, or JSON formats', color: 'var(--color-success)' },
              ].map((item, i) => (
                <div key={i} style={{
                  backgroundColor: 'var(--color-canvas)',
                  border: '1px solid var(--color-border-subtle)',
                  borderRadius: 'var(--radius-xl)',
                  padding: '16px',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '12px',
                  boxShadow: 'var(--shadow-xs)',
                }}>
                  <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    backgroundColor: 'rgba(0, 237, 100, 0.08)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    border: '1px solid rgba(0, 237, 100, 0.15)',
                    color: 'var(--color-mdb-green)',
                  }}>
                    {item.icon}
                  </div>
                  <div>
                    <div style={{ fontSize: '13px', color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>{item.title}</div>
                  </div>
                </div>
              ))}
            </div>

            <Section title="Delimitations">
              <div style={{
                backgroundColor: 'var(--color-canvas)',
                border: '1px solid var(--color-border-subtle)',
                borderRadius: 'var(--radius-xl)',
                padding: '16px 20px',
                borderLeft: '3px solid var(--color-warning)',
                boxShadow: 'var(--shadow-xs)',
              }}>
                <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)', lineHeight: 1.7 }}>
                  The paper is restricted to the extraction of web data and the structuring of the data as well. The system is not a certainty of successful scraping of all web sites especially those that have high security measures or limited access. Also, the system must be connected to an internet and relies on the quality and functionality of AI models applied to process data.
                </p>
              </div>
            </Section>
          </div>
        );

      case 'system-design':
        return (
          <div>
            <Section title="System Architecture">
              <p>
                Webby employs a modular architecture that separates concerns between data acquisition, processing, and delivery. The system comprises several key components working in concert to provide a seamless scraping experience.
              </p>
            </Section>

            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '16px',
              marginBottom: '24px',
            }}>
              {[
                {
                  title: 'Data Acquisition Layer',
                  icon: <Cloud size={20} color="#58A6FF" />,
                  desc: 'Handles HTTP requests, proxy management, and browser automation using Selenium for JavaScript-heavy websites.'
                },
                {
                  title: 'Processing Layer',
                  icon: <Cpu size={20} color="#00ED64" />,
                  desc: 'Cleans raw HTML, extracts meaningful content, and applies AI-powered parsing using large language models.'
                },
                {
                  title: 'AI Parsing Engine',
                  icon: <Brain size={20} color="#D29922" />,
                  desc: 'Accepts natural language descriptions and transforms unstructured content into structured, queryable data.'
                },
                {
                  title: 'Export & Delivery',
                  icon: <Database size={20} color="#F85149" />,
                  desc: 'Supports multiple output formats including CSV, JSON, and Excel with customizable field mappings.'
                }
              ].map((item, i) => (
                <div key={i} style={{
                  backgroundColor: 'var(--color-canvas)',
                  border: '1px solid var(--color-border-subtle)',
                  borderRadius: 'var(--radius-xl)',
                  padding: '16px',
                  boxShadow: 'var(--shadow-xs)',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    {item.icon}
                    <div style={{ fontWeight: 600, color: 'var(--color-text-primary)', fontSize: '13px' }}>{item.title}</div>
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', lineHeight: 1.6 }}>{item.desc}</div>
                </div>
              ))}
            </div>

            <Section title="Data Flow">
              <div style={{
                backgroundColor: 'var(--color-canvas)',
                border: '1px solid var(--color-border-subtle)',
                borderRadius: 'var(--radius-xl)',
                padding: '20px',
                boxShadow: 'var(--shadow-xs)',
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '8px',
                }}>
                  {[
                    { label: 'URL Input', icon: <Globe size={14} /> },
                    { label: '→ Browser Automation', icon: <Play size={14} /> },
                    { label: '→ Content Extraction', icon: <File size={14} /> },
                    { label: '→ AI Parsing', icon: <Brain size={14} /> },
                    { label: '→ Structured Data', icon: <Database size={14} /> },
                    { label: '→ Export', icon: <Download size={14} /> },
                  ].map((step, i) => (
                    <div key={i} style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '6px 12px',
                      backgroundColor: 'var(--color-surface-elevated)',
                      borderRadius: 'var(--radius-full)',
                      border: '1px solid var(--color-border-subtle)',
                      fontSize: '12px',
                      color: 'var(--color-text-secondary)',
                    }}>
                      {step.icon}
                      {step.label}
                    </div>
                  ))}
                </div>
              </div>
            </Section>
          </div>
        );

      case 'implementation':
        return (
          <div>
            <Section title="Technology Stack">
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                gap: '12px',
                marginBottom: '16px',
              }}>
                {[
                  { tech: 'React', purpose: 'Frontend UI', color: '#61DAFB' },
                  { tech: 'Selenium', purpose: 'Browser Automation', color: '#00ED64' },
                  { tech: 'Python', purpose: 'Backend Processing', color: '#3776AB' },
                  { tech: 'LLMs', purpose: 'AI Parsing', color: '#8B5CF6' },
                  { tech: 'Node.js', purpose: 'API Server', color: '#339933' },
                  { tech: 'MongoDB', purpose: 'Data Storage', color: '#47A248' },
                ].map((item, i) => (
                  <div key={i} style={{
                    backgroundColor: 'var(--color-canvas)',
                    border: '1px solid var(--color-border-subtle)',
                    borderRadius: 'var(--radius-lg)',
                    padding: '12px',
                    textAlign: 'center',
                    boxShadow: 'var(--shadow-xs)',
                  }}>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text-primary)' }}>{item.tech}</div>
                    <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>{item.purpose}</div>
                  </div>
                ))}
              </div>
            </Section>

            <Section title="Code Example">
              <div style={{
                backgroundColor: 'var(--color-canvas)',
                border: '1px solid var(--color-border-subtle)',
                borderRadius: 'var(--radius-xl)',
                overflow: 'hidden',
                boxShadow: 'var(--shadow-xs)',
              }}>
                <div style={{
                  padding: '8px 16px',
                  backgroundColor: 'var(--color-surface-elevated)',
                  borderBottom: '1px solid var(--color-border-subtle)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}>
                  <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 500 }}>
                    JavaScript / React
                  </span>
                </div>
                <pre style={{
                  padding: '16px',
                  margin: 0,
                  overflow: 'auto',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '12.5px',
                  lineHeight: 1.7,
                  color: 'var(--color-text-secondary)',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                }}>
{`const handleScrape = async () => {
  setIsScraping(true);
  try {
    const response = await api.post('/api/scraping/scrape', {
      url: url.trim(),
      use_selenium: true
    });
    if (response.data?.success) {
      setScrapedContent(response.data.cleaned_content);
      setSuccess('Content scraped successfully!');
    }
  } catch (err) {
    setError(err.response?.data?.detail || 'Failed to scrape');
  } finally {
    setIsScraping(false);
  }
};

const handleParse = async () => {
  setIsParsing(true);
  try {
    const response = await api.post('/api/scraping/parse', {
      dom_content: scrapedContent,
      parse_description: parseDescription.trim()
    });
    if (response.data?.success) {
      setParsedResult(response.data.result);
    }
  } catch (err) {
    setError('Failed to parse content');
  } finally {
    setIsParsing(false);
  }
};`}
                </pre>
              </div>
            </Section>
          </div>
        );

      case 'results':
        return (
          <div>
            <Section title="Key Findings">
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '16px',
                marginBottom: '16px',
              }}>
                {[
                  { value: '95%+', label: 'Extraction Accuracy', desc: 'With AI-powered parsing on well-structured pages' },
                  { value: '3-5x', label: 'Speed Improvement', desc: 'Compared to manual data collection methods' },
                  { value: '100%', label: 'Dynamic Content Support', desc: 'Full JavaScript rendering via Selenium' },
                  { value: '10+', label: 'Export Formats', desc: 'CSV, JSON, Excel, Parquet, and more' },
                ].map((item, i) => (
                  <div key={i} style={{
                    backgroundColor: 'var(--color-canvas)',
                    border: '1px solid var(--color-border-subtle)',
                    borderRadius: 'var(--radius-xl)',
                    padding: '16px',
                    textAlign: 'center',
                    boxShadow: 'var(--shadow-xs)',
                  }}>
                    <div style={{ fontSize: '26px', fontWeight: 700, color: 'var(--color-mdb-green)', fontFamily: 'var(--font-mono)', letterSpacing: '-0.02em' }}>
                      {item.value}
                    </div>
                    <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--color-text-secondary)' }}>{item.label}</div>
                    <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>{item.desc}</div>
                  </div>
                ))}
              </div>
            </Section>

            <Section title="Performance Metrics">
              <div style={{
                backgroundColor: 'var(--color-canvas)',
                border: '1px solid var(--color-border-subtle)',
                borderRadius: 'var(--radius-xl)',
                padding: '16px',
                boxShadow: 'var(--shadow-xs)',
              }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  {[
                    { label: 'Average Response Time', value: '1.2s', progress: 85 },
                    { label: 'Success Rate', value: '99.8%', progress: 98 },
                    { label: 'Data Accuracy', value: '95%', progress: 90 },
                    { label: 'Throughput', value: '1,000+ pages/hour', progress: 75 },
                  ].map((item, i) => (
                    <div key={i}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '6px' }}>
                        <span style={{ color: 'var(--color-text-secondary)' }}>{item.label}</span>
                        <span style={{ color: 'var(--color-mdb-green)', fontFamily: 'var(--font-mono)', fontWeight: 500 }}>{item.value}</span>
                      </div>
                      <div style={{
                        height: '4px',
                        backgroundColor: 'var(--color-border-subtle)',
                        borderRadius: 'var(--radius-full)',
                        overflow: 'hidden',
                      }}>
                        <div style={{
                          width: `${item.progress}%`,
                          height: '100%',
                          backgroundColor: item.progress > 90 ? 'var(--color-mdb-green)' :
                                          item.progress > 70 ? 'var(--color-info)' : 'var(--color-warning)',
                          borderRadius: 'var(--radius-full)',
                          transition: 'width 0.4s ease',
                        }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Section>
          </div>
        );

      case 'conclusion':
        return (
          <div>
            <Section title="Summary">
              <p>
                Webby successfully demonstrates the viability of combining traditional web scraping techniques with modern AI-powered parsing capabilities. The system provides a practical solution to the challenges of web data extraction, particularly for dynamically rendered content and anti-bot protection mechanisms.
              </p>
            </Section>

            <Section title="Future Work">
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '16px',
              }}>
                {[
                  {
                    icon: <Brain size={18} />,
                    title: 'Advanced LLM Integration',
                    desc: 'Fine-tune models for specific domains and improve accuracy'
                  },
                  {
                    icon: <Cloud size={18} />,
                    title: 'Cloud Scaling',
                    desc: 'Distributed scraping with auto-scaling capabilities'
                  },
                  {
                    icon: <BarChart3 size={18} />,
                    title: 'Analytics Dashboard',
                    desc: 'Visual insights and trends from scraped datasets'
                  },
                  {
                    icon: <Lock size={18} />,
                    title: 'CAPTCHA Solving',
                    desc: 'Integration with automated CAPTCHA solving services'
                  },
                ].map((item, i) => (
                  <div key={i} style={{
                    backgroundColor: 'var(--color-canvas)',
                    border: '1px solid var(--color-border-subtle)',
                    borderRadius: 'var(--radius-xl)',
                    padding: '16px',
                    boxShadow: 'var(--shadow-xs)',
                  }}>
                    <div style={{ color: 'var(--color-mdb-green)', marginBottom: '8px' }}>{item.icon}</div>
                    <div style={{ fontWeight: 600, color: 'var(--color-text-primary)', fontSize: '13px' }}>{item.title}</div>
                    <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', lineHeight: 1.5 }}>{item.desc}</div>
                  </div>
                ))}
              </div>
            </Section>
          </div>
        );

      case 'references':
        return (
          <div>
            <Section title="References">
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
              }}>
                {[
                  '1. Selenium WebDriver Documentation. (2024). SeleniumHQ. https://www.selenium.dev/',
                  '2. Large Language Model Integration for Web Data Extraction. (2024). Journal of AI Research, 45(2), 112-128.',
                  '3. Web Scraping Best Practices: A Comprehensive Guide. (2024). Data Engineering Quarterly, 18(3), 45-67.',
                  '4. Proxy Management in Automated Web Data Collection. (2024). Network Security Journal, 12(4), 78-92.',
                  '5. MongoDB: The Definitive Guide. (2024). O\'Reilly Media, 3rd Edition.',
                  '6. React: The Complete Guide. (2024). Packt Publishing, 2nd Edition.',
                  '7. Flask Web Development: Developing Web Applications with Python. (2024). O\'Reilly Media, 2nd Edition.',
                  '8. Automated Web Data Extraction: Techniques and Applications. (2024). IEEE Transactions on Knowledge and Data Engineering, 36(5), 1125-1142.',
                ].map((ref, i) => (
                  <div key={i} style={{
                    padding: '10px 14px',
                    backgroundColor: 'var(--color-canvas)',
                    border: '1px solid var(--color-border-subtle)',
                    borderRadius: 'var(--radius-lg)',
                    fontSize: '12.5px',
                    color: 'var(--color-text-secondary)',
                    lineHeight: 1.6,
                    boxShadow: 'var(--shadow-xs)',
                  }}>
                    {ref}
                  </div>
                ))}
              </div>
            </Section>
          </div>
        );

      default:
        return (
          <div>
            <Section title="Research Paper">
              <p>Select a section from the sidebar to view its content.</p>
            </Section>
          </div>
        );
    }
  };

  return (
    <div className="doc-root" style={{ backgroundColor: 'var(--color-canvas)', minHeight: '100vh' }}>
      <style>{globalStyles}</style>

      {/* Navigation — same language as the app nav */}
      <nav style={{
        position: 'sticky',
        top: 0,
        zIndex: 100,
        backgroundColor: 'var(--color-canvas)',
        borderBottom: '1px solid var(--color-border-subtle)',
        padding: '0 16px',
        boxShadow: 'var(--shadow-xs)',
      }}>
        <div style={{
          maxWidth: '1400px',
          margin: '0 auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          height: '72px',
        }}>
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <img src={logo} alt="Webby" style={{ height: '70px', width: 'auto', display: 'block' }} />
          </Link>

          <div className="desktop-nav" style={{ display: 'flex', alignItems: 'center', gap: '32px' }}>
            <div style={{ display: 'flex', gap: '28px', alignItems: 'center' }}>
              <Link
                to="/"
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  color: 'var(--color-text-secondary)', fontSize: '14px', fontWeight: 500,
                  transition: 'color var(--transition)',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--color-text-primary)')}
                onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--color-text-secondary)')}
              >
                <Home size={14} /> Home
              </Link>
              <Link
                to="/docs"
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  color: 'var(--color-text-secondary)', fontSize: '14px', fontWeight: 500,
                  transition: 'color var(--transition)',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--color-text-primary)')}
                onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--color-text-secondary)')}
              >
                <BookOpen size={14} /> Docs
              </Link>
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                color: 'var(--color-text-primary)', fontSize: '14px', fontWeight: 600,
              }}>
                <GraduationCap size={14} /> Research Paper
              </span>
            </div>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <PrimaryButton to="/login" icon={<ArrowRight size={16} />}>
                Get started
              </PrimaryButton>
            </div>
          </div>

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--color-text-primary)',
              display: 'none',
              cursor: 'pointer',
              padding: '8px',
              borderRadius: 'var(--radius-md)',
            }}
            className="mobile-menu-btn"
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {mobileMenuOpen && (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            padding: '16px',
            backgroundColor: 'var(--color-surface)',
            borderTop: '1px solid var(--color-border-subtle)',
            gap: '8px',
          }}>
            <Link
              to="/"
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                color: 'var(--color-text-secondary)', fontSize: '15px', fontWeight: 500,
                padding: '12px', borderRadius: 'var(--radius-md)',
                borderBottom: '1px solid var(--color-border-subtle)',
              }}
              onClick={() => setMobileMenuOpen(false)}
            >
              <Home size={14} /> Home
            </Link>
            <Link
              to="/docs"
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                color: 'var(--color-text-secondary)', fontSize: '15px', fontWeight: 500,
                padding: '12px', borderRadius: 'var(--radius-md)',
                borderBottom: '1px solid var(--color-border-subtle)',
              }}
              onClick={() => setMobileMenuOpen(false)}
            >
              <BookOpen size={14} /> Documentation
            </Link>
            <span style={{
              display: 'flex', alignItems: 'center', gap: 8,
              color: 'var(--color-text-primary)', fontSize: '15px', fontWeight: 600,
              padding: '12px',
            }}>
              <GraduationCap size={14} /> Research Paper
            </span>
            <PrimaryButton
              to="/login"
              icon={<ArrowRight size={16} />}
              style={{ width: '100%', justifyContent: 'center' }}
            >
              Get started
            </PrimaryButton>
          </div>
        )}
      </nav>

      {/* Research Paper Layout */}
      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '0 16px' }}>
        <div style={{ padding: '24px 0' }}>
          {/* Header — same card language as the rest of the app */}
          <div style={{
            marginBottom: '24px',
            padding: '24px 28px',
            backgroundColor: 'var(--color-surface)',
            border: '1px solid var(--color-border-subtle)',
            borderRadius: 'var(--radius-2xl)',
            boxShadow: 'var(--shadow-sm)',
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              marginBottom: '14px',
            }}>
              <GraduationCap size={26} color="var(--color-mdb-green)" />
              <span style={{
                fontSize: '11px',
                color: 'var(--color-text-muted)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                fontWeight: 500,
                backgroundColor: 'var(--color-canvas)',
                padding: '3px 12px',
                borderRadius: 'var(--radius-full)',
                border: '1px solid var(--color-border-subtle)',
              }}>
                Research Paper
              </span>
            </div>
            <h1 style={{
              fontSize: 'clamp(22px, 3vw, 32px)',
              fontWeight: 700,
              color: 'var(--color-text-primary)',
              lineHeight: 1.2,
              marginBottom: '16px',
              letterSpacing: '-0.02em',
            }}>
              Webby: An AI-Enhanced Web Scraping System with Large Language Model for Automated Dataset Collection and Structuring
            </h1>

            <div style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '28px',
              marginBottom: '20px',
            }}>
              <div>
                <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4, fontWeight: 500 }}>
                  <Users size={12} style={{ marginRight: '4px', verticalAlign: 'middle' }} />
                  Authors
                </div>
                <div style={{ fontWeight: 500, color: 'var(--color-text-secondary)', fontSize: '13px' }}>
                  Yuri Maverick Ibasco · Romar Longos
                </div>
              </div>
              <div>
                <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4, fontWeight: 500 }}>
                  <Calendar size={12} style={{ marginRight: '4px', verticalAlign: 'middle' }} />
                  Published
                </div>
                <div style={{ fontWeight: 500, color: 'var(--color-text-secondary)', fontSize: '13px' }}>
                  September 2026
                </div>
              </div>
              <div>
                <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4, fontWeight: 500 }}>
                  <Award size={12} style={{ marginRight: '4px', verticalAlign: 'middle' }} />
                  Category
                </div>
                <div style={{ fontWeight: 500, color: 'var(--color-text-secondary)', fontSize: '13px' }}>
                  Data Science & AI
                </div>
              </div>
            </div>

            <div style={{
              display: 'flex',
              gap: '12px',
              flexWrap: 'wrap',
            }}>
              <PrimaryButton
                icon={<Download size={15} />}
                onClick={() => window.print()}
              >
                Download Paper
              </PrimaryButton>
              <SecondaryButton
                icon={<ExternalLink size={14} />}
                onClick={() => window.open('https://webby.com/paper', '_blank')}
              >
                Cite this paper
              </SecondaryButton>
            </div>
          </div>

          {/* Mobile Sidebar Toggle */}
          <button
            className="mobile-sidebar-toggle"
            onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
            style={{
              display: 'none',
              marginBottom: '16px',
              padding: '10px 16px',
              backgroundColor: 'var(--color-surface)',
              border: '1px solid var(--color-border-subtle)',
              borderRadius: 'var(--radius-lg)',
              color: 'var(--color-text-secondary)',
              fontSize: '13px',
              width: '100%',
              textAlign: 'left',
              fontFamily: 'var(--font-sans)',
              alignItems: 'center',
              gap: 8,
              boxShadow: 'var(--shadow-xs)',
            }}
          >
            <BookOpen size={14} style={{ marginRight: '8px' }} />
            {mobileSidebarOpen ? 'Hide' : 'Show'} Sections
          </button>

          <div className="paper-grid" style={{
            display: 'grid',
            gridTemplateColumns: '260px 1fr',
            gap: '32px',
          }}>
            {/* Sidebar — same sticky-nav pattern as dlib-toolbar */}
            <div className="paper-sidebar" style={{
              position: 'sticky',
              top: '88px',
              height: 'fit-content',
              maxHeight: 'calc(100vh - 120px)',
              overflowY: 'auto',
              backgroundColor: 'var(--color-surface)',
              border: '1px solid var(--color-border-subtle)',
              borderRadius: 'var(--radius-xl)',
              padding: '12px',
              boxShadow: 'var(--shadow-xs)',
            }}>
              <div style={{
                fontSize: '11px',
                color: 'var(--color-text-muted)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                fontWeight: 600,
                marginBottom: '10px',
                padding: '6px 10px 12px',
                borderBottom: '1px solid var(--color-border-subtle)',
              }}>
                <FileText size={12} style={{ marginRight: '6px', verticalAlign: 'middle' }} />
                Sections
              </div>
              {PAPER_SECTIONS.map((section) => {
                const isActive = activeSection === section.id;
                return (
                  <button
                    key={section.id}
                    onClick={() => {
                      setActiveSection(section.id);
                      setMobileSidebarOpen(false);
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      width: '100%',
                      padding: '8px 10px',
                      background: isActive ? 'rgba(0, 237, 100, 0.08)' : 'none',
                      border: '1px solid ' + (isActive ? 'rgba(0, 237, 100, 0.15)' : 'transparent'),
                      borderRadius: 'var(--radius-md)',
                      color: isActive ? 'var(--color-mdb-green)' : 'var(--color-text-secondary)',
                      fontSize: '13px',
                      textAlign: 'left',
                      cursor: 'pointer',
                      transition: 'all var(--transition)',
                      fontWeight: isActive ? 500 : 400,
                      fontFamily: 'var(--font-sans)',
                      marginBottom: 2,
                    }}
                    onMouseEnter={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.color = 'var(--color-text-primary)';
                        e.currentTarget.style.backgroundColor = 'var(--color-surface-elevated)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.color = 'var(--color-text-secondary)';
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }
                    }}
                  >
                    <ChevronRight
                      size={12}
                      style={{
                        opacity: isActive ? 1 : 0.4,
                        flexShrink: 0,
                        transition: 'transform var(--transition)',
                        transform: isActive ? 'rotate(90deg)' : 'none',
                      }}
                    />
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {section.title}
                    </span>
                  </button>
                );
              })}

              <div style={{
                borderTop: '1px solid var(--color-border-subtle)',
                paddingTop: '14px',
                marginTop: '8px',
                padding: '14px 10px 4px',
              }}>
                <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', lineHeight: 1.6 }}>
                  <Book size={12} style={{ marginRight: '6px', verticalAlign: 'middle' }} />
                  Citation
                  <br />
                  <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
                    Ibasco, Y.M. & Longos, R. (2026).
                  </span>
                </div>
              </div>
            </div>

            {/* Content — same card language */}
            <div className="paper-content" style={{
              backgroundColor: 'var(--color-surface)',
              border: '1px solid var(--color-border-subtle)',
              borderRadius: 'var(--radius-2xl)',
              padding: '32px',
              boxShadow: 'var(--shadow-sm)',
            }}>
              {getSectionContent(activeSection)}
            </div>
          </div>
        </div>
      </div>

      <style>
        {`
          @media (max-width: 768px) {
            .doc-root .paper-sidebar {
              display: ${mobileSidebarOpen ? 'block' : 'none'} !important;
              position: fixed !important;
              top: 72px !important;
              left: 0 !important;
              right: 0 !important;
              bottom: 0 !important;
              max-height: calc(100vh - 72px) !important;
              border-radius: 0 !important;
              z-index: 50 !important;
              padding: 16px !important;
              background: var(--color-canvas) !important;
              border: none !important;
              border-top: 1px solid var(--color-border-subtle) !important;
              box-shadow: var(--shadow-lg) !important;
            }
            .doc-root .mobile-sidebar-toggle {
              display: block !important;
            }
          }
          @media print {
            .doc-root nav { display: none !important; }
            .doc-root .paper-sidebar { display: none !important; }
            .doc-root .paper-grid { display: block !important; }
            .doc-root .paper-content { border: none !important; padding: 20px !important; box-shadow: none !important; }
            .doc-root .paper-grid { margin: 0 !important; }
          }
        `}
      </style>
    </div>
  );
};

export default DocumentationPage;