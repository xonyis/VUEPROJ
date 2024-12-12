// Import modules
const fs = require('fs')
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors')
    // Initialize Express app and HTTP server
const app = express();

app.use(cors({
    origin: '*',
    methods: ['GET', 'POST'],
}));



const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*", // Allow requests from any origin (to be configured later for security)
    }
});


// Path to the JSON file

const messagesFilePath = './messages.json';

// Load existing messages from file or initialize an empty object (rooms-based)
let roomsMessages = {};
if (fs.existsSync(messagesFilePath)) {
    messages = JSON.parse(fs.readFileSync(messagesFilePath, 'utf-8'));
}

const roomUsers = {}; // Tracks users in each room

// Handle client connection
io.on('connection', (socket) => {

    const isRoomReady = (roomCode) => {

        return roomUsers[roomCode].every((user) => user.isReady && roomUsers[roomCode].length > 1);
    };
    // Join a room with user ID

    socket.on('join room', ({ roomCode, userId }) => {
        console.log('A user connected:', userId);
        const room = io.sockets.adapter.rooms.get(roomCode);
        const userCount = room ? room.size : 0;


        // Check if the room is full
        if (userCount >= 8) {
            console.log(`Room ${roomCode} is full. User ${userId} cannot join.`);
            socket.emit('room full'); // Notify the user that the room is full
            return;
        }

        // Allow the user to join the room
        socket.join(roomCode);

        // Add the user to the roomUsers list
        if (!roomUsers[roomCode]) {
            roomUsers[roomCode] = [];
        }

        // Check if the user is already in the room
        const existingUser = roomUsers[roomCode].find((user) => user.userId === userId);
        if (!existingUser) {
            roomUsers[roomCode].push({
                socketId: socket.id,
                userId,

            });
            console.log(`User ${userId} joined room ${roomCode}`);
        }

        // Notify all users in the room about the updated user list
        const userList = roomUsers[roomCode].map((user) => ({
            userId: user.userId,

        }));
        io.to(roomCode).emit('user list', userList);

        // Initialize room if it doesn't exist
        if (!roomsMessages[roomCode]) {
            roomsMessages[roomCode] = [];
        }

        // Send existing messages in the room
        socket.emit('chat history', roomsMessages[roomCode]);


    });

    // Listen for set pseudo
    socket.on('set pseudo', ({ roomCode, userId, userPseudo }) => {
        console.log(`set pseudo for ${userId} in room ${roomCode}:`, userPseudo);
        // Check if the room exists, if not, initialize it


        if (!roomUsers[roomCode]) {
            return console.log(`Room ${roomCode} does not exist. `);

        }
        // Save the message with the user ID
        // Find the user in the room
        const userIndex = roomUsers[roomCode].findIndex(user => user.userId === userId);

        if (userIndex === -1) {
            console.error(`User ${userId} not found in room ${roomCode}`);
            socket.emit('error', { message: 'User not found in room' });
            return;
        }
        console.log(userIndex);

        roomUsers[roomCode][userIndex].userPseudo = userPseudo;

        io.to(roomCode).emit('pseudo updated', { userId, userPseudo });
        // Notify all users in the room about the updated user list
        const userList = roomUsers[roomCode].map((user) => ({
            userId: user.userId,

        }));
        io.to(roomCode).emit('user list', userList);
        io.to(roomCode).emit('user list', roomUsers[roomCode]);

        // Broadcast the message to the room
    });

    // Listen for set color
    socket.on('set color', ({ roomCode, userId, userColor }) => {
        console.log(`set color for ${userId} in room ${roomCode}:`, userColor);
        // Check if the room exists, if not, 
        if (!roomUsers[roomCode]) {
            return console.log(`Room ${roomCode} does not exist. `);

        }
        // Save the message with the user ID
        // Find the user in the room
        const userIndex = roomUsers[roomCode].findIndex(user => user.userId === userId);

        if (userIndex === -1) {
            console.error(`User ${userId} not found in room ${roomCode}`);
            socket.emit('error', { message: 'User not found in room' });
            return;
        }


        roomUsers[roomCode][userIndex].userColor = userColor;

        io.to(roomCode).emit('color updated', { userId, userColor });
        // Notify all users in the room about the updated user list
        const userList = roomUsers[roomCode].map((user) => ({
            userId: user.userId,

        }));
        io.to(roomCode).emit('user list', userList);
        io.to(roomCode).emit('user list', roomUsers[roomCode]);

        // Broadcast the message to the room
    });

    // Listen for set color
    socket.on('set isReady', ({ roomCode, userId, isReady }) => {
        console.log(`set isReady for ${userId} in room ${roomCode}:`, isReady);
        // Check if the room exists, if not, 
        if (!roomUsers[roomCode]) {
            return console.log(`Room ${roomCode} does not exist. `);

        }
        // Save the message with the user ID
        // Find the user in the room
        const userIndex = roomUsers[roomCode].findIndex(user => user.userId === userId);

        if (userIndex === -1) {
            console.error(`User ${userId} not found in room ${roomCode}`);
            socket.emit('error', { message: 'User not found in room' });
            return;
        }


        roomUsers[roomCode][userIndex].isReady = isReady;

        // Broadcast the message to the room
        io.to(roomCode).emit('isready updated', { userId, isReady });
        io.to(roomCode).emit('user list', roomUsers[roomCode]);
        // If the room is no longer full, cancel the countdown
        if (!isRoomReady(roomCode)) {
            console.log(`Room ${roomCode} is no longer full. Cancelling alert.`);
            const countdownKey = `countdown-${roomCode}`;
            if (socket.data[countdownKey]) {
                clearTimeout(socket.data[countdownKey]);
                delete socket.data[countdownKey];
            }
        }
        // Check if the room have more than 1 user and all isReady and notify users after 5 seconds
        if (isRoomReady(roomCode)) {
            console.log(`Everyone in Room ${roomCode} is Ready. Start game in 5 seconds.`);
            const countdownKey = `countdown-${roomCode}`;

            socket.data[countdownKey] = setTimeout(() => {
                if (isRoomReady(roomCode)) {
                    console.log(`Room ${roomCode} is confirmed full.`);
                    io.to(roomCode).emit('room full alert', {
                        message: `The room ${roomCode} is now full.`,
                    });
                }
            }, 5000); // Delay of 5 seconds

        }
    });

    // Suppression d'une room
    socket.on('delete room', (roomCode) => {
        if (roomsMessages[roomCode]) {
            // Supprime les messages de la room
            delete roomsMessages[roomCode];
            fs.writeFileSync(messagesFilePath, JSON.stringify(roomsMessages, null, 2));

            // Informer tous les utilisateurs de la suppression
            io.to(roomCode).emit('room deleted');
            console.log(`Room ${roomCode} deleted.`);

            // Expulse tous les utilisateurs de la room
            const clients = io.sockets.adapter.rooms.get(roomCode);
            if (clients) {
                clients.forEach((clientId) => {
                    const clientSocket = io.sockets.sockets.get(clientId);
                    clientSocket.leave(roomCode);
                });
            }
        } else {
            console.log(`Room ${roomCode} does not exist.`);
        }
    });

    // Listen for new chat messages
    socket.on('chat message', ({ roomCode, message, userId, userPseudo }) => {
        console.log(`Message received in room ${roomCode}:`, message);

        // Save the message with the user ID
        const newMessage = { userId, userPseudo, message };
        roomsMessages[roomCode].push(newMessage);
        fs.writeFileSync(messagesFilePath, JSON.stringify(roomsMessages, null, 2));

        // Broadcast the message to the room
        io.to(roomCode).emit('chat message', newMessage);
    });

    // Disconnect user explicitly via userId
    socket.on('leave room', ({ roomCode, userId }) => {
        if (roomUsers[roomCode]) {
            roomUsers[roomCode] = roomUsers[roomCode].filter((user) => user.userId !== userId);
            console.log(`User ${userId} left room ${roomCode}`);

            // Notify users about the updated user list
            io.to(roomCode).emit('user list', roomUsers[roomCode].map((user) => ({
                userId: user.userId,
                userPseudo: user.userPseudo,
            })));

            const userIndex = roomUsers[roomCode].findIndex(
                (user) => user.userId === userId
            );

            // If the room is no longer full, cancel the countdown
            if (!isRoomReady(roomCode)) {
                console.log(`Room ${roomCode} is no longer full. Cancelling alert.`);
                const countdownKey = `countdown-${roomCode}`;
                if (socket.data[countdownKey]) {
                    clearTimeout(socket.data[countdownKey]);
                    delete socket.data[countdownKey];
                }
            }
        }
    });

    // Handle user disconnection
    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);

        for (const roomCode in roomUsers) {
            const user = roomUsers[roomCode].find((user) => user.socketId === socket.id);
            if (user) {
                socket.emit('leave room', { roomCode, userId: user.userId });
                break;
            }
        };
    });
});

// Start the server
const PORT = 3000;
server.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});