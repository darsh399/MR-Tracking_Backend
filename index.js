import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import Connect from './DatabaseConfigue/DatabaseConnect.js';
import dataRoutes from './routes/dataRoutes.js';

dotenv.config();
const PORT = process.env.PORT || 5000;
const app = express();

app.use(cors({
    origin: 'http://localhost:5173',
    credentials: true,
}));
app.use(express.json());
app.use(cookieParser());
app.use('/api/data', dataRoutes);

Connect()
    .then(() => {
        app.listen(PORT, () => {
            console.log(`Server is running on port ${PORT}`);
        });
    })
    .catch((error) => {
        console.error('Failed to connect to database:', error.message || error);
        process.exit(1);
    });



