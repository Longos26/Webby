"""
Modern Pydantic v2 Models with comprehensive validation, type safety, and security
Compatible with Python 3.12+ and MongoDB
"""

from datetime import datetime, timezone
from typing import Any, Dict, Optional, List, Union, Literal
from enum import Enum
import re
from pydantic import (
    BaseModel, 
    EmailStr, 
    Field, 
    SecretStr, 
    ConfigDict,
    field_validator,
    model_validator,
    computed_field
)
from pydantic.types import PastDate, FutureDate
import hashlib
import secrets


# ============= Enums for Type Safety =============

class JobStatus(str, Enum):
    """Standardized job status enum"""
    QUEUED = "queued"
    RUNNING = "running"
    SUCCESS = "success"
    FAILED = "failed"
    PAUSED = "paused"
    CANCELLED = "cancelled"
    PENDING = "pending"
    
    @classmethod
    def active_statuses(cls) -> List[str]:
        return [cls.QUEUED, cls.RUNNING, cls.PENDING]
    
    @classmethod
    def terminal_statuses(cls) -> List[str]:
        return [cls.SUCCESS, cls.FAILED, cls.CANCELLED]


class ActivityType(str, Enum):
    """Activity/notification types"""
    SUCCESS = "success"
    ERROR = "error"
    WARNING = "warning"
    INFO = "info"
    STARTED = "started"
    PROXY_ISSUE = "proxy"
    RATE_LIMIT = "rate_limit"


class ExportFormat(str, Enum):
    """Supported export formats"""
    CSV = "csv"
    JSON = "json"
    EXCEL = "excel"
    PDF = "pdf"
    HTML = "html"
    XML = "xml"


class FrequencyType(str, Enum):
    """Job scheduling frequencies"""
    ONE_TIME = "one-time"
    HOURLY = "hourly"
    DAILY = "daily"
    WEEKLY = "weekly"
    MONTHLY = "monthly"
    CUSTOM = "custom"


class LLMProvider(str, Enum):
    """Supported LLM providers"""
    OPENAI = "openai"
    ANTHROPIC = "anthropic"
    GOOGLE = "google"
    COHERE = "cohere"
    DEEPSEEK = "deepseek"
    OLLAMA = "ollama"
    OPENROUTER = "openrouter"
    GROQ = "groq"
    MISTRAL = "mistral"


class ScrapedDataStatus(str, Enum):
    """Status of scraped data"""
    SUCCESS = "success"
    PARTIAL = "partial"
    FAILED = "failed"
    PENDING = "pending"
    PROCESSING = "processing"


# ============= Base Models with Common Functionality =============

class BaseMongoModel(BaseModel):
    """Base model with MongoDB common fields and configuration"""
    model_config = ConfigDict(
        from_attributes=True,
        populate_by_name=True,
        json_encoders={
            datetime: lambda v: v.isoformat(),
            SecretStr: lambda v: v.get_secret_value() if v else None
        },
        arbitrary_types_allowed=True
    )
    
    id: Optional[str] = Field(default=None, alias="_id", description="MongoDB ObjectId")
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    
    @model_validator(mode="before")
    @classmethod
    def set_timestamps(cls, values: Dict[str, Any]) -> Dict[str, Any]:
        """Auto-update timestamps on model validation"""
        if isinstance(values, dict):
            now = datetime.now(timezone.utc)
            if not values.get("created_at"):
                values["created_at"] = now
            values["updated_at"] = now
        return values


# ============= User Management Models =============

class PasswordStrength(str, Enum):
    WEAK = "weak"
    MEDIUM = "medium"
    STRONG = "strong"


class UserCreate(BaseModel):
    """User registration model with validation"""
    email: EmailStr = Field(..., description="User email address")
    first_name: str = Field(min_length=1, max_length=50, description="First name")
    last_name: str = Field(min_length=1, max_length=50, description="Last name")
    password: SecretStr = Field(min_length=8, description="Password (min 8 characters)")
    accept_terms: bool = Field(..., description="Must accept terms and conditions")
    
    @field_validator("password")
    @classmethod
    def validate_password_strength(cls, v: SecretStr) -> SecretStr:
        """Validate password complexity"""
        password = v.get_secret_value()
        
        # Check password strength
        score = 0
        if len(password) >= 12:
            score += 1
        if re.search(r"[A-Z]", password):
            score += 1
        if re.search(r"[a-z]", password):
            score += 1
        if re.search(r"\d", password):
            score += 1
        if re.search(r"[!@#$%^&*(),.?\":{}|<>]", password):
            score += 1
            
        if score < 3:
            raise ValueError(
                "Password must contain at least: "
                "8 characters, uppercase, lowercase, number, or special character"
            )
        return v
    
    @field_validator("email")
    @classmethod
    def validate_email_domain(cls, v: str) -> str:
        """Optional: Validate against disposable email domains"""
        # Add your disposable email domain check here
        disposable_domains = ["tempmail.com", "throwaway.com"]
        domain = v.split("@")[-1]
        if domain in disposable_domains:
            raise ValueError("Disposable email addresses are not allowed")
        return v
    
    @model_validator(mode="after")
    def validate_terms(self) -> "UserCreate":
        """Ensure terms are accepted"""
        if not self.accept_terms:
            raise ValueError("You must accept the terms and conditions")
        return self


