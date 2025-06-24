from fastapi import FastAPI, APIRouter, HTTPException, Depends, status, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer
from contextlib import asynccontextmanager
from typing import List, Optional
import logging
from datetime import timedelta

# Import models and services
from models import *
from database import db
from auth import *
from tmdb_service import tmdb_service

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    await db.connect_to_mongo()
    logger.info("Connected to MongoDB")
    yield
    # Shutdown
    await db.close_mongo_connection()
    logger.info("Disconnected from MongoDB")

# Create FastAPI app with lifespan
app = FastAPI(
    title="Netflix Clone API",
    description="A complete Netflix clone API with user authentication, content management, and streaming features",
    version="1.0.0",
    lifespan=lifespan
)

# Create API router
api_router = APIRouter(prefix="/api")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Security
security = HTTPBearer()

# Health check
@api_router.get("/health")
async def health_check():
    return {"status": "healthy", "service": "Netflix Clone API"}

# Authentication endpoints
@api_router.post("/auth/register", response_model=UserResponse)
async def register_user(user_data: UserCreate):
    """Register a new user"""
    # Check if user already exists
    existing_user = await get_user_by_email(user_data.email)
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Create user
    hashed_password = get_password_hash(user_data.password)
    user = UserInDB(
        email=user_data.email,
        first_name=user_data.first_name,
        last_name=user_data.last_name,
        subscription_plan=user_data.subscription_plan,
        hashed_password=hashed_password,
        profiles=[]
    )
    
    # Save to database
    await db.database.users.insert_one(user.dict())
    
    # Return user response (without password)
    return UserResponse(
        id=user.id,
        email=user.email,
        first_name=user.first_name,
        last_name=user.last_name,
        subscription_plan=user.subscription_plan,
        is_active=user.is_active,
        created_at=user.created_at,
        profiles=[]
    )

@api_router.post("/auth/login", response_model=Token)
async def login_user(user_credentials: UserLogin):
    """Login user and return access token"""
    user = await authenticate_user(user_credentials.email, user_credentials.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token_expires = timedelta(hours=ACCESS_TOKEN_EXPIRE_HOURS)
    access_token = create_access_token(
        data={"sub": user.id}, expires_delta=access_token_expires
    )
    
    return Token(
        access_token=access_token,
        token_type="bearer",
        expires_in=ACCESS_TOKEN_EXPIRE_HOURS * 3600
    )

@api_router.get("/auth/me", response_model=UserResponse)
async def get_current_user_info(current_user: UserInDB = Depends(get_current_active_user)):
    """Get current user information"""
    return UserResponse(
        id=current_user.id,
        email=current_user.email,
        first_name=current_user.first_name,
        last_name=current_user.last_name,
        subscription_plan=current_user.subscription_plan,
        is_active=current_user.is_active,
        created_at=current_user.created_at,
        profiles=[
            ProfileResponse(
                id=profile.id,
                name=profile.name,
                avatar=profile.avatar,
                is_kid=profile.is_kid,
                language=profile.language,
                created_at=profile.created_at
            ) for profile in current_user.profiles
        ]
    )

# Profile endpoints
@api_router.post("/profiles", response_model=ProfileResponse)
async def create_profile(
    profile_data: ProfileCreate,
    current_user: UserInDB = Depends(get_current_active_user)
):
    """Create a new profile for the current user"""
    # Check profile limit based on subscription
    max_profiles = {"basic": 1, "standard": 2, "premium": 4}
    if len(current_user.profiles) >= max_profiles.get(current_user.subscription_plan.value, 1):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Profile limit reached for {current_user.subscription_plan.value} plan"
        )
    
    # Create profile
    profile = Profile(
        name=profile_data.name,
        avatar=profile_data.avatar,
        is_kid=profile_data.is_kid,
        language=profile_data.language
    )
    
    # Add to user's profiles
    await db.database.users.update_one(
        {"id": current_user.id},
        {"$push": {"profiles": profile.dict()}}
    )
    
    return ProfileResponse(
        id=profile.id,
        name=profile.name,
        avatar=profile.avatar,
        is_kid=profile.is_kid,
        language=profile.language,
        created_at=profile.created_at
    )

@api_router.get("/profiles", response_model=List[ProfileResponse])
async def get_profiles(current_user: UserInDB = Depends(get_current_active_user)):
    """Get all profiles for the current user"""
    return [
        ProfileResponse(
            id=profile.id,
            name=profile.name,
            avatar=profile.avatar,
            is_kid=profile.is_kid,
            language=profile.language,
            created_at=profile.created_at
        ) for profile in current_user.profiles
    ]

