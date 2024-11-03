require("dotenv").config()
const express = require('express');
const mongoose = require('mongoose');
const shortid = require('shortid');
const cors = require("cors")
// Set up Express
const app = express();


 
// const corsOptions = {
//     origin: '*', // Allow all origins
//     methods: ['GET', 'POST', 'PUT', 'DELETE'], // Allow specific HTTP methods
//     allowedHeaders: ['Content-Type', 'Authorization'], // Allow specific headers
//     credentials: true, // Allow credentials (cookies, authorization headers)
//   };
  
  // Use the CORS middleware with the defined options
  app.use(cors());
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
    visitorIds: [String], 
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

app.get('/:shortId', async (req, res) => {
  const { shortId } = req.params;

  // Fetch the URL record using the short ID
  const urlRecord = await Url.findOne({ shortId });

  if (urlRecord) {
      // Construct the temporary redirect URL with the shortId as a query parameter
      const redirectUrl = `https://testing1-hmvudqqg9-sudireddy-muralis-projects.vercel.app/?shortId=${shortId}`;

      // Redirect the user to the temporary URL
      res.redirect(redirectUrl);
  } else {
      res.status(404).json({ message: 'URL not found' });
  }
});

  
app.post('/store-visitor-id', async (req, res) => {
  const { visitorId, shortId } = req.body;

  // Find the corresponding URL record
  const urlRecord = await Url.findOne({ shortId });

  if (urlRecord) {
      // Check if the visitorId already exists in the visitorIds array
      if (!urlRecord.visitorIds.includes(visitorId)) {
          // If visitorId is unique, increment the click count and add the visitorId
          urlRecord.clickCount += 1;
          urlRecord.visitorIds.push(visitorId);
          await urlRecord.save();
      }
      
      // Return the original URL to redirect
      res.json({ originalUrl: urlRecord.originalUrl });
  } else {
      res.status(404).json({ message: 'URL not found' });
  }
});


// Start the server
const PORT = 3004;
app.listen(PORT, () => {
  console.log(`Server is running on ${PORT}`);
});
