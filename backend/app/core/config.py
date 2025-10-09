from pydantic_settings import BaseSettings
from typing import Optional
import os

class Settings(BaseSettings):
    # Database
    database_url: str = "sqlite:////home/ubuntu/RPO_GenData/data/gendata.db"
    
    # Security
    secret_key: str = "your-secret-key-change-this-in-production"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 180
    refresh_threshold_minutes: int = 10          # Refresh when 10 min left
    max_session_hours: int = 8                   # Maximum session duration
    activity_extension_minutes: int = 30         # Extend by 30 min on activity
    
    # API
    api_prefix: str = "/api"
    admin_prefix: str = "/admin"
    
    # Server
    host: str = "0.0.0.0"
    port: int = 8088
    
    # CORS
    backend_cors_origins: list = ["http://localhost:3000", "http://localhost:8088"]
    
    class Config:
        env_file = ".env"
        case_sensitive = False
        extra = "ignore"  # Ignore extra environment variables

settings = Settings()
