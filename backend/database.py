from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from typing import Optional
import os
from dotenv import load_dotenv

load_dotenv()

class Database:
    client: Optional[AsyncIOMotorClient] = None
    database: Optional[AsyncIOMotorDatabase] = None

    async def connect_to_mongo(self):
        """Create database connection"""
        mongo_url = os.getenv("MONGO_URL")
        db_name = os.getenv("DB_NAME")
        
        self.client = AsyncIOMotorClient(mongo_url)
        self.database = self.client[db_name]
        
        # Create indexes for better performance
        await self.create_indexes()

    async def close_mongo_connection(self):
        """Close database connection"""
        if self.client:
            self.client.close()

    async def create_indexes(self):
        """Create database indexes for better performance"""
        if self.database:
            # Users collection indexes
            await self.database.users.create_index("email", unique=True)
            await self.database.users.create_index("id", unique=True)
            
            # Movies collection indexes
            await self.database.movies.create_index("tmdb_id", unique=True)
            await self.database.movies.create_index("id", unique=True)
            await self.database.movies.create_index("title")
            await self.database.movies.create_index("genres.name")
            await self.database.movies.create_index("vote_average")
            await self.database.movies.create_index("popularity")
            
            # TV Shows collection indexes
            await self.database.tv_shows.create_index("tmdb_id", unique=True)
            await self.database.tv_shows.create_index("id", unique=True)
            await self.database.tv_shows.create_index("name")
            await self.database.tv_shows.create_index("genres.name")
            await self.database.tv_shows.create_index("vote_average")
            await self.database.tv_shows.create_index("popularity")
            
            # Watchlist collection indexes
            await self.database.watchlist.create_index([("profile_id", 1), ("content_id", 1)], unique=True)
            await self.database.watchlist.create_index("profile_id")
            
            # Viewing history collection indexes
            await self.database.viewing_history.create_index("profile_id")
            await self.database.viewing_history.create_index("content_id")
            await self.database.viewing_history.create_index("watched_at")
            
            # Categories collection indexes
            await self.database.categories.create_index("name", unique=True)
            await self.database.categories.create_index("order")

# Create global database instance
db = Database()