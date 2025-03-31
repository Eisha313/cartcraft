import { MongoClient, Db, MongoClientOptions } from 'mongodb';

if (!process.env.MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable inside .env.local');
}

const uri: string = process.env.MONGODB_URI;
const dbName: string = process.env.MONGODB_DB_NAME || 'cartcraft';

const options: MongoClientOptions = {
  maxPoolSize: 10,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
};

let client: MongoClient;
let clientPromise: Promise<MongoClient>;

declare global {
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

if (process.env.NODE_ENV === 'development') {
  if (!global._mongoClientPromise) {
    client = new MongoClient(uri, options);
    global._mongoClientPromise = client.connect();
  }
  clientPromise = global._mongoClientPromise;
} else {
  client = new MongoClient(uri, options);
  clientPromise = client.connect();
}

export async function getDatabase(): Promise<Db> {
  try {
    const client = await clientPromise;
    return client.db(dbName);
  } catch (error) {
    console.error('Failed to connect to MongoDB:', error);
    throw new Error('Database connection failed. Please try again later.');
  }
}

export async function isConnected(): Promise<boolean> {
  try {
    const client = await clientPromise;
    await client.db(dbName).command({ ping: 1 });
    return true;
  } catch (error) {
    console.error('MongoDB connection check failed:', error);
    return false;
  }
}

export async function closeConnection(): Promise<void> {
  try {
    const client = await clientPromise;
    await client.close();
  } catch (error) {
    console.error('Failed to close MongoDB connection:', error);
  }
}

export { clientPromise };
export default clientPromise;
