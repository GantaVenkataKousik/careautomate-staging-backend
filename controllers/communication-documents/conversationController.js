// import Conversation from '../models/Conversation.js';
// import Message from '../models/message.js';
// // Create a new conversation
// export const createConversation = async (req, res) => {
//     const { senderId, receiverId } = req.body; // Expecting sender and receiver IDs
//     // Check if a conversation already exists between these two users
//     let conversation = await Conversation.findOne(
//         { senderId, receiverId },
//     );
//     if (!conversation) {
//         // If no conversation exists, create a new one
//         conversation = new Conversation({ senderId, receiverId });
//         try {
//             await conversation.save();
//             res.status(201).json({ success: true, message: "Conversation created successfully", response: conversation });
//         } catch (err) {
//             res.status(400).json({ success: false, error: 'Error creating conversation.', response: err });
//         }
//     } else {
//         // If a conversation already exists, return it
//         res.status(200).json({ success: true, message: "Conversation already exists", response: conversation });
//     }
// };

// // Get all conversations for a user
// export const getConversation = async (req, res) => {
//     const conversationId = req.query.conversationId; // Assuming this should be userId to fetch all conversations for a user
//     try {
//         const conversations = await Conversation.find({ _id: conversationId });
//         res.status(200).json({ success: true, message: "Conversations fetched successfully", response: conversations });
//     } catch (err) {
//         res.status(500).json({ success: false, error: 'Error fetching conversations.' });
//     }
// };

// export const getAllConversations = async (req, res) => {
//     const userId = req.query.userId; // Assuming this should be userId to fetch all conversations for a user
//     try {
//         const conversations = await Conversation.find({ receiverId: userId });
//         res.status(200).json({ success: true, message: "Conversations fetched successfully", response: conversations });
//     } catch (err) {
//         res.status(500).json({ success: false, error: 'Error fetching conversations.' });
//     }
// };

// export const sendMessage = async (req, res) => {
//     try {
//         const { conversationId, senderId, receiverId, text } = req.body;

//         // Create and save the new message
//         const newMessage = new Message({ conversationId, senderId, receiverId, text });
//         await newMessage.save();

//         // Update the last message in the conversation
//         await Conversation.findByIdAndUpdate(conversationId, { lastMessage: newMessage._id });

//         res.status(200).json({ success: true, message: "Message sent successfully", response: newMessage });
//     } catch (err) {
//         res.status(500).json({ success: false, error: 'Error sending message.' });
//     }
// };

// // Get count of new messages for a user
// export const newMessagesCount = async (req, res) => {
//     try {
//         const { userId } = req.body;

//         if (!userId) {
//             return res.status(400).json({ success: false, message: "User ID is required" });
//         }

//         const conversations = await Conversation.find({ participants: userId, lastMsgSeen: false });
//         const count = conversations.length;

//         res.status(200).json({ success: true, message: "New messages count fetched successfully", response: count });
//     } catch (error) {
//         console.error('Error in newMessagesCount:', error);
//         res.status(400).json({ success: false, message: error.message });
//     }
// };

// export const getPaginatedMessages = async (req, res) => {
//     const { conversationId, page = 1, limit = 20 } = req.query; // Default to page 1, 20 messages per page

//     try {
//         const messages = await Message.find({ conversationId })
//             .sort({ timestamp: -1 }) // Sort by timestamp descending
//             .skip((page - 1) * limit)
//             .limit(limit)
//             .populate('sender')
//             .populate('receiver');

//         res.status(200).json({ success: true, messages });
//     } catch (error) {
//         res.status(500).json({ success: false, error: 'Error fetching messages.' });
//     }
// };