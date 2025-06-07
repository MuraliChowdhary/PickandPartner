const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  creatorName: {
    type: String,
    required: true,
    trim: true,
    maxLength: 50
  },
  brandName: {
    type: String,
    required: true,
    trim: true,
    maxLength: 100
  },
  niche: {
    type: String,
    required: true,
    trim: true,
    maxLength: 50
  },
  subscriberCount: {
    type: Number,
    required: true,
    min: 0
  },
  openRate: {
    type: Number,
    required: true,
    min: 0,
    max: 100 // Assuming percentage
  },
  userLink: {
    type: String,
    required: true,
    validate: {
      validator: function(v) {
        return /^https?:\/\/.+/.test(v);
      },
      message: 'Please provide a valid URL'
    }
  },
  adCopy: {
    type: String,
    required: true,
    trim: true,
    maxLength: 200
  },
  email: {
    type: String,
    required: true,
    lowercase: true,
    validate: {
      validator: function(v) {
        return /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(v);
      },
      message: 'Please provide a valid email address'
    }
  },
  password : {
    type: String,
    required: true,
    minlength: 6,
    select: false // Do not return password in queries
  },
  discordUsername: {
    type: String,
    required: true,
    trim: true,
    maxLength: 32
  },
  frequency: {
    type: String,
    required: true,
    enum: ['daily', 'weekly', 'bi-weekly', 'monthly', 'other'],
    lowercase: true
  },
  specialInstructions: {
    type: String,
    trim: true,
    maxLength: 500,
    default: ''
  }
}, {
  timestamps: true
});

// Create indexes for better query performance
userSchema.index({ niche: 1 });
userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ subscriberCount: -1 });
userSchema.index({ openRate: -1 });

module.exports = mongoose.model('User', userSchema);