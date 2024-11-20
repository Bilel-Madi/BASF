// server.js
import { handler } from './build/handler.js';
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config(); // Load environment variables

const app = express();
const server = createServer(app);
const io = new Server(server);

// SvelteKit middleware
app.use(handler);

// Start server
server.listen(3000, () => {
  console.log('Server listening on port 3000');
});

// WebSocket logic
io.on('connection', (socket) => {
  console.log('A client connected');

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
});

// MongoDB change streams
const uri = process.env.DATABASE_URL;
const client = new MongoClient(uri);

async function run() {
  await client.connect();
  console.log('Connected to MongoDB');

  const db = client.db(); // Default database
  const deviceCollection = db.collection('Device');
  const airCollection = db.collection('Air');
  const soilCollection = db.collection('Soil');

  // Watch for changes in the Device collection
  const deviceChangeStream = deviceCollection.watch([], { fullDocument: 'updateLookup' });
  deviceChangeStream.on('change', (change) => {
    console.log('Device change detected:', change);
    io.emit('device_update', change.fullDocument);
  });

  // Watch for changes in the Air collection
  const airChangeStream = airCollection.watch([], { fullDocument: 'updateLookup' });
  airChangeStream.on('change', (change) => {
    console.log('Air data change detected:', change);
    io.emit('air_data_update', change.fullDocument);
  });

  // Watch for changes in the Soil collection
  const soilChangeStream = soilCollection.watch([], { fullDocument: 'updateLookup' });
  soilChangeStream.on('change', (change) => {
    console.log('Soil data change detected:', change);
    io.emit('soil_data_update', change.fullDocument);
  });
}

run().catch(console.error);
