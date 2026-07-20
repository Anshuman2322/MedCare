import dotenv from 'dotenv';
import dns from 'node:dns';
import app from './app.js';
import { connectDB } from './config/db.js';

dotenv.config();
dns.setServers(['8.8.8.8', '8.8.4.4']);
const DEFAULT_PORT = Number(process.env.PORT) || 5000;

function startServer(port) {
  const server = app.listen(port, () => {
    console.log(`Server running on port ${port}`);
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.log(`Port ${port} in use, trying ${port + 1}...`);
      startServer(port + 1);
    } else {
      console.error(err);
    }
  });
}

async function start() {
  const databaseReady = await connectDB({ required: false });
  if (!databaseReady) {
    console.warn('Server is starting without a database connection. Database routes will be unavailable until MongoDB is fixed.');
  }
  startServer(DEFAULT_PORT);
}

start().catch((err) => {
  console.error('Failed to start server', err);
  process.exit(1);
});
