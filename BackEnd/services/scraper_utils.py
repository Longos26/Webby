# backend/services/scraper_utils.py - ENHANCED with clean text extraction

import requests
from bs4 import BeautifulSoup
from typing import List, Dict, Any, Optional, Set, Tuple
from urllib.parse import urljoin, urlparse, urlunparse
import re
import time
import asyncio
from collections import deque
import hashlib
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import TimeoutException, NoSuchElementException
from concurrent.futures import ThreadPoolExecutor, as_completed
import logging

logger = logging.getLogger(__name__)

# ============================================================
# ENHANCED SCRAPER WITH PAGINATION & DEEP CRAWLING
# ============================================================

class EnhancedScraper:
    """Enterprise-grade scraper with full pagination and deep crawling"""
    
    def __init__(self, max_depth: int = 3, max_pages: int = 1000, delay: float = 1.0):
        self.max_depth = max_depth
        self.max_pages = max_pages
        self.delay = delay
        self.visited_urls: Set[str] = set()
        self.url_queue = deque()
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        })
        
    def normalize_url(self, url: str, base_url: str = None) -> str:
        """Normalize URL to prevent duplicates"""
        if base_url:
            url = urljoin(base_url, url)
        
        parsed = urlparse(url)
        # Remove fragments and normalize
        normalized = urlunparse((
            parsed.scheme,
            parsed.netloc,
            parsed.path.rstrip('/'),
            '',  # params
            '',  # query - remove query params for deduplication
            ''   # fragment
        ))
        return normalized.lower()
    
    def is_same_domain(self, url: str, base_domain: str) -> bool:
        """Check if URL belongs to same domain"""
        parsed = urlparse(url)
        return parsed.netloc == base_domain or parsed.netloc.endswith(f'.{base_domain}')
    
    def detect_pagination(self, soup: BeautifulSoup, base_url: str) -> List[str]:
        """Detect pagination links from various patterns"""
        pagination_urls = set()
        
        # Pattern 1: Next button
        next_selectors = [
            'a:contains("Next")',
            'a:contains("next")',
            'a:contains("→")',
            'a:contains("»")',
            'a[rel="next"]',
            'a.next',
            '.next a',
            '.pagination-next a',
            'button:contains("Next")'
        ]
        
        for selector in next_selectors:
            try:
                next_link = soup.select_one(selector)
                if next_link and next_link.get('href'):
                    pagination_urls.add(self.normalize_url(next_link['href'], base_url))
            except:
                pass
        
        # Pattern 2: Page numbers
        page_selectors = [
            '.pagination a',
            '.pages a',
            'a.page',
            '.page-numbers',
            '[data-page]'
        ]
        
        for selector in page_selectors:
            for link in soup.select(selector):
                href = link.get('href')
                if href:
                    pagination_urls.add(self.normalize_url(href, base_url))
                # Check for data-page attribute
                page_num = link.get('data-page')
                if page_num and page_num.isdigit() and int(page_num) > 1:
                    # Need to construct URL - this is site-specific
                    pass
        
        # Pattern 3: URL patterns with page parameters
        parsed = urlparse(base_url)
        query_params = dict(p.split('=') for p in parsed.query.split('&') if '=' in p)
        
        # Check for common page parameter names
        page_params = ['page', 'p', 'pagina', 'pageNum', 'offset', 'start']
        for param in page_params:
            if param in query_params:
                try:
                    current_page = int(query_params[param])
                    # Generate next page URL
                    for next_page in [current_page + 1, current_page + 2, current_page + 3]:
                        new_query = parsed.query.replace(f'{param}={current_page}', f'{param}={next_page}')
                        next_url = urlunparse((
                            parsed.scheme, parsed.netloc, parsed.path,
                            parsed.params, new_query, parsed.fragment
                        ))
                        pagination_urls.add(self.normalize_url(next_url))
                except:
                    pass
        
        # Pattern 4: Infinite scroll detection (look for load-more triggers)
        load_more_selectors = [
            '.load-more',
            '#load-more',
            '.infinite-scroll',
            '.show-more',
            'button:contains("Load More")'
        ]
        
        for selector in load_more_selectors:
            element = soup.select_one(selector)
            if element:
                # Mark that infinite scroll is present
                pagination_urls.add('__INFINITE_SCROLL__')
        
        return list(pagination_urls)
    
    def extract_internal_links(self, soup: BeautifulSoup, base_url: str, domain: str) -> List[str]:
        """Extract all internal links from page"""
        links = set()
        
        for a in soup.find_all('a', href=True):
            href = a['href'].strip()
            if not href or href.startswith('#') or href.startswith('javascript:'):
                continue
            
            full_url = self.normalize_url(href, base_url)
            
            # Only keep internal links
            if self.is_same_domain(full_url, domain):
                # Filter out static assets
                if not any(ext in full_url.lower() for ext in ['.jpg', '.png', '.gif', '.pdf', '.zip', '.css', '.js']):
                    links.add(full_url)
        
        return list(links)
    
    def clean_html_to_text(self, html: str) -> str:
        """
        Convert HTML to clean, readable text.
        This is the KEY function that removes all HTML tags and formatting.
        """
        if not html:
            return ""
        
        try:
            soup = BeautifulSoup(html, "html.parser")
            
            # Remove all non-content elements
            for tag in soup(["script", "style", "meta", "link", "noscript", "svg", 
                             "header", "footer", "nav", "aside", "iframe", "form",
                             "button", "input", "select", "textarea", "label",
                             "figure", "picture", "source", "video", "audio"]):
                tag.decompose()
            
            # Try to find main content area first (better than entire body)
            main_content = (
                soup.find('main') or 
                soup.find('article') or 
                soup.find('div', class_=re.compile(r'content|main|body|post|entry', re.I)) or
                soup.find('div', id=re.compile(r'content|main|body|post|entry', re.I)) or
                soup.body or 
                soup
            )
            
            # Add newlines after block-level elements for better readability
            for tag in main_content.find_all(['br', 'p', 'div', 'h1', 'h2', 'h3', 
                                               'h4', 'h5', 'h6', 'li', 'tr', 'hr']):
                tag.append('\n')
            
            # Get text
            text = main_content.get_text(separator="\n")
            
            # Clean up the text
            lines = []
            for line in text.splitlines():
                cleaned = ' '.join(line.split())  # Normalize all whitespace
                if len(cleaned) > 2:  # Skip very short/empty lines
                    lines.append(cleaned)
            
            # Join and remove excessive blank lines
            result = "\n".join(lines)
            result = re.sub(r'\n{3,}', '\n\n', result)
            
            return result.strip()
            
        except Exception as e:
            logger.error(f"Error cleaning HTML: {str(e)}")
            # Fallback: simple regex removal
            text = re.sub(r'<[^>]+>', ' ', html)
            text = re.sub(r'\s+', ' ', text)
            return text.strip()
    
    def extract_structured_data(self, soup: BeautifulSoup, url: str, raw_html: str = "") -> Dict[str, Any]:
        """Extract structured data using multiple methods"""
        data = {
            'url': url,
            'title': '',
            'description': '',
            'price': '',
            'email': '',
            'phone': '',
            'product_name': '',
            'category': '',
            'rating': '',
            'reviews_count': '',
            'images': [],
            'meta_tags': {},
            'schema_org': {},
            'clean_text': '',   # <-- CLEAN READABLE TEXT (use this for display)
            'raw_html': ''      # <-- Keep raw HTML separately (for parsing/extraction)
        }
        
        # Extract title
        title_tag = soup.find('title')
        if title_tag:
            data['title'] = title_tag.get_text(strip=True)
        
        # Extract meta description
        meta_desc = soup.find('meta', attrs={'name': 'description'})
        if meta_desc:
            data['description'] = meta_desc.get('content', '')
        
        # Extract Open Graph data
        og_title = soup.find('meta', attrs={'property': 'og:title'})
        if og_title:
            data['title'] = og_title.get('content', data['title'])
        
        og_desc = soup.find('meta', attrs={'property': 'og:description'})
        if og_desc:
            data['description'] = og_desc.get('content', data['description'])
        
        # Extract Schema.org structured data
        for script in soup.find_all('script', type='application/ld+json'):
            import json
            try:
                schema_data = json.loads(script.string)
                data['schema_org'] = schema_data
            except:
                pass
        
        # Extract price patterns
        price_patterns = [
            r'\$\d+(?:\.\d{2})?',
            r'\d+(?:\.\d{2})?\s?(?:USD|EUR|GBP)',
            r'price["\']?\s*[:\=]\s*["\']?(\d+(?:\.\d{2})?)',
            r'productPrice["\']?\s*[:\=]\s*["\']?(\d+(?:\.\d{2})?)'
        ]
        
        html_str = str(soup)
        for pattern in price_patterns:
            match = re.search(pattern, html_str, re.IGNORECASE)
            if match:
                data['price'] = match.group(0)
                break
        
        # Extract email addresses
        email_pattern = r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}'
        emails = re.findall(email_pattern, html_str)
        if emails:
            data['email'] = emails[0]
        
        # Extract phone numbers
        phone_patterns = [
            r'\+?[\d\s\-\(\)]{10,}',
            r'\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}'
        ]
        
        for pattern in phone_patterns:
            phones = re.findall(pattern, html_str)
            if phones:
                data['phone'] = phones[0]
                break
        
        # Extract product name
        product_selectors = [
            '.product-title', '.product-name', '.product_title',
            '[itemprop="name"]', 'h1.product', '.product-details h1'
        ]
        
        for selector in product_selectors:
            elem = soup.select_one(selector)
            if elem:
                data['product_name'] = elem.get_text(strip=True)
                break
        
        # Extract images
        for img in soup.find_all('img', src=True):
            src = img['src']
            if src and not src.startswith('data:'):
                full_src = urljoin(url, src)
                data['images'].append(full_src)
        
        data['images'] = data['images'][:20]  # Limit to 20 images
        
        # ============================================================
        # KEY: Extract CLEAN TEXT for display (no HTML tags!)
        # ============================================================
        data['clean_text'] = self.clean_html_to_text(raw_html if raw_html else str(soup))
        
        # Keep a truncated version of raw HTML for advanced parsing
        data['raw_html'] = (raw_html if raw_html else str(soup))[:100000]
        
        return data
    
    def scrape_with_pagination(self, start_url: str, max_pages: int = None) -> List[Dict[str, Any]]:
        """
        Scrape website with full pagination support
        Returns all scraped content from all pages with CLEAN TEXT
        """
        results = []
        max_pages = max_pages or self.max_pages
        start_url = self.normalize_url(start_url)
        
        # Initialize queue
        pages_to_scrape = [start_url]
        scraped_urls = set()
        pagination_discovered = set([start_url])
        
        page_count = 0
        
        while pages_to_scrape and page_count < max_pages:
            current_url = pages_to_scrape.pop(0)
            
            if current_url in scraped_urls:
                continue
            
            logger.info(f"Scraping page {page_count + 1}: {current_url}")
            
            try:
                # Add delay to be respectful
                time.sleep(self.delay)
                
                # Fetch page
                response = self.session.get(current_url, timeout=30)
                response.raise_for_status()
                
                raw_html = response.text
                soup = BeautifulSoup(raw_html, 'html.parser')
                
                # Extract structured data WITH clean text
                page_data = self.extract_structured_data(soup, current_url, raw_html)
                page_data['page_number'] = page_count + 1
                
                results.append(page_data)
                scraped_urls.add(current_url)
                page_count += 1
                
                # Detect pagination links
                if page_count == 1:  # Only on first page
                    # Re-parse for pagination detection (since extract_structured_data modifies soup)
                    soup_for_pagination = BeautifulSoup(raw_html, 'html.parser')
                    pagination_links = self.detect_pagination(soup_for_pagination, current_url)
                    
                    # Handle infinite scroll detection
                    if '__INFINITE_SCROLL__' in pagination_links:
                        logger.info("Infinite scroll detected - will need Selenium")
                        # Add special handling for infinite scroll
                        infinite_data = self.scrape_infinite_scroll(current_url)
                        if infinite_data:
                            results.extend(infinite_data)
                            break
                    
                    for link in pagination_links:
                        if link not in pagination_discovered and link not in scraped_urls:
                            if link != '__INFINITE_SCROLL__':
                                pages_to_scrape.append(link)
                                pagination_discovered.add(link)
                                logger.info(f"Discovered pagination: {link}")
                
            except Exception as e:
                logger.error(f"Error scraping {current_url}: {str(e)}")
                continue
        
        logger.info(f"Scraping complete. Total pages: {len(results)}")
        return results
    
    def scrape_infinite_scroll(self, url: str, scroll_pause: float = 2, max_scrolls: int = 50) -> List[Dict[str, Any]]:
        """Handle infinite scroll websites using Selenium"""
        try:
            from selenium import webdriver
            from selenium.webdriver.common.by import By
            from selenium.webdriver.support.ui import WebDriverWait
            
            driver = webdriver.Chrome()  # Configure as needed
            driver.get(url)
            
            results = []
            last_height = driver.execute_script("return document.body.scrollHeight")
            scroll_count = 0
            
            while scroll_count < max_scrolls:
                # Scroll down
                driver.execute_script("window.scrollTo(0, document.body.scrollHeight);")
                time.sleep(scroll_pause)
                
                # Check if new content loaded
                new_height = driver.execute_script("return document.body.scrollHeight")
                if new_height == last_height:
                    break
                
                last_height = new_height
                scroll_count += 1
                
                # Extract current page content
                raw_html = driver.page_source
                soup = BeautifulSoup(raw_html, 'html.parser')
                page_data = self.extract_structured_data(soup, url, raw_html)
                page_data['scroll_position'] = scroll_count
                results.append(page_data)
            
            driver.quit()
            return results
            
        except Exception as e:
            logger.error(f"Infinite scroll error: {str(e)}")
            return []

    def deep_crawl(self, start_url: str, max_depth: int = None) -> List[Dict[str, Any]]:
        """
        Deep crawl website following internal links
        Returns all scraped content with CLEAN TEXT
        """
        max_depth = max_depth or self.max_depth
        results = []
        start_url = self.normalize_url(start_url)
        queue = deque([(start_url, 0)])  # (url, depth)
        visited = set()
        
        while queue and len(results) < self.max_pages:
            url, depth = queue.popleft()
            
            if url in visited or depth > max_depth:
                continue
            
            logger.info(f"Deep crawl depth {depth}: {url}")
            
            try:
                time.sleep(self.delay)
                response = self.session.get(url, timeout=30)
                response.raise_for_status()
                
                raw_html = response.text
                soup = BeautifulSoup(raw_html, 'html.parser')
                
                # Extract data WITH clean text
                page_data = self.extract_structured_data(soup, url, raw_html)
                page_data['crawl_depth'] = depth
                results.append(page_data)
                visited.add(url)
                
                # Extract domain for internal link filtering
                domain = urlparse(url).netloc
                
                # Re-parse for link extraction
                soup_for_links = BeautifulSoup(raw_html, 'html.parser')
                
                # Find internal links to continue crawling
                internal_links = self.extract_internal_links(soup_for_links, url, domain)
                
                for link in internal_links:
                    if link not in visited:
                        queue.append((link, depth + 1))
                        
            except Exception as e:
                logger.error(f"Deep crawl error at {url}: {str(e)}")
                continue
        
        logger.info(f"Deep crawl complete. Total pages: {len(results)}")
        return results