# Content endpoints
@api_router.get("/movies/popular", response_model=List[ContentResponse])
async def get_popular_movies(
    page: int = Query(1, ge=1, le=10),
    current_user: UserInDB = Depends(get_current_active_user)
):
    """Get popular movies from TMDB"""
    try:
        movies = await tmdb_service.get_popular_movies(page)
        
        # Save to database if not exists
        for movie in movies:
            existing = await db.database.movies.find_one({"tmdb_id": movie.tmdb_id})
            if not existing:
                await db.database.movies.insert_one(movie.dict())
        
        return [
            ContentResponse(
                id=movie.id,
                tmdb_id=movie.tmdb_id,
                title=movie.title,
                overview=movie.overview,
                poster_path=movie.poster_path,
                backdrop_path=movie.backdrop_path,
                release_date=movie.release_date,
                runtime=movie.runtime,
                vote_average=movie.vote_average,
                popularity=movie.popularity,
                genres=movie.genres,
                videos=movie.videos,
                maturity_rating=movie.maturity_rating,
                content_type=ContentType.MOVIE
            ) for movie in movies
        ]
    except Exception as e:
        logger.error(f"Error fetching popular movies: {str(e)}")
        raise HTTPException(status_code=500, detail="Error fetching movies")

@api_router.get("/tv/popular", response_model=List[ContentResponse])
async def get_popular_tv_shows(
    page: int = Query(1, ge=1, le=10),
    current_user: UserInDB = Depends(get_current_active_user)
):
    """Get popular TV shows from TMDB"""
    try:
        tv_shows = await tmdb_service.get_popular_tv_shows(page)
        
        # Save to database if not exists
        for tv_show in tv_shows:
            existing = await db.database.tv_shows.find_one({"tmdb_id": tv_show.tmdb_id})
            if not existing:
                await db.database.tv_shows.insert_one(tv_show.dict())
        
        return [
            ContentResponse(
                id=tv_show.id,
                tmdb_id=tv_show.tmdb_id,
                title=tv_show.name,
                overview=tv_show.overview,
                poster_path=tv_show.poster_path,
                backdrop_path=tv_show.backdrop_path,
                release_date=tv_show.first_air_date,
                runtime=None,
                vote_average=tv_show.vote_average,
                popularity=tv_show.popularity,
                genres=tv_show.genres,
                videos=tv_show.videos,
                maturity_rating=tv_show.maturity_rating,
                content_type=ContentType.TV_SHOW
            ) for tv_show in tv_shows
        ]
    except Exception as e:
        logger.error(f"Error fetching popular TV shows: {str(e)}")
        raise HTTPException(status_code=500, detail="Error fetching TV shows")

@api_router.get("/content/trending", response_model=List[ContentResponse])
async def get_trending_content(
    current_user: UserInDB = Depends(get_current_active_user)
):
    """Get trending content"""
    try:
        trending = await tmdb_service.get_trending_content()
        
        content_responses = []
        
        # Process movies
        for movie in trending["movies"]:
            existing = await db.database.movies.find_one({"tmdb_id": movie.tmdb_id})
            if not existing:
                await db.database.movies.insert_one(movie.dict())
            
            content_responses.append(ContentResponse(
                id=movie.id,
                tmdb_id=movie.tmdb_id,
                title=movie.title,
                overview=movie.overview,
                poster_path=movie.poster_path,
                backdrop_path=movie.backdrop_path,
                release_date=movie.release_date,
                runtime=movie.runtime,
                vote_average=movie.vote_average,
                popularity=movie.popularity,
                genres=movie.genres,
                videos=movie.videos,
                maturity_rating=movie.maturity_rating,
                content_type=ContentType.MOVIE
            ))
        
        # Process TV shows
        for tv_show in trending["tv_shows"]:
            existing = await db.database.tv_shows.find_one({"tmdb_id": tv_show.tmdb_id})
            if not existing:
                await db.database.tv_shows.insert_one(tv_show.dict())
            
            content_responses.append(ContentResponse(
                id=tv_show.id,
                tmdb_id=tv_show.tmdb_id,
                title=tv_show.name,
                overview=tv_show.overview,
                poster_path=tv_show.poster_path,
                backdrop_path=tv_show.backdrop_path,
                release_date=tv_show.first_air_date,
                runtime=None,
                vote_average=tv_show.vote_average,
                popularity=tv_show.popularity,
                genres=tv_show.genres,
                videos=tv_show.videos,
                maturity_rating=tv_show.maturity_rating,
                content_type=ContentType.TV_SHOW
            ))
        
        return content_responses
    except Exception as e:
        logger.error(f"Error fetching trending content: {str(e)}")
        raise HTTPException(status_code=500, detail="Error fetching trending content")

