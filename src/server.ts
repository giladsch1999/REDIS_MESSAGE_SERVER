import express, { Request, Response, NextFunction, RequestHandler } from 'express';
import redis from './redisClient';
import { startScheduler } from './scheduler';
import { v4 as uuidv4 } from 'uuid';

const app = express();
const PORT = process.env.PORT || 3000;
const REDIS_KEY = 'messages';

app.use(express.json());



const storeMessageHandler: RequestHandler = async (req: Request, res: Response, next: NextFunction) => {
  const { message, timestamp } = req.body;

  // Validate request data
  if (!message || !timestamp) {
     res.status(400).json({ error: 'Message and timestamp are required' });
  }

  try {
    // Store the message in a Redis sorted set
    // UUID
    const messageId = uuidv4();

    await redis.zadd(REDIS_KEY, timestamp, JSON.stringify({ id: messageId, content: message }));
    res.status(200).json({ success: true, message: 'Message stored successfully' });
  } catch (error) {
    next(error); // Pass error to the error handler middleware
  } 
};
// POST endpoint: store message in Redis
app.post('/message', storeMessageHandler);

app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong' });
});

// Start the scheduler to process messages continuously
startScheduler();

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
