import React, { useMemo } from 'react';
import { CONFIG, ROLES } from '../config.js';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer
} from 'recharts';

export default function HostDashboard({ state, onStartGame }) {
    const isPlaying = state.status === 'playing';

    // Host Configs
    const [config, setConfig] = React.useState({
        shipping_delay: 2,
        production_delay: 2,
        holding_cost: 1,
        backlog_cost: 2,
        initial_inventory: 12
    });

    const handleConfigChange = (e) => {
        const { name, value } = e.target;
        setConfig(prev => ({
            ...prev,
            [name]: Math.max(0, Number(value)) // Ensure non-negative numbers
        }));
    };

    // Prepare Analytics Data from History
    const chartData = useMemo(() => {
        return state.history.map(record => ({
            week: record.week,
            'Магазин': record.nodes[ROLES.RETAILER]?.inventory || 0,
            'Дистрибьютор': record.nodes[ROLES.DISTRIBUTOR]?.inventory || 0,
            'Завод': record.nodes[ROLES.FACTORY]?.inventory || 0,
        }));
    }, [state.history]);

    const chartDataDemand = useMemo(() => {
        return state.history.map(record => ({
            week: record.week,
            'Магазин': record.nodes[ROLES.RETAILER]?.lastOrderReceived || 0,
            'Дистрибьютор': record.nodes[ROLES.DISTRIBUTOR]?.lastOrderReceived || 0,
            'Завод': record.nodes[ROLES.FACTORY]?.lastOrderReceived || 0,
        }));
    }, [state.history]);

    const chartDataCosts = useMemo(() => {
        return state.history.map(record => ({
            week: record.week,
            'Магазин': record.nodes[ROLES.RETAILER]?.cost || 0,
            'Дистрибьютор': record.nodes[ROLES.DISTRIBUTOR]?.cost || 0,
            'Завод': record.nodes[ROLES.FACTORY]?.cost || 0,
        }));
    }, [state.history]);

    return (
        <div className="flex flex-col min-h-screen p-6 max-w-7xl mx-auto w-full fade-in">
            <div className="flex justify-between items-center bg-slate-800 p-6 rounded-t-xl border-b border-slate-700">
                <div>
                    <h1 className="text-3xl font-bold text-white">Панель Организатора (Host)</h1>
                    <p className="text-brandPrimary">Неделя {state.week} | Статус: {state.status === 'waiting' ? 'Ожидание игроков' : 'В игре'}</p>
                </div>
                {!isPlaying && (
                    <button onClick={() => onStartGame(config)} className="btn-primary py-3 px-8 text-lg shadow-lg">
                        ▶ Начать игру
                    </button>
                )}
            </div>

            {!isPlaying && (
                <div className="glass-panel p-6 rounded-none border-x border-panelBorder flex flex-col md:flex-row gap-6 items-center bg-slate-800/50">
                    <div className="w-full md:w-1/3">
                        <h2 className="text-xl font-bold text-white mb-2">Настройки Игры</h2>
                        <p className="text-sm text-slate-400">Настройте параметры цепи поставок до начала партии. Заказы (информационный поток) передаются мгновенно (задержка = 0).</p>
                    </div>
                    <div className="w-full md:w-2/3 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                        <div>
                            <label className="block text-xs font-medium text-slate-400 mb-1">Доставка (недель)</label>
                            <input type="number" name="shipping_delay" value={config.shipping_delay} onChange={handleConfigChange} className="w-full input-field py-1" />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-slate-400 mb-1">Производство (недель)</label>
                            <input type="number" name="production_delay" value={config.production_delay} onChange={handleConfigChange} className="w-full input-field py-1" />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-slate-400 mb-1">Нач. запасы (шт)</label>
                            <input type="number" name="initial_inventory" value={config.initial_inventory} onChange={handleConfigChange} className="w-full input-field py-1" />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-slate-400 mb-1">Хранение ($)</label>
                            <input type="number" name="holding_cost" value={config.holding_cost} onChange={handleConfigChange} step="0.5" className="w-full input-field py-1" />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-slate-400 mb-1">Штраф ($)</label>
                            <input type="number" name="backlog_cost" value={config.backlog_cost} onChange={handleConfigChange} step="0.5" className="w-full input-field py-1" />
                        </div>
                    </div>
                </div>
            )}

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
                <div className="col-span-1 lg:col-span-3 mt-4">
                    <h3 className="text-xl font-semibold text-white mb-4 border-b border-slate-700 pb-2">Статистика Цепи Поставок</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
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

                    {/* Analytics Charts */}
                    <div className="space-y-8">
                        <div className="glass-panel p-4">
                            <h3 className="text-lg font-semibold text-white mb-4">График Остатков (Склад)</h3>
                            <div className="bg-slate-800 p-4 rounded-lg h-72">
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                                        <XAxis dataKey="week" stroke="#94a3b8" />
                                        <YAxis stroke="#94a3b8" />
                                        <Tooltip contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f8fafc' }} />
                                        <Legend />
                                        <Line type="monotone" dataKey="Магазин" stroke="#3b82f6" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                                        <Line type="monotone" dataKey="Дистрибьютор" stroke="#10b981" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                                        <Line type="monotone" dataKey="Завод" stroke="#f59e0b" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        <div className="glass-panel p-4">
                            <h3 className="text-lg font-semibold text-white mb-4">Поступившие Заказы (Спрос)</h3>
                            <div className="bg-slate-800 p-4 rounded-lg h-72">
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={chartDataDemand} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                                        <XAxis dataKey="week" stroke="#94a3b8" />
                                        <YAxis stroke="#94a3b8" />
                                        <Tooltip contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f8fafc' }} />
                                        <Legend />
                                        <Line type="monotone" dataKey="Магазин" stroke="#3b82f6" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                                        <Line type="monotone" dataKey="Дистрибьютор" stroke="#10b981" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                                        <Line type="monotone" dataKey="Завод" stroke="#f59e0b" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        <div className="glass-panel p-4">
                            <h3 className="text-lg font-semibold text-white mb-4">Накопленные Затраты ($)</h3>
                            <div className="bg-slate-800 p-4 rounded-lg h-72">
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={chartDataCosts} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                                        <XAxis dataKey="week" stroke="#94a3b8" />
                                        <YAxis stroke="#94a3b8" />
                                        <Tooltip contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f8fafc' }} />
                                        <Legend />
                                        <Line type="monotone" dataKey="Магазин" stroke="#3b82f6" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                                        <Line type="monotone" dataKey="Дистрибьютор" stroke="#10b981" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                                        <Line type="monotone" dataKey="Завод" stroke="#f59e0b" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}
