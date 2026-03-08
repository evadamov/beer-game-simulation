import { CONFIG, ROLES } from '../config.js';

/**
 * Shared game logic used by the server to process rounds and state.
 */

export const createInitialState = (customConfig = {}) => {
    // Merge provided config with defaults
    const activeConfig = {
        ...CONFIG,
        ...customConfig
    };

    const initialOrder = activeConfig.customer_order_range[0];

    const createInitialNodeState = () => ({
        inventory: activeConfig.initial_inventory,
        backlog: 0,
        cost: 0,
        cumulativeHoldingCost: 0,
        cumulativeBacklogCost: 0,
        actionLog: [],
        lastOrderReceived: initialOrder, // Visual only
        lastShipmentReceived: initialOrder // Visual only
    });

    // We build the pipeline dynamically based on shipping_delay and order_delay (plus production_delay)
    // To ensure a smooth start, we pre-seed the pipeline with constant demand 'initialOrder'
    // arriving at each week up to the delay period.

    // Helper to seed queues
    const seedQueue = (delay) => {
        const queue = [];
        for (let i = 1; i <= delay; i++) {
            queue.push({ arrivalWeek: 1 + i, amount: initialOrder });
        }
        return queue;
    };

    return {
        week: 1,
        status: 'waiting',
        config: activeConfig, // Store the active config in the state to use in processRound
        players: {
            [ROLES.RETAILER]: null,
            [ROLES.DISTRIBUTOR]: null,
            [ROLES.FACTORY]: null,
            [ROLES.HOST]: null
        },
        nodes: {
            [ROLES.RETAILER]: createInitialNodeState(),
            [ROLES.DISTRIBUTOR]: createInitialNodeState(),
            [ROLES.FACTORY]: createInitialNodeState()
        },
        pipeline: {
            shipmentsToRetailer: seedQueue(activeConfig.shipping_delay),
            shipmentsToDistributor: seedQueue(activeConfig.shipping_delay),
            ordersToDistributor: seedQueue(activeConfig.order_delay),
            ordersToFactory: seedQueue(activeConfig.order_delay),
            productionQueue: seedQueue(activeConfig.production_delay)
        },
        history: []
    };
};



export const getCustomerOrder = (week) => {
    // Simple logic: stable for 4 weeks, then doubles.
    if (week <= 4) return CONFIG.customer_order_range[0];
    return CONFIG.customer_order_range[1] || CONFIG.customer_order_range[0] * 2;
};

