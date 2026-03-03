import dotenv from 'dotenv';
import app from './app.js';
import { connectDB } from './config/db.js';

dotenv.config();
const DEFAULT_PORT = Number(process.env.PORT) || 5000;

// Temporary debug to confirm env loading; remove after verification
console.log('Loaded JWT_SECRET:', process.env.JWT_SECRET);

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
  await connectDB();
  startServer(DEFAULT_PORT);
}

start().catch((err) => {
  console.error('Failed to start server', err);
  process.exit(1);
});
