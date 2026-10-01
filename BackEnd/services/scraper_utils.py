# backend/services/scraper_utils.py
# ENHANCED SCRAPER v2 — full pagination, deep crawl, detail pages,
# infinite scroll, deduplication, and clean-text extraction.

import os
import re
import time
import json
import hashlib
import logging
from typing import List, Dict, Any, Optional, Set, Tuple
from urllib.parse import (
    urljoin, urlparse, urlunparse, parse_qsl, urlencode
)
from collections import deque

import requests
from bs4 import BeautifulSoup, NavigableString

logger = logging.getLogger(__name__)


# ============================================================
# CONSTANTS
# ============================================================

TRACKING_PARAMS: Set[str] = {
    "utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content",
    "fbclid", "gclid", "gclsrc", "dclid", "msclkid",
    "ref", "ref_src", "sessionid", "session_id", "_ga", "_gl",
}

PAGE_PARAMS: List[str] = [
    "page", "p", "pagina", "pageNum", "paged", "pg", "pageno", "page_no",
    "offset", "start", "from", "skip",
]

STATIC_EXTENSIONS: Tuple[str, ...] = (
    ".jpg", ".jpeg", ".png", ".gif", ".webp", ".svg", ".ico",
    ".css", ".js", ".woff", ".woff2", ".ttf", ".eot",
    ".zip", ".rar", ".7z", ".gz", ".tar",
    ".mp4", ".mp3", ".avi", ".mov", ".webm",
)

NON_CONTENT_TAGS: List[str] = [
    "script", "style", "meta", "link", "noscript", "svg",
    "header", "footer", "nav", "aside", "iframe", "form",
    "button", "input", "select", "textarea", "label",
    "figure", "picture", "source", "video", "audio",
]

BLOCK_TAGS: List[str] = [
    "br", "p", "div", "h1", "h2", "h3", "h4", "h5", "h6",
    "li", "tr", "hr", "section", "article", "blockquote", "pre",
]


# ============================================================
# ENHANCED SCRAPER
# ============================================================

