import React, { useState } from 'react';
import { CONFIG } from '../config.js';

export default function Dashboard({ role, state, onSubmitTurn }) {
    const [shipAmount, setShipAmount] = useState('');
    const [orderAmount, setOrderAmount] = useState('');

    const nodeState = state.nodes[role];
    const isPlaying = state.status === 'playing';

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
                    Waiting for Host to Start...
                </h2>
                <p className="text-slate-400">Week: {state.week}</p>
                <p className="text-slate-400 mt-2">Connected Players: {Object.entries(state.players).filter(([, id]) => id).map(([r]) => r).join(', ')}</p>
            </div>
        );
    }

    // Calculate perceived demand
    const currentDemand = role === 'Retailer'
        ? (state.week <= 4 ? CONFIG.customer_order_range[0] : (CONFIG.customer_order_range[1] || CONFIG.customer_order_range[0] * 2))
        : nodeState.lastOrderReceived;

    const totalDemand = currentDemand + nodeState.backlog;

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6 fade-in max-w-7xl mx-auto">

            {/* Header Info */}
            <div className="col-span-full flex justify-between items-center glass-panel p-4">
                <div>
                    <h1 className="text-3xl font-bold text-white">{role} Dashboard</h1>
                    <p className="text-brandPrimary">Week {state.week}</p>
                </div>
                <div className="text-right">
                    <p className="text-sm text-slate-400">Total Cost</p>
                    <p className="text-2xl font-mono text-accentDanger">${nodeState.cost.toFixed(2)}</p>
                </div>
            </div>

            {/* Status Cards */}
            <StatCard title="Current Inventory" value={nodeState.inventory} subtitle={`Holding cost: $${CONFIG.holding_cost}/unit`} color="text-brandPrimary" />
            <StatCard title="Current Backlog" value={nodeState.backlog} subtitle={`Backlog cost: $${CONFIG.backlog_cost}/unit`} color="text-accentDanger" />
            <StatCard title="Last Shipment Received" value={nodeState.lastShipmentReceived} subtitle={`From upstream supplier`} color="text-accentSuccess" />

            {/* Action Area */}
            <div className="col-span-full md:col-span-2 lg:col-span-2 glass-panel p-6 border-l-4 border-brandSecondary">
                <h2 className="text-xl font-bold text-white mb-4">This Week's Actions</h2>

                <div className="bg-slate-800 rounded-lg p-4 mb-6 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1 h-full bg-accentWarning"></div>
                    <p className="text-slate-300">New Order Received: <span className="text-xl font-bold text-white">{currentDemand}</span> units</p>
                    <p className="text-slate-300 border-b border-slate-700 pb-2 mb-2">Previous Backlog: <span className="font-bold text-accentDanger">{nodeState.backlog}</span> units</p>
                    <p className="text-lg text-white font-medium">Total Demand to Fulfill: <span className="font-bold text-accentWarning">{totalDemand}</span> units</p>
                </div>

                <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1">
                            Units to Ship (Max: {nodeState.inventory})
                        </label>
                        <input
                            type="number"
                            min="0"
                            max={nodeState.inventory}
                            value={shipAmount}
                            onChange={(e) => setShipAmount(e.target.value)}
                            className="w-full input-field text-lg"
                            placeholder="0"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1">
                            Units to Order (from supplier)
                        </label>
                        <input
                            type="number"
                            min="0"
                            value={orderAmount}
                            onChange={(e) => setOrderAmount(e.target.value)}
                            className="w-full input-field text-lg"
                            placeholder="0"
                            required
                        />
                    </div>
                    <div className="col-span-full mt-4">
                        <button type="submit" className="w-full btn-primary py-3 text-lg">
                            Submit Turn Actions
                        </button>
                    </div>
                </form>
            </div>

        </div>
    );
}

function StatCard({ title, value, subtitle, color }) {
    return (
        <div className="glass-panel p-6 flex flex-col justify-between">
            <h3 className="text-sm font-medium text-slate-400">{title}</h3>
            <p className={`text-4xl font-bold mt-2 ${color}`}>{value}</p>
            {subtitle && <p className="text-xs text-slate-500 mt-2">{subtitle}</p>}
        </div>
    );
}