class UserLogin(BaseModel):
    """Login credentials model"""
    email: EmailStr
    password: SecretStr
    
    @field_validator("email")
    @classmethod
    def normalize_email(cls, v: str) -> str:
        """Normalize email to lowercase"""
        return v.lower().strip()


class Token(BaseModel):
    """JWT token response"""
    access_token: str
    refresh_token: Optional[str] = None
    token_type: str = "bearer"
    expires_in: int = Field(default=3600, description="Token expiration in seconds")


class RefreshToken(BaseModel):
    """Refresh token request"""
    refresh_token: str


class UserResponse(BaseModel):
    """User profile response (safe fields only)"""
    model_config = ConfigDict(from_attributes=True)
    
    id: str = Field(alias="_id")
    email: EmailStr
    first_name: str
    last_name: str
    is_active: bool = True
    is_verified: bool = False
    created_at: datetime
    updated_at: datetime
    
    @computed_field
    @property
    def full_name(self) -> str:
        """Computed full name"""
        return f"{self.first_name} {self.last_name}"
    
    @computed_field
    @property
    def display_name(self) -> str:
        """Display name (first name or email)"""
        return self.first_name or self.email.split("@")[0]


class UserInDB(BaseModel):
    """Internal database user model (never exposed to API)"""
    model_config = ConfigDict(from_attributes=True)
    
    email: EmailStr
    password_hash: str  # Never plain text
    salt: str
    first_name: str
    last_name: str
    is_active: bool = True
    is_verified: bool = False
    verification_token: Optional[str] = None
    reset_token: Optional[str] = None
    reset_token_expires: Optional[datetime] = None
    failed_login_attempts: int = 0
    locked_until: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    last_login: Optional[datetime] = None


class PasswordResetRequest(BaseModel):
    """Password reset request model"""
    email: EmailStr


class PasswordResetConfirm(BaseModel):
    """Password reset confirmation"""
    token: str
    new_password: SecretStr
    
    @field_validator("new_password")
    @classmethod
    def validate_password(cls, v: SecretStr) -> SecretStr:
        return UserCreate.validate_password_strength(v)


class EmailChangeRequest(BaseModel):
    """Email change request"""
    new_email: EmailStr
    password: SecretStr


# ============= Job Management Models =============

class BaseJob(BaseModel):
    """Abstract base job with common fields"""
    name: str = Field(min_length=1, max_length=200)
    user_id: str
    status: JobStatus = JobStatus.QUEUED
    progress: float = Field(default=0.0, ge=0, le=100)
    records: int = Field(default=0, ge=0)
    error_message: Optional[str] = None
    
    @field_validator("name")
    @classmethod
    def sanitize_name(cls, v: str) -> str:
        """Remove potential XSS from job name"""
        return re.sub(r'[<>"\']', '', v).strip()


class Job(BaseJob):
    """Standard job model"""
    target: str = Field(..., description="Target URL or identifier")
    
    @field_validator("target")
    @classmethod
    def validate_target(cls, v: str) -> str:
        """Validate target URL format"""
        if not v.startswith(("http://", "https://", "mongodb://", "postgresql://")):
            raise ValueError("Invalid target protocol")
        return v


class ScrapingJob(BaseJob):
    """Specialized scraping job model"""
    url: str = Field(..., description="Target URL to scrape")
    frequency: FrequencyType = FrequencyType.ONE_TIME
    scraped_content: Optional[str] = None
    scraped_at: Optional[datetime] = None
    selectors: Optional[Dict[str, str]] = None
    pagination_config: Optional[Dict[str, Any]] = None
    
    @field_validator("url")
    @classmethod
    def validate_url(cls, v: str) -> str:
        """Validate URL format and security"""
        if not v.startswith(("http://", "https://")):
            raise ValueError("URL must start with http:// or https://")
        
        # Block internal/private IPs if needed
        blocked_patterns = [r"127\.0\.0\.\d+", r"192\.168\.\d+\.\d+", r"10\.\d+\.\d+\.\d+"]
        for pattern in blocked_patterns:
            if re.search(pattern, v):
                raise ValueError(f"Access to local/private IPs is not allowed")
        return v
    
    @computed_field
    @property
    def target(self) -> str:
        """Alias for url to maintain compatibility"""
        return self.url


