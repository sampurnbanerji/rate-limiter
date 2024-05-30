import { Router } from 'express';
import rateLimiter, {setRateLimitOverride} from '../middleware/rateLimiter';
import {AUTH_RATE_LIMIT, UN_AUTH_RATE_LIMIT} from "../constants";

const router = Router();


const authRateLimiter = rateLimiter(AUTH_RATE_LIMIT);
const unAuthRateLimiter = rateLimiter(UN_AUTH_RATE_LIMIT);


router.get('/auth', unAuthRateLimiter, (req, res) => {
    res.send('Public endpoint, rate limited to 100 requests per hour.');
});


router.get('/guest', authRateLimiter, (req, res) => {
    res.send('Private endpoint, rate limited to 200 requests per hour.');
});

// BONUS: Endpoint to set temporary rate limit override
router.post('/override', (req, res) => {
    const { ip, limit, duration } = req.body;
    if (!ip || !limit || !duration) {
        return res.status(400).json({ message: 'IP, limit, and duration are required.' });
    }
    setRateLimitOverride(ip, limit, duration);
    res.status(200).json({ message: `Rate limit override set for IP ${ip} to ${limit} requests for ${duration} ms.`});
});
export default router;
