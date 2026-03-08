import React, { useState } from 'react';
import { ROLES } from '../config.js';

export default function Lobby({ onJoinRoom }) {
    const [roomId, setRoomId] = useState('');
    const [role, setRole] = useState(ROLES.RETAILER);

    // Host Configs
    const [config, setConfig] = useState({
        shipping_delay: 2,
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

    // Quick host setup
    const handleHostCreate = () => {
        const newRoomId = Math.random().toString(36).substring(2, 8).toUpperCase();

        // Pass the custom config up
        onJoinRoom(newRoomId, ROLES.HOST, config);
    };

    const handleJoin = (e) => {
        e.preventDefault();
        onJoinRoom(roomId.toUpperCase(), role);
    };

    return (
        <div className="flex items-center justify-center min-h-screen p-4">
            <div className="glass-panel p-8 max-w-md w-full fade-in mx-auto">
                <h1 className="text-4xl font-bold text-center mb-2 bg-clip-text text-transparent bg-gradient-to-r from-brandPrimary to-brandSecondary">
                    Beer Game
                </h1>
                <p className="text-slate-400 text-center mb-6">Симуляция Цепей Поставок (MIT)</p>

                {/* Game Legend */}
                <div className="bg-slate-800/80 p-4 rounded-lg border border-slate-700 mb-8 text-sm">
                    <h3 className="font-bold text-white mb-2 text-center border-b border-slate-600 pb-2">🎯 Цель Игры</h3>
                    <p className="text-slate-300 mb-3 text-center">Обеспечить бесперебойную поставку за минимальную стоимость.</p>
                    <p className="text-accentWarning/90 font-medium text-center bg-accentWarning/10 py-1 rounded">Игрокам запрещено общаться между собой, кроме как через интерфейс игры.</p>
                </div>

                {/* Host Section */}
                <div className="mb-8 border-b border-slate-700 pb-8">
                    <h2 className="text-xl font-semibold mb-4 text-white">Создать новую игру</h2>
                    <p className="text-sm text-slate-400 mb-4">Настройте параметры и нажмите "Создать панель Хоста". Изменения применятся ко всей партии.</p>

                    <div className="grid grid-cols-2 gap-3 mb-6">
                        <div>
                            <label className="block text-xs font-medium text-slate-400 mb-1">Задержка доставки (недель)</label>
                            <input type="number" name="shipping_delay" value={config.shipping_delay} onChange={handleConfigChange} className="w-full input-field py-1" />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-slate-400 mb-1">Начальные запасы (шт)</label>
                            <input type="number" name="initial_inventory" value={config.initial_inventory} onChange={handleConfigChange} className="w-full input-field py-1" />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-slate-400 mb-1">Стоимость хранения ($)</label>
                            <input type="number" name="holding_cost" value={config.holding_cost} onChange={handleConfigChange} step="0.5" className="w-full input-field py-1" />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-slate-400 mb-1">Штраф за дефицит ($)</label>
                            <input type="number" name="backlog_cost" value={config.backlog_cost} onChange={handleConfigChange} step="0.5" className="w-full input-field py-1" />
                        </div>
                    </div>

                    <button
                        onClick={handleHostCreate}
                        className="w-full btn-primary py-3"
                    >
                        Создать панель Хоста
                    </button>
                </div>

                {/* Join Section */}
                <div>
                    <h2 className="text-xl font-semibold mb-4 text-white">Присоединиться к игре</h2>
                    <form onSubmit={handleJoin} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-1">Код комнаты</label>
                            <input
                                type="text"
                                value={roomId}
                                onChange={(e) => setRoomId(e.target.value)}
                                placeholder="Например: A1B2C3"
                                className="w-full input-field"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-1">Выберите роль</label>
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
                            Войти в игру
                        </button>
                    </form>
                </div>

            </div>
        </div>
    );
}
