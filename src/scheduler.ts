import redis from './redisClient';


const REDIS_KEY = 'messages';
const LOCK_TIMEOUT = 5000; // Lock timeout in milliseconds


// Lock acquisition
async function acquireLock(lockKey: string): Promise<boolean> {
  const lockValue = Date.now() + LOCK_TIMEOUT; // Expiration time
  const result = await redis.set(lockKey, lockValue.toString(), 'PX', LOCK_TIMEOUT,'NX');
  return result === 'OK'; // Lock acquired if OK
}

// Lock release
async function releaseLock(lockKey: string): Promise<void> {
  await redis.del(lockKey);
}


// Function to continuously check for messages with the current timestamp
export function startScheduler() {
  setInterval(async () => {
    const now = (Date.now()).toString();
   
    // Retrieve messages with the current timestamp
    const messages = await redis.zrangebyscore(REDIS_KEY, "-inf" , now);

    // For each message, acquire the lock and process it
    for (const message of messages) {
      const { messageId, content } = JSON.parse(message);
      const lockKey = `lock:${messageId}`;
      // Attempt to acquire the lock
      const lockAcquired = await acquireLock(lockKey);
      if (lockAcquired) {
        try {
          // Process the message here
          console.log(`Processing message: ${content}`);

          //remove the proccesed message from redis
          const result = await redis.zrem(REDIS_KEY, message);

          // After processing, release the lock
          await releaseLock(lockKey);
        } catch (err) {
          console.error(`Error processing message ${content}:`, err);
          // Ensure that the lock is released even if processing fails
          await releaseLock(lockKey);
        }
      } else {
        console.log(`Could not acquire lock for message: ${content}`);
      }
    }
  }
, 1000);
}
