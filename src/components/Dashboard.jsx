import React, { useState } from 'react';
import { CONFIG, ROLES } from '../config.js';
import InventoryVisualizer from './InventoryVisualizer';

export default function Dashboard({ role, state, onSubmitTurn }) {
    const [shipAmount, setShipAmount] = useState('');
    const [orderAmount, setOrderAmount] = useState('');

    const nodeState = state.nodes[role];
    const isPlaying = state.status === 'playing';
    const isSubmitted = state.submitted?.includes(role);

    const handleSubmit = (e) => {
        e.preventDefault();
        const ship = parseInt(shipAmount, 10);
        const order = parseInt(orderAmount, 10);

        if (!isNaN(ship) && !isNaN(order)) {
            onSubmitTurn({ ship, order });
            setShipAmount('');
            setOrderAmount('');
        }
    };

    if (!isPlaying) {
        return (
            <div className="flex flex-col items-center justify-center p-12 glass-panel m-4 fade-in">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brandPrimary mb-4"></div>
                <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-brandPrimary to-brandSecondary mb-2">
                    Ожидание начала игры...
                </h2>
                <p className="text-slate-400">Неделя: {state.week}</p>
                <p className="text-slate-400 mt-2">Подключены: {Object.entries(state.players).filter(([, id]) => id).map(([r]) => r).join(', ')}</p>
            </div>
        );
    }

    // Read Demand from state
    const currentDemand = nodeState.lastOrderReceived;

    const totalDemand = currentDemand + nodeState.backlog;
    const maxShip = Math.min(nodeState.inventory, totalDemand);

    const orderInputLabel = role === ROLES.FACTORY ? "Заказ на производство (шт)" : "Заказ поставщику (шт)";

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6 fade-in max-w-7xl mx-auto">

            {/* Game Legend */}
            <div className="col-span-full bg-slate-800/80 p-4 rounded-lg border border-slate-700 text-sm">
                <h3 className="font-bold text-white mb-2 text-center border-b border-slate-600 pb-2">🎯 Цель Игры</h3>
                <p className="text-slate-300 mb-3 text-center">Обеспечить бесперебойную поставку за минимальную стоимость.</p>
                <p className="text-accentWarning/90 font-medium text-center bg-accentWarning/10 py-1 rounded">Игрокам запрещено общаться между собой, кроме как через интерфейс игры.</p>
            </div>

            {/* Header Info */}
            <div className="col-span-full flex justify-between items-center glass-panel p-4">
                <div>
                    <h1 className="text-3xl font-bold text-white">{role} Dashboard</h1>
                    <p className="text-brandPrimary">Неделя {state.week}</p>
                </div>
                <div className="text-right">
                    <p className="text-sm text-slate-400">Суммарные затраты</p>
                    <p className="text-2xl font-mono text-accentDanger">${nodeState.cost.toFixed(2)}</p>
                    <p className="text-xs text-slate-500">
                        Хранение: ${nodeState.cumulativeHoldingCost?.toFixed(2) || '0.00'} | Штрафы: ${nodeState.cumulativeBacklogCost?.toFixed(2) || '0.00'}
                    </p>
                </div>
            </div>

            {/* Status Cards */}
            <StatCard title="Склад (Inventory)" value={nodeState.inventory} subtitle={`Потери за хранение: $${CONFIG.holding_cost}/шт`} color="text-brandPrimary">
                <InventoryVisualizer count={nodeState.inventory} />
            </StatCard>
            <StatCard title="Текущие Заказы (Долг)" value={nodeState.backlog} subtitle={`Штраф за неудовлетворенный спрос: $${CONFIG.backlog_cost}/шт`} color="text-accentDanger" />
            <StatCard title="Получено товара" value={nodeState.lastShipmentReceived} subtitle={`От поставщика на этой неделе`} color="text-accentSuccess" />

            {/* Action Area */}
            <div className="col-span-full md:col-span-2 lg:col-span-2 glass-panel p-6 border-l-4 border-brandSecondary relative overflow-hidden">
                <h2 className="text-xl font-bold text-white mb-4">Действия на этой неделе</h2>

                <div className="bg-slate-800 rounded-lg p-4 mb-6 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1 h-full bg-accentWarning"></div>
                    <p className="text-slate-300">Новый заказ: <span className="text-xl font-bold text-white">{currentDemand}</span> шт</p>
                    <p className="text-slate-300 border-b border-slate-700 pb-2 mb-2">Накопленные Заказы (Долг): <span className="font-bold text-accentDanger">{nodeState.backlog}</span> шт</p>
                    <p className="text-lg text-white font-medium">Всего нужно отправить: <span className="font-bold text-accentWarning">{totalDemand}</span> шт</p>
                </div>

                {isSubmitted ? (
                    <div className="bg-panelBg/90 absolute inset-0 z-10 flex flex-col items-center justify-center backdrop-blur-sm">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brandPrimary mb-4"></div>
                        <h3 className="text-xl font-bold text-white">Ход принят!</h3>
                        <p className="text-brandPrimary mt-2">Ожидаем других игроков...</p>
                    </div>
                ) : null}

                <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4 relative z-0">
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1">
                            Отгрузить (Макс: {maxShip})
                        </label>
                        <input
                            type="number"
                            min="0"
                            max={maxShip}
                            value={shipAmount}
                            onChange={(e) => setShipAmount(e.target.value)}
                            className="w-full input-field text-lg"
                            placeholder="0"
                            required
                            disabled={isSubmitted}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1">
                            {orderInputLabel}
                        </label>
                        <input
                            type="number"
                            min="0"
                            value={orderAmount}
                            onChange={(e) => setOrderAmount(e.target.value)}
                            className="w-full input-field text-lg"
                            placeholder="0"
                            required
                            disabled={isSubmitted}
                        />
                    </div>
                    <div className="col-span-full mt-4">
                        <button type="submit" disabled={isSubmitted} className={`w-full py-3 text-lg ${isSubmitted ? 'bg-slate-600 cursor-not-allowed text-slate-400' : 'btn-primary'}`}>
                            Подтвердить ход
                        </button>
                    </div>
                </form>
            </div>

            {/* Action Log / Journal */}
            <div className="col-span-full md:col-span-1 glass-panel p-6 flex flex-col h-full max-h-[500px]">
                <h2 className="text-xl font-bold text-white mb-4 border-b border-slate-700 pb-2">Журнал действий</h2>
                <div className="overflow-y-auto pr-2 custom-scrollbar flex-1">
                    {nodeState.actionLog && nodeState.actionLog.length > 0 ? (
                        <div className="space-y-3">
                            {nodeState.actionLog.map((log, idx) => (
                                <div key={idx} className="bg-slate-800 p-3 rounded border border-slate-700 text-sm">
                                    <p className="text-brandPrimary font-bold mb-1">Неделя {log.week}</p>
                                    <div className="flex justify-between text-slate-300">
                                        <span>Отгружено:</span>
                                        <span className="font-mono text-white">{log.shipped}</span>
                                    </div>
                                    <div className="flex justify-between text-slate-300">
                                        <span>Заказано:</span>
                                        <span className="font-mono text-white">{log.ordered}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-slate-500 italic text-center mt-4">Действий пока нет</p>
                    )}
                </div>
            </div>

        </div>
    );
}

function StatCard({ title, value, subtitle, color, children }) {
    return (
        <div className="glass-panel p-6 flex flex-col justify-between h-full">
            <div>
                <h3 className="text-sm font-medium text-slate-400">{title}</h3>
                <p className={`text-4xl font-bold mt-2 ${color}`}>{value}</p>
                {children}
            </div>
            {subtitle && <p className="text-xs text-slate-500 mt-4 leading-snug">{subtitle}</p>}
        </div>
    );
}
