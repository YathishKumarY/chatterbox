import express from 'express';
import cors from 'cors';
import { env } from './config/env.js';
import passport from './config/passport.js';
import { errorHandler } from './middleware/error.js';
import authRoutes from './routes/auth.routes.js';
import userRoutes from './routes/user.routes.js';
import conversationRoutes from './routes/conversation.routes.js';
import messageRoutes from './routes/message.routes.js';
import pushRoutes from './routes/push.routes.js';
import contactRoutes from './routes/contact.routes.js';

const app = express();

const isDev = env.NODE_ENV !== 'production';
const lanRegex = /^https?:\/\/192\.168\.\d+\.\d+:\d+$/;

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || origin === env.CORS_ORIGIN || (isDev && lanRegex.test(origin))) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));
app.use(express.json({ limit: '100kb' }));
app.use(passport.initialize());

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/conversations', conversationRoutes);
app.use('/api/conversations', messageRoutes);
app.use('/api/push', pushRoutes);
app.use('/api/contacts', contactRoutes);

// JSON 404 for unmatched API routes (default Express returns HTML).
app.use('/api', (_req, res) => {
  res.status(404).json({ error: 'Not found' });
});

app.use(errorHandler);

export default app;
