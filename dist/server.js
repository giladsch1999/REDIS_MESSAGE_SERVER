"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const redisClient_1 = __importDefault(require("./redisClient"));
const scheduler_1 = require("./scheduler");
const uuid_1 = require("uuid");
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3000;
const REDIS_KEY = 'messages';
app.use(express_1.default.json());
const storeMessageHandler = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { message, timestamp } = req.body;
    // Validate request data
    if (!message || !timestamp) {
        res.status(400).json({ error: 'Message and timestamp are required' });
    }
    try {
        // Store the message in a Redis sorted set
        // UUID
        const messageId = (0, uuid_1.v4)();
        yield redisClient_1.default.zadd(REDIS_KEY, timestamp, JSON.stringify({ id: messageId, content: message }));
        res.status(200).json({ success: true, message: 'Message stored successfully' });
    }
    catch (error) {
        next(error); // Pass error to the error handler middleware
    }
});
// POST endpoint: store message in Redis
app.post('/message', storeMessageHandler);
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something went wrong' });
});
// Start the scheduler to process messages continuously
(0, scheduler_1.startScheduler)();
// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
