import express from 'express';
import dotenv from 'dotenv';
import db from './utils/db.js';
import router from './routes/url.router.js';
import cors from 'cors';

dotenv.config();
const PORT = process.env.PORT || 3000;

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// app.use(cors());
db();
app.use('/api/url', router);

app.listen(PORT, () => {
  console.log(`Server running on PORT ${PORT}`);
});
