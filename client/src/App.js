import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';

function App() {
  const [accessToken, setAccessToken] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('access_token');
    if (token) {
      setAccessToken(token);
      window.history.pushState({}, document.title, "/");
    }
  }, []);

  const handleAnalyze = async () => {
    if (!accessToken) return;
    setIsLoading(true);
    setError('');
    setAnalysis(null);
    try {
      const response = await axios.get(`https://spotify-coworker-backend.onrender.com/analyze?access_token=${accessToken}`);
      setAnalysis(response.data);
    } catch (err) {
      setError('An error occurred during analysis. Please try logging in again.');
      setAccessToken(null);
    } finally {
      setIsLoading(false);
    }
  };

  const LoginScreen = () => (
    <div className="container">
      <h1>Is Your Spotify "Coworker-Friendly"?</h1>
      {/* Updated description for the new logic */}
      <p>Analyze your music taste based on Spotify's popularity score to see how mainstream your music really is.</p>
      <a href="https://spotify-coworker-backend.onrender.com/login" className="login-button">Connect with Spotify</a>
    </div>
  );

  const ResultsScreen = () => (
    <div className="container">
        <h1>Your Results</h1>
        <div className="score-circle">
            <h2>Coworker Score</h2>
            <span>{analysis.coworkerScore}</span>
        </div>
        <div className="track-lists">
            <div className="track-list">
                <h3>⭐ Gold Star Tracks (Most Popular)</h3>
                <ul>
                    {analysis.goldStarTracks.map(track => (
                        <li key={track.name + track.artist}>
                            <div><strong>{track.name}</strong> by {track.artist}</div>
                            <div className="track-details">
                                {/* Corrected to show popularity */}
                                <span>SPOTIFY POPULARITY: {track.popularity}</span>
                            </div>
                        </li>
                    ))}
                </ul>
            </div>
            <div className="track-list">
                <h3>🚩 Red Flag Tracks (Too Obscure)</h3>
                <ul>
                    {analysis.redFlagTracks.map(track => (
                        <li key={track.name + track.artist}>
                            <div><strong>{track.name}</strong> by {track.artist}</div>
                            <div className="track-details">
                                {/* Corrected to show popularity */}
                                <span>SPOTIFY POPULARITY: {track.popularity}</span>
                            </div>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
         <button onClick={() => { setAnalysis(null); setAccessToken(null); }} className="logout-button">Start Over</button>
    </div>
  );

  return (
    <div className="App">
      {!accessToken ? (
        <LoginScreen />
      ) : (
        <>
          {!analysis && !isLoading && (
            <div className="container">
                <h1>Ready to Analyze?</h1>
                <p>You're logged in! Click the button below to analyze your top 50 tracks.</p>
                <button onClick={handleAnalyze} className="analyze-button">Analyze My Music</button>
            </div>
          )}
          {isLoading && <div className="container"><h2>Analyzing...</h2></div>}
          {error && <div className="container"><p className="error">{error}</p><button onClick={() => setAccessToken(null)} className="logout-button">Start Over</button></div>}
          {analysis && <ResultsScreen />}
        </>
      )}
    </div>
  );
}

export default App;