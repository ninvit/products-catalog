import 'dotenv/config'
import { getDatabase } from '../lib/mongodb'
import { hashPassword } from '../lib/auth'
import { User } from '../lib/models'
import bcrypt from 'bcryptjs'

interface UserDocument extends User {
  _id?: any
}

async function fixUserPasswords() {
  try {
    
    const db = await getDatabase()
    const collection = db.collection<UserDocument>('users')

    // Get all users
    const users = await collection.find({}).toArray()
    
    if (users.length === 0) {
      return
    }
    
    let fixedCount = 0
    let alreadyHashedCount = 0

    for (const user of users) {
      try {
        // Check if password is already hashed (bcrypt hashes start with $2a$, $2b$, or $2y$)
        const isAlreadyHashed = /^\$2[abyxy]?\$/.test(user.password)
        
        if (isAlreadyHashed) {
          alreadyHashedCount++
          continue
        }

        // If not hashed, hash the password
        const hashedPassword = await hashPassword(user.password)
        
        await collection.updateOne(
          { _id: user._id },
          { 
            $set: { 
              password: hashedPassword,
              updatedAt: new Date()
            }
          }
        )
        
        fixedCount++
        
      } catch (userError) {
      }
    }

    
    
  } catch (error) {
    console.error('❌ Error fixing user passwords:', error)
    throw error
  }
}

// Function to create a test user with properly hashed password
async function createTestUser() {
  try {
    
    const db = await getDatabase()
    const collection = db.collection<UserDocument>('users')

    // Check if test user already exists
    const existingUser = await collection.findOne({ email: 'test@example.com' })
    if (existingUser) {
      return
    }

    // Get next user ID
    const lastUser = await collection.findOne({}, { sort: { id: -1 } })
    const nextId = (lastUser?.id || 0) + 1

    // Create test user with hashed password
    const hashedPassword = await hashPassword('123456')
    
    const testUser: User = {
      id: nextId,
      firstName: 'Test',
      lastName: 'User',
      email: 'test@example.com',
      password: hashedPassword,
      createdAt: new Date(),
      updatedAt: new Date()
    }

    await collection.insertOne(testUser)
    
  } catch (error) {
    console.error('❌ Error creating test user:', error)
  }
}

// Function to verify all passwords are properly hashed
async function verifyPasswordSecurity() {
  try {
    
    const db = await getDatabase()
    const collection = db.collection<UserDocument>('users')

    const users = await collection.find({}).toArray()
    
    let secureCount = 0
    let insecureCount = 0

    for (const user of users) {
      const isHashed = /^\$2[abyxy]?\$/.test(user.password)
      
      if (isHashed) {
        secureCount++
      } else {
        insecureCount++
      }
    }

  
  } catch (error) {
  }
}

// Main function
async function main() {
  try {
    
    // First, verify current state
    await verifyPasswordSecurity()
    
    // Fix any insecure passwords
    await fixUserPasswords()
    
    // Create test user if needed
    await createTestUser()
    
    // Final verification
    await verifyPasswordSecurity()
    
  } catch (error) {
    process.exit(1)
  }
}

// Run if script is executed directly
if (require.main === module) {
  main().then(() => {
    process.exit(0)
  }).catch((error) => {
    console.error(error)
    process.exit(1)
  })
}

export { fixUserPasswords, createTestUser, verifyPasswordSecurity } 