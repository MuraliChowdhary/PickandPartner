require("dotenv").config()
const express = require('express');
const mongoose = require('mongoose');
const shortid = require('shortid');
const cors = require("cors")
// Set up Express
const app = express();


const corsOptions = {
    origin: 'http://localhost:5175', // Allow only this origin
    methods: ['GET', 'POST', 'PUT', 'DELETE'], // Allow specific HTTP methods
    allowedHeaders: ['Content-Type', 'Authorization'], // Allow specific headers
    credentials: true, // Allow credentials (cookies, authorization headers)
  };
 app.use(cors(corsOptions))
app.use(express.json());

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URL, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(()=>console.log("Connected to db"))
.catch((err)=>console.log(err))

// Create URL schema with an array to store visitor IDs
const urlSchema = new mongoose.Schema({
  shortId: String,
  originalUrl: String,
  clickCount: { type: Number, default: 0 },
  visitorIds: [String], // Store visitor IDs to track unique clicks
});

const Url = mongoose.model('Url', urlSchema);

// Route to create a short URL
app.post('/shorten', async (req, res) => {
  const { originalUrl } = req.body;
  const shortId = shortid.generate();

  // Save the original URL and its shortId to the database
  const newUrl = new Url({ shortId, originalUrl });
  await newUrl.save();

  res.json({ shortUrl: `https://pickandpartner.onrender.com/${shortId}` });
});

// Route to handle redirects and track unique clicks
   app.get('/:shortId/click', async (req, res) => {
    const { shortId } = req.params;
    const visitorId = req.query.visitorId; // Extract visitorId from query parameters
     
    const urlRecord = await Url.findOne({ shortId });
  
    if (urlRecord) {
      // Check if the visitorId already exists in the visitorIds array
      if (!urlRecord.visitorIds.includes(visitorId)) {
        // If visitorId is unique, increment the click count and add the visitorId
        urlRecord.clickCount += 1;
        urlRecord.visitorIds.push(visitorId);
        await urlRecord.save();
      }
  
      // Respond with the original URL for redirection
      res.json({ redirectUrl: urlRecord.originalUrl });
    } else {
      res.status(404).json({ message: 'URL not found' });
    }
  });
  

// Start the server
const PORT = 3004;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
