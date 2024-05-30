import { Request, Response, NextFunction } from 'express';
import Redis from 'ioredis';
import {RANDOM_IP} from "../constants";

interface RateLimitOptions {
    windowMs: number;
    maxRequests: number;
    keyPrefix?: string;
}

const redisClient: Redis = new Redis();

const overridesPrefix = 'overrides:';

const getOverrideKey = (ip: string) => overridesPrefix + ip;
/**
 * BONUS:
 * Description: This method is used to override the rate limiting setting for a special event in redis more
 * granular control over IP's
 * @param ip
 * @param limit
 * @param durationMs
 */

export const setRateLimitOverride = async (ip: string, limit: number, durationMs: number) => {
    const overrideKey = getOverrideKey(ip);
    await redisClient.setex(overrideKey, durationMs / 1000, limit.toString());
};

/**
 * Description: This function check for the user's IP address and based on that creates a key in redis with a
 * counter and timestamp. Checks for the number of requests allowed and whether the incoming request should be
 * allowed or not. If the limit exceeds then it returns a status 429 with a message and then sets headers for
 * the request.
 * @param options
 * windowMs: number; Window time for the rate limiter in milliseconds
 * maxRequests: number; Maximum number of requests allowed
 * keyPrefix?: string; Key prefix for redis.
 */

const rateLimiter = (options: RateLimitOptions) => {
    const { windowMs, maxRequests, keyPrefix = 'rl:' } = options;

    return async (req: Request, res: Response, next: NextFunction) => {
        const ip =  req.ip
        //note: can be tested for random IP's as well
        // const ip = RANDOM_IP[Math.floor(Math.random()*RANDOM_IP.length)];

        if (!ip) {
            res.status(400).json({ message: 'Unable to determine IP address.' });
            return;
        }

        const key:string = `${keyPrefix}${ip}`;
        const currentTime:number = Date.now();
        // Fetch rate limit from overrides or use default
        const overrideKey:string = getOverrideKey(ip);
        const userRateLimit = await redisClient.get(overrideKey) || maxRequests;
        // Log the current request with a timestamp
        await redisClient.zadd(key, currentTime, `${currentTime}`);
        await redisClient.expire(key, windowMs / 1000);

        //Bonus: Count requests in the sliding window
        const minTime:number = currentTime - windowMs;
        await redisClient.zremrangebyscore(key, 0, minTime);
        const requestCount = await redisClient.zcount(key, minTime, currentTime);
        // @ts-ignore
        if (requestCount > userRateLimit) {
            const ttl:number = await redisClient.pttl(key);
            res.set('Retry-After', `${Math.ceil(ttl / 1000)}`);
            res.status(429).json({ message: 'Too many requests, please try again later.' });
            return;
        }

        res.set('X-RateLimit-Limit', `${userRateLimit}`);
        // @ts-ignore
        res.set('X-RateLimit-Remaining', `${userRateLimit - requestCount}`);
        res.set('X-RateLimit-Reset', `${Math.ceil((minTime + windowMs) / 1000)}`);
        next();
    };
};
export const closeRedisConnection = async () => {
    await redisClient.quit();
};

export default rateLimiter;
