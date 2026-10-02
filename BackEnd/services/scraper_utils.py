# backend/services/scraper_utils.py
"""
ENHANCED SCRAPER v4
===================
Full pagination + deep crawl + detail pages + infinite scroll +
ITEM-LEVEL extraction + robust retries + record validation.

v4 CHANGES (over v3):
  - _fetch_with_retries: exponential backoff, permanent/transient split
  - detect_pagination: adds path-style page-N generation; no double soup parse
  - infinite-scroll no longer breaks the paginated queue
  - _is_meaningful_record guards against empty records
  - deep_crawl page cap separate from item cap
  - split_dom_content splits on line boundaries (never mid-record)
  - scrape_listing_with_details merges detail data into listing by canonical URL
  - rich summary dicts (pages_discovered, pages_scraped, records_skipped, errors)
"""

from __future__ import annotations

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
from collections import deque, Counter

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

ITEM_CONTAINER_SELECTORS: List[str] = [
    "article.product_pod",
    "li.product",
    "div.product",
    "div.product-item",
    "div.product-card",
    "li.product-item",
    "ul.products li.product",
    "li.wc-block-grid__product",
    "div.card-product",
    "article",
    "li.result",
    "div.result",
    "div.listing",
    "div.item",
    "div.card",
    "div.search-result",
    "div[class*='product']",
    "div[class*='item']",
    "div[class*='card']",
    "li[class*='product']",
    "li[class*='item']",
    "li[class*='card']",
]

# HTTP status codes that are worth retrying
TRANSIENT_STATUS = {408, 425, 429, 500, 502, 503, 504}
PERMANENT_STATUS = {400, 401, 403, 404, 410, 451}

MAX_RETRIES = 3
BACKOFF_BASE = 1.5  # seconds


# ============================================================
# ENHANCED SCRAPER
# ============================================================

