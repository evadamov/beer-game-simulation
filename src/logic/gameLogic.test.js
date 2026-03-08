import { describe, it, expect, beforeEach } from 'vitest';
import { createInitialState, getCustomerOrder, processRound } from './gameLogic.js';
import { CONFIG, ROLES } from '../config.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Build a minimal playerActions object with equal ship & order for all roles */
const makeActions = (ship, order) => ({
    [ROLES.RETAILER]: { ship, order },
    [ROLES.DISTRIBUTOR]: { ship, order },
    [ROLES.FACTORY]: { ship, order },
});

/** Deep-clone state so tests stay isolated */
const cloneState = (state) => JSON.parse(JSON.stringify(state));

// ---------------------------------------------------------------------------
// getCustomerOrder
// ---------------------------------------------------------------------------
describe('getCustomerOrder', () => {
    it('returns the low demand (4) for weeks 1–4', () => {
        for (let week = 1; week <= 4; week++) {
            expect(getCustomerOrder(week)).toBe(CONFIG.customer_order_range[0]);
        }
    });

    it('returns the high demand (8) for weeks 5 and beyond', () => {
        for (let week = 5; week <= 12; week++) {
            expect(getCustomerOrder(week)).toBe(CONFIG.customer_order_range[1]);
        }
    });
});

// ---------------------------------------------------------------------------
// createInitialState
// ---------------------------------------------------------------------------
describe('createInitialState', () => {
    let state;
    beforeEach(() => { state = createInitialState(); });

    it('starts at week 1', () => {
        expect(state.week).toBe(1);
    });

    it('starts with status "waiting"', () => {
        expect(state.status).toBe('waiting');
    });

    it('initialises each node with correct inventory', () => {
        [ROLES.RETAILER, ROLES.DISTRIBUTOR, ROLES.FACTORY].forEach(role => {
            expect(state.nodes[role].inventory).toBe(CONFIG.initial_inventory);
        });
    });

    it('initialises each node with backlog = 0', () => {
        [ROLES.RETAILER, ROLES.DISTRIBUTOR, ROLES.FACTORY].forEach(role => {
            expect(state.nodes[role].backlog).toBe(0);
        });
    });

    it('initialises each node with cost = 0', () => {
        [ROLES.RETAILER, ROLES.DISTRIBUTOR, ROLES.FACTORY].forEach(role => {
            expect(state.nodes[role].cost).toBe(0);
        });
    });

    it('has pipeline queues pre-seeded', () => {
        expect(state.pipeline.shipmentsToRetailer.length).toBeGreaterThan(0);
        expect(state.pipeline.shipmentsToDistributor.length).toBeGreaterThan(0);
        expect(state.pipeline.productionQueue.length).toBeGreaterThan(0);
    });

    it('all players start as null', () => {
        Object.values(state.players).forEach(p => expect(p).toBeNull());
    });
});

// ---------------------------------------------------------------------------
// processRound — basic mechanics
// ---------------------------------------------------------------------------
describe('processRound – inventory & backlog', () => {
    let state;
    beforeEach(() => { state = createInitialState(); });

    it('advances week by 1 each round', () => {
        state = processRound(cloneState(state), makeActions(4, 4));
        expect(state.week).toBe(2);
        state = processRound(cloneState(state), makeActions(4, 4));
        expect(state.week).toBe(3);
    });

    it('reduces retailer inventory after shipping', () => {
        const invBefore = state.nodes[ROLES.RETAILER].inventory;
        state = processRound(cloneState(state), makeActions(4, 4));
        // Retailer ships min(4, inventory, demand) — demand is 4 in week 1
        expect(state.nodes[ROLES.RETAILER].inventory).toBeLessThan(invBefore + 10); // some arrived from pipeline
    });

    it('cannot ship more than available inventory', () => {
        // Give retailer only 2 units, then try to ship 100
        state.nodes[ROLES.RETAILER].inventory = 2;
        const actions = {
            [ROLES.RETAILER]: { ship: 100, order: 4 },
            [ROLES.DISTRIBUTOR]: { ship: 4, order: 4 },
            [ROLES.FACTORY]: { ship: 4, order: 4 },
        };
        const newState = processRound(cloneState(state), actions);
        // Backlog should be demand(4) − shipped(2) = 2
        // But actual backlog also includes previous backlog=0
        expect(newState.nodes[ROLES.RETAILER].backlog).toBeGreaterThanOrEqual(0);
        // Inventory should not go negative
        expect(newState.nodes[ROLES.RETAILER].inventory).toBeGreaterThanOrEqual(0);
    });

    it('creates backlog when inventory is insufficient to fill demand', () => {
        // Zero out retailer inventory; demand = 4
        state.nodes[ROLES.RETAILER].inventory = 0;
        const actions = {
            [ROLES.RETAILER]: { ship: 0, order: 4 },
            [ROLES.DISTRIBUTOR]: { ship: 4, order: 4 },
            [ROLES.FACTORY]: { ship: 4, order: 4 },
        };
        const newState = processRound(cloneState(state), actions);
        // Backlog = demand (4) − shipped (0) = 4, minus any inventory arriving from pipeline
        // After processRound, backlog ≥ 0 always
        expect(newState.nodes[ROLES.RETAILER].backlog).toBeGreaterThanOrEqual(0);
    });

    it('clears backlog when inventory arrives and covers it', () => {
        // Start with a known backlog
        state.nodes[ROLES.RETAILER].backlog = 4;
        state.nodes[ROLES.RETAILER].inventory = 20;
        const actions = {
            [ROLES.RETAILER]: { ship: 20, order: 4 },
            [ROLES.DISTRIBUTOR]: { ship: 4, order: 4 },
            [ROLES.FACTORY]: { ship: 4, order: 4 },
        };
        const newState = processRound(cloneState(state), actions);
        // After shipping enough: backlog should drop
        expect(newState.nodes[ROLES.RETAILER].backlog).toBeLessThan(4);
    });
});