class EnhancedScraper:
    """
    Enterprise-grade scraper with:
      - Full pagination discovery (rel=next, text, class, query params)
      - Deep crawl of internal links
      - Infinite-scroll support via Selenium (guarded)
      - Listing -> detail page crawl
      - Record-level deduplication
      - Clean-text extraction (no HTML tags)
    """

    def __init__(
        self,
        max_depth: int = 3,
        max_pages: int = 1000,
        delay: float = 1.0,
        timeout: int = 30,
    ):
        self.max_depth = max_depth
        self.max_pages = max_pages
        self.delay = delay
        self.timeout = timeout

        self.visited_urls: Set[str] = set()
        self.url_queue: deque = deque()

        self.session = requests.Session()
        self.session.headers.update({
            "User-Agent": (
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                "AppleWebKit/537.36 (KHTML, like Gecko) "
                "Chrome/122.0.0.0 Safari/537.36"
            ),
            "Accept-Language": "en-US,en;q=0.9",
        })

    # --------------------------------------------------------
    # URL helpers
    # --------------------------------------------------------

    def normalize_url(self, url: str, base_url: Optional[str] = None) -> str:
        """Normalize URL: keep pagination params, drop tracking/fragments."""
        if base_url:
            url = urljoin(base_url, url)
        if not url:
            return ""

        parsed = urlparse(url)

        query_pairs = [
            (k, v) for k, v in parse_qsl(parsed.query, keep_blank_values=True)
            if k.lower() not in TRACKING_PARAMS
        ]
        clean_query = urlencode(query_pairs)

        path = parsed.path.rstrip("/") or "/"

        return urlunparse((
            parsed.scheme.lower(),
            parsed.netloc.lower(),
            path,
            parsed.params,
            clean_query,
            "",
        ))

    def is_same_domain(self, url: str, base_domain: str) -> bool:
        parsed = urlparse(url)
        return (
            parsed.netloc == base_domain
            or parsed.netloc.endswith(f".{base_domain}")
        )

    def _is_static_asset(self, url: str) -> bool:
        path = urlparse(url).path.lower()
        return path.endswith(STATIC_EXTENSIONS)

    # --------------------------------------------------------
    # Pagination detection
    # --------------------------------------------------------

    def detect_pagination(
        self, soup: BeautifulSoup, base_url: str
    ) -> List[str]:
        """
        Robust pagination detection.
        Returns a list of absolute URLs plus the sentinel
        '__INFINITE_SCROLL__' if a Load-More/scroll control is found.
        """
        pagination_urls: Set[str] = set()

        # ---- 1. rel="next" ----
        for a in soup.find_all("a", href=True):
            rel = a.get("rel") or []
            if isinstance(rel, str):
                rel = [rel]
            if "next" in [r.lower() for r in rel]:
                pagination_urls.add(self.normalize_url(a["href"], base_url))

        # ---- 2. Text-based Next ----
        next_words = {
            "next", "next page", "next ›", "next »", "›", "»", "→",
            ">>", "older", "older posts", "older entries", "more",
            "continue", "load more", "show more",
        }
        for a in soup.find_all("a", href=True):
            text = a.get_text(strip=True).lower()
            if text in next_words:
                pagination_urls.add(self.normalize_url(a["href"], base_url))

        # ---- 3. Common CSS classes ----
        next_selectors = [
            "a.next", "a.next-page", "a.nextpage",
            ".next a", ".pagination-next a", ".pagination .next a",
            "li.next a", "li.next-page a",
            ".page-numbers.next", ".page-numbers.next-page",
            "a[aria-label='Next']", "a[aria-label='Next page']",
            "a[title='Next']", "a[title='Next page']",
            ".pager-next a", ".pagination__next a",
        ]
        for selector in next_selectors:
            try:
                for a in soup.select(selector):
                    if a.get("href"):
                        pagination_urls.add(
                            self.normalize_url(a["href"], base_url)
                        )
            except Exception:
                continue

        # ---- 4. Numbered page links ----
        page_selectors = [
            ".pagination a", ".pages a", "a.page", "a.page-link",
            ".page-numbers a", ".pager a", ".wp-pagenavi a",
            "nav.pagination a", "ul.pagination a",
        ]
        for selector in page_selectors:
            try:
                for a in soup.select(selector):
                    if a.get("href"):
                        pagination_urls.add(
                            self.normalize_url(a["href"], base_url)
                        )
            except Exception:
                continue

        # ---- 5. Query-param pagination (e.g. ?page=1) ----
        parsed = urlparse(base_url)
        query_dict = dict(parse_qsl(parsed.query, keep_blank_values=True))

        for param in PAGE_PARAMS:
            if param in query_dict:
                try:
                    current = int(query_dict[param])
                except (ValueError, TypeError):
                    continue
                for n in range(current + 1, current + 4):
                    new_q = dict(query_dict)
                    new_q[param] = str(n)
                    next_url = urlunparse((
                        parsed.scheme, parsed.netloc, parsed.path,
                        parsed.params, urlencode(new_q), "",
                    ))
                    pagination_urls.add(self.normalize_url(next_url))
                break

        # ---- 6. Load More / infinite scroll ----
        load_more = soup.select_one(
            ".load-more, #load-more, .infinite-scroll, .show-more, "
            "button[data-load-more], a.load-more, "
            "[data-infinite-scroll], [data-load-more]"
        )
        if load_more is not None:
            pagination_urls.add("__INFINITE_SCROLL__")

        return list(pagination_urls)

    # --------------------------------------------------------
    # Link extraction
    # --------------------------------------------------------

    def extract_internal_links(
        self, soup: BeautifulSoup, base_url: str, domain: str
    ) -> List[str]:
        links: Set[str] = set()
        for a in soup.find_all("a", href=True):
            href = a["href"].strip()
            if not href or href.startswith(("#", "javascript:", "mailto:", "tel:")):
                continue
            full = self.normalize_url(href, base_url)
            if not full:
                continue
            if not self.is_same_domain(full, domain):
                continue
            if self._is_static_asset(full):
                continue
            links.add(full)
        return list(links)

    # --------------------------------------------------------
    # Text cleaning
    # --------------------------------------------------------

    def clean_html_to_text(self, html: str) -> str:
        """Convert HTML to clean, readable text (no tags)."""
        if not html:
            return ""
        try:
            soup = BeautifulSoup(html, "html.parser")

            for tag in soup(NON_CONTENT_TAGS):
                tag.decompose()

            # Prefer main content area
            main_content = (
                soup.find("main")
                or soup.find("article")
                or soup.find(
                    "div",
                    class_=re.compile(r"content|main|body|post|entry", re.I),
                )
                or soup.find(
                    "div",
                    id=re.compile(r"content|main|body|post|entry", re.I),
                )
                or soup.body
                or soup
            )

            # Replace <br> with newline; insert newline after block tags
            for br in main_content.find_all("br"):
                br.replace_with("\n")

            for tag in main_content.find_all(BLOCK_TAGS):
                if tag.name == "br":
                    continue
                tag.insert_after(NavigableString("\n"))

            text = main_content.get_text(separator="\n")

            lines: List[str] = []
            for line in text.splitlines():
                cleaned = " ".join(line.split())
                if len(cleaned) > 2:
                    lines.append(cleaned)

            result = "\n".join(lines)
            result = re.sub(r"\n{3,}", "\n\n", result)
            return result.strip()

        except Exception as e:
            logger.error(f"clean_html_to_text failed: {e}")
            text = re.sub(r"<[^>]+>", " ", html)
            text = re.sub(r"\s+", " ", text)
            return text.strip()

    # --------------------------------------------------------
    # Structured data extraction
    # --------------------------------------------------------

    def extract_structured_data(
        self,
        soup: BeautifulSoup,
        url: str,
        raw_html: str = "",
    ) -> Dict[str, Any]:
        data: Dict[str, Any] = {
            "url": url,
            "title": "",
            "description": "",
            "price": "",
            "email": "",
            "phone": "",
            "product_name": "",
            "category": "",
            "rating": "",
            "reviews_count": "",
            "images": [],
            "meta_tags": {},
            "schema_org": {},
            "clean_text": "",
            "raw_html": "",
        }

        # Title / description
        title_tag = soup.find("title")
        if title_tag:
            data["title"] = title_tag.get_text(strip=True)

        meta_desc = soup.find("meta", attrs={"name": "description"})
        if meta_desc:
            data["description"] = meta_desc.get("content", "")

        og_title = soup.find("meta", attrs={"property": "og:title"})
        if og_title:
            data["title"] = og_title.get("content", data["title"])

        og_desc = soup.find("meta", attrs={"property": "og:description"})
        if og_desc:
            data["description"] = og_desc.get("content", data["description"])

        # Meta tags
        for m in soup.find_all("meta"):
            name = m.get("name") or m.get("property")
            content = m.get("content")
            if name and content:
                data["meta_tags"][name] = content

        # Schema.org
        for script in soup.find_all("script", type="application/ld+json"):
            try:
                schema_data = json.loads(script.string or "{}")
                data["schema_org"] = schema_data
            except Exception:
                pass

        html_str = raw_html or str(soup)

        # Price
        price_patterns = [
            r"\$\d+(?:,\d{3})*(?:\.\d{2})?",
            r"\d+(?:,\d{3})*(?:\.\d{2})?\s?(?:USD|EUR|GBP|PHP|JPY|AUD|CAD)",
            r"(?:price|cost|total)[\"']?\s*[:\=]\s*[\"']?([\d.,]+)",
            r"productPrice[\"']?\s*[:\=]\s*[\"']?([\d.,]+)",
            r"itemprop=[\"']price[\"'][^>]*content=[\"']([\d.,]+)[\"']",
        ]
        for pattern in price_patterns:
            match = re.search(pattern, html_str, re.IGNORECASE)
            if match:
                data["price"] = match.group(0)
                break

        # Email
        emails = re.findall(
            r"[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}", html_str
        )
        if emails:
            data["email"] = emails[0]

        # Phone
        for pattern in [
            r"\+?\d[\d\s\-\(\)]{8,}\d",
            r"\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}",
        ]:
            phones = re.findall(pattern, html_str)
            if phones:
                data["phone"] = phones[0]
                break

        # Product name
        product_selectors = [
            ".product-title", ".product-name", ".product_title",
            "[itemprop='name']", "h1.product", ".product-details h1",
            "h1.product_title", "h1.entry-title", "h1",
        ]
        for selector in product_selectors:
            try:
                elem = soup.select_one(selector)
                if elem and elem.get_text(strip=True):
                    data["product_name"] = elem.get_text(strip=True)
                    break
            except Exception:
                continue

        # Rating
        rating_elem = soup.select_one(
            "[itemprop='ratingValue'], .rating, .stars, .product-rating"
        )
        if rating_elem:
            data["rating"] = rating_elem.get_text(strip=True)

        # Reviews count
        reviews_elem = soup.select_one(
            "[itemprop='reviewCount'], .review-count, .reviews-count"
        )
        if reviews_elem:
            data["reviews_count"] = reviews_elem.get_text(strip=True)

        # Category / breadcrumb
        breadcrumb = soup.select_one(
            ".breadcrumb, [itemprop='breadcrumb'], nav.breadcrumbs"
        )
        if breadcrumb:
            data["category"] = breadcrumb.get_text(" ", strip=True)

        # Images
        for img in soup.find_all("img", src=True):
            src = img["src"]
            if src and not src.startswith("data:"):
                data["images"].append(urljoin(url, src))
        data["images"] = data["images"][:20]

        # Clean text + raw html
        data["clean_text"] = self.clean_html_to_text(html_str)
        data["raw_html"] = html_str[:100_000]

        return data

    # --------------------------------------------------------
    # Record deduplication
    # --------------------------------------------------------

    @staticmethod
    def _record_key(record: Dict[str, Any]) -> str:
        key = "|".join([
            str(record.get("title", "") or record.get("product_name", "")),
            str(record.get("url", "")),
            str(record.get("price", "")),
            str(record.get("product_name", "")),
        ])
        return hashlib.sha256(key.encode("utf-8")).hexdigest()

    # --------------------------------------------------------
    # Pagination scraping
    # --------------------------------------------------------

    def scrape_with_pagination(
        self, start_url: str, max_pages: Optional[int] = None
    ) -> List[Dict[str, Any]]:
        """
        Backward-compatible: returns the list of records only.
        Use `scrape_with_pagination_full` for the summary dict.
        """
        return self.scrape_with_pagination_full(start_url, max_pages)["data"]

    def scrape_with_pagination_full(
        self, start_url: str, max_pages: Optional[int] = None
    ) -> Dict[str, Any]:
        """
        Full pagination crawl with summary output.

        Returns:
            {
              "pages_processed": int,
              "records_extracted": int,
              "duplicates_removed": int,
              "detail_pages_processed": int,
              "last_page": str,
              "data": [...]
            }
        """
        max_pages = max_pages or self.max_pages
        start_url = self.normalize_url(start_url)

        pages_to_scrape: List[str] = [start_url]
        pagination_discovered: Set[str] = {start_url}
        scraped_urls: Set[str] = set()
        seen_records: Set[str] = set()

        results: List[Dict[str, Any]] = []
        duplicates_removed = 0
        last_page = start_url

        page_count = 0

        while pages_to_scrape and page_count < max_pages:
            current_url = pages_to_scrape.pop(0)

            if current_url in scraped_urls:
                continue

            logger.info(f"Scraping page {page_count + 1}: {current_url}")

            try:
                time.sleep(self.delay)
                response = self.session.get(current_url, timeout=self.timeout)
                response.raise_for_status()

                raw_html = response.text
                soup = BeautifulSoup(raw_html, "html.parser")

                page_data = self.extract_structured_data(
                    soup, current_url, raw_html
                )
                page_data["page_number"] = page_count + 1

                # Record-level dedup
                key = self._record_key(page_data)
                if key in seen_records:
                    duplicates_removed += 1
                    scraped_urls.add(current_url)
                    page_count += 1
                    last_page = current_url
                    continue

                seen_records.add(key)
                results.append(page_data)
                scraped_urls.add(current_url)
                last_page = current_url
                page_count += 1

                # Detect pagination on EVERY page
                soup_for_pagination = BeautifulSoup(raw_html, "html.parser")
                pagination_links = self.detect_pagination(
                    soup_for_pagination, current_url
                )

                if "__INFINITE_SCROLL__" in pagination_links:
                    logger.info(
                        f"Infinite scroll detected at {current_url} — "
                        "switching to Selenium"
                    )
                    infinite_data = self.scrape_infinite_scroll(current_url)
                    for rec in infinite_data:
                        k = self._record_key(rec)
                        if k in seen_records:
                            duplicates_removed += 1
                            continue
                        seen_records.add(k)
                        results.append(rec)
                    break

                for link in pagination_links:
                    if link == "__INFINITE_SCROLL__":
                        continue
                    if link in pagination_discovered or link in scraped_urls:
                        continue
                    pages_to_scrape.append(link)
                    pagination_discovered.add(link)
                    logger.info(f"Discovered pagination: {link}")

            except Exception as e:
                logger.error(f"Error scraping {current_url}: {e}")
                continue

        logger.info(
            f"Pagination complete. Pages: {page_count}, "
            f"Records: {len(results)}, Duplicates removed: {duplicates_removed}"
        )

        return {
            "pages_processed": page_count,
            "records_extracted": len(results),
            "duplicates_removed": duplicates_removed,
            "detail_pages_processed": 0,
            "last_page": last_page,
            "data": results,
        }

    # --------------------------------------------------------
    # Infinite scroll (Selenium, guarded)
    # --------------------------------------------------------

    def _get_driver(self):
        """Create a Chrome driver using SBR_WEBDRIVER if available."""
        from selenium import webdriver
        from selenium.webdriver.chrome.options import Options
        from selenium.webdriver.chrome.service import Service

        options = Options()
        options.add_argument("--headless=new")
        options.add_argument("--no-sandbox")
        options.add_argument("--disable-dev-shm-usage")
        options.add_argument("--disable-gpu")
        options.add_argument("--window-size=1920,1080")

        driver_path = os.getenv("SBR_WEBDRIVER")
        if driver_path:
            service = Service(driver_path)
            return webdriver.Chrome(service=service, options=options)
        return webdriver.Chrome(options=options)

    def scrape_infinite_scroll(
        self, url: str, scroll_pause: float = 2.0, max_scrolls: int = 50
    ) -> List[Dict[str, Any]]:
        """Handle infinite scroll with Selenium. Silently no-ops if unavailable."""
        try:
            from selenium.webdriver.common.by import By
            from selenium.webdriver.support.ui import WebDriverWait
            from selenium.webdriver.support import expected_conditions as EC
        except Exception as e:
            logger.error(f"Selenium not installed: {e}")
            return []

        try:
            driver = self._get_driver()
        except Exception as e:
            logger.error(f"Selenium driver unavailable: {e}")
            return []

        results: List[Dict[str, Any]] = []
        try:
            driver.get(url)
            try:
                WebDriverWait(driver, 10).until(
                    EC.presence_of_element_located((By.TAG_NAME, "body"))
                )
            except Exception:
                pass

            last_height = driver.execute_script(
                "return document.body.scrollHeight"
            )
            stable_count = 0

            for scroll_count in range(max_scrolls):
                driver.execute_script(
                    "window.scrollTo(0, document.body.scrollHeight);"
                )
                time.sleep(scroll_pause)

                new_height = driver.execute_script(
                    "return document.body.scrollHeight"
                )
                if new_height == last_height:
                    stable_count += 1
                    if stable_count >= 2:
                        break
                else:
                    stable_count = 0

                last_height = new_height

                raw_html = driver.page_source
                soup = BeautifulSoup(raw_html, "html.parser")
                page_data = self.extract_structured_data(soup, url, raw_html)
                page_data["scroll_position"] = scroll_count
                results.append(page_data)

        except Exception as e:
            logger.error(f"Infinite scroll error: {e}")
        finally:
            try:
                driver.quit()
            except Exception:
                pass

        return results

    # --------------------------------------------------------
    # Deep crawl
    # --------------------------------------------------------

    def deep_crawl(
        self, start_url: str, max_depth: Optional[int] = None
    ) -> List[Dict[str, Any]]:
        max_depth = max_depth if max_depth is not None else self.max_depth
        start_url = self.normalize_url(start_url)

        results: List[Dict[str, Any]] = []
        queue: deque = deque([(start_url, 0)])
        visited: Set[str] = set()
        seen_records: Set[str] = set()

        while queue and len(results) < self.max_pages:
            url, depth = queue.popleft()
            if url in visited or depth > max_depth:
                continue

            logger.info(f"Deep crawl depth {depth}: {url}")

            try:
                time.sleep(self.delay)
                response = self.session.get(url, timeout=self.timeout)
                response.raise_for_status()

                raw_html = response.text
                soup = BeautifulSoup(raw_html, "html.parser")

                page_data = self.extract_structured_data(soup, url, raw_html)
                page_data["crawl_depth"] = depth

                key = self._record_key(page_data)
                if key not in seen_records:
                    seen_records.add(key)
                    results.append(page_data)

                visited.add(url)

                if depth == max_depth:
                    continue

                domain = urlparse(url).netloc
                soup_for_links = BeautifulSoup(raw_html, "html.parser")
                for link in self.extract_internal_links(
                    soup_for_links, url, domain
                ):
                    if link not in visited:
                        queue.append((link, depth + 1))

            except Exception as e:
                logger.error(f"Deep crawl error at {url}: {e}")
                continue

        logger.info(f"Deep crawl complete. Pages: {len(results)}")
        return results

    # --------------------------------------------------------
    # Listing -> Detail crawl
    # --------------------------------------------------------

    def scrape_listing_with_details(
        self,
        start_url: str,
        link_selector: str,
        max_pages: Optional[int] = None,
        detail_concurrency: int = 1,
    ) -> Dict[str, Any]:
        """
        Scrape a listing site with pagination, then visit each detail page.

        Args:
            start_url: listing entry point.
            link_selector: CSS selector for anchor tags linking to detail pages.
            max_pages: limit for pagination.
            detail_concurrency: reserved (currently sequential).

        Returns summary dict with merged records.
        """
        listing_summary = self.scrape_with_pagination_full(
            start_url, max_pages=max_pages
        )
        listing_records = listing_summary["data"]

        # Collect unique detail URLs
        detail_urls: List[str] = []
        seen_urls: Set[str] = set()

        for rec in listing_records:
            html = rec.get("raw_html", "")
            if not html:
                continue
            soup = BeautifulSoup(html, "html.parser")
            for a in soup.select(link_selector):
                href = a.get("href")
                if not href:
                    continue
                full = self.normalize_url(href, rec["url"])
                if full and full not in seen_urls:
                    seen_urls.add(full)
                    detail_urls.append(full)

        logger.info(
            f"Listing crawl found {len(listing_records)} listings, "
            f"{len(detail_urls)} unique detail URLs"
        )

        detail_records: List[Dict[str, Any]] = []
        seen_records: Set[str] = set()

        for i, url in enumerate(detail_urls, 1):
            try:
                time.sleep(self.delay)
                response = self.session.get(url, timeout=self.timeout)
                response.raise_for_status()
                raw_html = response.text
                soup = BeautifulSoup(raw_html, "html.parser")
                detail = self.extract_structured_data(soup, url, raw_html)
                key = self._record_key(detail)
                if key in seen_records:
                    continue
                seen_records.add(key)
                detail_records.append(detail)
                if i % 25 == 0:
                    logger.info(f"Detail pages processed: {i}/{len(detail_urls)}")
            except Exception as e:
                logger.error(f"Detail page failed {url}: {e}")
                continue

        merged = listing_records + detail_records

        return {
            "pages_processed": listing_summary["pages_processed"],
            "records_extracted": len(merged),
            "listing_records": len(listing_records),
            "detail_pages_processed": len(detail_records),
            "duplicates_removed": listing_summary["duplicates_removed"],
            "last_page": listing_summary["last_page"],
            "data": merged,
        }