class EnhancedScraper:
    """
    Enterprise-grade scraper.

    Public methods:
        scrape_with_pagination_full(url, max_pages) -> summary dict
        deep_crawl(url, max_depth)                  -> list of records
        scrape_listing_with_details(url, sel, max_pages) -> summary dict
        scrape_infinite_scroll(url)                 -> list of records
    """

    def __init__(
        self,
        max_depth: int = 3,
        max_pages: int = 500,
        delay: float = 0.6,
        timeout: int = 30,
    ):
        self.max_depth = max_depth
        self.max_pages = max_pages
        self.delay = delay
        self.timeout = timeout

        self.session = requests.Session()
        self.session.headers.update({
            "User-Agent": (
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                "AppleWebKit/537.36 (KHTML, like Gecko) "
                "Chrome/122.0.0.0 Safari/537.36"
            ),
            "Accept-Language": "en-US,en;q=0.9",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        })

    # --------------------------------------------------------
    # URL helpers
    # --------------------------------------------------------

    def normalize_url(self, url: str, base_url: Optional[str] = None) -> str:
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
    # Fetch with retries
    # --------------------------------------------------------

    def _fetch_with_retries(
        self, url: str, *, max_retries: int = MAX_RETRIES
    ) -> Optional[requests.Response]:
        """
        GET a URL with exponential backoff on transient errors.
        Returns the Response on success, None on permanent failure.
        """
        last_exc: Optional[Exception] = None
        for attempt in range(1, max_retries + 1):
            try:
                resp = self.session.get(url, timeout=self.timeout)
                if resp.status_code in PERMANENT_STATUS:
                    logger.warning(
                        f"[HTTP] Permanent {resp.status_code} for {url}"
                    )
                    return None
                if resp.status_code in TRANSIENT_STATUS:
                    wait = BACKOFF_BASE ** attempt
                    logger.warning(
                        f"[HTTP] Transient {resp.status_code} for {url} "
                        f"(attempt {attempt}/{max_retries}, wait {wait:.1f}s)"
                    )
                    time.sleep(wait)
                    last_exc = requests.HTTPError(f"{resp.status_code}")
                    continue
                resp.raise_for_status()
                return resp
            except (requests.ConnectionError, requests.Timeout) as e:
                last_exc = e
                wait = BACKOFF_BASE ** attempt
                logger.warning(
                    f"[HTTP] {type(e).__name__} for {url} "
                    f"(attempt {attempt}/{max_retries}, wait {wait:.1f}s)"
                )
                time.sleep(wait)
            except requests.RequestException as e:
                last_exc = e
                logger.error(f"[HTTP] RequestException for {url}: {e}")
                return None

        logger.error(
            f"[HTTP] Giving up on {url} after {max_retries} attempts: {last_exc}"
        )
        return None

    # --------------------------------------------------------
    # Pagination detection
    # --------------------------------------------------------

    def detect_pagination(
        self, soup: BeautifulSoup, base_url: str
    ) -> List[str]:
        """
        Return absolute URLs for the next page(s), plus the sentinel
        '__INFINITE_SCROLL__' if a Load-More control is present.
        """
        pagination_urls: Set[str] = set()

        # 1. rel="next"
        for a in soup.find_all("a", href=True):
            rel = a.get("rel") or []
            if isinstance(rel, str):
                rel = [rel]
            if "next" in [r.lower() for r in rel]:
                pagination_urls.add(self.normalize_url(a["href"], base_url))

        # 2. Text-based
        next_words = {
            "next", "next page", "next ›", "next »", "›", "»", "→",
            ">>", "older", "older posts", "older entries", "more",
            "continue", "load more", "show more", "次のページ", "次へ",
        }
        for a in soup.find_all("a", href=True):
            text = a.get_text(strip=True).lower()
            if text in next_words:
                pagination_urls.add(self.normalize_url(a["href"], base_url))

        # 3. Common CSS classes
        next_selectors = [
            "a.next", "a.next-page", "a.nextpage",
            ".next a", ".pagination-next a", ".pagination .next a",
            "li.next a", "li.next-page a",
            ".page-numbers.next", ".page-numbers.next-page",
            "a[aria-label='Next']", "a[aria-label='Next page']",
            "a[title='Next']", "a[title='Next page']",
            ".pager-next a", ".pagination__next a",
            "li.pager-next a", "ul.pager li.next a",
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

        # 4. Numbered page links
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

        # 5. Query-param pagination
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

        # 6. Path-style pagination: /page/2, /page-2, /page2, /p/2
        if not pagination_urls:
            path = parsed.path.rstrip("/")
            m = re.search(r"/(?:page|p)[/-]?(\d+)(\.[a-z]+)?$", path, re.I)
            if m:
                current = int(m.group(1))
                ext = m.group(2) or ""
                prefix = path[:m.start()]
                for n in range(current + 1, current + 4):
                    next_url = urlunparse((
                        parsed.scheme, parsed.netloc,
                        f"{prefix}/page/{n}{ext}",
                        parsed.params, parsed.query, "",
                    ))
                    pagination_urls.add(self.normalize_url(next_url))
            else:
                for n in (2, 3):
                    for pattern in (
                        f"{path}/page/{n}",
                        f"{path}/page-{n}",
                        f"{path}/page{n}",
                    ):
                        next_url = urlunparse((
                            parsed.scheme, parsed.netloc, pattern,
                            parsed.params, parsed.query, "",
                        ))
                        pagination_urls.add(self.normalize_url(next_url))

        # 7. Load More / infinite scroll
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
        if not html:
            return ""
        try:
            soup = BeautifulSoup(html, "html.parser")
            for tag in soup(NON_CONTENT_TAGS):
                tag.decompose()
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
            return re.sub(r"\s+", " ", text).strip()

    # --------------------------------------------------------
    # Structured data (page-level)
    # --------------------------------------------------------

    def extract_structured_data(
        self, soup: BeautifulSoup, url: str, raw_html: str = "",
    ) -> Dict[str, Any]:
        data: Dict[str, Any] = {
            "url": url, "title": "", "description": "", "price": "",
            "email": "", "phone": "", "product_name": "", "category": "",
            "rating": "", "reviews_count": "", "images": [],
            "meta_tags": {}, "schema_org": {}, "clean_text": "", "raw_html": "",
        }
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
        for m in soup.find_all("meta"):
            name = m.get("name") or m.get("property")
            content = m.get("content")
            if name and content:
                data["meta_tags"][name] = content
        for script in soup.find_all("script", type="application/ld+json"):
            try:
                data["schema_org"] = json.loads(script.string or "{}")
            except Exception:
                pass
        html_str = raw_html or str(soup)
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
        emails = re.findall(
            r"[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}", html_str
        )
        if emails:
            data["email"] = emails[0]
        for pattern in [
            r"\+?\d[\d\s\-\(\)]{8,}\d",
            r"\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}",
        ]:
            phones = re.findall(pattern, html_str)
            if phones:
                data["phone"] = phones[0]
                break
        for selector in [
            ".product-title", ".product-name", ".product_title",
            "[itemprop='name']", "h1.product", ".product-details h1",
            "h1.product_title", "h1.entry-title", "h1",
        ]:
            try:
                elem = soup.select_one(selector)
                if elem and elem.get_text(strip=True):
                    data["product_name"] = elem.get_text(strip=True)
                    break
            except Exception:
                continue
        rating_elem = soup.select_one(
            "[itemprop='ratingValue'], .rating, .stars, .product-rating"
        )
        if rating_elem:
            data["rating"] = rating_elem.get_text(strip=True)
        reviews_elem = soup.select_one(
            "[itemprop='reviewCount'], .review-count, .reviews-count"
        )
        if reviews_elem:
            data["reviews_count"] = reviews_elem.get_text(strip=True)
        breadcrumb = soup.select_one(
            ".breadcrumb, [itemprop='breadcrumb'], nav.breadcrumbs"
        )
        if breadcrumb:
            data["category"] = breadcrumb.get_text(" ", strip=True)
        for img in soup.find_all("img", src=True):
            src = img["src"]
            if src and not src.startswith("data:"):
                data["images"].append(urljoin(url, src))
        data["images"] = data["images"][:20]
        data["clean_text"] = self.clean_html_to_text(html_str)
        data["raw_html"] = html_str[:100_000]
        return data

    # ========================================================
    # ITEM-LEVEL EXTRACTION
    # ========================================================

    def _find_item_containers(self, soup: BeautifulSoup) -> List[Any]:
        for selector in ITEM_CONTAINER_SELECTORS:
            try:
                matches = soup.select(selector)
            except Exception:
                continue
            if len(matches) >= 2:
                tags = {m.name for m in matches}
                if len(tags) == 1:
                    logger.info(
                        f"Item container selector matched: {selector!r} "
                        f"({len(matches)} items)"
                    )
                    return matches
        return self._find_densest_repeated_block(soup)

    def _find_densest_repeated_block(self, soup: BeautifulSoup) -> List[Any]:
        candidates: Counter = Counter()
        nodes_by_key: Dict[Tuple[str, str], List[Any]] = {}
        for tag in soup.find_all(True):
            if tag.name in (
                "html", "body", "head", "script", "style",
                "meta", "link", "br", "hr",
            ):
                continue
            classes = tag.get("class") or []
            if not classes:
                continue
            key = (tag.name, " ".join(sorted(classes)))
            if len(tag.get_text(strip=True)) < 15:
                continue
            candidates[key] += 1
            nodes_by_key.setdefault(key, []).append(tag)
        if not candidates:
            return []
        (best_tag, best_class), count = candidates.most_common(1)[0]
        if count < 3:
            return []
        logger.info(
            f"Densest repeated block: <{best_tag} class='{best_class}'> x{count}"
        )
        return nodes_by_key[(best_tag, best_class)]

    def _extract_item_from_node(
        self, node, page_url: str
    ) -> Optional[Dict[str, Any]]:
        try:
            title = ""
            for sel in [
                "h3 a", "h2 a", "h1 a",
                ".product-title", ".product-name", ".title",
                "[itemprop='name']", "h3", "h2", "h1", "a[title]",
            ]:
                el = node.select_one(sel) if hasattr(node, "select_one") else None
                if el:
                    title = (
                        el.get("title") or el.get_text(strip=True) or ""
                    ).strip()
                    if title:
                        break
            url = page_url
            link_el = None
            for sel in ["h3 a[href]", "h2 a[href]", "h1 a[href]", "a[href]"]:
                if hasattr(node, "select_one"):
                    link_el = node.select_one(sel)
                    if link_el and link_el.get("href"):
                        break
            if link_el and link_el.get("href"):
                url = self.normalize_url(link_el["href"], page_url)
            price = ""
            for sel in [
                ".price_color", ".price", "[itemprop='price']",
                ".product-price", ".amount", ".cost",
            ]:
                el = node.select_one(sel) if hasattr(node, "select_one") else None
                if el:
                    price = el.get_text(strip=True)
                    if price:
                        break
            if not price:
                text = (
                    node.get_text(" ", strip=True)
                    if hasattr(node, "get_text") else ""
                )
                m = re.search(
                    r"[£$€]\s?\d+(?:[.,]\d{1,2})?|"
                    r"\d+(?:[.,]\d{1,2})?\s?(?:USD|EUR|GBP)",
                    text,
                )
                if m:
                    price = m.group(0)
            availability = ""
            for sel in [
                ".availability", ".stock", "[itemprop='availability']",
                ".in-stock", ".out-of-stock",
            ]:
                el = node.select_one(sel) if hasattr(node, "select_one") else None
                if el:
                    availability = el.get_text(" ", strip=True)
                    if availability:
                        break
            rating = ""
            rating_el = (
                node.select_one(
                    "[class*='star'], [class*='rating'], .rating"
                )
                if hasattr(node, "select_one") else None
            )
            if rating_el:
                cls = rating_el.get("class") or []
                rating = cls[-1] if cls else rating_el.get_text(strip=True)
            image = ""
            img_el = (
                node.select_one("img[src]")
                if hasattr(node, "select_one") else None
            )
            if img_el:
                image = urljoin(page_url, img_el["src"])
            description = ""
            desc_el = (
                node.select_one(".description, .summary, p")
                if hasattr(node, "select_one") else None
            )
            if desc_el:
                description = desc_el.get_text(" ", strip=True)
            if not title and not price and not description:
                return None
            try:
                clean_text = self.clean_html_to_text(str(node))
            except Exception:
                clean_text = (
                    node.get_text(" ", strip=True)
                    if hasattr(node, "get_text") else ""
                )
            return {
                "url": url,
                "source_page": page_url,
                "title": title,
                "product_name": title,
                "price": price,
                "availability": availability,
                "rating": rating,
                "description": description,
                "image": image,
                "clean_text": clean_text,
                "raw_html": str(node)[:50_000],
            }
        except Exception as e:
            logger.error(f"_extract_item_from_node failed: {e}")
            return None

    def extract_items_from_page(
        self, soup: BeautifulSoup, page_url: str, raw_html: str = "",
    ) -> List[Dict[str, Any]]:
        containers = self._find_item_containers(soup)
        items: List[Dict[str, Any]] = []
        seen_keys: Set[str] = set()
        for idx, node in enumerate(containers):
            item = self._extract_item_from_node(node, page_url)
            if not item:
                continue
            key = self._record_key(item)
            if key in seen_keys:
                continue
            seen_keys.add(key)
            item["item_index"] = idx
            items.append(item)
        if items:
            return items
        page_data = self.extract_structured_data(soup, page_url, raw_html)
        return [page_data]

    # --------------------------------------------------------
    # Record validation + dedup
    # --------------------------------------------------------

    @staticmethod
    def _is_meaningful_record(record: Dict[str, Any]) -> bool:
        if not record:
            return False
        for k in (
            "title", "product_name", "price", "description",
            "clean_text", "email", "phone", "rating",
        ):
            v = record.get(k)
            if isinstance(v, str) and len(v.strip()) >= 3:
                return True
        url = record.get("url", "")
        if url and ("/product" in url or "/item" in url or "/p/" in url):
            return True
        return False

    @staticmethod
    def _record_key(record: Dict[str, Any]) -> str:
        key = "|".join([
            str(record.get("title", "") or record.get("product_name", "")),
            str(record.get("url", "")),
            str(record.get("price", "")),
            str(record.get("product_name", "")),
            str(record.get("image", "")),
        ])
        return hashlib.sha256(key.encode("utf-8")).hexdigest()

    @staticmethod
    def _canonical_url_key(record: Dict[str, Any]) -> str:
        return str(record.get("url", "")).split("#")[0].rstrip("/")

    # --------------------------------------------------------
    # Pagination scraping
    # --------------------------------------------------------

    def scrape_with_pagination(
        self, start_url: str, max_pages: Optional[int] = None
    ) -> List[Dict[str, Any]]:
        return self.scrape_with_pagination_full(start_url, max_pages)["data"]

    def scrape_with_pagination_full(
        self, start_url: str, max_pages: Optional[int] = None
    ) -> Dict[str, Any]:
        max_pages = max_pages or self.max_pages
        start_url = self.normalize_url(start_url)

        pages_to_scrape: List[str] = [start_url]
        pagination_discovered: Set[str] = {start_url}
        scraped_urls: Set[str] = set()
        seen_records: Set[str] = set()

        results: List[Dict[str, Any]] = []
        duplicates_removed = 0
        records_skipped = 0
        errors: List[Dict[str, Any]] = []
        last_page = start_url

        page_count = 0
        infinite_done = False

        while pages_to_scrape and page_count < max_pages:
            current_url = pages_to_scrape.pop(0)
            if current_url in scraped_urls:
                continue

            logger.info(
                f"[SCRAPER] Page {page_count + 1}/{max_pages}: {current_url}"
            )

            resp = self._fetch_with_retries(current_url)
            if resp is None:
                errors.append({"url": current_url, "error": "fetch_failed"})
                scraped_urls.add(current_url)
                page_count += 1
                continue

            try:
                raw_html = resp.text
                soup = BeautifulSoup(raw_html, "html.parser")

                page_items = self.extract_items_from_page(
                    soup, current_url, raw_html
                )

                page_added = 0
                for item in page_items:
                    if not self._is_meaningful_record(item):
                        records_skipped += 1
                        continue
                    item["page_number"] = page_count + 1
                    key = self._record_key(item)
                    if key in seen_records:
                        duplicates_removed += 1
                        continue
                    seen_records.add(key)
                    results.append(item)
                    page_added += 1

                logger.info(
                    f"[SCRAPER] Page {page_count + 1}: "
                    f"{len(page_items)} items, {page_added} new, "
                    f"{len(page_items) - page_added} dupes/skipped"
                )

                scraped_urls.add(current_url)
                last_page = current_url
                page_count += 1

                pagination_links = self.detect_pagination(soup, current_url)

                if "__INFINITE_SCROLL__" in pagination_links and not infinite_done:
                    infinite_done = True
                    logger.info(
                        f"[SCRAPER] Infinite scroll detected at {current_url}"
                    )
                    try:
                        infinite_data = self.scrape_infinite_scroll(current_url)
                        for rec in infinite_data:
                            if not self._is_meaningful_record(rec):
                                records_skipped += 1
                                continue
                            rec["page_number"] = page_count
                            k = self._record_key(rec)
                            if k in seen_records:
                                duplicates_removed += 1
                                continue
                            seen_records.add(k)
                            results.append(rec)
                    except Exception as e:
                        logger.error(
                            f"Infinite scroll failed at {current_url}: {e}"
                        )

                for link in pagination_links:
                    if link == "__INFINITE_SCROLL__":
                        continue
                    if link in pagination_discovered or link in scraped_urls:
                        continue
                    pages_to_scrape.append(link)
                    pagination_discovered.add(link)
                    logger.info(f"[SCRAPER] Discovered: {link}")

            except Exception as e:
                logger.error(
                    f"[SCRAPER] Error at {current_url}: {e}", exc_info=True
                )
                errors.append({"url": current_url, "error": str(e)})
                scraped_urls.add(current_url)
                page_count += 1
                continue

            time.sleep(self.delay)

        logger.info(
            f"[SCRAPER] Pagination done. pages={page_count} "
            f"items={len(results)} dupes={duplicates_removed} "
            f"skipped={records_skipped} errors={len(errors)}"
        )

        return {
            "pages_processed": page_count,
            "pages_discovered": len(pagination_discovered),
            "records_extracted": len(results),
            "records_skipped": records_skipped,
            "duplicates_removed": duplicates_removed,
            "detail_pages_processed": 0,
            "last_page": last_page,
            "errors": errors,
            "data": results,
        }

    # --------------------------------------------------------
    # Infinite scroll (Selenium)
    # --------------------------------------------------------

    def _get_driver(self):
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
        self, url: str, scroll_pause: float = 1.5, max_scrolls: int = 40
    ) -> List[Dict[str, Any]]:
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
        seen_records: Set[str] = set()

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
                try:
                    driver.execute_script(
                        "window.scrollTo(0, document.body.scrollHeight);"
                    )
                    time.sleep(scroll_pause)
                    new_height = driver.execute_script(
                        "return document.body.scrollHeight"
                    )
                    raw_html = driver.page_source
                    soup = BeautifulSoup(raw_html, "html.parser")
                    for item in self.extract_items_from_page(
                        soup, url, raw_html
                    ):
                        if not self._is_meaningful_record(item):
                            continue
                        item["scroll_position"] = scroll_count
                        key = self._record_key(item)
                        if key in seen_records:
                            continue
                        seen_records.add(key)
                        results.append(item)
                    if new_height == last_height:
                        stable_count += 1
                        if stable_count >= 2:
                            break
                    else:
                        stable_count = 0
                    last_height = new_height
                except Exception as e:
                    logger.warning(
                        f"Infinite scroll step {scroll_count} failed: {e}"
                    )
                    continue
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

        while queue and len(visited) < self.max_pages:
            url, depth = queue.popleft()
            if url in visited or depth > max_depth:
                continue

            logger.info(f"[SCRAPER] Deep crawl depth {depth}: {url}")
            resp = self._fetch_with_retries(url)
            if resp is None:
                visited.add(url)
                continue

            try:
                raw_html = resp.text
                soup = BeautifulSoup(raw_html, "html.parser")
                for item in self.extract_items_from_page(
                    soup, url, raw_html
                ):
                    if not self._is_meaningful_record(item):
                        continue
                    item["crawl_depth"] = depth
                    key = self._record_key(item)
                    if key in seen_records:
                        continue
                    seen_records.add(key)
                    results.append(item)
                visited.add(url)
                if depth == max_depth:
                    continue
                domain = urlparse(url).netloc
                for link in self.extract_internal_links(soup, url, domain):
                    if link not in visited:
                        queue.append((link, depth + 1))
            except Exception as e:
                logger.error(f"Deep crawl error at {url}: {e}")
                visited.add(url)
                continue

            time.sleep(self.delay)

        logger.info(f"[SCRAPER] Deep crawl done. records={len(results)}")
        return results

    # --------------------------------------------------------
    # Listing -> Detail crawl
    # --------------------------------------------------------

    def scrape_listing_with_details(
        self, start_url: str, link_selector: str,
        max_pages: Optional[int] = None, detail_concurrency: int = 1,
    ) -> Dict[str, Any]:
        listing_summary = self.scrape_with_pagination_full(
            start_url, max_pages=max_pages
        )
        listing_records = listing_summary["data"]

        # Collect detail URLs from the item fragments
        detail_urls: List[str] = []
        seen_urls: Set[str] = set()

        for rec in listing_records:
            html = rec.get("raw_html", "")
            if html:
                try:
                    soup = BeautifulSoup(html, "html.parser")
                    for a in soup.select(link_selector):
                        href = a.get("href")
                        if not href:
                            continue
                        full = self.normalize_url(
                            href, rec.get("source_page") or rec["url"]
                        )
                        if full and full not in seen_urls:
                            seen_urls.add(full)
                            detail_urls.append(full)
                except Exception:
                    pass

        logger.info(
            f"[SCRAPER] Listing: {len(listing_records)} items, "
            f"{len(detail_urls)} unique detail URLs"
        )

        detail_records: List[Dict[str, Any]] = []
        seen_details: Set[str] = set()
        detail_errors: List[Dict[str, Any]] = []

        for i, url in enumerate(detail_urls, 1):
            resp = self._fetch_with_retries(url)
            if resp is None:
                detail_errors.append({"url": url, "error": "fetch_failed"})
                continue
            try:
                raw_html = resp.text
                soup = BeautifulSoup(raw_html, "html.parser")
                detail = self.extract_structured_data(soup, url, raw_html)
                if not self._is_meaningful_record(detail):
                    continue
                key = self._canonical_url_key(detail)
                if key in seen_details:
                    continue
                seen_details.add(key)
                detail_records.append(detail)
                if i % 25 == 0:
                    logger.info(
                        f"[SCRAPER] Details {i}/{len(detail_urls)}"
                    )
            except Exception as e:
                logger.error(f"Detail page failed {url}: {e}")
                detail_errors.append({"url": url, "error": str(e)})
            time.sleep(self.delay)

        merged = self._merge_listing_and_details(
            listing_records, detail_records
        )

        return {
            "pages_processed": listing_summary["pages_processed"],
            "pages_discovered": listing_summary["pages_discovered"],
            "records_extracted": len(merged),
            "listing_records": len(listing_records),
            "detail_pages_processed": len(detail_records),
            "detail_pages_failed": len(detail_errors),
            "duplicates_removed": listing_summary["duplicates_removed"],
            "records_skipped": listing_summary["records_skipped"],
            "last_page": listing_summary["last_page"],
            "errors": listing_summary["errors"] + detail_errors,
            "data": merged,
        }

    @staticmethod
    def _merge_listing_and_details(
        listing: List[Dict[str, Any]],
        details: List[Dict[str, Any]],
    ) -> List[Dict[str, Any]]:
        by_url: Dict[str, Dict[str, Any]] = {}
        order: List[str] = []

        for rec in listing:
            key = EnhancedScraper._canonical_url_key(rec) or f"__l{len(order)}"
            if key not in by_url:
                by_url[key] = dict(rec)
                order.append(key)
            else:
                for k, v in rec.items():
                    if k not in by_url[key] or not by_url[key][k]:
                        by_url[key][k] = v

        for rec in details:
            key = EnhancedScraper._canonical_url_key(rec) or f"__d{len(order)}"
            if key not in by_url:
                by_url[key] = dict(rec)
                order.append(key)
            else:
                for k, v in rec.items():
                    if v not in (None, "", [], {}):
                        by_url[key][k] = v
                by_url[key]["has_detail"] = True

        return [by_url[k] for k in order]


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
# BACKWARD-COMPATIBLE FUNCTIONS
# ============================================================

