import { CONFIG, ROLES } from '../config.js';

/**
 * Shared game logic used by the server to process rounds and state.
 */

export const createInitialState = () => ({
    week: 1,
    status: 'waiting', // waiting, playing, finished
    players: {
        [ROLES.RETAILER]: null, // socketId
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
        // Items moving between nodes
        shipmentsToRetailer: [], // { arrivalWeek: X, amount: Y }
        shipmentsToDistributor: [],

        // Orders moving between nodes
        ordersToDistributor: [],
        ordersToFactory: [],

        // Factory Production Queue
        productionQueue: []
    },
    history: [] // Array of { week, node: { ... } } for analytics
});

const createInitialNodeState = () => ({
    inventory: CONFIG.initial_inventory,
    backlog: 0,
    cost: 0,
    lastOrderReceived: 0, // Visual only
    lastShipmentReceived: 0 // Visual only
});

export const getCustomerOrder = (week) => {
    // Simple logic: stable for 4 weeks, then doubles.
    if (week <= 4) return CONFIG.customer_order_range[0];
    return CONFIG.customer_order_range[1] || CONFIG.customer_order_range[0] * 2;
};

// Process end of week using pending actions from players
export const processRound = (state, playerActions) => {
    // playerActions = { Retailer: { ship: 5, order: 5 }, Distributor: {...}, Factory: {...} }

    const nextWeek = state.week + 1;
    const customerOrder = getCustomerOrder(state.week);

    // 1. Receive Arrivals for Next Week (Shipments & Orders arriving at start of nextWeek)

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
    state.nodes[ROLES.RETAILER].lastOrderReceived = customerOrder; // Instant
    state.nodes[ROLES.DISTRIBUTOR].lastOrderReceived = incomingOrderToDistributor;
    state.nodes[ROLES.FACTORY].lastOrderReceived = incomingOrderToFactory;


    // 2. Process Actions (Shipping & Ordering placed at end of current week)

    // RETAILER
    const retAction = playerActions[ROLES.RETAILER];
    const retDemand = customerOrder + state.nodes[ROLES.RETAILER].backlog;
    const retShipped = Math.min(retAction.ship, state.nodes[ROLES.RETAILER].inventory, retDemand); // Can't ship more than inventory or demand
    state.nodes[ROLES.RETAILER].inventory -= retShipped;
    state.nodes[ROLES.RETAILER].backlog = retDemand - retShipped;
    // Retailer shipments leave system (go to customer)

    state.pipeline.ordersToDistributor.push({ arrivalWeek: state.week + CONFIG.order_delay, amount: retAction.order });

    // DISTRIBUTOR
    const distAction = playerActions[ROLES.DISTRIBUTOR];
    const distDemandToUse = (state.week === 1) ? 4 /* Initial seed */ + state.nodes[ROLES.DISTRIBUTOR].backlog : state.nodes[ROLES.DISTRIBUTOR].lastOrderReceived + state.nodes[ROLES.DISTRIBUTOR].backlog;
    const distShipped = Math.min(distAction.ship, state.nodes[ROLES.DISTRIBUTOR].inventory, distDemandToUse);
    state.nodes[ROLES.DISTRIBUTOR].inventory -= distShipped;
    state.nodes[ROLES.DISTRIBUTOR].backlog = distDemandToUse - distShipped;

    state.pipeline.shipmentsToRetailer.push({ arrivalWeek: state.week + CONFIG.shipping_delay, amount: distShipped });
    state.pipeline.ordersToFactory.push({ arrivalWeek: state.week + CONFIG.order_delay, amount: distAction.order });

    // FACTORY
    const factAction = playerActions[ROLES.FACTORY];
    const factDemandToUse = (state.week === 1) ? 4 /* Initial seed */ + state.nodes[ROLES.FACTORY].backlog : state.nodes[ROLES.FACTORY].lastOrderReceived + state.nodes[ROLES.FACTORY].backlog;
    const factShipped = Math.min(factAction.ship, state.nodes[ROLES.FACTORY].inventory, factDemandToUse);
    state.nodes[ROLES.FACTORY].inventory -= factShipped;
    state.nodes[ROLES.FACTORY].backlog = factDemandToUse - factShipped;

    state.pipeline.shipmentsToDistributor.push({ arrivalWeek: state.week + CONFIG.shipping_delay, amount: factShipped });
    // Factory ordering is production
    state.pipeline.productionQueue.push({ arrivalWeek: state.week + CONFIG.production_delay, amount: factAction.order });

    // 3. Calculate Costs
    [ROLES.RETAILER, ROLES.DISTRIBUTOR, ROLES.FACTORY].forEach(role => {
        const node = state.nodes[role];
        const holding = node.inventory * CONFIG.holding_cost;
        const backlogCost = node.backlog * CONFIG.backlog_cost;
        node.cost += (holding + backlogCost);
    });

    // Save history
    state.history.push({
        week: state.week,
        nodes: JSON.parse(JSON.stringify(state.nodes))
    });

    state.week = nextWeek;

    return state;
};
