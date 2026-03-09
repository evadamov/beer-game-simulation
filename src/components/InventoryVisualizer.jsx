import React from 'react';

export default function InventoryVisualizer({ count }) {
    if (count <= 0) {
        return <div className="text-slate-500 text-sm italic">Склад пуст</div>;
    }

    const pallets = Math.floor(count / 10);
    const boxes = count % 10;

    return (
        <div className="flex flex-wrap gap-1 mt-2 p-2 bg-slate-900/50 rounded-lg min-h-[40px] items-center border border-slate-800/80">
            {/* Render Pallets */}
            {Array.from({ length: pallets }).map((_, i) => (
                <span key={`pallet-${i}`} className="text-2xl drop-shadow-md" title="Палета (10 шт)">
                    🛢️
                </span>
            ))}

            {/* Render Boxes */}
            {Array.from({ length: boxes }).map((_, i) => (
                <span key={`box-${i}`} className="text-xl drop-shadow-sm opacity-90" title="Коробка (1 шт)">
                    📦
                </span>
            ))}
        </div>
    );
}