class SmartContentDetector:
    """AI-powered content detection and classification"""
    
    @staticmethod
    def detect_content_type(content: str) -> Dict[str, float]:
        """Detect content type using keyword analysis"""
        scores = {
            'product': 0,
            'article': 0,
            'blog': 0,
            'ecommerce': 0,
            'business': 0,
            'educational': 0,
            'research': 0,
            'contact': 0
        }
        
        keywords = {
            'product': ['price', 'buy', 'shop', 'cart', 'product', 'in stock', 'add to cart', 'purchase', 'order now'],
            'article': ['published', 'author', 'date', 'read more', 'article', 'story', 'featured'],
            'blog': ['blog', 'posted by', 'comments', 'share this', 'category', 'tags'],
            'ecommerce': ['checkout', 'shipping', 'payment', 'discount', 'coupon', 'offers', 'deals'],
            'business': ['company', 'about us', 'services', 'clients', 'portfolio', 'team'],
            'educational': ['learn', 'course', 'tutorial', 'lesson', 'education', 'study', 'training'],
            'research': ['research', 'study', 'findings', 'methodology', 'conclusion', 'references'],
            'contact': ['contact', 'email', 'phone', 'address', 'location', 'support', 'help']
        }
        
        content_lower = content.lower()
        
        for content_type, words in keywords.items():
            for word in words:
                if word in content_lower:
                    scores[content_type] += 1
        
        # Normalize scores
        total = sum(scores.values())
        if total > 0:
            for key in scores:
                scores[key] = round((scores[key] / total) * 100, 1)
        
        return scores
    
    @staticmethod
    def extract_smart_data(content: str) -> Dict[str, Any]:
        """Extract data intelligently using pattern recognition"""
        data = {
            'emails': [],
            'phones': [],
            'urls': [],
            'prices': [],
            'dates': [],
            'names': [],
            'organizations': [],
            'addresses': []
        }
        
        # Email extraction
        email_pattern = r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}'
        data['emails'] = list(set(re.findall(email_pattern, content)))
        
        # Phone extraction (enhanced)
        phone_patterns = [
            r'\+?[\d\s\-\(\)]{10,}',
            r'\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}',
            r'\d{3}[-.\s]\d{3}[-.\s]\d{4}'
        ]
        phones = set()
        for pattern in phone_patterns:
            phones.update(re.findall(pattern, content))
        data['phones'] = list(phones)
        
        # URL extraction
        url_pattern = r'https?://(?:[-\w.]|(?:%[\da-fA-F]{2}))+[/\w\.-]*(?:\?[^\s]*)?'
        data['urls'] = list(set(re.findall(url_pattern, content)))[:50]
        
        # Price extraction (enhanced)
        price_patterns = [
            r'\$\d+(?:,\d{3})*(?:\.\d{2})?',
            r'\d+(?:,\d{3})*(?:\.\d{2})?\s?(?:USD|EUR|GBP|€|£)',
            r'(?:price|cost|total)[:\s]*[\$\€\£]?\s*(\d+(?:\.\d{2})?)'
        ]
        prices = set()
        for pattern in price_patterns:
            matches = re.findall(pattern, content, re.IGNORECASE)
            for match in matches:
                if isinstance(match, tuple):
                    match = match[0]
                prices.add(match)
        data['prices'] = list(prices)[:20]
        
        # Date extraction
        date_patterns = [
            r'\d{4}-\d{2}-\d{2}',
            r'\d{2}/\d{2}/\d{4}',
            r'\d{1,2}\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{4}'
        ]
        dates = set()
        for pattern in date_patterns:
            dates.update(re.findall(pattern, content))
        data['dates'] = list(dates)[:20]
        
        return data


