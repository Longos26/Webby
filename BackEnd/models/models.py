from pydantic import BaseModel, EmailStr, Field
from datetime import datetime
from typing import Any, Dict, Optional



# User-related models
class UserCreate(BaseModel):
    first_name: str
    last_name: str
    email: EmailStr
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"

class UserResponse(BaseModel):
    id: str
    username: str
    email: str
    created_at: datetime

    class Config:
        from_attributes = True

class UserInDB(BaseModel):
    username: str
    email: str
    password_hash: str
    created_at: datetime
    updated_at: datetime

# Job Model
class Job(BaseModel):
    id: Optional[str] = None
    name: str
    target: str
    status: str = "queued"  
    progress: int = 0
    records: int = 0
    user_id: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class JobResponse(Job):
    class Config:
        from_attributes = True

# Activity Model
class Activity(BaseModel):
    id: Optional[str] = None
    type: str  # success, error, started, warning, proxy
    title: str
    description: str
    user_id: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
    timeAgo: Optional[str] = None


class ExportHistory(BaseModel):
    id: Optional[str] = None
    name: str
    format: str
    size: str
    rows: int
    user_id: str
    date: datetime = Field(default_factory=datetime.utcnow)
    file_url: Optional[str] = None

class ScrapedData(BaseModel):
    id: Optional[str] = None
    job_id: str
    user_id: str
    data: Dict[str, Any]
    created_at: datetime = Field(default_factory=datetime.utcnow)
    status: str = "success"

class ScrapingJob(BaseModel):
    id: Optional[str] = None
    name: str
    url: str
    user_id: str
    status: str = "queued"  # queued, running, success, failed, paused
    progress: float = 0.0
    records: int = 0
    scraped_content: str = ""
    error_message: str = ""
    frequency: str = "one-time"  # one-time, hourly, daily, weekly
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    scraped_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True
        
    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "url": self.url,
            "target": self.url,
            "user_id": self.user_id,
            "status": self.status,
            "progress": self.progress,
            "records": self.records,
            "scraped_content": self.scraped_content[:1000] if self.scraped_content else "",
            "error_message": self.error_message,
            "frequency": self.frequency,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
            "scraped_at": self.scraped_at.isoformat() if self.scraped_at else None
        }
    

class LLMConfig(BaseModel):
    provider: str  # openai, anthropic, google, cohere, deepseek, ollama, openrouter
    model: str
    api_key: Optional[str] = None
    base_url: Optional[str] = None
    temperature: float = Field(default=0.1, ge=0, le=2)
    max_tokens: int = Field(default=4096, ge=1, le=32768)
    
class ParseRequest(BaseModel):
    dom_content: str
    parse_description: str
    provider: str = "openrouter"
    model: Optional[str] = None
    temperature: Optional[float] = None
    max_tokens: Optional[int] = None
    stream: bool = False

class ParseResponse(BaseModel):
    extracted_content: str
    provider: str
    model: str
    tokens_used: Optional[int] = None
    processing_time_ms: float
    success: bool
    error: Optional[str] = None

class ProviderConfig(BaseModel):
    provider: str
    api_key: Optional[str] = None
    base_url: Optional[str] = None
    default_model: str

class TestConnectionRequest(BaseModel):
    provider: str
    model: str
    api_key: Optional[str] = None
    base_url: Optional[str] = None
