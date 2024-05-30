import {createClient, RedisClientType} from 'redis';

//Needs to be moved to environment variables
const REDIS_CONFIG = {
    HOST: '127.0.0.1',
    PORT: 6379,
}

export let redisClient: RedisClientType | null = null;

/**
 * Config: Configuration for connecting to the redis server.
 * Description: Connecting to redis client
 */
const redisConnect = async () => {
    if (!redisClient) {
        redisClient = createClient({
            socket: {
                host: REDIS_CONFIG.HOST,
                port: REDIS_CONFIG.PORT,
            }
        })
    }
    await redisClient.connect();
}

redisConnect().then(r => console.log("connected successfully to redis server"));


export default redisClient;