@api_router.get("/content/search", response_model=SearchResult)
async def search_content(
    q: str = Query(..., min_length=1),
    page: int = Query(1, ge=1, le=10),
    current_user: UserInDB = Depends(get_current_active_user)
):
    """Search for movies and TV shows"""
    try:
        search_results = await tmdb_service.search_content(q, page)
        
        # Save new content to database
        for movie in search_results["movies"]:
            existing = await db.database.movies.find_one({"tmdb_id": movie.tmdb_id})
            if not existing:
                await db.database.movies.insert_one(movie.dict())
        
        for tv_show in search_results["tv_shows"]:
            existing = await db.database.tv_shows.find_one({"tmdb_id": tv_show.tmdb_id})
            if not existing:
                await db.database.tv_shows.insert_one(tv_show.dict())
        
        return SearchResult(
            movies=search_results["movies"],
            tv_shows=search_results["tv_shows"],
            total_results=search_results["total_results"]
        )
    except Exception as e:
        logger.error(f"Error searching content: {str(e)}")
        raise HTTPException(status_code=500, detail="Error searching content")

# Watchlist endpoints
@api_router.post("/watchlist/{profile_id}")
async def add_to_watchlist(
    profile_id: str,
    item: WatchlistCreate,
    current_user: UserInDB = Depends(get_current_active_user)
):
    """Add content to profile's watchlist"""
    # Verify profile access
    profile = await require_profile_access(profile_id, current_user)
    
    # Check if already in watchlist
    existing = await db.database.watchlist.find_one({
        "profile_id": profile_id,
        "content_id": item.content_id
    })
    
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Item already in watchlist"
        )
    
    # Add to watchlist
    watchlist_item = WatchlistItem(
        profile_id=profile_id,
        content_id=item.content_id,
        content_type=item.content_type
    )
    
    await db.database.watchlist.insert_one(watchlist_item.dict())
    
    return {"message": "Added to watchlist successfully"}

@api_router.delete("/watchlist/{profile_id}/{content_id}")
async def remove_from_watchlist(
    profile_id: str,
    content_id: str,
    current_user: UserInDB = Depends(get_current_active_user)
):
    """Remove content from profile's watchlist"""
    # Verify profile access
    profile = await require_profile_access(profile_id, current_user)
    
    # Remove from watchlist
    result = await db.database.watchlist.delete_one({
        "profile_id": profile_id,
        "content_id": content_id
    })
    
    if result.deleted_count == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Item not found in watchlist"
        )
    
    return {"message": "Removed from watchlist successfully"}

@api_router.get("/watchlist/{profile_id}", response_model=List[ContentResponse])
async def get_watchlist(
    profile_id: str,
    current_user: UserInDB = Depends(get_current_active_user)
):
    """Get profile's watchlist"""
    # Verify profile access
    profile = await require_profile_access(profile_id, current_user)
    
    # Get watchlist items
    watchlist_items = await db.database.watchlist.find({"profile_id": profile_id}).to_list(1000)
    
    content_responses = []
    
    for item in watchlist_items:
        if item["content_type"] == ContentType.MOVIE:
            content = await db.database.movies.find_one({"id": item["content_id"]})
            if content:
                movie = Movie(**content)
                content_responses.append(ContentResponse(
                    id=movie.id,
                    tmdb_id=movie.tmdb_id,
                    title=movie.title,
                    overview=movie.overview,
                    poster_path=movie.poster_path,
                    backdrop_path=movie.backdrop_path,
                    release_date=movie.release_date,
                    runtime=movie.runtime,
                    vote_average=movie.vote_average,
                    popularity=movie.popularity,
                    genres=movie.genres,
                    videos=movie.videos,
                    maturity_rating=movie.maturity_rating,
                    content_type=ContentType.MOVIE
                ))
        else:  # TV Show
            content = await db.database.tv_shows.find_one({"id": item["content_id"]})
            if content:
                tv_show = TVShow(**content)
                content_responses.append(ContentResponse(
                    id=tv_show.id,
                    tmdb_id=tv_show.tmdb_id,
                    title=tv_show.name,
                    overview=tv_show.overview,
                    poster_path=tv_show.poster_path,
                    backdrop_path=tv_show.backdrop_path,
                    release_date=tv_show.first_air_date,
                    runtime=None,
                    vote_average=tv_show.vote_average,
                    popularity=tv_show.popularity,
                    genres=tv_show.genres,
                    videos=tv_show.videos,
                    maturity_rating=tv_show.maturity_rating,
                    content_type=ContentType.TV_SHOW
                ))
    
    return content_responses

# Include router in main app
app.include_router(api_router)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)