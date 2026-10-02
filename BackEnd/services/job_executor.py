# services/job_executor.py
import asyncio
import logging
from datetime import datetime, timezone
from bson import ObjectId

from mongodb.database import get_database
from .scraper_utils import get_enhanced_scraper, split_dom_content
from analytics.analytics_service import get_analytics_service
from parsing.Ollama import parse_with_openrouter

logger = logging.getLogger(__name__)


class JobExecutor:
    def __init__(self):
        self.active_jobs: set = set()

    async def update_job(self, db, job_id, data):
        data["updated_at"] = datetime.now(timezone.utc)
        await db.jobs.update_one({"_id": ObjectId(job_id)}, {"$set": data})

    async def execute_job(self, job_id: str, user_id: str):
        db = await get_database()
        if job_id in self.active_jobs:
            logger.warning(f"Job {job_id} already running")
            return
        self.active_jobs.add(job_id)

        job = None
        try:
            job = await db.jobs.find_one({"_id": ObjectId(job_id)})
            if not job:
                raise Exception("Job not found")

            target_url = job.get("url") or job.get("target")
            if not target_url:
                raise Exception("Job has no target URL")

            mode = (job.get("mode") or "pagination").lower()
            max_pages = int(job.get("max_pages") or 100)
            link_selector = job.get("link_selector") or ""

            logger.info(
                f"[JOB {job_id}] START mode={mode} url={target_url} "
                f"max_pages={max_pages}"
            )

            await self.update_job(db, job_id, {
                "status": "running",
                "progress": 2,
                "error_message": None,
                "errors": [],
            })

            scraper = get_enhanced_scraper()

            # ---- Run the crawl in a worker thread ----
            if mode == "deep":
                data = await asyncio.to_thread(
                    scraper.deep_crawl, target_url, job.get("max_depth", 2)
                )
                summary = {
                    "data": data,
                    "pages_processed": len(data),
                    "pages_discovered": len(data),
                    "records_extracted": len(data),
                    "records_skipped": 0,
                    "duplicates_removed": 0,
                    "detail_pages_processed": 0,
                    "last_page": target_url,
                    "errors": [],
                }
            elif mode == "details":
                if not link_selector:
                    raise Exception(
                        "link_selector is required for details mode"
                    )
                summary = await asyncio.to_thread(
                    scraper.scrape_listing_with_details,
                    target_url, link_selector, max_pages,
                )
            else:
                summary = await asyncio.to_thread(
                    scraper.scrape_with_pagination_full,
                    target_url, max_pages,
                )

            items = summary.get("data", []) or []
            pages_processed = summary.get("pages_processed", 0)
            pages_discovered = summary.get("pages_discovered", pages_processed)
            duplicates_removed = summary.get("duplicates_removed", 0)
            records_skipped = summary.get("records_skipped", 0)
            detail_pages_processed = summary.get("detail_pages_processed", 0)
            last_page = summary.get("last_page", target_url)
            errors = summary.get("errors", []) or []

            logger.info(
                f"[JOB {job_id}] Scraped {pages_processed} pages, "
                f"{len(items)} items, dupes={duplicates_removed}, "
                f"skipped={records_skipped}, errors={len(errors)}"
            )

            await self.update_job(db, job_id, {
                "progress": 60,
                "pages_processed": pages_processed,
                "pages_discovered": pages_discovered,
                "duplicates_removed": duplicates_removed,
                "records_skipped": records_skipped,
                "detail_pages_processed": detail_pages_processed,
                "last_page": last_page,
            })

            # Cap per-item clean_text to keep the doc manageable
            for it in items:
                if (
                    isinstance(it.get("clean_text"), str)
                    and len(it["clean_text"]) > 5000
                ):
                    it["clean_text"] = it["clean_text"][:5000]

            scraped_text = self._build_scraped_text(items)
            if not scraped_text or len(scraped_text.strip()) < 20:
                raise Exception(
                    f"Content too small or empty "
                    f"({len(items)} items extracted)"
                )

            await self.update_job(db, job_id, {"progress": 85})

            record_count = len(items)
            partial = len(errors) > 0 or records_skipped > 0

            await self.update_job(db, job_id, {
                "status": "success",
                "progress": 100,
                "records": record_count,
                "items": items,
                "pages_processed": pages_processed,
                "pages_discovered": pages_discovered,
                "duplicates_removed": duplicates_removed,
                "records_skipped": records_skipped,
                "detail_pages_processed": detail_pages_processed,
                "last_page": last_page,
                "errors": errors,
                "scraped_content": scraped_text[:2_000_000],
                "scraped_at": datetime.now(timezone.utc),
                "error_message": (
                    f"Completed with {len(errors)} page errors "
                    f"and {records_skipped} skipped records"
                ) if partial else None,
            })

            # Optional auto-parse
            if job.get("auto_parse") and job.get("parse_description"):
                try:
                    await self.parse_job_content(
                        job_id, job["parse_description"]
                    )
                except Exception as e:
                    logger.warning(
                        f"Auto-parse failed for job {job_id}: {e}"
                    )

            await db.activities.insert_one({
                "type": "success" if not partial else "warning",
                "title": (
                    "Job Completed" if not partial
                    else "Job Completed with Warnings"
                ),
                "description": (
                    f"Scraped {target_url} — {record_count} items "
                    f"across {pages_processed} pages"
                    + (f" ({len(errors)} errors)" if errors else "")
                ),
                "user_id": user_id,
                "created_at": datetime.now(timezone.utc),
            })

            try:
                from services.notification_service import NotificationService
                await NotificationService.create_notification(
                    user_id=user_id,
                    title="Job Completed",
                    message=(
                        f"'{job.get('name', 'Untitled')}' finished — "
                        f"{record_count} items from {pages_processed} pages"
                    ),
                    notification_type="job_completed",
                    job_id=str(job_id),
                    metadata={
                        "url": target_url,
                        "records": record_count,
                        "pages_processed": pages_processed,
                        "job_name": job.get("name", "Untitled"),
                    },
                )
            except Exception as notif_err:
                logger.warning(f"Notification failed: {notif_err}")

            try:
                analytics = get_analytics_service()
                if analytics and hasattr(analytics, "track_job_completed"):
                    await analytics.track_job_completed(
                        user_id=user_id,
                        job_id=str(job_id),
                        records=record_count,
                    )
            except Exception as an_err:
                logger.debug(f"Analytics skipped: {an_err}")

        except Exception as e:
            error_message = str(e)
            logger.error(
                f"Job {job_id} failed: {error_message}", exc_info=True
            )
            await self.update_job(db, job_id, {
                "status": "failed",
                "progress": 0,
                "error_message": error_message,
            })
            await db.activities.insert_one({
                "type": "error",
                "title": "Job Failed",
                "description": (
                    f"Failed to scrape "
                    f"{(job or {}).get('url', 'unknown')}: "
                    f"{error_message[:200]}"
                ),
                "user_id": user_id,
                "created_at": datetime.now(timezone.utc),
            })
            try:
                from services.notification_service import NotificationService
                await NotificationService.create_notification(
                    user_id=user_id,
                    title="Job Failed",
                    message=(
                        f"'{(job or {}).get('name', 'Untitled')}' failed: "
                        f"{error_message[:150]}"
                    ),
                    notification_type="job_failed",
                    job_id=str(job_id),
                    metadata={
                        "url": (job or {}).get("url", "unknown"),
                        "error": error_message,
                        "job_name": (job or {}).get("name", "Untitled"),
                    },
                )
            except Exception as notif_err:
                logger.warning(f"Notification failed: {notif_err}")

        finally:
            self.active_jobs.discard(job_id)

    # ============================================================
    # HELPERS
    # ============================================================

    @staticmethod
    def _build_scraped_text(items):
        if not items:
            return ""
        lines = []
        for i, item in enumerate(items, 1):
            title = (
                item.get("title")
                or item.get("product_name")
                or f"Item {i}"
            )
            parts = [f"#{i}", f"title={title}"]
            for key in (
                "price", "availability", "rating", "url", "page_number"
            ):
                val = item.get(key)
                if val not in (None, "", []):
                    parts.append(f"{key}={val}")
            lines.append(" | ".join(parts))
        return "\n".join(lines).strip()

    async def parse_job_content(self, job_id: str, parse_description: str):
        db = await get_database()
        try:
            job = await db.jobs.find_one({"_id": ObjectId(job_id)})
            if not job or not job.get("scraped_content"):
                return None

            from parsing.Ollama import DEFAULT_MODEL

            items = job.get("items") or []
            if items:
                chunks = [
                    self._item_to_prompt_chunk(i, it)
                    for i, it in enumerate(items, 1)
                ]
            else:
                chunks = split_dom_content(job["scraped_content"])

            parsed_result = parse_with_openrouter(
                chunks, parse_description, model=DEFAULT_MODEL,
            )

            if (
                isinstance(parsed_result, str)
                and parsed_result.startswith("ERROR:")
            ):
                logger.warning(
                    f"Auto-parse error for job {job_id}: {parsed_result}"
                )
                return None

            await db.parsed_results.insert_one({
                "job_id": ObjectId(job_id),
                "parse_description": parse_description,
                "parsed_content": parsed_result,
                "created_at": datetime.now(timezone.utc),
            })
            return parsed_result
        except Exception as e:
            logger.error(f"Auto-parse failed for job {job_id}: {e}")
            return None

    @staticmethod
    def _item_to_prompt_chunk(index, item):
        parts = [f"Item #{index}"]
        for key in (
            "title", "product_name", "price", "availability",
            "rating", "description", "url",
        ):
            val = item.get(key)
            if val:
                parts.append(f"{key}: {val}")
        return "\n".join(parts)


job_executor = JobExecutor()