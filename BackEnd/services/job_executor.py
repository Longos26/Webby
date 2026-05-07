# services/job_executor.py
import asyncio
import logging
from datetime import datetime
from bson import ObjectId
from mongodb.database import get_database
from .scraper_utils import scrape_website, extract_body_content, clean_body_content
from analytics.analytics_service import get_analytics_service
from parsing.Ollama import parse_with_openrouter

logger = logging.getLogger(__name__)

class JobExecutor:
    def __init__(self):
        self.active_jobs = set()

    async def update_job(self, db, job_id, data):
        """Update job with new data"""
        data["updated_at"] = datetime.utcnow()
        await db.jobs.update_one(
            {"_id": ObjectId(job_id)}, 
            {"$set": data}
        )

    async def execute_job(self, job_id: str, user_id: str):
        """Execute a scraping job - THIS MUST BE ASYNC"""
        db = await get_database()
        
        if job_id in self.active_jobs:
            logger.warning(f"Job {job_id} already running")
            return
        
        self.active_jobs.add(job_id)
        
        try:
            # Get job details
            job = await db.jobs.find_one({"_id": ObjectId(job_id)})
            if not job:
                raise Exception("Job not found")
            
            logger.info(f"Starting job {job_id} for URL: {job['url']}")
            
            # STEP 1: Mark as running
            await self.update_job(db, job_id, {"status": "running", "progress": 10})
        
            # STEP 2: Scrape website
            html = scrape_website(job["url"], use_selenium=False)
            await self.update_job(db, job_id, {"progress": 40})
    
            # STEP 3: Extract and clean body
            body = extract_body_content(html)
            cleaned = clean_body_content(body)
            
            if not cleaned or len(cleaned.strip()) < 50:
                raise Exception("Content too small or empty")
            
            records = len([line for line in cleaned.splitlines() if line.strip()])
            await self.update_job(db, job_id, {"progress": 80})
            
            # STEP 4: Save results
            await self.update_job(db, job_id, {
                "status": "success",
                "progress": 100,
                "records": records,
                "scraped_content": cleaned[:500000],
                "scraped_at": datetime.utcnow(),
                "error_message": None
            })
            
            # Add activity
            await db.activities.insert_one({
                "type": "success",
                "title": "Job Completed",
                "description": f"Successfully scraped {job['url']} - Extracted {records} records",
                "user_id": user_id,
                "created_at": datetime.utcnow()
            })
            
            # CREATE NOTIFICATION FOR JOB COMPLETION
            from services.notification_service import NotificationService
            await NotificationService.create_notification(
                user_id=user_id,
                title="Job Completed Successfully",
                message=f"Your scraping job '{job.get('name', 'Untitled')}' has completed. Extracted {records} records from {job['url']}",
                notification_type="job_completed",
                job_id=str(job_id),
                metadata={
                    "url": job["url"],
                    "records": records,
                    "job_name": job.get("name", "Untitled")
                }
            )
            
            logger.info(f"Created completion notification for job {job_id}")
            
        except Exception as e:
            error_message = str(e)
            logger.error(f"Job {job_id} failed: {error_message}")
            
            await self.update_job(db, job_id, {
                "status": "failed",
                "progress": 0,
                "error_message": error_message,
                "scraped_content": None
            })
            
            await db.activities.insert_one({
                "type": "error",
                "title": "Job Failed",
                "description": f"Failed to scrape {job.get('url', 'unknown')}: {error_message[:200]}",
                "user_id": user_id,
                "created_at": datetime.utcnow()
            })
            
            # CREATE NOTIFICATION FOR JOB FAILURE
            from services.notification_service import NotificationService
            await NotificationService.create_notification(
                user_id=user_id,
                title="Job Failed",
                message=f"Your scraping job '{job.get('name', 'Untitled')}' failed: {error_message[:150]}",
                notification_type="job_failed",
                job_id=str(job_id),
                metadata={
                    "url": job.get("url", "unknown"),
                    "error": error_message,
                    "job_name": job.get("name", "Untitled")
                }
            )
            
            logger.info(f"Created failure notification for job {job_id}")
            
        finally:
            self.active_jobs.discard(job_id)

    async def parse_job_content(self, job_id: str, parse_description: str):
        """Parse job content using Ollama after scraping"""
        db = await get_database()
        
        try:
            job = await db.jobs.find_one({"_id": ObjectId(job_id)})
            if not job or not job.get("scraped_content"):
                return None
            
            parsed_result = parse_with_openrouter(job["scraped_content"], parse_description)
            
            # Save to database
            parse_doc = {
                "job_id": ObjectId(job_id),
                "parse_description": parse_description,
                "parsed_content": parsed_result,
                "created_at": datetime.utcnow()
            }
            await db.parsed_results.insert_one(parse_doc)
            
            return parsed_result
        except Exception as e:
            logger.error(f"Auto-parse failed for job {job_id}: {str(e)}")
            return None

# Create singleton instance
job_executor = JobExecutor()