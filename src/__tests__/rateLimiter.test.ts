import request from 'supertest';
import express from 'express';
import rateLimiter, {closeRedisConnection, setRateLimitOverride} from '../middleware/rateLimiter';
import Redis from 'ioredis';

const redisClient = new Redis();
const createApp = () => {
    const app = express();
    app.use(express.json());
    const testLimiter = rateLimiter({ windowMs: 60 * 60 * 1000, maxRequests: 5 });
    app.get('/test', testLimiter, (req, res) => res.send('OK'));
    app.post('/override', (req, res) => {
        const { ip, limit, duration } = req.body;
        setRateLimitOverride(ip, limit, duration);
        res.status(200).json({ message: `Rate limit override set for IP ${ip} to ${limit} requests for ${duration} ms.` });
    });
    return app;
};
//note change this IP address to your ip if needed.
const mockIp = '::ffff:127.0.0.1';
describe('Rate Limiter Middleware', () => {
    let app:any;

    beforeAll(() => {
        app = createApp();
    });

    beforeEach((done) => {
        // Flushing keys before each test
        redisClient.flushall().then(() => done());
    });

    afterAll(async () => {
        // Close the Redis client to ensure Jest exits properly
        await closeRedisConnection();
        await redisClient.quit();
    });

    it('should allow requests under the limit', async () => {
        for (let i = 0; i < 5; i++) {
            const response = await request(app).get('/test');
            expect(response.status).toBe(200);
        }
    });

    it('should block requests over the limit', async () => {
        for (let i = 0; i < 5; i++) {
            await request(app).get('/test');
        }
        const response = await request(app).get('/test');
        expect(response.status).toBe(429);
        expect(response.body.message).toBe('Too many requests, please try again later.');
    });

    it('should allow temporary rate limit overrides', async () => {

        await request(app)
            .post('/override')
            .send({ ip:mockIp, limit: 10, duration: 60 * 60 * 1000 });

        for (let i = 0; i < 10; i++) {
            const response = await request(app).get('/test').set('X-Forwarded-For', mockIp);
            expect(response.status).toBe(200);
        }

        const response = await request(app).get('/test').set('X-Forwarded-For', mockIp);
        expect(response.status).toBe(429);
        expect(response.body.message).toBe('Too many requests, please try again later.');

    });
});
