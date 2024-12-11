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
// Function to continuously check for messages with the current timestamp
function startScheduler() {
    setInterval(() => __awaiter(this, void 0, void 0, function* () {
        const now = Date.now().toString();
        // Retrieve messages with the current timestamp
        const messages = yield redisClient_1.default.zrangebyscore(REDIS_KEY, now, now);
        if (messages.length > 0) {
            console.log(`Messages for timestamp ${now}:`, messages);
        }
    }), 1000); // Check every second
}
