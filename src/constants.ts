/**
 * These rate limiters can also be configured in the ENV variables or even in the redis configuration depending on the use case.
 */
export const AUTH_RATE_LIMIT = { windowMs: 10*1000, maxRequests: 200 }
export const UN_AUTH_RATE_LIMIT = { windowMs: 60 * 60 * 1000, maxRequests: 100 }
export const RANDOM_IP = ["127.0.0.1", "192.168.1.1", "192.168.1.2","127.0.0.2"]