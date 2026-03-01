import React from 'react';
import { CONFIG, ROLES } from '../config.js';

export default function HostDashboard({ state, onStartGame }) {

    const isPlaying = state.status === 'playing';

    return (
        <div className="flex flex-col min-h-screen p-6 max-w-7xl mx-auto w-full fade-in">
            <div className="flex justify-between items-center bg-slate-800 p-6 rounded-t-xl border-b border-slate-700">
                <div>
                    <h1 className="text-3xl font-bold text-white">Панель Организатора (Host)</h1>
                    <p className="text-brandPrimary">Неделя {state.week} | Статус: {state.status === 'waiting' ? 'Ожидание игроков' : 'В игре'}</p>
                </div>
                {!isPlaying && (
                    <button onClick={onStartGame} className="btn-primary py-3 px-8 text-lg shadow-lg">
                        ▶ Начать игру
                    </button>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 p-6 bg-panelBg rounded-b-xl border border-t-0 border-panelBorder shadow-xl flex-grow">

                {/* Node Columns */}
                {[ROLES.RETAILER, ROLES.DISTRIBUTOR, ROLES.FACTORY].map(role => {
                    const node = state.nodes[role];
                    const playerId = state.players[role];
                    const isSubmitted = state.submitted?.includes(role);

                    let statusBadge = null;
                    if (!playerId) {
                        statusBadge = <span className="text-xs px-2 py-1 rounded-full bg-slate-600 text-slate-300">Ожидание игрока...</span>;
                    } else if (isSubmitted) {
                        statusBadge = <span className="text-xs px-2 py-1 rounded-full bg-brandPrimary/20 text-brandPrimary">Ход сделан</span>;
                    } else if (isPlaying) {
                        statusBadge = <span className="text-xs px-2 py-1 rounded-full bg-accentWarning/20 text-accentWarning animate-pulse">Думает... (Ожидание хода)</span>;
                    } else {
                        statusBadge = <span className="text-xs px-2 py-1 rounded-full bg-accentSuccess/20 text-accentSuccess">Подключен</span>;
                    }

                    return (
                        <div key={role} className="flex flex-col space-y-4">
                            <div className={`p-4 rounded-lg border-t-4 shadow-md ${playerId ? 'bg-slate-700 border-accentSuccess' : 'bg-slate-800 border-slate-600'}`}>
                                <h2 className="text-xl font-bold text-white mb-1 flex justify-between items-center">
                                    {role}
                                    {statusBadge}
                                </h2>
                            </div>

                            {/* Node Stats */}
                            <div className="glass-panel p-5 space-y-4">
                                <div className="flex justify-between items-center">
                                    <span className="text-slate-400">Склад (Inventory)</span>
                                    <span className="text-2xl font-bold text-brandPrimary">{node.inventory}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-slate-400">Текущие Заказы (Долг)</span>
                                    <span className="text-2xl font-bold text-accentDanger">{node.backlog}</span>
                                </div>
                                <div className="flex flex-col pt-3 border-t border-slate-700">
                                    <div className="flex justify-between items-center mb-1">
                                        <span className="text-slate-300 font-medium">Суммарные затраты</span>
                                        <span className="text-xl font-mono text-white">${node.cost.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-xs text-slate-500">
                                        <span>Хранение:</span>
                                        <span className="font-mono">${node.cumulativeHoldingCost?.toFixed(2) || '0.00'}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-xs text-slate-500">
                                        <span>Штрафы за дефицит:</span>
                                        <span className="font-mono">${node.cumulativeBacklogCost?.toFixed(2) || '0.00'}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )
                })}

                {/* Global Pipeline / Stats */}
                <div className="col-span-1 lg:col-span-3 mt-6">
                    <h3 className="text-xl font-semibold text-white mb-4 border-b border-slate-700 pb-2">Статистика Цепи Поставок</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="glass-panel p-4 text-center">
                            <p className="text-slate-400 text-sm">Общие запасы системы</p>
                            <p className="text-3xl font-bold text-brandPrimary mt-1">
                                {Object.values(state.nodes).reduce((acc, n) => acc + n.inventory, 0)}
                            </p>
                        </div>
                        <div className="glass-panel p-4 text-center">
                            <p className="text-slate-400 text-sm">Общий долг системы</p>
                            <p className="text-3xl font-bold text-accentDanger mt-1">
                                {Object.values(state.nodes).reduce((acc, n) => acc + n.backlog, 0)}
                            </p>
                        </div>
                        <div className="glass-panel p-4 text-center bg-slate-800">
                            <p className="text-slate-400 text-sm">Общие затраты системы</p>
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
