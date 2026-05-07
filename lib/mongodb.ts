import { MongoClient } from "mongodb";
import { env } from "@/env";

declare global {
  var __turdsoutMongoClientPromise: Promise<MongoClient> | undefined;
}

const uri = env.MONGODB_URI;

let clientPromise: Promise<MongoClient>;

if (process.env.NODE_ENV === "development") {
  if (!global.__turdsoutMongoClientPromise) {
    const client = new MongoClient(uri);
    global.__turdsoutMongoClientPromise = client.connect();
  }
  clientPromise = global.__turdsoutMongoClientPromise;
} else {
  const client = new MongoClient(uri);
  clientPromise = client.connect();
}

export default clientPromise;
