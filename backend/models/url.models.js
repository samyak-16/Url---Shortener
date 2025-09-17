import mongoose from 'mongoose';

const urlSchema = new mongoose.Schema(
  {
    shortId: {
      type: String,
      required: true,
      unique: true,
    },
    originalUrl: {
      type: String,
      required: true,
    },
    totalClicks: {
      type: Number,
      default: 0,
    },
    visitHistory: [
      {
        timestamp: {
          type: Number,
          default: () => Date.now(), // when the click happens
        },
        ipAddress: {
          type: String,
        },
        userAgent: {
          type: String,
        },
        country: {
          type: String,
        },
      },
    ],
  },
  { timestamps: true }
);

const URL = mongoose.model('url', urlSchema);
export default URL;