# Singleton instance
_enhanced_scraper = None

def get_enhanced_scraper() -> EnhancedScraper:
    global _enhanced_scraper
    if _enhanced_scraper is None:
        _enhanced_scraper = EnhancedScraper()
    return _enhanced_scraper


# ============================================================
# BACKWARD COMPATIBILITY FUNCTIONS (all return CLEAN TEXT)
# ============================================================

def scrape_website(website: str, use_selenium: bool = False) -> str:
    """Legacy function - now enhanced and returns CLEAN TEXT"""
    scraper = get_enhanced_scraper()
    results = scraper.scrape_with_pagination(website, max_pages=1)
    if results:
        # Return clean text, not raw HTML
        return results[0].get('clean_text', '')
    return ''


def extract_body_content(html: str) -> str:
    """Extract body from HTML"""
    soup = BeautifulSoup(html, "html.parser")
    return str(soup.body) if soup.body else html


def clean_body_content(body: str) -> str:
    """
    Clean HTML and return readable text with good formatting.
    This removes ALL HTML tags.
    """
    if not body:
        return ""
    
    try:
        soup = BeautifulSoup(body, "html.parser")
        
        # Remove all non-content tags
        for tag in soup(["script", "style", "meta", "link", "noscript", "svg", 
                         "header", "footer", "nav", "aside", "iframe", "form",
                         "button", "input", "select", "textarea", "label",
                         "figure", "picture", "source", "video", "audio"]):
            tag.decompose()
        
        # Try to find main content area first
        main_content = (
            soup.find('main') or 
            soup.find('article') or 
            soup.find('div', class_=re.compile(r'content|main|body|post|entry', re.I)) or
            soup.find('div', id=re.compile(r'content|main|body|post|entry', re.I)) or
            soup.body or 
            soup
        )
        
        # Add newlines after block elements
        for tag in main_content.find_all(['br', 'p', 'div', 'h1', 'h2', 'h3', 
                                           'h4', 'h5', 'h6', 'li', 'tr', 'hr']):
            tag.append('\n')
        
        # Get text
        text = main_content.get_text(separator="\n")
        
        # Clean up whitespace
        lines = []
        for line in text.splitlines():
            cleaned = ' '.join(line.split())  # Normalize spaces
            if len(cleaned) > 2:  # Skip very short lines
                lines.append(cleaned)
        
        # Remove excessive blank lines
        result = "\n".join(lines)
        result = re.sub(r'\n{3,}', '\n\n', result)
        
        return result.strip()[:1000000]  # 1MB limit
        
    except Exception as e:
        logger.error(f"Error in clean_body_content: {str(e)}")
        # Fallback: simple regex removal
        text = re.sub(r'<[^>]+>', ' ', body)
        text = re.sub(r'\s+', ' ', text)
        return text.strip()[:1000000]


def split_dom_content(content: str, max_length: int = 6000) -> List[str]:
    """Split content into chunks for AI parsing"""
    return [content[i:i + max_length] for i in range(0, len(content), max_length)]


# ============================================================
# ENHANCED FUNCTIONS FOR THESIS REQUIREMENTS
# ============================================================

def scrape_with_pagination(url: str, max_pages: int = 100) -> List[Dict[str, Any]]:
    """Scrape website with full pagination support - returns CLEAN TEXT"""
    scraper = get_enhanced_scraper()
    return scraper.scrape_with_pagination(url, max_pages)


def deep_crawl_website(start_url: str, max_depth: int = 3) -> List[Dict[str, Any]]:
    """Deep crawl website following internal links - returns CLEAN TEXT"""
    scraper = get_enhanced_scraper()
    return scraper.deep_crawl(start_url, max_depth)


def smart_content_extraction(content: str) -> Dict[str, Any]:
    """Extract content intelligently using AI patterns"""
    return SmartContentDetector.extract_smart_data(content)


def detect_content_type(content: str) -> Dict[str, float]:
    """Detect content type with confidence scores"""
    return SmartContentDetector.detect_content_type(content)