/**
 * Migration Script: Update ChargingSession with Battery Fields
 * 
 * Adds/updates the following fields for completed sessions:
 * - final_battery_percentage
 * - battery_charged_percentage
 * - target_reached
 * - power_capacity_kw
 * 
 * Calculates values based on existing data.
 */

const mongoose = require('mongoose');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/evdriver';

async function migrateChargingSessions() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const db = mongoose.connection.db;
    const sessionsCollection = db.collection('chargingsessions');

    // 1. Kiểm tra số lượng sessions
    const totalSessions = await sessionsCollection.countDocuments();
    console.log(`\n📊 Total charging sessions: ${totalSessions}`);

    const completedSessions = await sessionsCollection.countDocuments({ status: 'completed' });
    console.log(`🔋 Completed sessions: ${completedSessions}`);

    // 2. Kiểm tra sessions chưa có battery fields
    const sessionsWithoutBatteryFields = await sessionsCollection.countDocuments({
      status: 'completed',
      battery_charged_percentage: { $exists: false }
    });
    console.log(`🔍 Sessions without battery_charged_percentage: ${sessionsWithoutBatteryFields}`);

    if (sessionsWithoutBatteryFields === 0) {
      console.log('\n✅ All completed sessions already have battery fields!');
      console.log('No migration needed.');
      process.exit(0);
    }

    // 3. Update sessions
    console.log('\n🔄 Starting migration...');
    
    const sessions = await sessionsCollection.find({
      status: 'completed',
      battery_charged_percentage: { $exists: false }
    }).toArray();

    let updated = 0;
    for (const session of sessions) {
      const initial = session.initial_battery_percentage || 0;
      const current = session.current_battery_percentage || initial;
      const target = session.target_battery_percentage || 100;
      
      const final_battery = current;
      const battery_charged = final_battery - initial;
      const target_reached = final_battery >= target;

      await sessionsCollection.updateOne(
        { _id: session._id },
        {
          $set: {
            final_battery_percentage: final_battery,
            battery_charged_percentage: battery_charged,
            target_reached: target_reached
          }
        }
      );
      
      updated++;
      if (updated % 10 === 0) {
        console.log(`Updated ${updated}/${sessions.length} sessions...`);
      }
    }

    console.log(`\n✅ Migration completed!`);
    console.log(`📝 Updated ${updated} sessions`);

    // 4. Verify migration
    console.log('\n🔍 Verifying migration...');
    const sampleSession = await sessionsCollection.findOne({ status: 'completed' });
    console.log('\nSample session after migration:');
    console.log(JSON.stringify({
      _id: sampleSession._id,
      status: sampleSession.status,
      initial_battery_percentage: sampleSession.initial_battery_percentage,
      final_battery_percentage: sampleSession.final_battery_percentage,
      battery_charged_percentage: sampleSession.battery_charged_percentage,
      target_battery_percentage: sampleSession.target_battery_percentage,
      target_reached: sampleSession.target_reached
    }, null, 2));

    const allHaveBatteryFields = await sessionsCollection.countDocuments({
      status: 'completed',
      battery_charged_percentage: { $exists: true }
    });
    console.log(`\n✅ Completed sessions with battery fields: ${allHaveBatteryFields}/${completedSessions}`);

    if (allHaveBatteryFields === completedSessions) {
      console.log('\n🎉 Migration successful! All sessions updated.');
    } else {
      console.log('\n⚠️  Warning: Some sessions may not have been updated.');
    }

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  }
}

// Run migration
migrateChargingSessions();
