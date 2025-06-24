import httpx
import os
from typing import List, Optional, Dict, Any
from models import Movie, TVShow, Genre, ProductionCompany, SpokenLanguage, Video, ContentType, MaturityRating
import asyncio
import logging

logger = logging.getLogger(__name__)

class TMDBService:
    def __init__(self):
        self.api_key = os.getenv("TMDB_API_KEY")
        self.api_key_backup = os.getenv("TMDB_API_KEY_BACKUP")
        self.base_url = "https://api.themoviedb.org/3"
        self.image_base_url = "https://image.tmdb.org/t/p/w500"
        self.backdrop_base_url = "https://image.tmdb.org/t/p/w1280"
        self.current_key = self.api_key
        
    async def _make_request(self, endpoint: str, params: Dict[str, Any] = None) -> Optional[Dict[str, Any]]:
        """Make a request to TMDB API with fallback to backup key"""
        if params is None:
            params = {}
        
        params["api_key"] = self.current_key
        
        async with httpx.AsyncClient() as client:
            try:
                response = await client.get(f"{self.base_url}{endpoint}", params=params)
                
                if response.status_code == 429:  # Rate limit
                    # Switch to backup key
                    if self.current_key == self.api_key:
                        self.current_key = self.api_key_backup
                        params["api_key"] = self.current_key
                        await asyncio.sleep(1)  # Brief delay
                        response = await client.get(f"{self.base_url}{endpoint}", params=params)
                    else:
                        logger.warning("Rate limited on both API keys")
                        return None
                
                if response.status_code == 200:
                    return response.json()
                else:
                    logger.error(f"TMDB API error: {response.status_code} - {response.text}")
                    return None
                    
            except Exception as e:
                logger.error(f"Error making TMDB request: {str(e)}")
                return None

    def _process_poster_path(self, poster_path: Optional[str]) -> Optional[str]:
        """Process poster path to full URL"""
        if poster_path:
            return f"{self.image_base_url}{poster_path}"
        return None

    def _process_backdrop_path(self, backdrop_path: Optional[str]) -> Optional[str]:
        """Process backdrop path to full URL"""
        if backdrop_path:
            return f"{self.backdrop_base_url}{backdrop_path}"
        return None

    def _get_maturity_rating(self, adult: bool, vote_average: float) -> MaturityRating:
        """Determine maturity rating based on content"""
        if adult:
            return MaturityRating.R
        elif vote_average >= 8.0:
            return MaturityRating.PG13
        elif vote_average >= 6.0:
            return MaturityRating.PG
        else:
            return MaturityRating.G

    async def get_popular_movies(self, page: int = 1) -> List[Movie]:
        """Get popular movies from TMDB"""
        data = await self._make_request("/movie/popular", {"page": page})
        if not data or "results" not in data:
            return []

        movies = []
        for movie_data in data["results"]:
            try:
                # Get detailed movie information including videos
                detailed_movie = await self.get_movie_details(movie_data["id"])
                if detailed_movie:
                    movies.append(detailed_movie)
            except Exception as e:
                logger.error(f"Error processing movie {movie_data.get('id')}: {str(e)}")
                
        return movies

    async def get_movie_details(self, tmdb_id: int) -> Optional[Movie]:
        """Get detailed movie information"""
        # Get movie details
        movie_data = await self._make_request(f"/movie/{tmdb_id}")
        if not movie_data:
            return None

        # Get movie videos
        videos_data = await self._make_request(f"/movie/{tmdb_id}/videos")
        videos = []
        if videos_data and "results" in videos_data:
            for video_data in videos_data["results"]:
                if video_data.get("site") == "YouTube":
                    videos.append(Video(
                        id=video_data["id"],
                        key=video_data["key"],
                        name=video_data["name"],
                        site=video_data["site"],
                        type=video_data["type"],
                        official=video_data.get("official", False)
                    ))

        try:
            movie = Movie(
                tmdb_id=movie_data["id"],
                title=movie_data["title"],
                overview=movie_data["overview"],
                poster_path=self._process_poster_path(movie_data.get("poster_path")),
                backdrop_path=self._process_backdrop_path(movie_data.get("backdrop_path")),
                release_date=movie_data.get("release_date"),
                runtime=movie_data.get("runtime"),
                vote_average=movie_data.get("vote_average", 0.0),
                vote_count=movie_data.get("vote_count", 0),
                popularity=movie_data.get("popularity", 0.0),
                adult=movie_data.get("adult", False),
                original_language=movie_data.get("original_language", "en"),
                original_title=movie_data.get("original_title", movie_data["title"]),
                genres=[Genre(id=g["id"], name=g["name"]) for g in movie_data.get("genres", [])],
                production_companies=[
                    ProductionCompany(
                        id=pc["id"],
                        name=pc["name"],
                        logo_path=self._process_poster_path(pc.get("logo_path"))
                    ) for pc in movie_data.get("production_companies", [])
                ],
                spoken_languages=[
                    SpokenLanguage(iso_639_1=sl["iso_639_1"], name=sl["name"])
                    for sl in movie_data.get("spoken_languages", [])
                ],
                videos=videos,
                maturity_rating=self._get_maturity_rating(
                    movie_data.get("adult", False),
                    movie_data.get("vote_average", 0.0)
                )
            )
            return movie
        except Exception as e:
            logger.error(f"Error creating movie object: {str(e)}")
            return None

    async def get_popular_tv_shows(self, page: int = 1) -> List[TVShow]:
        """Get popular TV shows from TMDB"""
        data = await self._make_request("/tv/popular", {"page": page})
        if not data or "results" not in data:
            return []

        tv_shows = []
        for tv_data in data["results"]:
            try:
                # Get detailed TV show information
                detailed_tv = await self.get_tv_show_details(tv_data["id"])
                if detailed_tv:
                    tv_shows.append(detailed_tv)
            except Exception as e:
                logger.error(f"Error processing TV show {tv_data.get('id')}: {str(e)}")
                
        return tv_shows

    async def get_tv_show_details(self, tmdb_id: int) -> Optional[TVShow]:
        """Get detailed TV show information"""
        # Get TV show details
        tv_data = await self._make_request(f"/tv/{tmdb_id}")
        if not tv_data:
            return None

        # Get TV show videos
        videos_data = await self._make_request(f"/tv/{tmdb_id}/videos")
        videos = []
        if videos_data and "results" in videos_data:
            for video_data in videos_data["results"]:
                if video_data.get("site") == "YouTube":
                    videos.append(Video(
                        id=video_data["id"],
                        key=video_data["key"],
                        name=video_data["name"],
                        site=video_data["site"],
                        type=video_data["type"],
                        official=video_data.get("official", False)
                    ))

        try:
            tv_show = TVShow(
                tmdb_id=tv_data["id"],
                name=tv_data["name"],
                overview=tv_data["overview"],
                poster_path=self._process_poster_path(tv_data.get("poster_path")),
                backdrop_path=self._process_backdrop_path(tv_data.get("backdrop_path")),
                first_air_date=tv_data.get("first_air_date"),
                last_air_date=tv_data.get("last_air_date"),
                number_of_episodes=tv_data.get("number_of_episodes", 0),
                number_of_seasons=tv_data.get("number_of_seasons", 0),
                vote_average=tv_data.get("vote_average", 0.0),
                vote_count=tv_data.get("vote_count", 0),
                popularity=tv_data.get("popularity", 0.0),
                original_language=tv_data.get("original_language", "en"),
                original_name=tv_data.get("original_name", tv_data["name"]),
                genres=[Genre(id=g["id"], name=g["name"]) for g in tv_data.get("genres", [])],
                production_companies=[
                    ProductionCompany(
                        id=pc["id"],
                        name=pc["name"],
                        logo_path=self._process_poster_path(pc.get("logo_path"))
                    ) for pc in tv_data.get("production_companies", [])
                ],
                spoken_languages=[
                    SpokenLanguage(iso_639_1=sl["iso_639_1"], name=sl["name"])
                    for sl in tv_data.get("spoken_languages", [])
                ],
                videos=videos,
                maturity_rating=self._get_maturity_rating(
                    False,  # TV shows don't have adult flag
                    tv_data.get("vote_average", 0.0)
                )
            )
            return tv_show
        except Exception as e:
            logger.error(f"Error creating TV show object: {str(e)}")
            return None

    async def search_content(self, query: str, page: int = 1) -> Dict[str, Any]:
        """Search for movies and TV shows"""
        # Search movies
        movie_data = await self._make_request("/search/movie", {"query": query, "page": page})
        # Search TV shows
        tv_data = await self._make_request("/search/tv", {"query": query, "page": page})

        movies = []
        tv_shows = []

        if movie_data and "results" in movie_data:
            for movie in movie_data["results"][:10]:  # Limit to 10 results
                detailed_movie = await self.get_movie_details(movie["id"])
                if detailed_movie:
                    movies.append(detailed_movie)

        if tv_data and "results" in tv_data:
            for tv in tv_data["results"][:10]:  # Limit to 10 results
                detailed_tv = await self.get_tv_show_details(tv["id"])
                if detailed_tv:
                    tv_shows.append(detailed_tv)

        return {
            "movies": movies,
            "tv_shows": tv_shows,
            "total_results": len(movies) + len(tv_shows)
        }

    async def get_trending_content(self, time_window: str = "week") -> Dict[str, Any]:
        """Get trending content"""
        data = await self._make_request(f"/trending/all/{time_window}")
        if not data or "results" not in data:
            return {"movies": [], "tv_shows": []}

        movies = []
        tv_shows = []

        for item in data["results"]:
            try:
                if item.get("media_type") == "movie":
                    movie = await self.get_movie_details(item["id"])
                    if movie:
                        movies.append(movie)
                elif item.get("media_type") == "tv":
                    tv_show = await self.get_tv_show_details(item["id"])
                    if tv_show:
                        tv_shows.append(tv_show)
            except Exception as e:
                logger.error(f"Error processing trending item: {str(e)}")

        return {"movies": movies, "tv_shows": tv_shows}

    async def get_movies_by_genre(self, genre_id: int, page: int = 1) -> List[Movie]:
        """Get movies by genre"""
        data = await self._make_request("/discover/movie", {
            "with_genres": genre_id,
            "page": page,
            "sort_by": "popularity.desc"
        })
        
        if not data or "results" not in data:
            return []

        movies = []
        for movie_data in data["results"]:
            try:
                movie = await self.get_movie_details(movie_data["id"])
                if movie:
                    movies.append(movie)
            except Exception as e:
                logger.error(f"Error processing genre movie: {str(e)}")

        return movies

# Create global TMDB service instance
tmdb_service = TMDBService()