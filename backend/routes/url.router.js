import express, { Router } from 'express';

import {
  generateShortUrl,
  getStats,
  redirectUrl,
} from '../controllers/url.controller.js';

const router = express.Router();

router.post('/', generateShortUrl);
router.get('/:shortId', redirectUrl);
router.get('/:shortId/stats', getStats);
export default router;
