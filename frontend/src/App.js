import React, { useState, useEffect, useRef, createContext, useContext } from 'react';
import { BrowserRouter, Routes, Route, useNavigate, Navigate } from 'react-router-dom';
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
  VolumeX,
  Eye,
  EyeOff,
  LogOut
} from 'lucide-react';
import axios from 'axios';
import './App.css';
import './components.css';

const API_BASE = process.env.REACT_APP_BACKEND_URL + '/api';

// Auth Context
const AuthContext = createContext();

const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem('netflix_token'));

  useEffect(() => {
    if (token) {
      fetchUser();
    } else {
      setLoading(false);
    }
  }, [token]);

  const fetchUser = async () => {
    try {
      const response = await axios.get(`${API_BASE}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUser(response.data);
    } catch (error) {
      console.error('Error fetching user:', error);
      logout();
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      const response = await axios.post(`${API_BASE}/auth/login`, {
        email,
        password
      });
      
      const { access_token } = response.data;
      setToken(access_token);
      localStorage.setItem('netflix_token', access_token);
      
      // Fetch user data
      const userResponse = await axios.get(`${API_BASE}/auth/me`, {
        headers: { Authorization: `Bearer ${access_token}` }
      });
      setUser(userResponse.data);
      
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.detail || 'Login failed' 
      };
    }
  };

  const register = async (userData) => {
    try {
      await axios.post(`${API_BASE}/auth/register`, userData);
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.detail || 'Registration failed' 
      };
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('netflix_token');
  };

  const createProfile = async (profileData) => {
    try {
      const response = await axios.post(`${API_BASE}/profiles`, profileData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Refresh user data
      await fetchUser();
      return { success: true, profile: response.data };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.detail || 'Profile creation failed' 
      };
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      login,
      register,
      logout,
      createProfile,
      token,
      isAuthenticated: !!user
    }}>
      {children}
    </AuthContext.Provider>
  );
};

// Login/Register Component
const AuthScreen = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    first_name: '',
    last_name: '',
    subscription_plan: 'basic'
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { login, register, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (isLogin) {
        const result = await login(formData.email, formData.password);
        if (!result.success) {
          setError(result.error);
        }
        // Navigation will be handled by useEffect when isAuthenticated changes
      } else {
        const result = await register(formData);
        if (result.success) {
          setIsLogin(true);
          setError('');
          setFormData({ ...formData, password: '' });
        } else {
          setError(result.error);
        }
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className="min-h-screen bg-netflix-black flex items-center justify-center">
      <div className="bg-black bg-opacity-80 p-16 rounded-lg w-full max-w-md">
        <h1 className="text-white text-3xl font-bold mb-8">
          {isLogin ? 'Sign In' : 'Sign Up'}
        </h1>
        
        {error && (
          <div className="bg-netflix-red text-white p-3 rounded mb-4 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <>
              <input
                type="text"
                name="first_name"
                placeholder="First Name"
                value={formData.first_name}
                onChange={handleInputChange}
                className="w-full p-4 bg-gray-700 text-white rounded focus:outline-none focus:bg-gray-600"
                required={!isLogin}
              />
              <input
                type="text"
                name="last_name"
                placeholder="Last Name"
                value={formData.last_name}
                onChange={handleInputChange}
                className="w-full p-4 bg-gray-700 text-white rounded focus:outline-none focus:bg-gray-600"
                required={!isLogin}
              />
            </>
          )}
          
          <input
            type="email"
            name="email"
            placeholder="Email"
            value={formData.email}
            onChange={handleInputChange}
            className="w-full p-4 bg-gray-700 text-white rounded focus:outline-none focus:bg-gray-600"
            required
          />
          
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              name="password"
              placeholder="Password"
              value={formData.password}
              onChange={handleInputChange}
              className="w-full p-4 bg-gray-700 text-white rounded focus:outline-none focus:bg-gray-600 pr-12"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>

          {!isLogin && (
            <select
              name="subscription_plan"
              value={formData.subscription_plan}
              onChange={handleInputChange}
              className="w-full p-4 bg-gray-700 text-white rounded focus:outline-none focus:bg-gray-600"
            >
              <option value="basic">Basic Plan</option>
              <option value="standard">Standard Plan</option>
              <option value="premium">Premium Plan</option>
            </select>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-netflix-red text-white p-4 rounded font-bold hover:bg-netflix-dark-red transition-colors disabled:opacity-50"
          >
            {loading ? 'Please wait...' : (isLogin ? 'Sign In' : 'Sign Up')}
          </button>
        </form>

        <div className="mt-8 text-gray-400">
          {isLogin ? "New to Netflix? " : "Already have an account? "}
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="text-white hover:underline"
          >
            {isLogin ? 'Sign up now' : 'Sign in'}
          </button>
        </div>
      </div>
    </div>
  );
};

// Profile Creation Component
const ProfileCreation = () => {
  const { user, createProfile } = useAuth();
  const [profileData, setProfileData] = useState({
    name: '',
    is_kid: false,
    language: 'en'
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const avatars = [
    'https://i.pravatar.cc/150?img=1',
    'https://i.pravatar.cc/150?img=2',
    'https://i.pravatar.cc/150?img=3',
    'https://i.pravatar.cc/150?img=4',
    'https://i.pravatar.cc/150?img=5',
    'https://i.pravatar.cc/150?img=6'
  ];

  const [selectedAvatar, setSelectedAvatar] = useState(avatars[0]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const result = await createProfile({
      ...profileData,
      avatar: selectedAvatar
    });

    if (!result.success) {
      setError(result.error);
    }
    setLoading(false);
  };

  const maxProfiles = {
    basic: 1,
    standard: 2,
    premium: 4
  };

  const canCreateProfile = user?.profiles?.length < maxProfiles[user?.subscription_plan];

  if (!canCreateProfile) {
    return (
      <div className="min-h-screen bg-netflix-black flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-white text-4xl font-bold mb-4">Profile Limit Reached</h1>
          <p className="text-gray-400 text-lg">
            You've reached the maximum number of profiles for your {user.subscription_plan} plan.
          </p>
          <p className="text-gray-400 mt-2">
            Upgrade your plan to create more profiles.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-netflix-black flex items-center justify-center">
      <div className="text-center max-w-md">
        <h1 className="text-white text-4xl font-bold mb-8">Add Profile</h1>
        
        {error && (
          <div className="bg-netflix-red text-white p-3 rounded mb-4 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Avatar Selection */}
          <div>
            <h3 className="text-white text-xl mb-4">Choose Avatar</h3>
            <div className="grid grid-cols-3 gap-4">
              {avatars.map((avatar, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => setSelectedAvatar(avatar)}
                  className={`w-20 h-20 rounded-lg overflow-hidden border-4 transition-all ${
                    selectedAvatar === avatar ? 'border-white' : 'border-transparent'
                  }`}
                >
                  <img src={avatar} alt={`Avatar ${index + 1}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </div>

          <input
            type="text"
            placeholder="Profile Name"
            value={profileData.name}
            onChange={(e) => setProfileData({...profileData, name: e.target.value})}
            className="w-full p-4 bg-gray-700 text-white rounded focus:outline-none focus:bg-gray-600"
            required
          />

          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              id="is_kid"
              checked={profileData.is_kid}
              onChange={(e) => setProfileData({...profileData, is_kid: e.target.checked})}
              className="w-5 h-5"
            />
            <label htmlFor="is_kid" className="text-white">Kid's Profile</label>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-netflix-red text-white p-4 rounded font-bold hover:bg-netflix-dark-red transition-colors disabled:opacity-50"
          >
            {loading ? 'Creating...' : 'Create Profile'}
          </button>
        </form>
      </div>
    </div>
  );
};

// Main Netflix App Component
const NetflixApp = () => {
  const { user, logout } = useAuth();
  const [currentProfile, setCurrentProfile] = useState(null);
  const [showProfileSelector, setShowProfileSelector] = useState(true);
  const [showProfileCreation, setShowProfileCreation] = useState(false);
  const [selectedMovie, setSelectedMovie] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [myList, setMyList] = useState([]);
  const [showTrailer, setShowTrailer] = useState(false);
  const [currentTrailer, setCurrentTrailer] = useState('');
  const [activeTab, setActiveTab] = useState('home');
  const [muted, setMuted] = useState(true);
  const [content, setContent] = useState({
    trending: [],
    movies: [],
    tvShows: [],
    searchResults: []
  });
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  // API calls
  const apiCall = async (url, options = {}) => {
    const token = localStorage.getItem('netflix_token');
    return axios({
      ...options,
      url: `${API_BASE}${url}`,
      headers: {
        ...options.headers,
        Authorization: `Bearer ${token}`
      }
    });
  };

  const fetchContent = async () => {
    if (!currentProfile) return;
    
    setLoading(true);
    try {
      const [trendingRes, moviesRes, tvRes] = await Promise.all([
        apiCall('/content/trending'),
        apiCall('/movies/popular'),
        apiCall('/tv/popular')
      ]);

      setContent({
        trending: trendingRes.data || [],
        movies: moviesRes.data || [],
        tvShows: tvRes.data || [],
        searchResults: []
      });

      // Fetch watchlist
      const watchlistRes = await apiCall(`/watchlist/${currentProfile.id}`);
      setMyList(watchlistRes.data || []);
    } catch (error) {
      console.error('Error fetching content:', error);
    } finally {
      setLoading(false);
    }
  };

  const searchContent = async (query) => {
    if (!query.trim()) {
      setContent(prev => ({ ...prev, searchResults: [] }));
      return;
    }

    try {
      const response = await apiCall(`/content/search?q=${encodeURIComponent(query)}`);
      const results = [...(response.data.movies || []), ...(response.data.tv_shows || [])];
      setContent(prev => ({ ...prev, searchResults: results }));
    } catch (error) {
      console.error('Error searching content:', error);
    }
  };

  const addToMyList = async (movie) => {
    if (!currentProfile) return;

    try {
      await apiCall(`/watchlist/${currentProfile.id}`, {
        method: 'POST',
        data: {
          content_id: movie.id,
          content_type: movie.content_type
        }
      });

      setMyList(prev => [...prev, movie]);
    } catch (error) {
      console.error('Error adding to watchlist:', error);
    }
  };

  const removeFromMyList = async (movieId) => {
    if (!currentProfile) return;

    try {
      await apiCall(`/watchlist/${currentProfile.id}/${movieId}`, {
        method: 'DELETE'
      });

      setMyList(prev => prev.filter(m => m.id !== movieId));
    } catch (error) {
      console.error('Error removing from watchlist:', error);
    }
  };

  const isInMyList = (movieId) => {
    return myList.some(m => m.id === movieId);
  };

  const handleProfileSelect = (profile) => {
    setCurrentProfile(profile);
    setShowProfileSelector(false);
    setShowProfileCreation(false);
  };

  const handleMovieClick = (movie) => {
    setSelectedMovie(movie);
  };

  const playTrailer = (movie) => {
    const trailer = movie.videos?.find(v => v.type === 'Trailer' && v.site === 'YouTube');
    if (trailer) {
      setCurrentTrailer(trailer.key);
      setShowTrailer(true);
    }
  };

  useEffect(() => {
    if (currentProfile) {
      fetchContent();
    }
  }, [currentProfile]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      searchContent(searchQuery);
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  // Show profile creation if user has no profiles
  if (user && user.profiles.length === 0 && !showProfileCreation) {
    return <ProfileCreation />;
  }

  if (showProfileCreation) {
    return <ProfileCreation />;
  }

  if (showProfileSelector) {
    return (
      <div className="min-h-screen bg-netflix-black flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-6xl font-bold text-white mb-12">Who's watching?</h1>
          <div className="flex justify-center space-x-8 flex-wrap">
            {user?.profiles?.map((profile) => (
              <motion.div
                key={profile.id}
                className="text-center cursor-pointer group"
                whileHover={{ scale: 1.1 }}
                onClick={() => handleProfileSelect(profile)}
              >
                <div className="w-32 h-32 rounded-lg overflow-hidden mb-4 group-hover:ring-4 group-hover:ring-white transition-all">
                  <img
                    src={profile.avatar || 'https://i.pravatar.cc/150?img=1'}
                    alt={profile.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <p className="text-white text-xl font-medium group-hover:text-gray-300">
                  {profile.name}
                </p>
              </motion.div>
            ))}
            
            {/* Add Profile Button */}
            <motion.div
              className="text-center cursor-pointer group"
              whileHover={{ scale: 1.1 }}
              onClick={() => setShowProfileCreation(true)}
            >
              <div className="w-32 h-32 rounded-lg bg-gray-700 flex items-center justify-center mb-4 group-hover:bg-gray-600 transition-all">
                <Plus className="w-12 h-12 text-gray-400" />
              </div>
              <p className="text-gray-400 text-xl font-medium group-hover:text-white">
                Add Profile
              </p>
            </motion.div>
          </div>
          
          <button
            onClick={logout}
            className="mt-8 text-gray-400 hover:text-white flex items-center justify-center mx-auto"
          >
            <LogOut className="w-5 h-5 mr-2" />
            Sign Out
          </button>
        </div>
      </div>
    );
  }

  const featuredContent = content.trending[0] || content.movies[0] || content.tvShows[0];

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
            <div className="flex items-center space-x-2 cursor-pointer group relative">
              <img
                src={currentProfile?.avatar || 'https://i.pravatar.cc/150?img=1'}
                alt={currentProfile?.name}
                className="w-8 h-8 rounded"
              />
              <ChevronDown className="w-4 h-4 group-hover:rotate-180 transition-transform" />
              
              {/* Profile Dropdown */}
              <div className="absolute top-full right-0 mt-2 bg-black bg-opacity-90 rounded-md py-2 px-4 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                <button
                  onClick={() => setShowProfileSelector(true)}
                  className="block text-white hover:text-gray-300 mb-2"
                >
                  Switch Profile
                </button>
                <button
                  onClick={logout}
                  className="block text-white hover:text-gray-300 flex items-center"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        </nav>
      </header>

      {loading && (
        <div className="pt-32 flex justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-netflix-red"></div>
        </div>
      )}

      {/* Search Results */}
      {searchQuery && content.searchResults.length > 0 && (
        <div className="pt-32 px-12">
          <h2 className="text-2xl font-bold mb-6">Search Results for "{searchQuery}"</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {content.searchResults.map((movie) => (
              <motion.div
                key={movie.id}
                className="cursor-pointer group"
                whileHover={{ scale: 1.05 }}
                onClick={() => handleMovieClick(movie)}
              >
                <img
                  src={movie.poster_path || 'https://via.placeholder.com/300x450?text=No+Image'}
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
      {!searchQuery && activeTab === 'home' && featuredContent && (
        <div className="relative h-screen">
          <div className="absolute inset-0">
            <img
              src={featuredContent.backdrop_path || featuredContent.poster_path || 'https://via.placeholder.com/1920x1080'}
              alt={featuredContent.title}
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
                {featuredContent.title}
              </motion.h1>
              <motion.p 
                className="text-xl mb-8 text-gray-200 leading-relaxed"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1, delay: 0.3 }}
              >
                {featuredContent.overview}
              </motion.p>
              <motion.div 
                className="flex space-x-4"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1, delay: 0.6 }}
              >
                <button 
                  className="bg-white text-black px-8 py-3 rounded-md font-bold text-lg hover:bg-gray-300 transition-colors flex items-center"
                  onClick={() => playTrailer(featuredContent)}
                >
                  <Play className="w-6 h-6 mr-2 fill-current" />
                  Play
                </button>
                <button 
                  className="bg-gray-500 bg-opacity-70 text-white px-8 py-3 rounded-md font-bold text-lg hover:bg-opacity-50 transition-colors flex items-center"
                  onClick={() => handleMovieClick(featuredContent)}
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
                    src={movie.poster_path || 'https://via.placeholder.com/300x450/1a1a1a/666666?text=No+Image'}
                    alt={movie.title}
                    className="w-full rounded-md group-hover:opacity-80 transition-opacity"
                    onClick={() => handleMovieClick(movie)}
                    onError={(e) => {
                      e.target.src = 'https://via.placeholder.com/300x450/1a1a1a/666666?text=No+Image';
                    }}
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
      {!searchQuery && activeTab === 'home' && !loading && (
        <div className="pb-20">
          {content.trending.length > 0 && (
            <MovieRow
              title="Trending Now"
              movies={content.trending}
              onMovieClick={handleMovieClick}
              onAddToList={addToMyList}
              onPlayTrailer={playTrailer}
              myList={myList}
            />
          )}
          {content.movies.length > 0 && (
            <MovieRow
              title="Popular Movies"
              movies={content.movies}
              onMovieClick={handleMovieClick}
              onAddToList={addToMyList}
              onPlayTrailer={playTrailer}
              myList={myList}
            />
          )}
          {content.tvShows.length > 0 && (
            <MovieRow
              title="Popular TV Shows"
              movies={content.tvShows}
              onMovieClick={handleMovieClick}
              onAddToList={addToMyList}
              onPlayTrailer={playTrailer}
              myList={myList}
            />
          )}
        </div>
      )}

      {/* Movies Tab */}
      {activeTab === 'movies' && (
        <div className="pt-32 px-12">
          <h2 className="text-4xl font-bold mb-8">Movies</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {content.movies.map((movie) => (
              <motion.div
                key={movie.id}
                className="cursor-pointer group"
                whileHover={{ scale: 1.05 }}
                onClick={() => handleMovieClick(movie)}
              >
                <img
                  src={movie.poster_path || 'https://via.placeholder.com/300x450?text=No+Image'}
                  alt={movie.title}
                  className="w-full rounded-md group-hover:opacity-80 transition-opacity"
                />
                <p className="mt-2 text-sm font-medium">{movie.title}</p>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* TV Shows Tab */}
      {activeTab === 'shows' && (
        <div className="pt-32 px-12">
          <h2 className="text-4xl font-bold mb-8">TV Shows</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {content.tvShows.map((show) => (
              <motion.div
                key={show.id}
                className="cursor-pointer group"
                whileHover={{ scale: 1.05 }}
                onClick={() => handleMovieClick(show)}
              >
                <img
                  src={show.poster_path || 'https://via.placeholder.com/300x450?text=No+Image'}
                  alt={show.title}
                  className="w-full rounded-md group-hover:opacity-80 transition-opacity"
                />
                <p className="mt-2 text-sm font-medium">{show.title}</p>
              </motion.div>
            ))}
          </div>
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
                  src={selectedMovie.backdrop_path || selectedMovie.poster_path || 'https://via.placeholder.com/1920x1080'}
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
                      <span className="text-green-400 font-bold">{Math.round(selectedMovie.vote_average * 10)}% Match</span>
                      <span className="border border-gray-500 px-2 py-1 text-sm">{selectedMovie.maturity_rating || 'NR'}</span>
                      <span className="text-gray-400">{selectedMovie.release_date?.split('-')[0] || 'N/A'}</span>
                      <span className="text-gray-400">
                        {selectedMovie.runtime ? `${selectedMovie.runtime}m` : 
                         selectedMovie.number_of_seasons ? `${selectedMovie.number_of_seasons} Season${selectedMovie.number_of_seasons !== 1 ? 's' : ''}` : 'N/A'}
                      </span>
                    </div>
                    <p className="text-lg leading-relaxed mb-6">{selectedMovie.overview}</p>
                  </div>
                  <div>
                    <div className="space-y-2">
                      <p><span className="text-gray-400">Genres:</span> {selectedMovie.genres?.map(g => g.name).join(', ') || 'N/A'}</p>
                      <div className="flex items-center">
                        <Star className="w-4 h-4 text-yellow-400 mr-1 fill-current" />
                        <span>{selectedMovie.vote_average}/10</span>
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
const MovieRow = ({ title, movies, onMovieClick, onAddToList, onPlayTrailer, myList }) => {
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
            >
              <div className="relative overflow-hidden rounded-md">
                <img
                  src={movie.poster_path || 'https://via.placeholder.com/300x450/1a1a1a/666666?text=No+Image'}
                  alt={movie.title}
                  className="w-full h-36 object-cover transition-all duration-300 group-hover/item:opacity-80"
                  onClick={() => onMovieClick(movie)}
                  onError={(e) => {
                    e.target.src = 'https://via.placeholder.com/300x450/1a1a1a/666666?text=No+Image';
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-0 group-hover/item:opacity-100 transition-opacity" />
                <div className="absolute bottom-2 left-2 right-2 opacity-0 group-hover/item:opacity-100 transition-opacity">
                  <h3 className="text-white font-bold text-sm truncate">{movie.title}</h3>
                  <div className="flex items-center justify-between mt-1">
                    <div className="flex items-center space-x-1">
                      <Star className="w-3 h-3 text-yellow-400 fill-current" />
                      <span className="text-xs text-white">{movie.vote_average?.toFixed(1) || 'N/A'}</span>
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

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-netflix-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-netflix-red"></div>
      </div>
    );
  }

  return isAuthenticated ? children : <Navigate to="/auth" replace />;
};

// Main App Component
function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/auth" element={<AuthScreen />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <NetflixApp />
              </ProtectedRoute>
            }
          />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;