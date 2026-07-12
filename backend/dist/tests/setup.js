"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const prismaClient_1 = __importDefault(require("../src/config/prismaClient"));
beforeAll(async () => {
    // Clear the DB entirely before tests run
    const tablenames = await prismaClient_1.default.$queryRaw `
    SELECT tablename FROM pg_tables WHERE schemaname='public'
  `;
    const tables = tablenames
        .map(({ tablename }) => tablename)
        .filter((name) => name !== '_prisma_migrations')
        .map((name) => `"public"."${name}"`)
        .join(', ');
    try {
        if (tables) {
            await prismaClient_1.default.$executeRawUnsafe(`TRUNCATE TABLE ${tables} CASCADE;`);
        }
    }
    catch (error) {
        console.log({ error });
    }
});
afterAll(async () => {
    await prismaClient_1.default.$disconnect();
});
