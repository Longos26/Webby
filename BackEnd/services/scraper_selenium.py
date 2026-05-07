import logging
from selenium.webdriver import Remote, ChromeOptions
from selenium.webdriver.chromium.remote_connection import ChromiumRemoteConnection
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from dotenv import load_dotenv
import os

load_dotenv()
logger = logging.getLogger(__name__)

SBR_WEBDRIVER = os.getenv("SBR_WEBDRIVER")


def scrape_with_selenium(website: str) -> str:
    if not SBR_WEBDRIVER:
        raise Exception("SBR_WEBDRIVER not set")

    try:
        connection = ChromiumRemoteConnection(SBR_WEBDRIVER, "goog", "chrome")
        options = ChromeOptions()

        options.add_argument('--no-sandbox')
        options.add_argument('--disable-dev-shm-usage')

        with Remote(connection, options=options) as driver:
            driver.get(website)

            # ✅ wait properly instead of sleep
            WebDriverWait(driver, 15).until(
                EC.presence_of_element_located((By.TAG_NAME, "body"))
            )

            # Optional captcha solve
            try:
                driver.execute("executeCdpCommand", {
                    "cmd": "Captcha.waitForSolve",
                    "params": {"detectTimeout": 10000},
                })
            except:
                pass

            return driver.page_source

    except Exception as e:
        raise Exception(f"Selenium error: {str(e)}")