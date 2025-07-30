import { useEffect, useState } from 'react';
import Search from './components/Search.jsx';
import Spinner from './components/Spinner.jsx';
import MovieCard from './components/MovieCard.jsx';

const API_BASE_URL = 'https://api.themoviedb.org/3';
const API_KEY = import.meta.env.VITE_TMDB_API_KEY;

const API_OPTIONS = {
  method: 'GET',
  headers: {
    accept: 'application/json',
    Authorization: `Bearer ${API_KEY}`,
  },
};

const App = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [movieList, setMovieList] = useState([]);
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedMovie, setSelectedMovie] = useState(null);

  const fetchWithRetry = async (url, options, retries = 3, delay = 1000) => {
    for (let i = 0; i < retries; i++) {
      try {
        const response = await fetch(url, options);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return await response.json();
      } catch (error) {
        if (i === retries - 1) throw error;
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  };

  const fetchMovies = async (query = '') => {
    if (!API_KEY) {
      setErrorMessage('API key is missing. Please check your configuration.');
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setErrorMessage('');

    try {
      let allResults = [];
      const pagesToFetch = query ? 1 : 2; // Fetch 2 pages for homepage, 1 for search to keep it focused
      for (let page = 1; page <= pagesToFetch; page++) {
        const endpoint = query
          ? `${API_BASE_URL}/search/movie?query=${encodeURIComponent(query)}&language=en-US&page=${page}`
          : `${API_BASE_URL}/discover/movie?sort_by=popularity.desc&language=en-US&page=${page}`;

        const data = await fetchWithRetry(endpoint, API_OPTIONS);

        if (!data.results || data.results.length === 0) {
          if (page === 1) { // Only set error if no results on first page
            setErrorMessage(query ? 'No movies found for your search' : 'No movies available');
            setMovieList([]);
            return;
          }
          break;
        }

        allResults = [...allResults, ...data.results.map(movie => ({
          ...movie,
          poster_path: movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : './No-Poster.png'
        }))];
      }

      setMovieList(allResults);
    } catch (error) {
      console.error('Error fetching movies:', error);
      let errorMsg = 'Error fetching movies. Please try again later.';
      
      if (error.message.includes('401')) {
        errorMsg = 'Invalid API key. Please check your TMDB API configuration.';
      } else if (error.message.includes('429')) {
        errorMsg = 'Rate limit exceeded. Please try again later.';
      }
      
      setErrorMessage(errorMsg);
      setMovieList([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMovies(searchTerm);
  }, [searchTerm]);

  const handleMovieClick = (movie) => {
    setSelectedMovie(movie);
  };

  const closeModal = () => {
    setSelectedMovie(null);
  };

  return (
    <main className="min-h-screen relative">
      <div className="pattern absolute inset-0 z-0" />
      <div className="wrapper max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
        <div className="flex flex-col items-center mb-6">
          <img 
            src="./logo.png" 
            alt="Logo" 
            className="text-3xl w-auto object-contain transition-transform hover:scale-105 mb-4" 
          />
          <h1 className="text-3xl font-bold text-white mb-4 text-center">
            Unlimited <span className="text-gradient">Entertainment</span>, Anytime, Anywhere!
          </h1>
          <div className="w-full max-w-md mb-6">
            <Search searchTerm={searchTerm} setSearchTerm={setSearchTerm} />
          </div>
        </div>

        <section className="movies">
          <h2 className="text-2xl font-bold text-white-900 mb-6 text-center">
            {searchTerm ? `Search Results for "${searchTerm}"` : 'Popular Movies'}
          </h2>

          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <Spinner />
            </div>
          ) : errorMessage ? (
            <p className="error-message text-red-600 text-center text-lg py-12">{errorMessage}</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
              {movieList.map((movie) => (
                <div key={movie.id} onClick={() => handleMovieClick(movie)} className="cursor-pointer">
                  <MovieCard movie={movie} />
                </div>
              ))}
            </div>
          )}
        </section>

        {selectedMovie && (
          <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
            <div className="bg-purple-900 rounded-xl p-8 max-w-lg w-full mx-4 relative shadow-2xl transform transition-all duration-300">
              <button
                onClick={closeModal}
                className="absolute top-4 right-4 text-white hover:text-gray-300 transition-colors"
              >
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              <h3 className="text-2xl font-bold text-white mb-4">{selectedMovie.title}</h3>
              <p className="text-gray-200 mb-6 leading-relaxed">
                {selectedMovie.overview || 'No story available for this movie.'}
              </p>
              <button
                onClick={closeModal}
                className="bg-purple-700 text-white px-6 py-2 rounded-lg hover:bg-purple-800 transition-colors duration-200"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
};

export default App;