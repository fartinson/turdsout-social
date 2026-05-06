import mongoose from "mongoose";
import { env } from "@/env";

declare global {
  // eslint-disable-next-line no-var
  var __turdsoutMongooseConn: { conn: typeof mongoose | null; promise: Promise<typeof mongoose> | null } | undefined;
}

const globalState =
  global.__turdsoutMongooseConn ?? (global.__turdsoutMongooseConn = { conn: null, promise: null });

export async function connectMongoose() {
  if (globalState.conn) return globalState.conn;

  if (!globalState.promise) {
    globalState.promise = mongoose.connect(env.MONGODB_URI, {
      dbName: env.MONGODB_DB,
      bufferCommands: false,
    });
  }

  globalState.conn = await globalState.promise;
  return globalState.conn;
}

