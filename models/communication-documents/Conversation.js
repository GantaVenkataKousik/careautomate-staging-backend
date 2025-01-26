import mongoose from 'mongoose';

const conversationSchema = new mongoose.Schema({
    senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'users' },
    receiverId: { type: mongoose.Schema.Types.ObjectId, ref: 'users' },
    lastMessage: { type: String },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
    lastMsgSeen: { type: Boolean, default: false }
});

export default mongoose.model('conversation', conversationSchema);