# ============================================================
# SINGLETON
# ============================================================

_enhanced_scraper: Optional[EnhancedScraper] = None


def get_enhanced_scraper() -> EnhancedScraper:
    global _enhanced_scraper
    if _enhanced_scraper is None:
        _enhanced_scraper = EnhancedScraper()
    return _enhanced_scraper


# ============================================================
# BACKWARD-COMPATIBLE FUNCTIONS (all return CLEAN TEXT)
# ============================================================

def scrape_website(website: str, use_selenium: bool = False) -> str:
    """Legacy: single-page fetch -> clean text."""
    scraper = get_enhanced_scraper()
    try:
        response = scraper.session.get(website, timeout=scraper.timeout)
        response.raise_for_status()
        return scraper.clean_html_to_text(response.text)
    except Exception as e:
        logger.error(f"scrape_website error: {e}")
        return ""


def extract_body_content(html: str) -> str:
    soup = BeautifulSoup(html, "html.parser")
    return str(soup.body) if soup.body else html


def clean_body_content(body: str) -> str:
    """Legacy: return clean text (no HTML tags)."""
    return get_enhanced_scraper().clean_html_to_text(body)[:1_000_000]


def split_dom_content(content: str, max_length: int = 6000) -> List[str]:
    if not content:
        return []
    return [content[i:i + max_length] for i in range(0, len(content), max_length)]


