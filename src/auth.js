const SpotifyWebApi = require('spotify-web-api-node');
const fs = require('fs');
const path = require('path');
const open = require('open').default || require('open');

const TOKEN_PATH = path.join(process.env.HOME || process.env.USERPROFILE, '.config/spotify-tui/token.json');

function loadToken() {
  try {
    if (fs.existsSync(TOKEN_PATH)) {
      const tokenData = JSON.parse(fs.readFileSync(TOKEN_PATH));
      return tokenData;
    }
  } catch (error) {
    console.error('Error loading token:', error.message);
  }
  return null;
}

function saveToken(tokenData) {
  try {
    const dir = path.dirname(TOKEN_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(TOKEN_PATH, JSON.stringify(tokenData, null, 2));
    console.log('Token saved to:', TOKEN_PATH);
  } catch (error) {
    console.error('Error saving token:', error.message);
  }
}

async function authenticate() {
  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
  
  if (!clientId || !clientSecret) {
    console.error('Please set SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET environment variables');
    console.error('Get these from https://developer.spotify.com/dashboard');
    process.exit(1);
  }

  const spotifyApi = new SpotifyWebApi({
    clientId: clientId,
    clientSecret: clientSecret,
    redirectUri: 'http://127.0.0.1:8888/callback'
  });

  const tokenData = loadToken();
  
  if (tokenData) {
    try {
      spotifyApi.setAccessToken(tokenData.access_token);
      spotifyApi.setRefreshToken(tokenData.refresh_token);
      
      // Test the token
      await spotifyApi.getMe();
      console.log('Using existing token');
      return spotifyApi;
    } catch (error) {
      console.log('Token expired or invalid, refreshing...');
      try {
        const data = await spotifyApi.refreshAccessToken();
        const newTokenData = {
          access_token: data.body.access_token,
          refresh_token: data.body.refresh_token || tokenData.refresh_token,
          expires_in: data.body.expires_in
        };
        saveToken(newTokenData);
        spotifyApi.setAccessToken(newTokenData.access_token);
        spotifyApi.setRefreshToken(newTokenData.refresh_token);
        console.log('Token refreshed successfully');
        return spotifyApi;
      } catch (refreshError) {
        console.log('Failed to refresh token, starting auth flow...');
      }
    }
  }

  // Start OAuth flow
  const scopes = [
    'user-read-playback-state',
    'user-modify-playback-state',
    'user-read-currently-playing',
    'streaming',
    'user-read-email',
    'user-read-private'
  ];

  const authorizeUrl = spotifyApi.createAuthorizeURL(scopes);
  console.log('Opening browser for authentication...');
  await open(authorizeUrl);

  // Simple server for callback
  const http = require('http');
  const url = require('url');
  
  return new Promise((resolve, reject) => {
    const server = http.createServer(async (req, res) => {
      const query = url.parse(req.url, true).query;
      
      if (query.error) {
        console.error('Auth error:', query.error);
        res.writeHead(500);
        res.end('Authentication failed');
        reject(new Error('Authentication failed'));
        return;
      }

      if (query.code) {
        try {
          const data = await spotifyApi.authorizationCodeGrant(query.code);
          const tokenData = {
            access_token: data.body.access_token,
            refresh_token: data.body.refresh_token,
            expires_in: data.body.expires_in
          };
          
          saveToken(tokenData);
          spotifyApi.setAccessToken(tokenData.access_token);
          spotifyApi.setRefreshToken(tokenData.refresh_token);
          
          console.log('Authentication successful!');
          res.writeHead(200);
          res.end('Authentication successful! You can close this window.');
          server.close();
          resolve(spotifyApi);
        } catch (error) {
          console.error('Error getting token:', error);
          res.writeHead(500);
          res.end('Authentication failed');
          reject(error);
        }
      }
    });

    server.listen(8888, () => {
      console.log('Waiting for callback on http://127.0.0.1:8888/callback');
      console.log('Complete the authentication in your browser');
    });
  });
}

module.exports = { authenticate };