class JobResponse(BaseModel):
    """Job response with safe field exposure"""
    model_config = ConfigDict(from_attributes=True)
    
    id: str
    name: str
    target: str
    status: JobStatus
    progress: float
    records: int
    user_id: str
    created_at: datetime
    updated_at: datetime
    error_message: Optional[str] = None
    completed_at: Optional[datetime] = None


# ============= Activity and Logging Models =============

class Activity(BaseModel):
    """User activity/notification model"""
    model_config = ConfigDict(from_attributes=True)
    
    id: Optional[str] = None
    type: ActivityType
    title: str = Field(min_length=1, max_length=200)
    description: str = Field(min_length=1, max_length=1000)
    user_id: str
    metadata: Optional[Dict[str, Any]] = Field(default_factory=dict)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    is_read: bool = False
    
    @computed_field
    @property
    def time_ago(self) -> str:
        """Calculate human-readable time difference"""
        from datetime import timedelta
        delta = datetime.now(timezone.utc) - self.created_at
        
        if delta < timedelta(minutes=1):
            return "just now"
        elif delta < timedelta(hours=1):
            mins = int(delta.total_seconds() / 60)
            return f"{mins} minute{'s' if mins != 1 else ''} ago"
        elif delta < timedelta(days=1):
            hours = int(delta.total_seconds() / 3600)
            return f"{hours} hour{'s' if hours != 1 else ''} ago"
        elif delta < timedelta(days=7):
            days = delta.days
            return f"{days} day{'s' if days != 1 else ''} ago"
        else:
            return self.created_at.strftime("%Y-%m-%d")


# ============= Export Models =============

class ExportHistory(BaseModel):
    """Export history tracking model"""
    model_config = ConfigDict(from_attributes=True)
    
    id: Optional[str] = None
    name: str = Field(min_length=1, max_length=200)
    format: ExportFormat
    size_bytes: int = Field(ge=0, description="File size in bytes")
    rows: int = Field(ge=0)
    user_id: str
    date: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    file_url: Optional[str] = None
    expires_at: Optional[datetime] = None
    download_count: int = Field(default=0, ge=0)
    
    @computed_field
    @property
    def size_human_readable(self) -> str:
        """Human readable file size"""
        for unit in ['B', 'KB', 'MB', 'GB']:
            if self.size_bytes < 1024.0:
                return f"{self.size_bytes:.1f} {unit}"
            self.size_bytes /= 1024.0
        return f"{self.size_bytes:.1f} TB"


# ============= Scraped Data Models =============

class ScrapedData(BaseModel):
    """Scraped content storage model"""
    model_config = ConfigDict(from_attributes=True)
    
    id: Optional[str] = None
    job_id: str
    user_id: str
    data: Dict[str, Any]
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    status: ScrapedDataStatus = ScrapedDataStatus.SUCCESS
    data_hash: Optional[str] = None
    content_type: Optional[str] = None
    size_bytes: Optional[int] = None
    
    @model_validator(mode="after")
    def calculate_hash(self) -> "ScrapedData":
        """Auto-calculate data hash for deduplication"""
        import json
        data_str = json.dumps(self.data, sort_keys=True)
        self.data_hash = hashlib.sha256(data_str.encode()).hexdigest()[:16]
        return self


# ============= LLM Integration Models =============

class LLMConfig(BaseModel):
    """LLM provider configuration (secure)"""
    provider: LLMProvider
    model: str
    api_key: Optional[SecretStr] = None
    base_url: Optional[str] = None
    temperature: float = Field(default=0.1, ge=0, le=2)
    max_tokens: int = Field(default=4096, ge=1, le=32768)
    timeout_seconds: int = Field(default=60, ge=1, le=300)
    retry_attempts: int = Field(default=3, ge=0, le=5)
    
    @field_validator("model")
    @classmethod
    def validate_model_name(cls, v: str) -> str:
        """Validate model naming convention"""
        if not re.match(r'^[a-zA-Z0-9\-_\.\/]+$', v):
            raise ValueError("Invalid model name format")
        return v


