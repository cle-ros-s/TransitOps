"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = __importDefault(require("./app"));
const env_1 = require("./config/env");
const prismaClient_1 = __importDefault(require("./config/prismaClient"));
async function startServer() {
    try {
        await prismaClient_1.default.$connect();
        console.log('✅ Connected to database');
        const port = env_1.env.PORT;
        app_1.default.listen(port, () => {
            console.log(`🚀 Server running on port ${port} in ${env_1.env.NODE_ENV} mode`);
        });
    }
    catch (error) {
        console.error('❌ Failed to start server:', error);
        process.exit(1);
    }
}
startServer();
