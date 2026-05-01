import { createServer } from 'http';
import app from './app.js';
import { env } from './config/env.js';
import { logger } from './utils/logger.js';
import { initializeSocket } from './socket/index.js';

const httpServer = createServer(app);
initializeSocket(httpServer);

if (env.NODE_ENV === 'production' && !env.REDIS_URL) {
  logger.warn(
    'REDIS_URL is not set in production. Presence and the message-delivery queue ' +
      'fall back to in-process memory and will not work across multiple backend instances.',
  );
}

httpServer.listen(env.PORT, () => {
  logger.info(`Server running on port ${env.PORT}`);
});
