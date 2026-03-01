import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { createInitialState, processRound } from '../src/logic/gameLogic.js';
import { ROLES } from '../src/config.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());

const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

// Using an in-memory store for rooms
const rooms = {};

io.on('connection', (socket) => {
    console.log(`User connected: ${socket.id}`);

    // Create or Join Room
    socket.on('join_room', (roomId, role, callback) => {
        if (!rooms[roomId]) {
            rooms[roomId] = {
                state: createInitialState(),
                turnActions: {}
            };
        }

        const room = rooms[roomId];

        if (room.state.players[role]) {
            const existingSocketId = room.state.players[role];
            // Get all currently connected sockets
            const connectedSockets = Array.from(io.sockets.sockets.keys());
            if (connectedSockets.includes(existingSocketId) && existingSocketId !== socket.id) {
                if (callback) callback({ success: false, message: 'Данная роль уже занята активным игроком.' });
                return;
            }
        }

        room.state.players[role] = socket.id;
        socket.join(roomId);

        console.log(`Socket ${socket.id} joined ${roomId} as ${role}`);

        io.to(roomId).emit('state_update', room.state);

        if (callback) callback({ success: true, state: room.state });
    });

    socket.on('start_game', (roomId) => {
        const room = rooms[roomId];
        if (room && room.state.status === 'waiting') {
            room.state.status = 'playing';
            io.to(roomId).emit('state_update', room.state);
        }
    });

    socket.on('submit_turn', (roomId, role, action) => {
        const room = rooms[roomId];
        if (!room || room.state.status !== 'playing') return;

        if (!room.state.submitted) room.state.submitted = [];
        room.turnActions[role] = action;
        if (!room.state.submitted.includes(role)) {
            room.state.submitted.push(role);
        }

        const requiredRoles = [ROLES.RETAILER, ROLES.DISTRIBUTOR, ROLES.FACTORY];
        const allSubmitted = requiredRoles.every(r => room.turnActions[r]);

        if (allSubmitted) {
            try {
                room.state = processRound(room.state, room.turnActions);
                room.turnActions = {};
                room.state.submitted = [];
                io.to(roomId).emit('state_update', room.state);
            } catch (err) {
                console.error("Error processing round", err);
            }
        } else {
            // Send full state update so frontend can show who is waiting
            io.to(roomId).emit('state_update', room.state);
        }
    });

    socket.on('disconnect', () => {
        console.log(`User disconnected: ${socket.id}`);
    });
});

// Serve static files from the React app if in production
if (process.env.NODE_ENV === 'production') {
    const buildPath = path.join(__dirname, '../dist');
    app.use(express.static(buildPath));

    app.use((req, res) => {
        res.sendFile(path.join(buildPath, 'index.html'));
    });
}

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
});
