import mongoose from 'mongoose'
import { MongoMemoryServer } from 'mongodb-memory-server'
import dotenv from 'dotenv'

dotenv.config()

let mongoServer

/**
 * Connect to the in-memory database
 */
export const connectDB = async () => {
  // Check if we should use system MongoDB instead of Memory Server
  const useSystemMongo = process.env.USE_SYSTEM_MONGO === 'true' || process.env.MONGO_URI_TEST
  
  if (useSystemMongo) {
    // Use system MongoDB or test URI from environment
    const testMongoUri = process.env.MONGO_URI_TEST || process.env.MONGO_URI_DEV || 'mongodb://localhost:27017/jest-test-db'
    console.log('Using system MongoDB:', testMongoUri)
    await mongoose.connect(testMongoUri)
    return
  }

  try {
    // Try to use MongoDB Memory Server
    mongoServer = await MongoMemoryServer.create({
      instance: {
        dbName: 'jest-test-db'
      },
      binary: {
        version: '7.0.24',
        skipMD5: true
      }
    })

    const mongoUri = mongoServer.getUri()
    await mongoose.connect(mongoUri)
    console.log('Using MongoDB Memory Server')
  } catch (error) {
    // Fallback: Use a test MongoDB URI from environment or local connection
    console.warn('MongoDB Memory Server failed to start, using fallback connection:', error.message)
    console.warn('To avoid this, set USE_SYSTEM_MONGO=true or MONGO_URI_TEST in your environment')
    
    // Try using a test database URI from environment
    const testMongoUri = process.env.MONGO_URI_TEST || process.env.MONGO_URI_DEV || 'mongodb://localhost:27017/jest-test-db'
    
    try {
      await mongoose.connect(testMongoUri)
      console.log('Connected to test database:', testMongoUri)
    } catch (fallbackError) {
      console.error('Failed to connect to fallback database:', fallbackError.message)
      throw new Error(
        'Unable to connect to any test database.\n' +
        'Solutions:\n' +
        '1. Install MongoDB locally and set USE_SYSTEM_MONGO=true\n' +
        '2. Set MONGO_URI_TEST environment variable\n' +
        '3. Check your network connection for MongoDB Memory Server download\n' +
        'See __tests__/TROUBLESHOOTING.md for more details'
      )
    }
  }
}

/**
 * Drop database, close connection and stop mongoServer
 */
export const closeDB = async () => {
  if (mongoose.connection.readyState !== 0) {
    // Drop database for real MongoDB (not needed for Memory Server)
    if (process.env.USE_SYSTEM_MONGO === 'true' || process.env.MONGO_URI_TEST) {
      await mongoose.connection.dropDatabase()
    }
    await mongoose.connection.close()
  }
  if (mongoServer) {
    await mongoServer.stop()
    mongoServer = null
  }
}

/**
 * Clear all test data from database
 */
export const clearDB = async () => {
  if (mongoose.connection.readyState === 0) {
    return // Not connected
  }

  const db = mongoose.connection.db
  if (!db) {
    return
  }

  const useSystemMongo = process.env.USE_SYSTEM_MONGO === 'true' || process.env.MONGO_URI_TEST
  
  if (useSystemMongo) {
    // For real MongoDB, drop all collections to ensure clean state
    const collections = await db.listCollections().toArray()
    
    await Promise.all(
      collections
        .map(collection => collection.name)
        .filter(name => !name.startsWith('system.'))
        .map(async (collectionName) => {
          try {
            await db.collection(collectionName).drop()
          } catch (error) {
            // Ignore if collection doesn't exist
            if (error.codeName !== 'NamespaceNotFound') {
              throw error
            }
          }
        })
    )
    
    // Rebuild indexes by syncing Mongoose models
    // This ensures indexes are recreated for the next test
    const modelNames = Object.keys(mongoose.models)
    for (const modelName of modelNames) {
      try {
        await mongoose.models[modelName].createIndexes()
      } catch (error) {
        // Ignore errors if model doesn't need indexes
      }
    }
    
    return
  }

  // For MongoDB Memory Server, just delete documents
  const collections = await db.listCollections().toArray()
  await Promise.all(
    collections
      .map(collection => collection.name)
      .filter(name => !name.startsWith('system.'))
      .map(collectionName => 
        db.collection(collectionName).deleteMany({})
      )
  )
}