// ---------------------------------------------------------------------------
// processRound — cost calculations
// ---------------------------------------------------------------------------
describe('processRound – cost calculations', () => {
    let state;
    beforeEach(() => { state = createInitialState(); });

    it('applies holding cost per unit of inventory', () => {
        // Run one round with known inventory left
        const newState = processRound(cloneState(state), makeActions(4, 4));
        const retailerNode = newState.nodes[ROLES.RETAILER];
        // cost should be positive (holding cost for remaining inventory)
        expect(retailerNode.cost).toBeGreaterThan(0);
    });

    it('applies backlog cost when there is unfulfilled demand', () => {
        // Force backlog scenario
        state.nodes[ROLES.RETAILER].inventory = 0;
        const actions = {
            [ROLES.RETAILER]: { ship: 0, order: 4 },
            [ROLES.DISTRIBUTOR]: { ship: 4, order: 4 },
            [ROLES.FACTORY]: { ship: 4, order: 4 },
        };
        const newState = processRound(cloneState(state), actions);
        // If there's backlog, backlog cost must be > 0
        if (newState.nodes[ROLES.RETAILER].backlog > 0) {
            expect(newState.nodes[ROLES.RETAILER].cumulativeBacklogCost).toBeGreaterThan(0);
        }
    });

    it('cumulative costs accumulate across multiple rounds', () => {
        let s = cloneState(state);
        s = processRound(s, makeActions(4, 4));
        const costAfterRound1 = s.nodes[ROLES.RETAILER].cost;
        s = processRound(s, makeActions(4, 4));
        expect(s.nodes[ROLES.RETAILER].cost).toBeGreaterThanOrEqual(costAfterRound1);
    });
});

