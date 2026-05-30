import dotenv from 'dotenv';
import mongoose from 'mongoose';

dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

const MONGODB_URL = process.env.MONGODB_URL;

if (!MONGODB_URL) {
  console.error('Missing MONGODB_URL in environment');
  process.exit(1);
}

await mongoose.connect(MONGODB_URL, {
  serverSelectionTimeoutMS: 30000,
  socketTimeoutMS: 45000,
  family: 4
});

console.log('Connected to MongoDB');

const db = mongoose.connection.db;

const reviewResult = await db.collection('reviews').updateMany(
  { embedding: { $exists: true } },
  { $unset: { embedding: '' } }
);

const postResult = await db.collection('posts').updateMany(
  { embedding: { $exists: true } },
  { $unset: { embedding: '' } }
);

console.log(`Reviews updated: ${reviewResult.modifiedCount || 0}`);
console.log(`Posts updated: ${postResult.modifiedCount || 0}`);

await mongoose.disconnect();
console.log('Done');
process.exit(0);
