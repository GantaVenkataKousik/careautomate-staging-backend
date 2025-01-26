// // controllers/chatController.js
// import { Server } from 'socket.io';
// import Message from '../models/message.js';
// export const setupChat = (server) => {
//     const io = new Server(server, {
//         cors: {
//             origin: '*',
//             methods: ['GET', 'POST']
//         }
//     });
//     io.on('connection', (socket) => {
//         console.log('A user connected');

//         socket.on('chat message', async (msg) => {
//             const message = new Message(msg);
//             await message.save();
//             io.emit('chat message', msg);
//         });

//         socket.on('disconnect', () => {
//             console.log('User disconnected');
//         });
//     });
// };