# ============================================================
# PUBLIC ENHANCED FUNCTIONS
# ============================================================

def scrape_with_pagination(
    url: str, max_pages: int = 100
) -> List[Dict[str, Any]]:
    """Backward-compatible: returns list of records."""
    return get_enhanced_scraper().scrape_with_pagination(url, max_pages)


def scrape_with_pagination_full(
    url: str, max_pages: int = 100
) -> Dict[str, Any]:
    """Returns summary dict with data + counts."""
    return get_enhanced_scraper().scrape_with_pagination_full(url, max_pages)


def deep_crawl_website(
    start_url: str, max_depth: int = 3
) -> List[Dict[str, Any]]:
    return get_enhanced_scraper().deep_crawl(start_url, max_depth)


def scrape_listing_with_details(
    start_url: str,
    link_selector: str,
    max_pages: int = 100,
) -> Dict[str, Any]:
    return get_enhanced_scraper().scrape_listing_with_details(
        start_url, link_selector, max_pages=max_pages
    )


def smart_content_extraction(content: str) -> Dict[str, Any]:
    return SmartContentDetector.extract_smart_data(content)


def detect_content_type(content: str) -> Dict[str, float]:
    return SmartContentDetector.detect_content_type(content)


# ============================================================
# SMART CONTENT DETECTOR
# ============================================================

