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

        room.turnActions[role] = action;

        const requiredRoles = [ROLES.RETAILER, ROLES.DISTRIBUTOR, ROLES.FACTORY];
        const allSubmitted = requiredRoles.every(r => room.turnActions[r]);

        if (allSubmitted) {
            try {
                room.state = processRound(room.state, room.turnActions);
                room.turnActions = {};
                io.to(roomId).emit('state_update', room.state);
            } catch (err) {
                console.error("Error processing round", err);
            }
        } else {
            io.to(roomId).emit('player_submitted', role);
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

    app.get('*', (req, res) => {
        res.sendFile(path.join(buildPath, 'index.html'));
    });
}

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
});
