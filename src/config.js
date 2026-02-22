export const CONFIG = {
    customer_order_range: [4, 8], // Initial stable demand, can change later
    initial_inventory: 12,
    holding_cost: 0.50,
    backlog_cost: 1.00,
    shipping_delay: 2, // Weeks
    order_delay: 2,    // Weeks
    production_delay: 2, // Weeks Factory brewing time
    analytics_visibility: 'always', // 'end_only' | 'per_role' | 'always'
    communication_allowed: false
};

// Role Constants
export const ROLES = {
    RETAILER: 'Retailer',
    DISTRIBUTOR: 'Distributor',
    FACTORY: 'Factory',
    HOST: 'Host'
};
