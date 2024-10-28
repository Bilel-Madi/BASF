// src/lib/dbConnect.js
import mongoose from 'mongoose';

const MONGODB_URI = "mongodb+srv://bilelmadi:K2KCoFSFKEmQJf4p@cluster0.k7z0gfa.mongodb.net/BASF?retryWrites=true&w=majority";

if (!MONGODB_URI) {
    throw new Error('Please define the MONGODB_URI environment variable inside .env.local');
}

let cachedConnection = null; // Cache the connection

async function dbConnect() {
    if (cachedConnection) {
        console.log('Using existing database connection.');
        return cachedConnection;
    }

    const opts = {
        bufferCommands: false,
    };

    try {
        cachedConnection = await mongoose.connect(MONGODB_URI, opts);
        console.log('New database connection established.');
        return cachedConnection;
    } catch (error) {
        console.error('Database connection failed:', error);
        throw error;
    }
}

export default dbConnect;
