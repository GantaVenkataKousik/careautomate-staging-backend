import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config()

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.DB_URL, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });

        console.log(`Connected to MongoDB Successfully`);

        // Listen for connection events
        mongoose.connection.on('connected', () => {
            console.log('Mongoose connected to DB');
        });

        mongoose.connection.on('error', (err) => {
            console.log(`Mongoose connection error: ${err.message}`);
        });

        mongoose.connection.on('disconnected', () => {
            console.log('Mongoose disconnected');
        });

        // Handle process termination
        process.on('SIGINT', async () => {
            await mongoose.connection.close();
            console.log('Mongoose connection closed due to app termination');
            process.exit(0);
        });

    } catch (err) {
        console.log(`Error connecting to MongoDB: ${err.message}`);
    }
};

export default connectDB;