def scrape_website(website: str, use_selenium: bool = False) -> str:
    scraper = get_enhanced_scraper()
    try:
        resp = scraper._fetch_with_retries(website)
        if resp is None:
            return ""
        return scraper.clean_html_to_text(resp.text)
    except Exception as e:
        logger.error(f"scrape_website error: {e}")
        return ""


def extract_body_content(html: str) -> str:
    soup = BeautifulSoup(html, "html.parser")
    return str(soup.body) if soup.body else html


def clean_body_content(body: str) -> str:
    return get_enhanced_scraper().clean_html_to_text(body)[:1_000_000]


def split_dom_content(content: str, max_length: int = 6000) -> List[str]:
    """Split on line boundaries so we never cut a record in half."""
    if not content:
        return []
    chunks: List[str] = []
    current: List[str] = []
    current_len = 0
    for line in content.split("\n"):
        if current_len + len(line) + 1 > max_length and current:
            chunks.append("\n".join(current))
            current = [line]
            current_len = len(line) + 1
        else:
            current.append(line)
            current_len += len(line) + 1
    if current:
        chunks.append("\n".join(current))
    return chunks


def scrape_with_pagination(
    url: str, max_pages: int = 100
) -> List[Dict[str, Any]]:
    return get_enhanced_scraper().scrape_with_pagination(url, max_pages)


def scrape_with_pagination_full(
    url: str, max_pages: int = 100
) -> Dict[str, Any]:
    return get_enhanced_scraper().scrape_with_pagination_full(url, max_pages)


def deep_crawl_website(
    start_url: str, max_depth: int = 3
) -> List[Dict[str, Any]]:
    return get_enhanced_scraper().deep_crawl(start_url, max_depth)


def scrape_listing_with_details(
    start_url: str, link_selector: str, max_pages: int = 100,
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
            "emails": [], "phones": [], "urls": [], "prices": [], "dates": [],
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