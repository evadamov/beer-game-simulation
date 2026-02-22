import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import Lobby from './components/Lobby';
import Dashboard from './components/Dashboard';
import HostDashboard from './components/HostDashboard';
import { ROLES } from './config';

// Determine socket URL based on environment
const SOCKET_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:3001';

// Create socket instance outside component to prevent recreation
const socket = io(SOCKET_URL, {
  autoConnect: false // We connect manually when picking a room
});

function App() {
  const [gameState, setGameState] = useState(null);
  const [currentRole, setCurrentRole] = useState(null);
  const [roomId, setRoomId] = useState(null);
  const [connectionError, setConnectionError] = useState('');
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    socket.on('connect', () => setIsConnected(true));
    socket.on('disconnect', () => setIsConnected(false));

    socket.on('state_update', (newState) => {
      setGameState(newState);
      setConnectionError('');
    });

    socket.on('connect_error', (err) => {
      setConnectionError('Failed to connect to server. Please ensure the backend is running.');
      console.error(err);
    });

    return () => {
      socket.off('connect');
      socket.off('disconnect');
      socket.off('state_update');
      socket.off('connect_error');
    };
  }, []);

  const handleJoinRoom = (room, role) => {
    if (!socket.connected) {
      socket.connect();
    }

    socket.emit('join_room', room, role, (response) => {
      if (response.success) {
        setRoomId(room);
        setCurrentRole(role);
        setGameState(response.state);
      }
    });
  };

  const handleStartGame = () => {
    socket.emit('start_game', roomId);
  };

  const handleSubmitTurn = (action) => {
    socket.emit('submit_turn', roomId, currentRole, action);
  };

  return (
    <div className="min-h-screen text-slate-100 font-sans">

      {/* Top Banner */}
      <div className="bg-slate-900 border-b border-slate-800 p-2 text-center text-xs text-slate-400 flex justify-between px-4">
        <span>MIT Beer Game Simulation</span>
        <div className="flex items-center space-x-2">
          <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-accentSuccess' : 'bg-accentDanger'}`}></span>
          <span>{isConnected ? 'Connected' : 'Disconnected'}</span>
          {roomId && <span className="ml-4 font-mono">Room: <span className="text-white bg-slate-800 px-2 py-1 rounded">{roomId}</span></span>}
        </div>
      </div>

      {connectionError && (
        <div className="bg-accentDanger/20 border-l-4 border-accentDanger text-accentDanger p-4 m-4 rounded">
          {connectionError}
        </div>
      )}

      {/* Main Content Routing */}
      {!gameState ? (
        <Lobby onJoinRoom={handleJoinRoom} />
      ) : currentRole === ROLES.HOST ? (
        <HostDashboard state={gameState} onStartGame={handleStartGame} />
      ) : (
        <Dashboard
          role={currentRole}
          state={gameState}
          onSubmitTurn={handleSubmitTurn}
        />
      )}

    </div>
  );
}

export default App;
