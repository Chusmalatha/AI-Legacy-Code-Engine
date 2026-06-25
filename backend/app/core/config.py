from pydantic import BaseSettings

class Settings(BaseSettings):
    PROJECT_ROOT: str = "uploads/projects"
    class Config:
        env_file = ".env"

settings = Settings()