class ParseRequest(BaseModel):
    """Structured parsing request for LLM"""
    dom_content: str = Field(..., description="HTML/XML content to parse")
    parse_description: str = Field(min_length=10, max_length=2000, description="Parsing instructions")
    provider: LLMProvider = LLMProvider.OPENROUTER
    model: Optional[str] = None
    temperature: Optional[float] = Field(default=None, ge=0, le=2)
    max_tokens: Optional[int] = Field(default=None, ge=1, le=32768)
    stream: bool = False
    response_format: Optional[Literal["json", "text", "markdown"]] = "json"
    
    @field_validator("dom_content")
    @classmethod
    def validate_dom_size(cls, v: str) -> str:
        """Limit DOM content size to prevent abuse"""
        max_size = 1024 * 1024  # 1MB
        if len(v.encode('utf-8')) > max_size:
            raise ValueError(f"DOM content exceeds {max_size // 1024}KB limit")
        return v


class ParseResponse(BaseModel):
    """LLM parsing response"""
    extracted_content: str
    provider: LLMProvider
    model: str
    tokens_used: Optional[int] = Field(default=None, ge=0)
    tokens_prompt: Optional[int] = None
    tokens_completion: Optional[int] = None
    processing_time_ms: float = Field(ge=0)
    success: bool
    error: Optional[str] = None
    cached: bool = False
    
    @computed_field
    @property
    def cost_estimate_usd(self) -> Optional[float]:
        """Estimate API cost based on token usage"""
        if not self.tokens_used:
            return None
        
        # Rough pricing (update based on actual provider rates)
        rates = {
            LLMProvider.OPENAI: 0.002,  # per 1K tokens
            LLMProvider.ANTHROPIC: 0.003,
            LLMProvider.GOOGLE: 0.001,
        }
        rate = rates.get(self.provider, 0.001)
        return round((self.tokens_used / 1000) * rate, 4)


class ProviderConfig(BaseModel):
    """Provider configuration for multi-LLM support"""
    provider: LLMProvider
    api_key: Optional[SecretStr] = None
    base_url: Optional[str] = None
    default_model: str
    is_default: bool = False
    rate_limit_rpm: int = Field(default=60, ge=1)
    rate_limit_tpm: int = Field(default=100000, ge=1)


class TestConnectionRequest(BaseModel):
    """Test LLM provider connection"""
    provider: LLMProvider
    model: str
    api_key: Optional[SecretStr] = None
    base_url: Optional[str] = None
    timeout_seconds: int = Field(default=10, ge=1, le=30)


# ============= Webhook and Notification Models =============

class WebhookConfig(BaseModel):
    """Webhook configuration for job events"""
    model_config = ConfigDict(from_attributes=True)
    
    id: Optional[str] = None
    user_id: str
    url: str = Field(..., description="Webhook endpoint URL")
    events: List[str] = Field(default_factory=list, description="Events to trigger webhook")
    secret: Optional[SecretStr] = None
    is_active: bool = True
    retry_count: int = Field(default=3, ge=0, le=10)
    timeout_seconds: int = Field(default=10, ge=1, le=30)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    
    @field_validator("url")
    @classmethod
    def validate_webhook_url(cls, v: str) -> str:
        """Validate webhook URL security"""
        if not v.startswith("https://"):
            raise ValueError("Webhook URL must use HTTPS")
        return v


# ============= API Response Wrappers =============

class APIResponse(BaseModel):
    """Standard API response wrapper"""
    success: bool
    message: str
    data: Optional[Union[Dict, List, BaseModel]] = None
    error_code: Optional[str] = None
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    
    @classmethod
    def ok(cls, data=None, message="Success"):
        return cls(success=True, message=message, data=data)
    
    @classmethod
    def error(cls, message, error_code=None, data=None):
        return cls(success=False, message=message, error_code=error_code, data=data)


class PaginatedResponse(BaseModel):
    """Paginated API response"""
    items: List[Any]
    total: int
    page: int
    page_size: int
    total_pages: int
    has_next: bool
    has_prev: bool
    
    @classmethod
    def create(cls, items: List, total: int, page: int, page_size: int):
        total_pages = (total + page_size - 1) // page_size
        return cls(
            items=items,
            total=total,
            page=page,
            page_size=page_size,
            total_pages=total_pages,
            has_next=page < total_pages,
            has_prev=page > 1
        )


# ============= Utility Functions =============

def obfuscate_sensitive_data(data: Dict[str, Any]) -> Dict[str, Any]:
    """Obfuscate sensitive fields for logging/debugging"""
    sensitive_fields = {"password", "api_key", "secret", "token", "authorization"}
    result = data.copy()
    
    for key in result:
        if any(sensitive in key.lower() for sensitive in sensitive_fields):
            result[key] = "***REDACTED***"
    
    return result