import { MongoClient } from 'mongodb'

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/products-catalog'

async function updateUserRoles() {
  const client = new MongoClient(MONGODB_URI)
  
  try {
    await client.connect()
    console.log('✅ Connected to MongoDB')
    
    const db = client.db()
    const usersCollection = db.collection('users')
    
    // First, add role field to all existing users without a role (default to 'user')
    const updateResult = await usersCollection.updateMany(
      { role: { $exists: false } },
      { $set: { role: 'user' } }
    )
    
    console.log(`✅ Updated ${updateResult.modifiedCount} users with default 'user' role`)
    
    // Debug: Show all users first
    console.log('\n🔍 Looking for users in database...')
    const allUsers = await usersCollection.find({}, { 
      projection: { email: 1, id: 1, firstName: 1, lastName: 1, _id: 0 }
    }).toArray()
    
    console.log('Found users:', allUsers)
    
    // Set ninvit@gmail.com as admin (case insensitive search)
    const adminUpdateResult = await usersCollection.updateOne(
      { $or: [
        { email: 'ninvit@gmail.com' },
        { email: { $regex: /^ninvit@gmail\.com$/i } },
        { id: 1 } // Also try by ID as backup
      ]},
      { $set: { role: 'admin' } }
    )
    
    if (adminUpdateResult.matchedCount > 0) {
      console.log('✅ Successfully set ninvit@gmail.com (or user ID 1) as admin')
    } else {
      console.log('⚠️  User ninvit@gmail.com not found in database')
      console.log('⚠️  Also tried user ID 1 as backup')
    }
    
    // Show current users and their roles
    const users = await usersCollection.find({}, { 
      projection: { email: 1, firstName: 1, lastName: 1, role: 1, _id: 0 }
    }).toArray()
    
    console.log('\n📋 Current users and roles:')
    users.forEach(user => {
      console.log(`  - ${user.email} (${user.firstName} ${user.lastName}): ${user.role}`)
    })
    
  } catch (error) {
    console.error('❌ Error updating user roles:', error)
  } finally {
    await client.close()
    console.log('\n🔌 Database connection closed')
  }
}

// Run the script
updateUserRoles().catch(console.error) 