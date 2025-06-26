import { MongoClient } from 'mongodb'

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/products-catalog'

async function findAndSetAdmin() {
  const client = new MongoClient(MONGODB_URI)
  
  try {
    await client.connect()
    console.log('✅ Connected to MongoDB')
    console.log('📍 Connection URI:', MONGODB_URI)
    
    const db = client.db()
    console.log('📊 Database name:', db.databaseName)
    
    // List all collections
    const collections = await db.listCollections().toArray()
    console.log('\n📁 Available collections:', collections.map(c => c.name))
    
    const usersCollection = db.collection('users')
    
    // Count total users
    const totalUsers = await usersCollection.countDocuments()
    console.log(`\n👥 Total users in collection: ${totalUsers}`)
    
    if (totalUsers === 0) {
      console.log('⚠️  No users found in the users collection')
      console.log('💡 Make sure you have registered users in your application')
      return
    }
    
    // Show all users with all fields
    console.log('\n🔍 All users in database:')
    const allUsers = await usersCollection.find({}).toArray()
    allUsers.forEach((user, index) => {
      console.log(`\n📋 User ${index + 1}:`)
      console.log(`  - ID: ${user.id}`)
      console.log(`  - Email: "${user.email}"`)
      console.log(`  - Name: ${user.firstName} ${user.lastName}`)
      console.log(`  - Role: ${user.role || 'not set'}`)
      console.log(`  - MongoDB _id: ${user._id}`)
    })
    
    // Try to find user by email (exact match)
    const userByEmail = await usersCollection.findOne({ email: 'ninvit@gmail.com' })
    console.log('\n🔍 Search by email "ninvit@gmail.com":', userByEmail ? 'FOUND' : 'NOT FOUND')
    
    // Try to find user by ID
    const userById = await usersCollection.findOne({ id: 1 })
    console.log('🔍 Search by ID 1:', userById ? 'FOUND' : 'NOT FOUND')
    
    // Interactive update - try different approaches
    let targetUser = null
    
    // Approach 1: By exact email
    if (userByEmail) {
      targetUser = userByEmail
      console.log('\n✅ Found user by email')
    }
    // Approach 2: By ID
    else if (userById) {
      targetUser = userById
      console.log('\n✅ Found user by ID')
    }
    // Approach 3: Find any user with email containing "ninvit"
    else {
      const userByPartialEmail = await usersCollection.findOne({ 
        email: { $regex: /ninvit/i } 
      })
      if (userByPartialEmail) {
        targetUser = userByPartialEmail
        console.log('\n✅ Found user by partial email match')
      }
    }
    
    if (targetUser) {
      console.log(`\n🎯 Target user found:`)
      console.log(`  - Email: ${targetUser.email}`)
      console.log(`  - Name: ${targetUser.firstName} ${targetUser.lastName}`)
      console.log(`  - Current role: ${targetUser.role || 'not set'}`)
      
      // Update to admin
      const updateResult = await usersCollection.updateOne(
        { _id: targetUser._id },
        { $set: { role: 'admin' } }
      )
      
      if (updateResult.modifiedCount > 0) {
        console.log('\n🎉 SUCCESS: User has been set as admin!')
      } else {
        console.log('\n⚠️  Update matched but no changes made (user might already be admin)')
      }
      
      // Verify the update
      const updatedUser = await usersCollection.findOne({ _id: targetUser._id })
      console.log(`\n✅ Verification - User role is now: ${updatedUser?.role}`)
      
    } else {
      console.log('\n❌ No user found matching the criteria')
      console.log('💡 Please check:')
      console.log('   - Is the user registered in your application?')
      console.log('   - Is the email address correct?')
      console.log('   - Are you connected to the right database?')
    }
    
    // Also set default role for any users without a role
    const updateResult = await usersCollection.updateMany(
      { role: { $exists: false } },
      { $set: { role: 'user' } }
    )
    
    if (updateResult.modifiedCount > 0) {
      console.log(`\n✅ Updated ${updateResult.modifiedCount} users with default 'user' role`)
    }
    
  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await client.close()
    console.log('\n🔌 Database connection closed')
  }
}

// Run the script
findAndSetAdmin().catch(console.error) 