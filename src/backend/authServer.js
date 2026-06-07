import https from 'https';
import fs from 'fs';
import express from 'express';
import cors from 'cors';
import OAuth from 'oauth-1.0a';
import { createHmac } from 'crypto';
import axios from 'axios';
import querystring from 'querystring';
import session from 'express-session';
import { saveUser, saveActivity, getFirebaseID, getAccessTokens } from './storeData.js';
import { processData, dateToEpochs, formatDaily, feedModel } from './dataManager.js';
import { Server } from 'socket.io';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const port = 443;
app.use(express.json());

const consumerKey = process.env.CONSUMER_KEY
const consumerSecret = process.env.CONSUMER_SECRET

const tokenSecrets = new Map();
let firebaseID;

// The library used can be found here: https://github.com/ddo/oauth-1.0a
const oauth = OAuth({
  consumer: { 
    key: consumerKey, 
    secret: consumerSecret
  },
  signature_method: 'HMAC-SHA1',
  hash_function(baseString, key) {
    return createHmac('sha1', key)
      .update(baseString)
      .digest('base64');
  },
});

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    return callback(null, origin);
  },
  credentials: true
}));

// Use session to temporarily store token secrets
app.use(session({
  secret: 'secret',
  resave: false,
  saveUninitialized: true,
  cookie: {
    sameSite: 'none', // Allow cross-origin
    secure: true
  }
}));

// Starting endpoint for authentication
app.post('/start-garmin-auth', async (req, res) => {

  const { callbackUrl, userID } = req.body;
  req.session.firebaseId = userID;
  firebaseID = userID;

  try {
    const requestTokenUrl = 'https://connectapi.garmin.com/oauth-service/oauth/request_token';
    const requestData = {
      url: requestTokenUrl,
      method: 'POST',
      data: {
        oauth_callback: callbackUrl
      }
    };

    const authHeader = oauth.toHeader(oauth.authorize(requestData));

    const response = await axios.post(requestTokenUrl, null, {
      headers: { Authorization: authHeader.Authorization },
    });

    const { oauth_token, oauth_token_secret } = querystring.parse(response.data);
    console.log('Request Token:', oauth_token);
    console.log('Request Token Secret:', oauth_token_secret);

    // Store token and token secret 
    tokenSecrets.set(oauth_token, oauth_token_secret);

    // Send redirect URL to frontend
    const authorizeUrl = `https://connect.garmin.com/oauthConfirm?oauth_token=${oauth_token}`;
    res.json({ redirectUrl: authorizeUrl });

  } catch (err) {
    console.error('OAuth start error:', err.response?.data || err.message);
    res.status(500).send('Failed to initiate Garmin OAuth');
  }
});

