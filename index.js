// require("dotenv").config();
// const express = require("express");
// const mongoose = require("mongoose");
// const shortid = require("shortid");
// const cors = require("cors");

// // Set up Express
// const app = express();
// app.use(cors());
// app.use(express.json());

// // Connect to MongoDB
// mongoose
//   .connect(process.env.MONGO_URL, {
//     useNewUrlParser: true,
//     useUnifiedTopology: true,
//   })
//   .then(() => console.log("Connected to db"))
//   .catch((err) => console.log(err));

// // Create URL schema with additional fields for click counts and visitor details
// const urlSchema = new mongoose.Schema({
//   shortId: String,
//   originalUrl: String,
//   discordId1: { type: String, default: "" },
//   discordId2: { type: String, default: "" },
//   totalClicks: { type: Number, default: 0 }, // Total clicks
//   uniqueClicks: { type: Number, default: 0 }, // Unique visitor clicks
//   visitorDetails: [
//     {
//       // Array to store visitor details
//       visitorId: String,
//       city: String,
//     },
//   ],
// });

// const Url = mongoose.model("Url", urlSchema);

// // Route to create a short URL
// app.post("/shorten", async (req, res) => {
//   try {
//     const { originalUrl, discordId1, discordId2 } = req.body;

//     console.log(`Discord IDs received: ${discordId1}, ${discordId2}`);

//     const shortId = shortid.generate();

//     // Save the original URL, shortId, and Discord IDs to the database
//     const newUrl = new Url({ shortId, originalUrl, discordId1, discordId2 });
//     await newUrl.save();

//     res.json({ shortUrl: `http://localhost:3004/${shortId}` });
//   } catch (error) {
//     console.error("Error saving new URL:", error);
//     res
//       .status(500)
//       .json({ message: "An error occurred while shortening the URL" });
//   }
// });

// // Route to handle redirection
// app.get("/:shortId", async (req, res) => {
//   const { shortId } = req.params;

//   // Fetch the URL record using the short ID
//   const urlRecord = await Url.findOne({ shortId });

//   if (urlRecord) {
//     // Construct the temporary redirect URL with the shortId as a query parameter
//     const redirectUrl = `https://finger-print-clicks.vercel.app/?shortId=${shortId}`;

//     // Redirect the user to the temporary URL
//     res.redirect(redirectUrl);
//   } else {
//     res.status(404).json({ message: "URL not found" });
//   }
// });

// // Route to store visitor ID and city information
// app.post("/store-visitor-id", async (req, res) => {
//   const { visitorId, shortId, city } = req.body;

//   // Find the corresponding URL record
//   const urlRecord = await Url.findOne({ shortId });

//   if (urlRecord) {
//     // Increment totalClicks for every visit
//     urlRecord.totalClicks += 1;

//     // Check if the visitor is unique
//     const isUniqueVisitor = !urlRecord.visitorDetails.some(
//       (visitor) => visitor.visitorId === visitorId
//     );

//     if (isUniqueVisitor) {
//       // If visitor is unique, increment uniqueClicks and add visitor details
//       urlRecord.uniqueClicks += 1;
//       urlRecord.visitorDetails.push({ visitorId, city });
//     }

//     // Save the updated record
//     await urlRecord.save();

//     // Return the original URL to redirect
//     res.json({ originalUrl: urlRecord.originalUrl });
//   } else {
//     res.status(404).json({ message: "URL not found" });
//   }
// });

// // Start the server
// const PORT = 3004;
// app.listen(PORT, () => {
//   console.log(`Server is running on ${PORT}`);
// });

require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const shortid = require("shortid");
const cors = require("cors");

// Set up Express
const app = express();
app.use(cors());
app.use(express.json());

// Connect to MongoDB
mongoose
  .connect(process.env.MONGO_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("Connected to db"))
  .catch((err) => console.log(err));

// Create URL schema with additional fields for click counts and visitor details
const urlSchema = new mongoose.Schema(
  {
    shortId: String,
    originalUrl: String,
    totalClicks: { type: Number, default: 0 }, // Total clicks
    uniqueClicks: { type: Number, default: 0 }, // Unique visitor clicks
    visitorDetails: [
      // Array to store visitor details
      {
        visitorId: String,
        city: String,
      },
    ],
  },
  {
    timestamps: true, // Automatically adds `createdAt` and `updatedAt` fields
  }
);

const Url = mongoose.model("Url", urlSchema);

app.get("/heath", async (req, res) => {
  res.send("Server is running");
});

// Route to create a short URL
app.post("/shorten", async (req, res) => {
  const { originalUrl } = req.body;
  const shortId = shortid.generate();

  // Save the original URL and its shortId to the database
  const newUrl = new Url({ shortId, originalUrl });
  await newUrl.save();

  res.json({
    shortUrl: `https://pickandpartner-8nes.onrender.com /${shortId}`,
  });
});

// Route to handle redirection
app.get("/:shortId", async (req, res) => {
  const { shortId } = req.params;

  // Fetch the URL record using the short ID
  const urlRecord = await Url.findOne({ shortId });

  if (urlRecord) {
    // Construct the temporary redirect URL with the shortId as a query parameter
    const redirectUrl = `https://finger-print-clicks.vercel.app/?shortId=${shortId}`;

    // Redirect the user to the temporary URL
    res.redirect(redirectUrl);
  } else {
    res.status(404).json({ message: "URL not found" });
  }
});

// Route to store visitor ID and city information
app.post("/store-visitor-id", async (req, res) => {
  const { visitorId, shortId, city } = req.body;

  // Find the corresponding URL record
  const urlRecord = await Url.findOne({ shortId });

  if (urlRecord) {
    // Increment totalClicks for every visit
    urlRecord.totalClicks += 1;

    // Check if the visitor is unique
    const isUniqueVisitor = !urlRecord.visitorDetails.some(
      (visitor) => visitor.visitorId === visitorId
    );

    if (isUniqueVisitor) {
      // If visitor is unique, increment uniqueClicks and add visitor details
      urlRecord.uniqueClicks += 1;
      urlRecord.visitorDetails.push({ visitorId, city });
    }

    // Save the updated record
    await urlRecord.save();

    // Return the original URL to redirect
    res.json({ originalUrl: urlRecord.originalUrl });
  } else {
    res.status(404).json({ message: "URL not found" });
  }
});

// Start the server
const PORT = 3004;
app.listen(PORT, () => {
  console.log(`Server is running on ${PORT}`);
});
