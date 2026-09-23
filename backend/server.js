import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

import connectDB from './config/db.js';
import { ensureAdminSeed } from './config/seedAdmin.js';
import { ensureBootstrapData } from './config/seedData.js';
import {
  helmetSecurity,
  corsSecurity,
  generalLimiter,
  sanitizeNoSql,
} from './middleware/securityMiddleware.js';
import userRoutes from './routes/userRoutes.js';
import vendorRoutes from './routes/vendorRoutes.js';
import productRoutes from './routes/productRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import whatsappRoutes from './routes/whatsappRoutes.js';
import uploadRoutes from './routes/uploadRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import updateRoutes from './routes/updateRoutes.js';

const app = express();

// 1. Security Headers via Helmet
app.use(helmetSecurity);

// 2. Strict CORS whitelist
app.use(corsSecurity);

// 3. Payload size limiting against DoS
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// 4. NoSQL injection sanitizer
app.use(sanitizeNoSql);

// 5. Global API Rate Limiter
app.use('/api', generalLimiter);

// Admin panel — a same-origin static page that talks to /api/admin. Served at
// /admin.html (and /admin). Same origin means no CORS and no separate host.
const __dirname = path.dirname(fileURLToPath(import.meta.url));
app.use(express.static(path.join(__dirname, 'public')));
app.get('/admin', (req, res) => res.sendFile(path.join(__dirname, 'public', 'admin.html')));

app.get('/health', (req, res) => res.json({ status: 'ok' }));

app.use('/api/users', userRoutes);
app.use('/api/vendors', vendorRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/whatsapp', whatsappRoutes);
app.use('/api/uploads', uploadRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/updates', updateRoutes);

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Internal server error' });
});

// Not 5000: macOS AirPlay Receiver listens there and answers requests as
// "AirTunes" with a 403, which looks exactly like an auth bug from the app side.
const PORT = process.env.PORT || 5001;

const start = async () => {
  await connectDB();
  await ensureAdminSeed();
  if (process.env.SEED_DATA === 'true') {
    await ensureBootstrapData();
  }
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
};

start();
