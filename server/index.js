// =================================================================
//                      IMPORTS & SETUP
// =================================================================
require('dotenv').config();
const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
const port = 8888;

// =================================================================
//                   ENVIRONMENT VARIABLES
// =================================================================
const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const REDIRECT_URI = process.env.REDIRECT_URI;

app.use(cors());

// =================================================================
//                      AUTHENTICATION ROUTES
// =================================================================
app.get('/login', (req, res) => {
  const scope = 'user-top-read';
  const authUrl = 'https://accounts.spotify.com/authorize?' + new URLSearchParams({
    response_type: 'code', client_id: CLIENT_ID, scope: scope, redirect_uri: REDIRECT_URI,
  }).toString();
  res.redirect(authUrl);
});

app.get('/callback', async (req, res) => {
  const code = req.query.code || null;
  try {
    const response = await axios({
      method: 'post', url: 'https://accounts.spotify.com/api/token',
      data: new URLSearchParams({ grant_type: 'authorization_code', code: code, redirect_uri: REDIRECT_URI }).toString(),
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': 'Basic ' + (Buffer.from(CLIENT_ID + ':' + CLIENT_SECRET).toString('base64')),
      },
    });
    const { access_token, refresh_token } = response.data;
    res.redirect(`http://localhost:3000?access_token=${access_token}&refresh_token=${refresh_token}`);
  } catch (error) {
    res.send("Error during authentication.");
    console.error("Error in /callback:", error.response ? error.response.data : error.message);
  }
});

// =================================================================
//                        ANALYSIS ROUTE
// =================================================================
app.get('/analyze', async (req, res) => {
  const { access_token } = req.query;
  if (!access_token) return res.status(400).json({ error: 'Access token not provided' });

  try {
    // 1. Get user's top 50 tracks from Spotify (the ONLY API call needed)
    const topTracksResponse = await axios.get('https://api.spotify.com/v1/me/top/tracks', {
      headers: { 'Authorization': `Bearer ${access_token}` },
      params: { time_range: 'medium_term', limit: 50 }
    });
    const tracks = topTracksResponse.data.items;

    // 2. Score each track based on its popularity
    const finalTracks = tracks.map(track => {
      const popularity = track.popularity;
      let trackScore = 0;
      
      if (popularity >= 75) {
        trackScore = 15; // Mainstream Hit
      } else if (popularity >= 40) {
        trackScore = -5; // Indie / Less Known
      } else {
        trackScore = -15; // Obscure
      }
      
      return {
        name: track.name,
        artist: track.artists[0].name,
        popularity: popularity,
        finalScore: trackScore
      };
    });

    // 3. Calculate final score and sort tracks
    const totalScore = finalTracks.reduce((acc, t) => acc + t.finalScore, 0);
    const finalScoreValue = Math.max(0, Math.min(100, 50 + (totalScore / finalTracks.length)));

    const sortedTracks = finalTracks.sort((a, b) => a.finalScore - b.finalScore);
    const redFlagTracks = sortedTracks.slice(0, 5); // These will be the LEAST popular tracks
    const goldStarTracks = sortedTracks.slice(-5).reverse(); // These will be the MOST popular tracks

    res.json({
      coworkerScore: Math.round(finalScoreValue),
      redFlagTracks,
      goldStarTracks,
    });

  } catch (error) {
    console.error("Error in /analyze:", error.response ? error.response.data : error.message);
    res.status(500).json({ error: 'Failed to analyze music.' });
  }
});

// =================================================================
//                      START THE SERVER
// =================================================================
app.listen(port, () => {
  console.log(`Backend server listening at http://localhost:${port}`);
});