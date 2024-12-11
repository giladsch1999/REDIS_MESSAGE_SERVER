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
exports.startScheduler = startScheduler;
const redisClient_1 = __importDefault(require("./redisClient"));
const REDIS_KEY = 'messages';
const LOCK_TIMEOUT = 5000; // Lock timeout in milliseconds
// Lock acquisition
function acquireLock(lockKey) {
    return __awaiter(this, void 0, void 0, function* () {
        const lockValue = Date.now() + LOCK_TIMEOUT; // Expiration time
        const result = yield redisClient_1.default.set(lockKey, lockValue.toString(), 'PX', LOCK_TIMEOUT, 'NX');
        return result === 'OK'; // Lock acquired if OK
    });
}
// Lock release
function releaseLock(lockKey) {
    return __awaiter(this, void 0, void 0, function* () {
        yield redisClient_1.default.del(lockKey);
    });
}
// Function to continuously check for messages with the current timestamp
function startScheduler() {
    setInterval(() => __awaiter(this, void 0, void 0, function* () {
        const now = (Date.now()).toString();
        // Retrieve messages with the current timestamp
        const messages = yield redisClient_1.default.zrangebyscore(REDIS_KEY, "-inf", now);
        // For each message, acquire the lock and process it
        for (const message of messages) {
            const { messageId, content } = JSON.parse(message);
            const lockKey = `lock:${messageId}`;
            // Attempt to acquire the lock
            const lockAcquired = yield acquireLock(lockKey);
            if (lockAcquired) {
                try {
                    // Process the message here
                    console.log(`Processing message: ${content}`);
                    //remove the proccesed message from redis
                    const result = yield redisClient_1.default.zrem(REDIS_KEY, message);
                    // After processing, release the lock
                    yield releaseLock(lockKey);
                }
                catch (err) {
                    console.error(`Error processing message ${content}:`, err);
                    // Ensure that the lock is released even if processing fails
                    yield releaseLock(lockKey);
                }
            }
            else {
                console.log(`Could not acquire lock for message: ${content}`);
            }
        }
    }), 1000);
}
