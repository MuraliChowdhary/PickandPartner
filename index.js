
require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const shortid = require("shortid");
const cors = require("cors");
const bcrypt = require("bcrypt");
const User = require("./models/user.schema"); // Assuming you have a user schema defined in this path
const jwt = require("jsonwebtoken");
const {userMiddleware} = require("./middleware"); // Assuming you have a middleware for user authentication
// Set up Express
const app = express();
app.use(cors());
app.use(express.json());

// Connect to MongoDB
mongoose
  .connect(process.env.MONGO_URL, {
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



// Route to get all info
app.get("/get-info", async (req, res) => {
  try{
    const urlData = await Url.find({});
    if(urlData){
      res.json({
        success : true,
        urlData
      })
    }
    else res.json({success:false})
  }
  catch(e){
    res.status(404).json({message : "Error occured : No data found"})
  }
  
});



// Route to verify a hashed word
app.get("/compare/:word/:hash", async (req, res) => {
  const { word, hash } = req.params;
  try {
    const isMatch = await bcrypt.compare(word, hash);
    res.json({ success : isMatch });
  } catch (error) {
    res.status(500).json({ error: "Error comparing the word" });
  }
}
);


// Route to create a short URL
app.post("/shorten", async (req, res) => {
  const { originalUrl } = req.body;
  const shortId = shortid.generate();

  // Save the original URL and its shortId to the database
  const newUrl = new Url({ shortId, originalUrl });
  await newUrl.save();

  res.json({
    shortUrl: `https://pickand-partner-ten.vercel.app/${shortId}`,
  });
});

// Route to store visitor ID and city information
app.post("/store-visitor-id", async (req, res) => {
  const { visitorId, shortId, city } = req.body;
  const urlRecord = await Url.findOne({ shortId });
  if (urlRecord) {
    urlRecord.totalClicks += 1;
    const isUniqueVisitor = !urlRecord.visitorDetails.some(visitor => visitor.visitorId === visitorId);
    if (isUniqueVisitor) {
      urlRecord.uniqueClicks += 1;
      urlRecord.visitorDetails.push({ visitorId, city });
    }
    await urlRecord.save();
    res.json({ success: true });
  } else {
    res.status(404).json({ message: "URL not found" });
  }
});

// signup
app.post("/signup", async (req, res) => {
  const { user } = req.body;
  try {
    // Hash the password
    const hashedPassword = await bcrypt.hash(user.password, 10);
    const newUser = new User({...user, password: hashedPassword });
    await newUser.save();

    res.json({ success: true, message: "User signed up successfully" });
  } catch (error) {
    res.status(500).json({ error: "Error signing up user" });
  }
});
// login
app.post("/login", async (req, res) => {
  const { email, password } = req.body;
  try {
    // Add validation for required fields
    if (!email || !password) {
      return res.status(400).json({ success: false, message: "Email and password are required" });
    }

    // Explicitly select the password field since it has select: false in schema
    const user = await User.findOne({ email }).select('+password');
    
    if (user) {
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(401).json({ success: false, message: "Invalid email or password" });
      }
      // If the password matches, return jwt
      const token = jwt.sign({ userId: user._id }, process.env.JWT_USER_SECRET, { expiresIn: '1h' });

      res.json({ success: isMatch, token, message: "User logged in successfully" });
    } else {
      res.status(401).json({ success: false, message: "Invalid email or password" });
    }
  } catch (error) {
    console.error("Error during login:", error);
    res.status(500).json({ success: false, message: "Error logging in user" });
  }
});

// get user info route 
app.get("/profile", userMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json({ success: true, user });
  } catch (error) {
    console.error("Error in protected route:", error);
    res.status(500).json({ success: false, message: "Error accessing protected route" });
  }
});

// Route to update user profile
app.put("/profile", userMiddleware, async (req, res) => {
  const { user } = req.body;
  try {
    // Find the user by ID and update their profile
    const updatedUser = await User.findByIdAndUpdate(req.userId, user, { new: true });
    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json({ success: true, user: updatedUser });
  } catch (error) {
    console.error("Error updating profile:", error);
    res.status(500).json({ success: false, message: "Error updating profile" });
  }
});

// send all creator details
app.get("/all-creators", async (req, res) => {
  try {
    const creators = await User.find({});
    if (creators.length > 0) {
      res.json({ success: true, creators });
    } else {
      res.json({ success: false, message: "No creators found" });
    }
  } catch (error) {
    console.error("Error fetching creators:", error);
    res.status(500).json({ success: false, message: "Error fetching creators" });
  }
});

app.get('/creators/:creatorId', async (req, res) => {
  const { creatorId } = req.params;
  try {
    const creator = await User.findById(creatorId);
    if (!creator) {
      return res.status(404).json({ success: false, message: "Creator not found" });
    }
    res.json({ success: true, creator });
  } catch (error) {
    console.error("Error fetching creator:", error);
    res.status(500).json({ success: false, message: "Error fetching creator" });
  }
}
);

// Route to handle redirection - MUST BE LAST due to catch-all nature
app.get("/:shortId", async (req, res) => {
  const { shortId } = req.params;
  const urlRecord = await Url.findOne({ shortId });

  if (urlRecord) {
    // Include originalUrl in the redirect to frontend
    const redirectUrl = `https://finger-print-clicks.vercel.app/?shortId=${shortId}&originalUrl=${encodeURIComponent(urlRecord.originalUrl)}`;
    res.redirect(redirectUrl);
  } else {
    res.status(404).json({ message: "URL not found" });
  }
});

// Start the server
const PORT = 3004;
app.listen(PORT, () => {
  console.log(`Server is running on ${PORT}`);
});
