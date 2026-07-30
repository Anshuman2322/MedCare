import dotenv from 'dotenv';
import dns from 'node:dns';
import app from './app.js';
import { connectDB } from './config/db.js';
import { logger } from './config/logger.js';

dotenv.config();

// Workaround for environments where the default resolver can't reach Atlas's SRV
// records; opt out with DNS_SERVERS=system if your host's resolver is fine.
if (process.env.DNS_SERVERS !== 'system') {
  const servers = (process.env.DNS_SERVERS || '8.8.8.8,8.8.4.4').split(',').map((s) => s.trim());
  dns.setServers(servers);
}

const DEFAULT_PORT = Number(process.env.PORT) || 5000;

// Last line of defense: log and exit rather than let the process hang in an
// undefined state. A process manager (Docker restart policy, PM2, systemd) is
// expected to bring it back up.
process.on('unhandledRejection', (reason) => {
  logger.error({ err: reason }, 'Unhandled promise rejection');
  process.exit(1);
});

process.on('uncaughtException', (err) => {
  logger.error({ err }, 'Uncaught exception');
  process.exit(1);
});

function startServer(port) {
  const server = app.listen(port, () => {
    logger.info(`Server running on port ${port}`);
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      logger.warn(`Port ${port} in use, trying ${port + 1}...`);
      startServer(port + 1);
    } else {
      logger.error({ err }, 'Server failed to start');
    }
  });
}

async function start() {
  const databaseReady = await connectDB({ required: false });
  if (!databaseReady) {
    logger.warn('Server is starting without a database connection. Database routes will be unavailable until MongoDB is fixed.');
  }
  startServer(DEFAULT_PORT);
}

start().catch((err) => {
  logger.error({ err }, 'Failed to start server');
  process.exit(1);
});
