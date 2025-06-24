from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional, Dict, Any
from datetime import datetime
from enum import Enum
import uuid

class UserRole(str, Enum):
    USER = "user"
    ADMIN = "admin"

class SubscriptionPlan(str, Enum):
    BASIC = "basic"
    STANDARD = "standard"
    PREMIUM = "premium"

class ContentType(str, Enum):
    MOVIE = "movie"
    TV_SHOW = "tv"

class MaturityRating(str, Enum):
    G = "G"
    PG = "PG"
    PG13 = "PG-13"
    R = "R"
    NC17 = "NC-17"
    TV_Y = "TV-Y"
    TV_Y7 = "TV-Y7"
    TV_G = "TV-G"
    TV_PG = "TV-PG"
    TV_14 = "TV-14"
    TV_MA = "TV-MA"

# User Models
class ProfileCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=50)
    avatar: Optional[str] = None
    is_kid: bool = False
    language: str = "en"

class Profile(ProfileCreate):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    created_at: datetime = Field(default_factory=datetime.utcnow)
    preferences: Dict[str, Any] = Field(default_factory=dict)

class UserCreate(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=6)
    first_name: str = Field(..., min_length=1, max_length=50)
    last_name: str = Field(..., min_length=1, max_length=50)
    subscription_plan: SubscriptionPlan = SubscriptionPlan.BASIC

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class User(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    email: EmailStr
    first_name: str
    last_name: str
    subscription_plan: SubscriptionPlan
    role: UserRole = UserRole.USER
    is_active: bool = True
    created_at: datetime = Field(default_factory=datetime.utcnow)
    profiles: List[Profile] = Field(default_factory=list)

class UserInDB(User):
    hashed_password: str

# Content Models
class Genre(BaseModel):
    id: int
    name: str

class ProductionCompany(BaseModel):
    id: int
    name: str
    logo_path: Optional[str] = None

class SpokenLanguage(BaseModel):
    iso_639_1: str
    name: str

class Video(BaseModel):
    id: str
    key: str
    name: str
    site: str
    type: str
    official: bool = False

class MovieBase(BaseModel):
    tmdb_id: int
    title: str
    overview: str
    poster_path: Optional[str] = None
    backdrop_path: Optional[str] = None
    release_date: Optional[str] = None
    runtime: Optional[int] = None
    vote_average: float = 0.0
    vote_count: int = 0
    popularity: float = 0.0
    adult: bool = False
    original_language: str
    original_title: str

class Movie(MovieBase):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    content_type: ContentType = ContentType.MOVIE
    genres: List[Genre] = Field(default_factory=list)
    production_companies: List[ProductionCompany] = Field(default_factory=list)
    spoken_languages: List[SpokenLanguage] = Field(default_factory=list)
    videos: List[Video] = Field(default_factory=list)
    maturity_rating: Optional[MaturityRating] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class TVShowBase(BaseModel):
    tmdb_id: int
    name: str
    overview: str
    poster_path: Optional[str] = None
    backdrop_path: Optional[str] = None
    first_air_date: Optional[str] = None
    last_air_date: Optional[str] = None
    number_of_episodes: int = 0
    number_of_seasons: int = 0
    vote_average: float = 0.0
    vote_count: int = 0
    popularity: float = 0.0
    original_language: str
    original_name: str

class TVShow(TVShowBase):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    content_type: ContentType = ContentType.TV_SHOW
    genres: List[Genre] = Field(default_factory=list)
    production_companies: List[ProductionCompany] = Field(default_factory=list)
    spoken_languages: List[SpokenLanguage] = Field(default_factory=list)
    videos: List[Video] = Field(default_factory=list)
    maturity_rating: Optional[MaturityRating] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

# Watchlist Models
class WatchlistItem(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    profile_id: str
    content_id: str
    content_type: ContentType
    added_at: datetime = Field(default_factory=datetime.utcnow)

class WatchlistCreate(BaseModel):
    content_id: str
    content_type: ContentType

# Viewing History Models
class ViewingHistoryItem(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    profile_id: str
    content_id: str
    content_type: ContentType
    watched_at: datetime = Field(default_factory=datetime.utcnow)
    progress_seconds: int = 0
    completed: bool = False

class ViewingHistoryCreate(BaseModel):
    content_id: str
    content_type: ContentType
    progress_seconds: int = 0
    completed: bool = False

# Search Models
class SearchResult(BaseModel):
    movies: List[Movie] = Field(default_factory=list)
    tv_shows: List[TVShow] = Field(default_factory=list)
    total_results: int = 0

# Category Models
class Category(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    description: Optional[str] = None
    content_ids: List[str] = Field(default_factory=list)
    order: int = 0
    is_active: bool = True

# Response Models
class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int

class ProfileResponse(BaseModel):
    id: str
    name: str
    avatar: Optional[str]
    is_kid: bool
    language: str
    created_at: datetime

class UserResponse(BaseModel):
    id: str
    email: str
    first_name: str
    last_name: str
    subscription_plan: SubscriptionPlan
    is_active: bool
    created_at: datetime
    profiles: List[ProfileResponse]

class ContentResponse(BaseModel):
    id: str
    tmdb_id: int
    title: str
    overview: str
    poster_path: Optional[str]
    backdrop_path: Optional[str]
    release_date: Optional[str]
    runtime: Optional[int]
    vote_average: float
    popularity: float
    genres: List[Genre]
    videos: List[Video]
    maturity_rating: Optional[MaturityRating]
    content_type: ContentType

# Error Models
class ErrorResponse(BaseModel):
    error: str
    message: str
    status_code: int