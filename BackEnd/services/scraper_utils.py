import requests
from bs4 import BeautifulSoup
from typing import List
from .scraper_selenium import scrape_with_selenium


def scrape_website(website: str, use_selenium: bool = False) -> str:
    if not website.startswith(('http://', 'https://')):
        website = 'https://' + website

    if use_selenium:
        return scrape_with_selenium(website)

    headers = {'User-Agent': 'Mozilla/5.0'}
    res = requests.get(website, headers=headers, timeout=30)
    res.raise_for_status()
    return res.text


def extract_body_content(html: str) -> str:
    soup = BeautifulSoup(html, "html.parser")
    return str(soup.body) if soup.body else html


def clean_body_content(body: str) -> str:
    soup = BeautifulSoup(body, "html.parser")

    for tag in soup(["script","style","meta","link","noscript","svg","header","footer","nav"]):
        tag.extract()

    text = soup.get_text(separator="\n")
    lines = [l.strip() for l in text.splitlines() if len(l.strip()) > 2]

    return "\n".join(lines)[:1_000_000]


def split_dom_content(content: str, max_length: int = 6000) -> List[str]:
    return [content[i:i + max_length] for i in range(0, len(content), max_length)]