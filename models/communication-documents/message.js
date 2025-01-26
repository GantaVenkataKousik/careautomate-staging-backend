import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
    conversationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Conversation' },
    senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'users' },
    receiverId: { type: mongoose.Schema.Types.ObjectId, ref: 'users' },
    text: { type: String, required: true },
    timestamp: { type: Date, default: Date.now }
});

// Define the new model
export default mongoose.model('message', messageSchema);