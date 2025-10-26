/**
 * Migration Script: Move power_capacity from ChargingPoint to Station
 * 
 * Mục đích:
 * - Thêm field power_capacity vào Station
 * - Xóa field power_capacity từ ChargingPoint
 * 
 * Cách chạy:
 * 1. Kết nối MongoDB
 * 2. node migrations/migrate_power_capacity.js
 */

const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const Station = require('../models/Station');
const ChargingPoint = require('../models/ChargingPoint');

// Database connection
const DB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/evdriver';

async function migratePowerCapacity() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(DB_URI);
    console.log('✅ Connected to MongoDB\n');

    // ========== BƯỚC 1: Kiểm tra dữ liệu hiện tại ==========
    console.log('📊 BƯỚC 1: Kiểm tra dữ liệu hiện tại...');
    const stations = await Station.find();
    const chargingPoints = await ChargingPoint.find().populate('stationId');

    console.log(`   - Tổng số Station: ${stations.length}`);
    console.log(`   - Tổng số ChargingPoint: ${chargingPoints.length}`);

    // Kiểm tra station nào chưa có power_capacity
    const stationsWithoutPower = stations.filter(s => !s.power_capacity);
    console.log(`   - Station chưa có power_capacity: ${stationsWithoutPower.length}\n`);

    // ========== BƯỚC 2: Cập nhật Station ==========
    console.log('🔧 BƯỚC 2: Cập nhật power_capacity cho Station...');
    
    if (stationsWithoutPower.length > 0) {
      // Tạo map: stationId -> avg power_capacity từ charging points của nó
      const stationPowerMap = {};
      
      for (const cp of chargingPoints) {
        if (cp.power_capacity && cp.stationId) {
          const stationId = cp.stationId._id.toString();
          if (!stationPowerMap[stationId]) {
            stationPowerMap[stationId] = [];
          }
          stationPowerMap[stationId].push(cp.power_capacity);
        }
      }

      // Cập nhật từng station
      for (const station of stationsWithoutPower) {
        const stationId = station._id.toString();
        let powerCapacity = 50; // Giá trị mặc định

        // Nếu có charging points, lấy giá trị phổ biến nhất
        if (stationPowerMap[stationId] && stationPowerMap[stationId].length > 0) {
          const powers = stationPowerMap[stationId];
          // Lấy giá trị đầu tiên (hoặc có thể tính trung bình)
          powerCapacity = powers[0];
        }

        await Station.findByIdAndUpdate(station._id, {
          $set: { power_capacity: powerCapacity }
        });

        console.log(`   ✓ Updated Station "${station.name}" với power_capacity = ${powerCapacity} kW`);
      }
      console.log(`\n✅ Đã cập nhật ${stationsWithoutPower.length} stations\n`);
    } else {
      console.log('   ✓ Tất cả Station đã có power_capacity\n');
    }

    // ========== BƯỚC 3: Xóa power_capacity từ ChargingPoint ==========
    console.log('🗑️  BƯỚC 3: Xóa power_capacity từ ChargingPoint...');
    
    const cpWithPower = await ChargingPoint.countDocuments({ 
      power_capacity: { $exists: true } 
    });

    if (cpWithPower > 0) {
      const result = await ChargingPoint.updateMany(
        { power_capacity: { $exists: true } },
        { $unset: { power_capacity: "" } }
      );
      
      console.log(`   ✓ Đã xóa power_capacity từ ${result.modifiedCount} charging points\n`);
    } else {
      console.log('   ✓ ChargingPoint không còn field power_capacity\n');
    }

    // ========== BƯỚC 4: Kiểm tra kết quả ==========
    console.log('🔍 BƯỚC 4: Kiểm tra kết quả migration...');
    
    const finalStations = await Station.find();
    const finalChargingPoints = await ChargingPoint.find();

    const stationsWithPower = finalStations.filter(s => s.power_capacity);
    const cpStillHasPower = finalChargingPoints.filter(cp => cp.power_capacity);

    console.log('   📋 Kết quả:');
    console.log(`   - Station có power_capacity: ${stationsWithPower.length}/${finalStations.length}`);
    console.log(`   - ChargingPoint còn power_capacity: ${cpStillHasPower.length}/${finalChargingPoints.length}`);

    if (stationsWithPower.length === finalStations.length && cpStillHasPower.length === 0) {
      console.log('\n✅ MIGRATION THÀNH CÔNG!\n');
      
      // Hiển thị một vài ví dụ
      console.log('📌 Ví dụ Station sau migration:');
      const sampleStation = finalStations[0];
      console.log(`   - Name: ${sampleStation.name}`);
      console.log(`   - Power Capacity: ${sampleStation.power_capacity} kW`);
      console.log(`   - Connector Type: ${sampleStation.connector_type}\n`);
    } else {
      console.log('\n⚠️  CÓ VẤN ĐỀ! Vui lòng kiểm tra lại.\n');
    }

  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Đã đóng kết nối MongoDB');
  }
}

// Chạy migration
if (require.main === module) {
  migratePowerCapacity();
}

module.exports = migratePowerCapacity;
