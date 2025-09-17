import { nanoid } from 'nanoid';
import URL from '../models/url.models.js';
import ApiError from '../utils/api-error.js';
import ApiResponse from '../utils/api-response.js';
import geoip from 'geoip-lite'; // optional for local country lookup

const generateShortUrl = async (req, res) => {
  const { originalUrl = '', businessPrefix = '' } = req.body || {};

  if (!originalUrl) {
    return res.status(400).json(new ApiError(400, 'originalUrl is required'));
  }
  try {
    let shortId = '';
    if (!businessPrefix) {
      shortId = `${nanoid(5)}`;
    } else {
      shortId = `${businessPrefix}-${nanoid(5)}`;
    }
    await URL.create({ originalUrl, shortId });
    res.status(200).json(
      new ApiResponse(200, {
        shortUrl: `${process.env.BACKEND_URL}/api/url/${shortId}`,
      })
    );
  } catch (error) {
    console.error('Error  in generateShortUrl', error);
    res
      .status(500)
      .json(
        new ApiError(500, 'Internal Server Error at generateShortUrl', [
          error.message,
        ])
      );
  }
};

const redirectUrl = async (req, res) => {
  const { shortId = '' } = req.params;
  if (!shortId) {
    return res.status(400).json(new ApiError(400, 'shortId not provided'));
  }
  try {
    const url = await URL.findOneAndUpdate(
      { shortId },
      {
        $inc: { totalClicks: 1 },
        $push: {
          visitHistory: {
            timestamp: Date.now(),
            ipAddress: req.ip,
            userAgent: req.headers['user-agent'],
            country:
              req.headers['cf-ipcountry'] ||
              geoip.lookup(req.ip)?.country ||
              'Unknown',
          },
        },
      },
      { new: true }
    );
    if (!url) {
      return res.status(404).json(new ApiError(404, 'Url Not Found'));
    }

    return res.redirect(url.originalUrl);
  } catch (error) {
    console.error('Error in redirectUrl ', error);
    return res.status(500).json(new ApiError(500, 'Internal Server Error'));
  }
};

const getStats = async (req, res) => {
  const { shortId = '' } = req.params;
  if (!shortId) {
    return res.status(400).json(new ApiError(400, 'shortId required'));
  }

  try {
    const url = await URL.findOne({ shortId });
    if (!url) {
      return res.status(404).json(new ApiError(404, 'Url not found'));
    }

    // totalClicks
    const totalClicks = url.totalClicks;

    // uniqueClicks (distinct IPs)
    const uniqueClicks = new Set(url.visitHistory.map((v) => v.ipAddress)).size;

    // lastAccessed
    const lastAccessed =
      url.visitHistory.length > 0
        ? new Date(Math.max(...url.visitHistory.map((v) => v.timestamp)))
        : null;

    // dailyClicks
    const dailyClicks = {};
    url.visitHistory.forEach((v) => {
      const date = new Date(v.timestamp).toISOString().split('T')[0];
      dailyClicks[date] = (dailyClicks[date] || 0) + 1;
    });

    // browsers
    const browsers = {};
    url.visitHistory.forEach((v) => {
      const ua = v.userAgent || 'Unknown';
      browsers[ua] = (browsers[ua] || 0) + 1;
    });

    // devices (simple detection)
    const devices = { Desktop: 0, Mobile: 0, Tablet: 0, Unknown: 0 };
    url.visitHistory.forEach((v) => {
      const ua = v.userAgent || '';
      if (/mobile/i.test(ua)) devices.Mobile++;
      else if (/tablet/i.test(ua)) devices.Tablet++;
      else if (ua) devices.Desktop++;
      else devices.Unknown++;
    });

    // countries
    const countries = {};
    url.visitHistory.forEach((v) => {
      const c = v.country || 'Unknown';
      countries[c] = (countries[c] || 0) + 1;
    });

    // referrers
    const referrers = {};
    url.visitHistory.forEach((v) => {
      const ref = v.referrer || 'direct';
      referrers[ref] = (referrers[ref] || 0) + 1;
    });

    return res.status(200).json(
      new ApiResponse(200, {
        shortId: url.shortId,
        originalUrl: url.originalUrl,
        totalClicks,
        uniqueClicks,
        createdAt: url.createdAt,
        lastAccessed,
        dailyClicks,
        browsers,
        devices,
        countries,
        referrers,
      })
    );
  } catch (error) {
    console.error('Error in getStats', error);
    return res.status(500).json(new ApiError(500, 'Internal Server Error'));
  }
};

export { generateShortUrl, redirectUrl, getStats };
