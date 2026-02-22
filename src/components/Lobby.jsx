import React, { useState } from 'react';
import { ROLES } from '../config.js';

export default function Lobby({ onJoinRoom }) {
    const [roomId, setRoomId] = useState('');
    const [role, setRole] = useState(ROLES.RETAILER);

    // Quick host setup
    const handleHostCreate = () => {
        const newRoomId = Math.random().toString(36).substring(2, 8).toUpperCase();
        onJoinRoom(newRoomId, ROLES.HOST);
    };

    const handleJoin = (e) => {
        e.preventDefault();
        if (roomId.trim() && role) {
            onJoinRoom(roomId.toUpperCase(), role);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen p-4">
            <div className="glass-panel p-8 max-w-md w-full fade-in">
                <h1 className="text-4xl font-bold text-center mb-2 bg-clip-text text-transparent bg-gradient-to-r from-brandPrimary to-brandSecondary">
                    Beer Game
                </h1>
                <p className="text-slate-400 text-center mb-8">Supply Chain Simulation</p>

                {/* Host Section */}
                <div className="mb-8 border-b border-slate-700 pb-8">
                    <h2 className="text-xl font-semibold mb-4 text-white">Create New Game</h2>
                    <p className="text-sm text-slate-400 mb-4">Start a new session as an observer and invite players.</p>
                    <button
                        onClick={handleHostCreate}
                        className="w-full btn-primary py-3"
                    >
                        Create as Host
                    </button>
                </div>

                {/* Join Section */}
                <div>
                    <h2 className="text-xl font-semibold mb-4 text-white">Join Existing Game</h2>
                    <form onSubmit={handleJoin} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-1">Room ID</label>
                            <input
                                type="text"
                                value={roomId}
                                onChange={(e) => setRoomId(e.target.value)}
                                placeholder="e.g. A1B2C3"
                                className="w-full input-field"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-1">Select Role</label>
                            <select
                                value={role}
                                onChange={(e) => setRole(e.target.value)}
                                className="w-full input-field bg-slate-800"
                            >
                                <option value={ROLES.RETAILER}>🛒 {ROLES.RETAILER} (Магазин)</option>
                                <option value={ROLES.DISTRIBUTOR}>🚚 {ROLES.DISTRIBUTOR} (Дистрибьютор)</option>
                                <option value={ROLES.FACTORY}>🏭 {ROLES.FACTORY} (Завод)</option>
                            </select>
                        </div>

                        <button
                            type="submit"
                            className="w-full btn-secondary py-3 mt-4"
                            disabled={!roomId.trim()}
                        >
                            Join Game
                        </button>
                    </form>
                </div>

            </div>
        </div>
    );
}
