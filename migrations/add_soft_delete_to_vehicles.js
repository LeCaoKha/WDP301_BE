/**
 * Migration Script: Add Soft Delete Fields to Vehicles
 * 
 * Adds the following fields to all existing vehicles:
 * - isActive: true (default - all existing vehicles are active)
 * - deletedAt: null
 * - deletedReason: null
 * 
 * Run this script once to update existing vehicles in database.
 */

const mongoose = require('mongoose');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/evdriver';

async function migrateVehicles() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const db = mongoose.connection.db;
    const vehiclesCollection = db.collection('vehicles');

    // 1. Kiểm tra số lượng vehicles hiện tại
    const totalVehicles = await vehiclesCollection.countDocuments();
    console.log(`\n📊 Total vehicles in database: ${totalVehicles}`);

    // 2. Kiểm tra vehicles chưa có soft delete fields
    const vehiclesWithoutSoftDelete = await vehiclesCollection.countDocuments({
      isActive: { $exists: false }
    });
    console.log(`🔍 Vehicles without soft delete fields: ${vehiclesWithoutSoftDelete}`);

    if (vehiclesWithoutSoftDelete === 0) {
      console.log('\n✅ All vehicles already have soft delete fields!');
      console.log('No migration needed.');
      process.exit(0);
    }

    // 3. Update vehicles chưa có fields
    console.log('\n🔄 Starting migration...');
    
    const result = await vehiclesCollection.updateMany(
      { isActive: { $exists: false } },
      {
        $set: {
          isActive: true,
          deletedAt: null,
          deletedReason: null
        }
      }
    );

    console.log(`\n✅ Migration completed!`);
    console.log(`📝 Updated ${result.modifiedCount} vehicles`);

    // 4. Tạo index cho isActive để query nhanh
    console.log('\n🔍 Creating index on isActive field...');
    await vehiclesCollection.createIndex({ isActive: 1 });
    console.log('✅ Index created successfully');

    // 5. Verify migration
    console.log('\n🔍 Verifying migration...');
    const sampleVehicle = await vehiclesCollection.findOne({});
    console.log('\nSample vehicle after migration:');
    console.log(JSON.stringify(sampleVehicle, null, 2));

    const allHaveSoftDelete = await vehiclesCollection.countDocuments({
      isActive: { $exists: true }
    });
    console.log(`\n✅ Vehicles with soft delete fields: ${allHaveSoftDelete}/${totalVehicles}`);

    if (allHaveSoftDelete === totalVehicles) {
      console.log('\n🎉 Migration successful! All vehicles updated.');
    } else {
      console.log('\n⚠️  Warning: Some vehicles may not have been updated.');
    }

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  }
}

// Run migration
migrateVehicles();
