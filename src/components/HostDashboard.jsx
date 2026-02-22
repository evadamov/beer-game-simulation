import React from 'react';
import { CONFIG, ROLES } from '../config.js';

export default function HostDashboard({ state, onStartGame }) {

    const isPlaying = state.status === 'playing';

    return (
        <div className="flex flex-col min-h-screen p-6 max-w-7xl mx-auto w-full fade-in">
            <div className="flex justify-between items-center bg-slate-800 p-6 rounded-t-xl border-b border-slate-700">
                <div>
                    <h1 className="text-3xl font-bold text-white">Observer Dashboard</h1>
                    <p className="text-brandPrimary">Week {state.week} | Status: {state.status}</p>
                </div>
                {!isPlaying && (
                    <button onClick={onStartGame} className="btn-primary py-3 px-8 text-lg shadow-lg">
                        ▶ Start Game
                    </button>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 p-6 bg-panelBg rounded-b-xl border border-t-0 border-panelBorder shadow-xl flex-grow">

                {/* Node Columns */}
                {[ROLES.RETAILER, ROLES.DISTRIBUTOR, ROLES.FACTORY].map(role => {
                    const node = state.nodes[role];
                    const playerId = state.players[role];

                    return (
                        <div key={role} className="flex flex-col space-y-4">
                            <div className={`p-4 rounded-lg border-t-4 shadow-md ${playerId ? 'bg-slate-700 border-accentSuccess' : 'bg-slate-800 border-slate-600'}`}>
                                <h2 className="text-xl font-bold text-white mb-1 flex justify-between">
                                    {role}
                                    <span className={`text-xs px-2 py-1 rounded-full ${playerId ? 'bg-accentSuccess/20 text-accentSuccess' : 'bg-slate-600 text-slate-300'}`}>
                                        {playerId ? 'Connected' : 'Waiting...'}
                                    </span>
                                </h2>
                            </div>

                            {/* Node Stats */}
                            <div className="glass-panel p-5 space-y-4">
                                <div className="flex justify-between items-center">
                                    <span className="text-slate-400">Inventory</span>
                                    <span className="text-2xl font-bold text-brandPrimary">{node.inventory}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-slate-400">Backlog (Shortage)</span>
                                    <span className="text-2xl font-bold text-accentDanger">{node.backlog}</span>
                                </div>
                                <div className="flex justify-between items-center pt-2 border-t border-slate-700">
                                    <span className="text-slate-400">Cumulative Cost</span>
                                    <span className="text-xl font-mono text-white">${node.cost.toFixed(2)}</span>
                                </div>
                            </div>
                        </div>
                    )
                })}

                {/* Global Pipeline / Stats */}
                <div className="col-span-1 lg:col-span-3 mt-6">
                    <h3 className="text-xl font-semibold text-white mb-4 border-b border-slate-700 pb-2">Supply Chain Totals</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="glass-panel p-4 text-center">
                            <p className="text-slate-400 text-sm">System Total Inventory</p>
                            <p className="text-3xl font-bold text-brandPrimary mt-1">
                                {Object.values(state.nodes).reduce((acc, n) => acc + n.inventory, 0)}
                            </p>
                        </div>
                        <div className="glass-panel p-4 text-center">
                            <p className="text-slate-400 text-sm">System Total Backlog</p>
                            <p className="text-3xl font-bold text-accentDanger mt-1">
                                {Object.values(state.nodes).reduce((acc, n) => acc + n.backlog, 0)}
                            </p>
                        </div>
                        <div className="glass-panel p-4 text-center bg-slate-800">
                            <p className="text-slate-400 text-sm">System Total Cost</p>
                            <p className="text-3xl font-mono text-white mt-1">
                                ${Object.values(state.nodes).reduce((acc, n) => acc + n.cost, 0).toFixed(2)}
                            </p>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}