// Callback Endpoint
app.get('/', async (req, res) => {

  const { oauth_token, oauth_verifier } = req.query;
  const oauth_token_secret = tokenSecrets.get(oauth_token);
  if (!oauth_token_secret) return res.status(400).send("Missing token secret");
  tokenSecrets.delete(oauth_token);
  
  console.log('OAuth token:', oauth_token);
  console.log('OAuth token secret (from session):', oauth_token_secret);

  if (!oauth_token || !oauth_verifier || !oauth_token_secret) {
    return res.status(400).send('Missing parameters or session data.');
  }

  const accessTokenUrl = 'https://connectapi.garmin.com/oauth-service/oauth/access_token';
  const token = { key: oauth_token, secret: oauth_token_secret };

  const authHeader = oauth.toHeader(
    oauth.authorize(
      {
        url: accessTokenUrl,
        method: 'POST',
        data: { 
          oauth_verifier 
        },
      },
      token
    )
  );

  try {
    const response = await axios.post(accessTokenUrl, querystring.stringify({ oauth_verifier }), {
      headers: {
        Authorization: authHeader.Authorization,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });

    const {
      oauth_token: access_token,
      oauth_token_secret: access_token_secret,
    } = querystring.parse(response.data);

    req.session.access_token = access_token;
    req.session.access_token_secret = access_token_secret;
    console.log('Access Token: ', req.session.access_token);
    console.log('Access Token Secret: ', req.session.access_token_secret);

    res.redirect('/get-user-id');

  } catch (err) {
    console.error('OAuth callback error:', err.response?.data || err.message);
    res.status(500).json({ error: 'OAuth callback failed' });
  }
});

// Get user ID
app.get('/get-user-id', async (req, res) => {

  const accessToken = req.session.access_token;
  const accessTokenSecret = req.session.access_token_secret;

  if (!accessToken || !accessTokenSecret) {
    return res.redirect('/start-garmin-auth');
  }

  const userToken = {
    key: accessToken,
    secret: accessTokenSecret,
  };

  const url = 'https://apis.garmin.com/wellness-api/rest/user/id';
  const requestData = {
    url,
    method: 'GET',
  };

  try {
    const authHeader = oauth.toHeader(oauth.authorize(requestData, userToken));
    const response = await axios.get(url, {
      headers: { Authorization: authHeader.Authorization },
    });

    console.log('User ID: ', response.data.userId);
    console.log('Firebase User ID:', firebaseID);

    // Store the new user in the database
    saveUser(response.data.userId, firebaseID, accessToken, accessTokenSecret);

    res.send(`
      <html lang="en">
        <head>
          <meta charset="UTF-8" />
          <title>Registration Successful</title>
          <style>
            body {
              background-color: #404040;
              margin: 0;
              height: 100vh;
              display: flex;
              justify-content: center;
              align-items: center;
              color: white;
              font-size: 2em;
              font-family: sans-serif;
              text-align: center;
            }
          </style>
        </head>
        <body>
          <p>Registration successful! </br>
          You can close this page.</p>
        </body>
      </html>
    `);

  } catch (err) {
    console.error('Failed to fetch Garmin activities:', err.response?.data || err.message);
    res.status(500).send('Error fetching Garmin data');
  }
});

// As soon as a new activity is uploaded in Garmin Connect it is stored in the database
app.post('/activities', async (req, res) => {
  try {
    console.log(JSON.stringify(req.body, null, 2));
    const processedData = processData(req.body.activities);
    saveActivity(processedData);

    const garminUserId = req.body.activities[0].userId;
    console.log(garminUserId);
    const firebaseID = await getFirebaseID(garminUserId);

    // The activity must be sent to the user with the corresponding firebase ID
    if (firebaseID) {
      io.to(firebaseID).emit('new-activity', processedData);
      console.log(`Activity sent to Firebase user: ${firebaseID}`);
    } else {
      console.warn(`No Firebase ID found for Garmin User ID: ${garminUserId}`);
    }
    res.status(200).send();
  } catch (error) {
    console.error('Error processing activity:', error);
    res.sendStatus(500);
  }
});

const server = https.createServer({
  cert: fs.readFileSync(`/etc/letsencrypt/live/${process.env.HOSTING_ADDRESS}/fullchain.pem`),
  key: fs.readFileSync(`/etc/letsencrypt/live/${process.env.HOSTING_ADDRESS}/privkey.pem`)
}, app);

// In order to exchange data with the client, socket communication is used
// Enable CORS for all origins
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// Listen for new client connections and assign a unique id to each of them
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  // Listen to event from the client. The client joins the room with the room ID
  // Inform when the client joins the room
  socket.on('join-room', (roomID) => {
    socket.join(roomID);
    socket.data.roomID = roomID;
    console.log(`Socket ${socket.id} joined room ${roomID}`);
    io.to(firebaseID).emit('update-dailies');
  });

  socket.on('update-dailies', async (firebaseID, start, end) => {

    const tokens = await getAccessTokens(firebaseID);
    const startEpoch = dateToEpochs(start);
    const endEpoch = dateToEpochs(end);

    // Print the tokens (if they exist)
    if (tokens) {
      console.log('Access Token:', tokens.accesstoken);
      console.log('Access Token Secret:', tokens.accesstokensecret);

      const url = `https://apis.garmin.com/wellness-api/rest/dailies?uploadStartTimeInSeconds=${startEpoch}&uploadEndTimeInSeconds=${endEpoch}`;

  const userToken = {
    key: tokens.accesstoken,
    secret: tokens.accesstokensecret,
  };

  const requestData = {
    url,
    method: 'GET',
  };

  try {
    const authHeader = oauth.toHeader(oauth.authorize(requestData, userToken));
    const response = await axios.get(url, {
      headers: { Authorization: authHeader.Authorization },
    });

    if (Array.isArray(response.data) && response.data.length > 0) {
      // This log can be uncommented for debugging purposes. Otherwise, the output may be very long
      // console.log('Last daily:', response.data.at(-1));
      const dailyFormatted = await formatDaily(response.data.at(-1));
      io.to(firebaseID).emit('dailies-data', dailyFormatted);
      console.log(dailyFormatted);
    } else {
      console.log('No dailies found');
    }
  } catch (err) {
    console.error('Failed to fetch daily reports:', err.response?.data || err.message);
  }
    } else {
      console.log('No tokens found for FirebaseID:', firebaseID);
    }
  });

  socket.on('activity-conflicts', async (data) => {
    console.log('Received conflicting events:', data);
    const superEvents = await feedModel(data);
    io.to(socket.data.roomID).emit('new-super-event', superEvents);
  });

  // Inform when the client leaves the room
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

server.listen(port, () => {
  console.log(`HTTPS server running at https://localhost:${port}`);
});