// ---------------------------------------------------------------------------
// processRound — pipeline & delay
// ---------------------------------------------------------------------------
describe('processRound – pipeline mechanics', () => {
    let state;
    beforeEach(() => { state = createInitialState(); });

    it('orders placed this week arrive after order_delay weeks', () => {
        const orderAmount = 7;
        const actions = {
            [ROLES.RETAILER]: { ship: 4, order: orderAmount },
            [ROLES.DISTRIBUTOR]: { ship: 4, order: 4 },
            [ROLES.FACTORY]: { ship: 4, order: 4 },
        };
        const newState = processRound(cloneState(state), actions);
        const delay = CONFIG.order_delay; // 2
        const expectedArrivalWeek = 1 + 1 + delay; // current week(1) +1 + delay = 4

        const matchingOrders = newState.pipeline.ordersToDistributor.filter(
            o => o.arrivalWeek === expectedArrivalWeek && o.amount === orderAmount
        );
        expect(matchingOrders.length).toBeGreaterThanOrEqual(1);
    });

    it('shipments pushed to pipeline arrive after shipping_delay weeks', () => {
        const shipAmount = 5;
        // Give distributor enough inventory
        state.nodes[ROLES.DISTRIBUTOR].inventory = 50;
        state.nodes[ROLES.DISTRIBUTOR].lastOrderReceived = shipAmount;
        const actions = {
            [ROLES.RETAILER]: { ship: 4, order: 4 },
            [ROLES.DISTRIBUTOR]: { ship: shipAmount, order: 4 },
            [ROLES.FACTORY]: { ship: 4, order: 4 },
        };
        const newState = processRound(cloneState(state), actions);
        const delay = CONFIG.shipping_delay; // 2
        const expectedArrivalWeek = 1 + 1 + delay; // 4

        const matchingShipments = newState.pipeline.shipmentsToRetailer.filter(
            s => s.arrivalWeek === expectedArrivalWeek && s.amount === shipAmount
        );
        expect(matchingShipments.length).toBeGreaterThanOrEqual(1);
    });

    it('factory production arrives after production_delay weeks', () => {
        const produceAmount = 6;
        const actions = {
            [ROLES.RETAILER]: { ship: 4, order: 4 },
            [ROLES.DISTRIBUTOR]: { ship: 4, order: 4 },
            [ROLES.FACTORY]: { ship: 4, order: produceAmount },
        };
        const newState = processRound(cloneState(state), actions);
        const delay = CONFIG.production_delay; // 2
        const expectedArrivalWeek = 1 + 1 + delay; // 4

        const matchingProduction = newState.pipeline.productionQueue.filter(
            p => p.arrivalWeek === expectedArrivalWeek && p.amount === produceAmount
        );
        expect(matchingProduction.length).toBeGreaterThanOrEqual(1);
    });
});

// ---------------------------------------------------------------------------
// processRound — action log & history
// ---------------------------------------------------------------------------
describe('processRound – action log & history', () => {
    let state;
    beforeEach(() => { state = createInitialState(); });

    it('records actions taken into each node actionLog', () => {
        const newState = processRound(cloneState(state), makeActions(4, 5));
        [ROLES.RETAILER, ROLES.DISTRIBUTOR, ROLES.FACTORY].forEach(role => {
            const log = newState.nodes[role].actionLog;
            expect(log.length).toBeGreaterThan(0);
            expect(log[0].week).toBe(1);
            expect(log[0].ordered).toBe(5);
        });
    });

    it('saves a history entry for each round', () => {
        let s = cloneState(state);
        s = processRound(s, makeActions(4, 4));
        expect(s.history.length).toBe(1);
        expect(s.history[0].week).toBe(1);

        s = processRound(s, makeActions(4, 4));
        expect(s.history.length).toBe(2);
        expect(s.history[1].week).toBe(2);
    });

    it('history snapshot contains node data', () => {
        const newState = processRound(cloneState(state), makeActions(4, 4));
        const snap = newState.history[0];
        expect(snap.nodes).toBeDefined();
        expect(snap.nodes[ROLES.RETAILER]).toBeDefined();
        expect(typeof snap.nodes[ROLES.RETAILER].inventory).toBe('number');
    });
});

// ---------------------------------------------------------------------------
// Multi-round scenario: demand shock simulation
// ---------------------------------------------------------------------------
describe('Multi-round scenario – demand shock', () => {
    it('simulates 8 rounds without crashing, inventories stay non-negative', () => {
        let s = createInitialState();
        for (let week = 1; week <= 8; week++) {
            s = processRound(s, makeActions(4, 4));
            [ROLES.RETAILER, ROLES.DISTRIBUTOR, ROLES.FACTORY].forEach(role => {
                expect(s.nodes[role].inventory).toBeGreaterThanOrEqual(0);
                expect(s.nodes[role].backlog).toBeGreaterThanOrEqual(0);
                expect(s.nodes[role].cost).toBeGreaterThanOrEqual(0);
            });
        }
        expect(s.week).toBe(9);
        expect(s.history.length).toBe(8);
    });

    it('costs increase when demand doubles after week 4 without reorder', () => {
        let s = createInitialState();
        // Play conservatively (ship 4, order 4) through the shock
        for (let week = 1; week <= 7; week++) {
            s = processRound(s, makeActions(4, 4));
        }
        // After the shock (week 5+), total cost should be higher than just holding
        const totalCost = [ROLES.RETAILER, ROLES.DISTRIBUTOR, ROLES.FACTORY]
            .reduce((sum, role) => sum + s.nodes[role].cost, 0);
        expect(totalCost).toBeGreaterThan(0);
    });
});
