export const CONFIG = {
    customer_order_range: [4, 8], // Order range for Retailer for weeks > 4
    initial_inventory: 12,
    holding_cost: 1, // $1 per unit per week
    backlog_cost: 2, // $2 per unit per week
    shipping_delay: 2, // Weeks it takes to ship goods
    order_delay: 0, // Orders are instaneous directly to the upstream next turn
    production_delay: 2, // Weeks it takes Factory to produce goods
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