class SmartContentDetector:
    """Keyword-based content classification and extraction."""

    @staticmethod
    def detect_content_type(content: str) -> Dict[str, float]:
        scores = {
            "product": 0, "article": 0, "blog": 0, "ecommerce": 0,
            "business": 0, "educational": 0, "research": 0, "contact": 0,
        }
        keywords = {
            "product": ["price", "buy", "shop", "cart", "product",
                        "in stock", "add to cart", "purchase", "order now"],
            "article": ["published", "author", "date", "read more",
                        "article", "story", "featured"],
            "blog": ["blog", "posted by", "comments", "share this",
                     "category", "tags"],
            "ecommerce": ["checkout", "shipping", "payment", "discount",
                          "coupon", "offers", "deals"],
            "business": ["company", "about us", "services", "clients",
                         "portfolio", "team"],
            "educational": ["learn", "course", "tutorial", "lesson",
                            "education", "study", "training"],
            "research": ["research", "study", "findings", "methodology",
                         "conclusion", "references"],
            "contact": ["contact", "email", "phone", "address",
                        "location", "support", "help"],
        }
        lower = content.lower()
        for ctype, words in keywords.items():
            for word in words:
                if word in lower:
                    scores[ctype] += 1

        total = sum(scores.values())
        if total > 0:
            for k in scores:
                scores[k] = round((scores[k] / total) * 100, 1)
        return scores

    @staticmethod
    def extract_smart_data(content: str) -> Dict[str, Any]:
        data: Dict[str, Any] = {
            "emails": [], "phones": [], "urls": [],
            "prices": [], "dates": [],
        }

        data["emails"] = list(set(re.findall(
            r"[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}", content
        )))

        phones: Set[str] = set()
        for pattern in [
            r"\+?\d[\d\s\-\(\)]{8,}\d",
            r"\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}",
            r"\d{3}[-.\s]\d{3}[-.\s]\d{4}",
        ]:
            phones.update(re.findall(pattern, content))
        data["phones"] = list(phones)

        data["urls"] = list(set(re.findall(
            r"https?://(?:[-\w.]|(?:%[\da-fA-F]{2}))+[/\w\.-]*(?:\?[^\s]*)?",
            content,
        )))[:50]

        prices: Set[str] = set()
        for pattern in [
            r"\$\d+(?:,\d{3})*(?:\.\d{2})?",
            r"\d+(?:,\d{3})*(?:\.\d{2})?\s?(?:USD|EUR|GBP|€|£)",
            r"(?:price|cost|total)[:\s]*[\$\€\£]?\s*(\d+(?:\.\d{2})?)",
        ]:
            for m in re.findall(pattern, content, re.IGNORECASE):
                prices.add(m if isinstance(m, str) else m[0])
        data["prices"] = list(prices)[:20]

        dates: Set[str] = set()
        for pattern in [
            r"\d{4}-\d{2}-\d{2}",
            r"\d{2}/\d{2}/\d{4}",
            r"\d{1,2}\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{4}",
        ]:
            dates.update(re.findall(pattern, content))
        data["dates"] = list(dates)[:20]

        return data