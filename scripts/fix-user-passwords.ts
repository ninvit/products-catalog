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
    console.log('🔐 Starting password security fix...')
    
    const db = await getDatabase()
    const collection = db.collection<UserDocument>('users')

    // Get all users
    const users = await collection.find({}).toArray()
    
    if (users.length === 0) {
      console.log('👥 No users found in database')
      return
    }

    console.log(`👥 Found ${users.length} users to check`)
    
    let fixedCount = 0
    let alreadyHashedCount = 0

    for (const user of users) {
      try {
        // Check if password is already hashed (bcrypt hashes start with $2a$, $2b$, or $2y$)
        const isAlreadyHashed = /^\$2[abyxy]?\$/.test(user.password)
        
        if (isAlreadyHashed) {
          console.log(`✅ User ${user.email} already has hashed password`)
          alreadyHashedCount++
          continue
        }

        // If not hashed, hash the password
        console.log(`🔧 Fixing password for user ${user.email}`)
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
        console.log(`✅ Fixed password for ${user.email}`)
        
      } catch (userError) {
        console.error(`❌ Error fixing password for user ${user.email}:`, userError)
      }
    }

    console.log('\n📊 Password Security Fix Summary:')
    console.log(`✅ Passwords already hashed: ${alreadyHashedCount}`)
    console.log(`🔧 Passwords fixed: ${fixedCount}`)
    console.log(`👥 Total users: ${users.length}`)
    
    if (fixedCount > 0) {
      console.log('🎉 Password security fix completed!')
    } else {
      console.log('✨ All passwords were already secure!')
    }
    
  } catch (error) {
    console.error('❌ Error fixing user passwords:', error)
    throw error
  }
}

// Function to create a test user with properly hashed password
async function createTestUser() {
  try {
    console.log('\n👤 Creating test user...')
    
    const db = await getDatabase()
    const collection = db.collection<UserDocument>('users')

    // Check if test user already exists
    const existingUser = await collection.findOne({ email: 'test@example.com' })
    if (existingUser) {
      console.log('👤 Test user already exists')
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
    console.log('✅ Test user created:')
    console.log('   Email: test@example.com')
    console.log('   Password: 123456')
    console.log('   Password is properly hashed with bcrypt')
    
  } catch (error) {
    console.error('❌ Error creating test user:', error)
  }
}

// Function to verify all passwords are properly hashed
async function verifyPasswordSecurity() {
  try {
    console.log('\n🔍 Verifying password security...')
    
    const db = await getDatabase()
    const collection = db.collection<UserDocument>('users')

    const users = await collection.find({}).toArray()
    
    let secureCount = 0
    let insecureCount = 0

    for (const user of users) {
      const isHashed = /^\$2[abyxy]?\$/.test(user.password)
      
      if (isHashed) {
        secureCount++
        console.log(`✅ ${user.email} - Secure (hashed)`)
      } else {
        insecureCount++
        console.log(`❌ ${user.email} - INSECURE (plaintext)`)
      }
    }

    console.log('\n🛡️ Security Status:')
    console.log(`✅ Secure passwords: ${secureCount}`)
    console.log(`❌ Insecure passwords: ${insecureCount}`)
    
    if (insecureCount === 0) {
      console.log('🎉 All passwords are secure!')
    } else {
      console.log('⚠️  Some passwords need fixing!')
    }
    
  } catch (error) {
    console.error('❌ Error verifying password security:', error)
  }
}

// Main function
async function main() {
  try {
    console.log('🚀 Starting password security maintenance...\n')
    
    // First, verify current state
    await verifyPasswordSecurity()
    
    // Fix any insecure passwords
    await fixUserPasswords()
    
    // Create test user if needed
    await createTestUser()
    
    // Final verification
    await verifyPasswordSecurity()
    
    console.log('\n✨ Password security maintenance completed!')
    
  } catch (error) {
    console.error('💥 Fatal error:', error)
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