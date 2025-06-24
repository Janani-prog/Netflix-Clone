import React, { useState, useEffect, useRef } from 'react';
import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  Bell, 
  User, 
  Play, 
  Info, 
  Plus, 
  ChevronDown, 
  X,
  ChevronLeft,
  ChevronRight,
  Home,
  Film,
  Tv,
  List,
  Star,
  Volume2,
  VolumeX
} from 'lucide-react';
import './App.css';
import './components.css';

const NetflixApp = () => {
  const [currentUser, setCurrentUser] = useState(null);
  const [showProfileSelector, setShowProfileSelector] = useState(true);
  const [selectedMovie, setSelectedMovie] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [myList, setMyList] = useState([]);
  const [showTrailer, setShowTrailer] = useState(false);
  const [currentTrailer, setCurrentTrailer] = useState('');
  const [hoveredMovie, setHoveredMovie] = useState(null);
  const [activeTab, setActiveTab] = useState('home');
  const [muted, setMuted] = useState(true);

  // Mock data for Netflix clone
  const profiles = [
    { id: 1, name: 'You', avatar: 'https://i.pravatar.cc/150?img=1', isKid: false },
    { id: 2, name: 'Family', avatar: 'https://i.pravatar.cc/150?img=2', isKid: false },
    { id: 3, name: 'Kids', avatar: 'https://i.pravatar.cc/150?img=3', isKid: true },
  ];

  const movieCategories = {
    trending: {
      title: 'Trending Now',
      movies: [
        {
          id: 1,
          title: 'The Crown',
          poster: 'https://images.unsplash.com/photo-1590179068383-b9c69aacebd3?w=300&h=450&fit=crop',
          backdrop: 'https://images.unsplash.com/photo-1590179068383-b9c69aacebd3?w=1920&h=1080&fit=crop',
          description: 'Drama series following the political rivalries and romance of Queen Elizabeth II\'s reign.',
          rating: 8.7,
          year: 2023,
          maturity: 'TV-MA',
          duration: '6 Seasons',
          trailer: 'dQw4w9WgXcQ',
          genres: ['Drama', 'Historical', 'Biography']
        },
        {
          id: 2,
          title: 'Stranger Things',
          poster: 'https://images.unsplash.com/photo-1577387195075-2ebe489a1198?w=300&h=450&fit=crop',
          backdrop: 'https://images.unsplash.com/photo-1577387195075-2ebe489a1198?w=1920&h=1080&fit=crop',
          description: 'When a young boy vanishes, a small town uncovers a mystery involving secret experiments.',
          rating: 8.9,
          year: 2024,
          maturity: 'TV-14',
          duration: '4 Seasons',
          trailer: 'dQw4w9WgXcQ',
          genres: ['Sci-Fi', 'Drama', 'Horror']
        },
        {
          id: 3,
          title: 'Money Heist',
          poster: 'https://images.unsplash.com/photo-1715305278832-4e4a15d1a083?w=300&h=450&fit=crop',
          backdrop: 'https://images.unsplash.com/photo-1715305278832-4e4a15d1a083?w=1920&h=1080&fit=crop',
          description: 'A mysterious man known as the Professor recruits eight uniquely skilled robbers.',
          rating: 8.5,
          year: 2023,
          maturity: 'TV-MA',
          duration: '5 Seasons',
          trailer: 'dQw4w9WgXcQ',
          genres: ['Crime', 'Drama', 'Thriller']
        },
        {
          id: 4,
          title: 'The Witcher',
          poster: 'https://images.pexels.com/photos/8272156/pexels-photo-8272156.jpeg?w=300&h=450&fit=crop',
          backdrop: 'https://images.pexels.com/photos/8272156/pexels-photo-8272156.jpeg?w=1920&h=1080&fit=crop',
          description: 'Geralt of Rivia, a solitary monster hunter, struggles to find his place in a world.',
          rating: 8.2,
          year: 2024,
          maturity: 'TV-MA',
          duration: '3 Seasons',
          trailer: 'dQw4w9WgXcQ',
          genres: ['Fantasy', 'Adventure', 'Drama']
        },
        {
          id: 5,
          title: 'Dark',
          poster: 'https://images.pexels.com/photos/7149329/pexels-photo-7149329.jpeg?w=300&h=450&fit=crop',
          backdrop: 'https://images.pexels.com/photos/7149329/pexels-photo-7149329.jpeg?w=1920&h=1080&fit=crop',
          description: 'A family saga with a supernatural twist, set in a German town.',
          rating: 8.8,
          year: 2023,
          maturity: 'TV-MA',
          duration: '3 Seasons',
          trailer: 'dQw4w9WgXcQ',
          genres: ['Sci-Fi', 'Drama', 'Mystery']
        }
      ]
    },
    action: {
      title: 'Action Movies',
      movies: [
        {
          id: 6,
          title: 'Extraction',
          poster: 'https://images.pexels.com/photos/5845904/pexels-photo-5845904.jpeg?w=300&h=450&fit=crop',
          backdrop: 'https://images.pexels.com/photos/5845904/pexels-photo-5845904.jpeg?w=1920&h=1080&fit=crop',
          description: 'A black-market mercenary who has nothing to lose is hired to rescue the kidnapped son.',
          rating: 7.8,
          year: 2024,
          maturity: 'R',
          duration: '1h 56m',
          trailer: 'dQw4w9WgXcQ',
          genres: ['Action', 'Thriller', 'Adventure']
        },
        {
          id: 7,
          title: 'The Old Guard',
          poster: 'https://images.unsplash.com/photo-1623841305968-f85336594764?w=300&h=450&fit=crop',
          backdrop: 'https://images.unsplash.com/photo-1623841305968-f85336594764?w=1920&h=1080&fit=crop',
          description: 'A covert team of immortal mercenaries is suddenly exposed.',
          rating: 7.6,
          year: 2024,
          maturity: 'R',
          duration: '2h 5m',
          trailer: 'dQw4w9WgXcQ',
          genres: ['Action', 'Fantasy', 'Adventure']
        },
        {
          id: 8,
          title: 'Red Notice',
          poster: 'https://images.pexels.com/photos/8272144/pexels-photo-8272144.jpeg?w=300&h=450&fit=crop',
          backdrop: 'https://images.pexels.com/photos/8272144/pexels-photo-8272144.jpeg?w=1920&h=1080&fit=crop',
          description: 'An FBI profiler pursuing the world\'s most wanted art thief becomes his reluctant partner.',
          rating: 7.4,
          year: 2024,
          maturity: 'PG-13',
          duration: '1h 58m',
          trailer: 'dQw4w9WgXcQ',
          genres: ['Action', 'Comedy', 'Crime']
        },
        {
          id: 9,
          title: 'Army of the Dead',
          poster: 'https://images.pexels.com/photos/7605490/pexels-photo-7605490.jpeg?w=300&h=450&fit=crop',
          backdrop: 'https://images.pexels.com/photos/7605490/pexels-photo-7605490.jpeg?w=1920&h=1080&fit=crop',
          description: 'A zombie outbreak has left Las Vegas in ruins and a group of mercenaries take the ultimate gamble.',
          rating: 7.2,
          year: 2024,
          maturity: 'R',
          duration: '2h 28m',
          trailer: 'dQw4w9WgXcQ',
          genres: ['Action', 'Horror', 'Thriller']
        },
        {
          id: 10,
          title: 'Thunder Force',
          poster: 'https://images.unsplash.com/photo-1613386932982-58fcdbaa5a4d?w=300&h=450&fit=crop',
          backdrop: 'https://images.unsplash.com/photo-1613386932982-58fcdbaa5a4d?w=1920&h=1080&fit=crop',
          description: 'Two childhood friends team up to become the world\'s first superheroes.',
          rating: 6.8,
          year: 2024,
          maturity: 'PG-13',
          duration: '1h 46m',
          trailer: 'dQw4w9WgXcQ',
          genres: ['Action', 'Comedy', 'Adventure']
        }
      ]
    },
    comedy: {
      title: 'Comedy Movies',
      movies: [
        {
          id: 11,
          title: 'The Kissing Booth',
          poster: 'https://images.pexels.com/photos/3379941/pexels-photo-3379941.jpeg?w=300&h=450&fit=crop',
          backdrop: 'https://images.pexels.com/photos/3379941/pexels-photo-3379941.jpeg?w=1920&h=1080&fit=crop',
          description: 'A high school student finds herself at the center of a love triangle.',
          rating: 7.1,
          year: 2024,
          maturity: 'TV-14',
          duration: '1h 45m',
          trailer: 'dQw4w9WgXcQ',
          genres: ['Comedy', 'Romance', 'Teen']
        },
        {
          id: 12,
          title: 'Murder Mystery',
          poster: 'https://images.pexels.com/photos/1983035/pexels-photo-1983035.jpeg?w=300&h=450&fit=crop',
          backdrop: 'https://images.pexels.com/photos/1983035/pexels-photo-1983035.jpeg?w=1920&h=1080&fit=crop',
          description: 'A New York cop and his wife go on a European vacation to reinvigorate their marriage.',
          rating: 7.3,
          year: 2024,
          maturity: 'PG-13',
          duration: '1h 37m',
          trailer: 'dQw4w9WgXcQ',
          genres: ['Comedy', 'Mystery', 'Adventure']
        },
        {
          id: 13,
          title: 'The Wrong Missy',
          poster: 'https://images.pexels.com/photos/7618392/pexels-photo-7618392.jpeg?w=300&h=450&fit=crop',
          backdrop: 'https://images.pexels.com/photos/7618392/pexels-photo-7618392.jpeg?w=1920&h=1080&fit=crop',
          description: 'A guy meets the woman of his dreams and invites her to his company retreat.',
          rating: 6.9,
          year: 2024,
          maturity: 'R',
          duration: '1h 30m',
          trailer: 'dQw4w9WgXcQ',
          genres: ['Comedy', 'Romance']
        },
        {
          id: 14,
          title: 'Hubie Halloween',
          poster: 'https://images.unsplash.com/photo-1609095515245-f6b9d9c32d95?w=300&h=450&fit=crop',
          backdrop: 'https://images.unsplash.com/photo-1609095515245-f6b9d9c32d95?w=1920&h=1080&fit=crop',
          description: 'Despite his devotion to his hometown of Salem, Hubie Dubois is a figure of mockery.',
          rating: 7.0,
          year: 2024,
          maturity: 'PG-13',
          duration: '1h 43m',
          trailer: 'dQw4w9WgXcQ',
          genres: ['Comedy', 'Horror', 'Mystery']
        }
      ]
    }
  };

  const featuredMovie = movieCategories.trending.movies[0];

  const handleProfileSelect = (profile) => {
    setCurrentUser(profile);
    setShowProfileSelector(false);
  };

  const handleMovieClick = (movie) => {
    setSelectedMovie(movie);
  };

  const playTrailer = (movie) => {
    setCurrentTrailer(movie.trailer);
    setShowTrailer(true);
  };

  const addToMyList = (movie) => {
    if (!myList.find(m => m.id === movie.id)) {
      setMyList([...myList, movie]);
    }
  };

  const removeFromMyList = (movieId) => {
    setMyList(myList.filter(m => m.id !== movieId));
  };

  const isInMyList = (movieId) => {
    return myList.some(m => m.id === movieId);
  };

  const filteredMovies = searchQuery 
    ? Object.values(movieCategories).flatMap(category => 
        category.movies.filter(movie => 
          movie.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          movie.genres.some(genre => genre.toLowerCase().includes(searchQuery.toLowerCase()))
        )
      )
    : [];

  if (showProfileSelector) {
    return (
      <div className="min-h-screen bg-netflix-black flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-6xl font-bold text-white mb-12">Who's watching?</h1>
          <div className="flex justify-center space-x-8">
            {profiles.map((profile) => (
              <motion.div
                key={profile.id}
                className="text-center cursor-pointer group"
                whileHover={{ scale: 1.1 }}
                onClick={() => handleProfileSelect(profile)}
              >
                <div className="w-32 h-32 rounded-lg overflow-hidden mb-4 group-hover:ring-4 group-hover:ring-white transition-all">
                  <img
                    src={profile.avatar}
                    alt={profile.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <p className="text-white text-xl font-medium group-hover:text-gray-300">
                  {profile.name}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-netflix-black text-white">
      {/* Navigation Header */}
      <header className="fixed top-0 w-full z-50 bg-gradient-to-b from-black to-transparent">
        <nav className="flex items-center justify-between px-12 py-6">
          <div className="flex items-center space-x-8">
            <div className="text-netflix-red text-3xl font-bold">NETFLIX</div>
            <div className="hidden md:flex space-x-6">
              <button 
                className={`hover:text-gray-300 transition-colors ${activeTab === 'home' ? 'text-white' : 'text-gray-400'}`}
                onClick={() => setActiveTab('home')}
              >
                <Home className="w-5 h-5 inline mr-2" />
                Home
              </button>
              <button 
                className={`hover:text-gray-300 transition-colors ${activeTab === 'movies' ? 'text-white' : 'text-gray-400'}`}
                onClick={() => setActiveTab('movies')}
              >
                <Film className="w-5 h-5 inline mr-2" />
                Movies
              </button>
              <button 
                className={`hover:text-gray-300 transition-colors ${activeTab === 'shows' ? 'text-white' : 'text-gray-400'}`}
                onClick={() => setActiveTab('shows')}
              >
                <Tv className="w-5 h-5 inline mr-2" />
                TV Shows
              </button>
              <button 
                className={`hover:text-gray-300 transition-colors ${activeTab === 'mylist' ? 'text-white' : 'text-gray-400'}`}
                onClick={() => setActiveTab('mylist')}
              >
                <List className="w-5 h-5 inline mr-2" />
                My List
              </button>
            </div>
          </div>
          <div className="flex items-center space-x-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search..."
                className="bg-black bg-opacity-70 border border-gray-600 rounded-md pl-10 pr-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-white"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Bell className="w-6 h-6 cursor-pointer hover:text-gray-300" />
            <div className="flex items-center space-x-2 cursor-pointer group">
              <img
                src={currentUser?.avatar}
                alt={currentUser?.name}
                className="w-8 h-8 rounded"
              />
              <ChevronDown className="w-4 h-4 group-hover:rotate-180 transition-transform" />
            </div>
          </div>
        </nav>
      </header>

      {/* Search Results */}
      {searchQuery && (
        <div className="pt-32 px-12">
          <h2 className="text-2xl font-bold mb-6">Search Results for "{searchQuery}"</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {filteredMovies.map((movie) => (
              <motion.div
                key={movie.id}
                className="cursor-pointer group"
                whileHover={{ scale: 1.05 }}
                onClick={() => handleMovieClick(movie)}
              >
                <img
                  src={movie.poster}
                  alt={movie.title}
                  className="w-full rounded-md group-hover:opacity-80 transition-opacity"
                />
                <p className="mt-2 text-sm font-medium">{movie.title}</p>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Hero Section */}
      {!searchQuery && activeTab === 'home' && (
        <div className="relative h-screen">
          <div className="absolute inset-0">
            <img
              src={featuredMovie.backdrop}
              alt={featuredMovie.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black via-black/50 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
          </div>
          <div className="relative z-10 flex items-center h-full px-12">
            <div className="max-w-2xl">
              <motion.h1 
                className="text-6xl font-bold mb-4"
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1 }}
              >
                {featuredMovie.title}
              </motion.h1>
              <motion.p 
                className="text-xl mb-8 text-gray-200 leading-relaxed"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1, delay: 0.3 }}
              >
                {featuredMovie.description}
              </motion.p>
              <motion.div 
                className="flex space-x-4"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1, delay: 0.6 }}
              >
                <button 
                  className="bg-white text-black px-8 py-3 rounded-md font-bold text-lg hover:bg-gray-300 transition-colors flex items-center"
                  onClick={() => playTrailer(featuredMovie)}
                >
                  <Play className="w-6 h-6 mr-2 fill-current" />
                  Play
                </button>
                <button 
                  className="bg-gray-500 bg-opacity-70 text-white px-8 py-3 rounded-md font-bold text-lg hover:bg-opacity-50 transition-colors flex items-center"
                  onClick={() => handleMovieClick(featuredMovie)}
                >
                  <Info className="w-6 h-6 mr-2" />
                  More Info
                </button>
              </motion.div>
            </div>
          </div>
        </div>
      )}

      {/* My List */}
      {activeTab === 'mylist' && (
        <div className="pt-32 px-12">
          <h2 className="text-4xl font-bold mb-8">My List</h2>
          {myList.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-xl text-gray-400">Your list is empty</p>
              <p className="text-gray-500 mt-2">Add movies and shows to watch them later</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {myList.map((movie) => (
                <motion.div
                  key={movie.id}
                  className="cursor-pointer group relative"
                  whileHover={{ scale: 1.05 }}
                >
                  <img
                    src={movie.poster}
                    alt={movie.title}
                    className="w-full rounded-md group-hover:opacity-80 transition-opacity"
                    onClick={() => handleMovieClick(movie)}
                  />
                  <button
                    className="absolute top-2 right-2 bg-black bg-opacity-70 rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => removeFromMyList(movie.id)}
                  >
                    <X className="w-4 h-4 text-white" />
                  </button>
                  <p className="mt-2 text-sm font-medium">{movie.title}</p>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Content Rows */}
      {!searchQuery && activeTab === 'home' && (
        <div className="pb-20">
          {Object.entries(movieCategories).map(([key, category]) => (
            <MovieRow
              key={key}
              title={category.title}
              movies={category.movies}
              onMovieClick={handleMovieClick}
              onMovieHover={setHoveredMovie}
              onAddToList={addToMyList}
              onPlayTrailer={playTrailer}
              myList={myList}
            />
          ))}
        </div>
      )}

      {/* Movie Detail Modal */}
      <AnimatePresence>
        {selectedMovie && (
          <motion.div
            className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedMovie(null)}
          >
            <motion.div
              className="bg-netflix-gray rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="relative">
                <img
                  src={selectedMovie.backdrop}
                  alt={selectedMovie.title}
                  className="w-full h-96 object-cover rounded-t-lg"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-netflix-gray to-transparent rounded-t-lg" />
                <button
                  className="absolute top-4 right-4 bg-black bg-opacity-70 rounded-full p-2"
                  onClick={() => setSelectedMovie(null)}
                >
                  <X className="w-6 h-6 text-white" />
                </button>
                <div className="absolute bottom-8 left-8 right-8">
                  <h2 className="text-4xl font-bold mb-4">{selectedMovie.title}</h2>
                  <div className="flex space-x-4 mb-4">
                    <button 
                      className="bg-white text-black px-6 py-2 rounded-md font-bold hover:bg-gray-300 transition-colors flex items-center"
                      onClick={() => playTrailer(selectedMovie)}
                    >
                      <Play className="w-5 h-5 mr-2 fill-current" />
                      Play
                    </button>
                    <button
                      className={`bg-gray-600 text-white px-6 py-2 rounded-md font-bold hover:bg-gray-500 transition-colors flex items-center ${
                        isInMyList(selectedMovie.id) ? 'bg-green-600 hover:bg-green-500' : ''
                      }`}
                      onClick={() => isInMyList(selectedMovie.id) ? removeFromMyList(selectedMovie.id) : addToMyList(selectedMovie)}
                    >
                      <Plus className="w-5 h-5 mr-2" />
                      {isInMyList(selectedMovie.id) ? 'In My List' : 'Add to List'}
                    </button>
                  </div>
                </div>
              </div>
              <div className="p-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  <div className="md:col-span-2">
                    <div className="flex items-center space-x-4 mb-4">
                      <span className="text-green-400 font-bold">{Math.round(selectedMovie.rating * 10)}% Match</span>
                      <span className="border border-gray-500 px-2 py-1 text-sm">{selectedMovie.maturity}</span>
                      <span className="text-gray-400">{selectedMovie.year}</span>
                      <span className="text-gray-400">{selectedMovie.duration}</span>
                    </div>
                    <p className="text-lg leading-relaxed mb-6">{selectedMovie.description}</p>
                  </div>
                  <div>
                    <div className="space-y-2">
                      <p><span className="text-gray-400">Genres:</span> {selectedMovie.genres.join(', ')}</p>
                      <div className="flex items-center">
                        <Star className="w-4 h-4 text-yellow-400 mr-1 fill-current" />
                        <span>{selectedMovie.rating}/10</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Trailer Modal */}
      <AnimatePresence>
        {showTrailer && (
          <motion.div
            className="fixed inset-0 bg-black z-50 flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="relative w-full h-full max-w-6xl max-h-[80vh]">
              <button
                className="absolute top-4 right-4 z-10 bg-black bg-opacity-70 rounded-full p-2"
                onClick={() => setShowTrailer(false)}
              >
                <X className="w-6 h-6 text-white" />
              </button>
              <button
                className="absolute top-4 left-4 z-10 bg-black bg-opacity-70 rounded-full p-2"
                onClick={() => setMuted(!muted)}
              >
                {muted ? <VolumeX className="w-6 h-6 text-white" /> : <Volume2 className="w-6 h-6 text-white" />}
              </button>
              <iframe
                src={`https://www.youtube.com/embed/${currentTrailer}?autoplay=1&mute=${muted ? 1 : 0}`}
                className="w-full h-full rounded-lg"
                allowFullScreen
                title="Movie Trailer"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// Movie Row Component
const MovieRow = ({ title, movies, onMovieClick, onMovieHover, onAddToList, onPlayTrailer, myList }) => {
  const scrollRef = useRef(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);

  const scroll = (direction) => {
    const container = scrollRef.current;
    const scrollAmount = container.clientWidth * 0.8;
    
    if (direction === 'left') {
      container.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
    } else {
      container.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  const handleScroll = () => {
    const container = scrollRef.current;
    setShowLeftArrow(container.scrollLeft > 0);
    setShowRightArrow(
      container.scrollLeft < container.scrollWidth - container.clientWidth - 10
    );
  };

  const isInMyList = (movieId) => {
    return myList.some(m => m.id === movieId);
  };

  return (
    <div className="px-12 mb-10 group">
      <h2 className="text-2xl font-bold mb-4">{title}</h2>
      <div className="relative">
        <AnimatePresence>
          {showLeftArrow && (
            <motion.button
              className="absolute left-0 top-1/2 transform -translate-y-1/2 z-10 bg-black bg-opacity-70 p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={() => scroll('left')}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <ChevronLeft className="w-6 h-6 text-white" />
            </motion.button>
          )}
        </AnimatePresence>
        
        <div
          ref={scrollRef}
          className="flex space-x-4 overflow-x-auto scrollbar-hide scroll-smooth"
          onScroll={handleScroll}
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {movies.map((movie) => (
            <motion.div
              key={movie.id}
              className="flex-shrink-0 w-64 cursor-pointer group/item relative"
              whileHover={{ scale: 1.05 }}
              onHoverStart={() => onMovieHover(movie)}
              onHoverEnd={() => onMovieHover(null)}
            >
              <div className="relative overflow-hidden rounded-md">
                <img
                  src={movie.poster}
                  alt={movie.title}
                  className="w-full h-36 object-cover transition-all duration-300 group-hover/item:opacity-80"
                  onClick={() => onMovieClick(movie)}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-0 group-hover/item:opacity-100 transition-opacity" />
                <div className="absolute bottom-2 left-2 right-2 opacity-0 group-hover/item:opacity-100 transition-opacity">
                  <h3 className="text-white font-bold text-sm truncate">{movie.title}</h3>
                  <div className="flex items-center justify-between mt-1">
                    <div className="flex items-center space-x-1">
                      <Star className="w-3 h-3 text-yellow-400 fill-current" />
                      <span className="text-xs text-white">{movie.rating}</span>
                    </div>
                    <div className="flex space-x-1">
                      <button
                        className="bg-white bg-opacity-20 hover:bg-opacity-40 rounded-full p-1 transition-colors"
                        onClick={(e) => {
                          e.stopPropagation();
                          onPlayTrailer(movie);
                        }}
                      >
                        <Play className="w-3 h-3 text-white fill-current" />
                      </button>
                      <button
                        className={`bg-white bg-opacity-20 hover:bg-opacity-40 rounded-full p-1 transition-colors ${
                          isInMyList(movie.id) ? 'bg-green-500 bg-opacity-80' : ''
                        }`}
                        onClick={(e) => {
                          e.stopPropagation();
                          onAddToList(movie);
                        }}
                      >
                        <Plus className="w-3 h-3 text-white" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <AnimatePresence>
          {showRightArrow && (
            <motion.button
              className="absolute right-0 top-1/2 transform -translate-y-1/2 z-10 bg-black bg-opacity-70 p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={() => scroll('right')}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <ChevronRight className="w-6 h-6 text-white" />
            </motion.button>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<NetflixApp />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;