// Process end of week using pending actions from players
export const processRound = (state, playerActions) => {
    // Read the active config from the current state rather than the global CONFIG
    const activeConfig = state.config || CONFIG;

    const customerOrder = getCustomerOrder(state.week);

    // 1. Process Actions (Shipping & Ordering placed at end of current week)
    // RETAILER
    const retAction = playerActions[ROLES.RETAILER];
    const retDemand = customerOrder + state.nodes[ROLES.RETAILER].backlog;
    const retShipped = Math.min(retAction.ship, state.nodes[ROLES.RETAILER].inventory, retDemand); // Can't ship more than inventory or demand
    state.nodes[ROLES.RETAILER].inventory -= retShipped;
    state.nodes[ROLES.RETAILER].backlog = retDemand - retShipped;
    // Retailer shipments leave system (go to customer)
    state.pipeline.ordersToDistributor.push({ arrivalWeek: state.week + 1 + activeConfig.order_delay, amount: retAction.order });

    // DISTRIBUTOR
    const distAction = playerActions[ROLES.DISTRIBUTOR];
    const distDemandToUse = state.nodes[ROLES.DISTRIBUTOR].lastOrderReceived + state.nodes[ROLES.DISTRIBUTOR].backlog;
    const distShipped = Math.min(distAction.ship, state.nodes[ROLES.DISTRIBUTOR].inventory, distDemandToUse);
    state.nodes[ROLES.DISTRIBUTOR].inventory -= distShipped;
    state.nodes[ROLES.DISTRIBUTOR].backlog = distDemandToUse - distShipped;
    state.pipeline.shipmentsToRetailer.push({ arrivalWeek: state.week + 1 + activeConfig.shipping_delay, amount: distShipped });
    state.pipeline.ordersToFactory.push({ arrivalWeek: state.week + 1 + activeConfig.order_delay, amount: distAction.order });

    // FACTORY
    const factAction = playerActions[ROLES.FACTORY];
    const factDemandToUse = state.nodes[ROLES.FACTORY].lastOrderReceived + state.nodes[ROLES.FACTORY].backlog;
    const factShipped = Math.min(factAction.ship, state.nodes[ROLES.FACTORY].inventory, factDemandToUse);
    state.nodes[ROLES.FACTORY].inventory -= factShipped;
    state.nodes[ROLES.FACTORY].backlog = factDemandToUse - factShipped;
    state.pipeline.shipmentsToDistributor.push({ arrivalWeek: state.week + 1 + activeConfig.shipping_delay, amount: factShipped });
    // Factory ordering is production
    state.pipeline.productionQueue.push({ arrivalWeek: state.week + 1 + activeConfig.production_delay, amount: factAction.order });

    // 2. Calculate Costs & Log Actions for Current Week
    [ROLES.RETAILER, ROLES.DISTRIBUTOR, ROLES.FACTORY].forEach(role => {
        const node = state.nodes[role];
        const holding = node.inventory * activeConfig.holding_cost;
        const backlogCost = node.backlog * activeConfig.backlog_cost;
        node.cost += (holding + backlogCost);
        node.cumulativeHoldingCost += holding;
        node.cumulativeBacklogCost += backlogCost;

        const action = playerActions[role];
        if (action) {
            node.actionLog.unshift({
                week: state.week,
                shipped: action.ship,
                ordered: action.order
            });
        }
    });

    // Save history
    state.history.push({
        week: state.week,
        nodes: JSON.parse(JSON.stringify(state.nodes))
    });

    // 3. Advance to next week
    const nextWeek = state.week + 1;

    // 4. Receive Arrivals for Next Week (Shipments & Orders arriving at start of nextWeek)

    // Pipeline Helper Functions
    const getArriving = (queue, week) => queue.filter(item => item.arrivalWeek === week).reduce((sum, item) => sum + item.amount, 0);

    const arrivingAtRetailer = getArriving(state.pipeline.shipmentsToRetailer, nextWeek);
    const arrivingAtDistributor = getArriving(state.pipeline.shipmentsToDistributor, nextWeek);
    const arrivingAtFactory = getArriving(state.pipeline.productionQueue, nextWeek); // Finished brewing

    const incomingOrderToDistributor = getArriving(state.pipeline.ordersToDistributor, nextWeek);
    const incomingOrderToFactory = getArriving(state.pipeline.ordersToFactory, nextWeek);

    // Update Inventory with Arrivals
    state.nodes[ROLES.RETAILER].inventory += arrivingAtRetailer;
    state.nodes[ROLES.RETAILER].lastShipmentReceived = arrivingAtRetailer;

    state.nodes[ROLES.DISTRIBUTOR].inventory += arrivingAtDistributor;
    state.nodes[ROLES.DISTRIBUTOR].lastShipmentReceived = arrivingAtDistributor;

    state.nodes[ROLES.FACTORY].inventory += arrivingAtFactory;
    state.nodes[ROLES.FACTORY].lastShipmentReceived = arrivingAtFactory; // "From brewing"

    // Update incoming orders view
    state.nodes[ROLES.RETAILER].lastOrderReceived = getCustomerOrder(nextWeek); // Identify instant demand for UI for next week
    state.nodes[ROLES.DISTRIBUTOR].lastOrderReceived = incomingOrderToDistributor;
    state.nodes[ROLES.FACTORY].lastOrderReceived = incomingOrderToFactory;

    state.week = nextWeek;

    return state;
};
