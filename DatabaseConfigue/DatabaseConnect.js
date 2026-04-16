import mongoose from "mongoose";

const Connect = async () => {
    const DB_URL = process.env.DB_URL;
    console.log('Attempting to connect to MongoDB at:', DB_URL);
    if (!DB_URL) {
        throw new Error('DB_URL environment variable is not set');
    }

    try {
        const connect = await mongoose.connect(DB_URL, {
            serverSelectionTimeoutMS: 10000,
        });

        console.log('connection created with database');
        return connect;
    } catch (error) {
        console.error('MongoDB connection error:', error.message || error);
        throw error;
    }
};

export default Connect;