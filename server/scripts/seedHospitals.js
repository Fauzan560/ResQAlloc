/**
 * Hospital Data Import Script
 * 
 * Imports the 99 Hyderabad hospitals from the CSV dataset.
 * Also creates:
 * - Default admin user
 * - Demo responder and hospital_staff users
 * - Synthetic resource availability for each hospital
 * 
 * Usage: npm run seed
 * 
 * NOTE: This script will clear existing data. Use with caution.
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const Hospital = require('../models/Hospital');
const HospitalResource = require('../models/HospitalResource');
const User = require('../models/User');
const AuditLog = require('../models/AuditLog');

async function seed() {
  try {
    await connectDB();
    console.log('\n🌱 Starting database seed...\n');

    // Clear existing data
    console.log('🗑️  Clearing existing data...');
    await Promise.all([
      Hospital.deleteMany({}),
      HospitalResource.deleteMany({}),
      User.deleteMany({}),
      AuditLog.deleteMany({})
    ]);

    // 1. Import hospitals from CSV
    console.log('🏥 Importing hospitals from CSV...');
    const hospitals = await importHospitalsFromCSV();
    console.log(`   ✅ Imported ${hospitals.length} hospitals`);

    // 2. Create resource entries for each hospital
    console.log('📊 Creating synthetic resource data...');
    const resources = await createResourceEntries(hospitals);
    console.log(`   ✅ Created ${resources.length} resource entries`);

    // 3. Create demo users
    console.log('👤 Creating demo users...');
    const users = await createDemoUsers(hospitals);
    console.log(`   ✅ Created ${users.length} users`);

    // 4. Log the import
    await AuditLog.log({
      action: 'data_imported',
      description: `Seeded database: ${hospitals.length} hospitals, ${resources.length} resource entries, ${users.length} users`,
      targetModel: 'System'
    });

    console.log('\n✅ Database seeded successfully!\n');
    console.log('📋 Demo Accounts:');
    console.log('   Admin:          admin@resqalloc.demo / admin123demo');
    console.log('   Responder:      responder@resqalloc.demo / responder123');
    console.log('   Hospital Staff: staff@resqalloc.demo / staff123');
    console.log('   (assigned to:', hospitals[0]?.name, ')\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Seed error:', error);
    process.exit(1);
  }
}

function importHospitalsFromCSV() {
  return new Promise((resolve, reject) => {
    const hospitals = [];
    const csvPath = path.join(__dirname, '..', '..', 'data', 'hyderabad_hospitals.csv');

    if (!fs.existsSync(csvPath)) {
      reject(new Error(`CSV file not found at ${csvPath}`));
      return;
    }

    fs.createReadStream(csvPath)
      .pipe(csv())
      .on('data', (row) => {
        hospitals.push({
          csvId: parseInt(row.id),
          name: row.name,
          type: row.type,
          address: row.address,
          area: row.area,
          city: row.city || 'Hyderabad',
          state: row.state || 'Telangana',
          pincode: row.pincode,
          location: {
            type: 'Point',
            coordinates: [
              parseFloat(row.longitude),
              parseFloat(row.latitude)
            ]
          },
          locationVerified: row.location_verified || 'approximate',
          capacityVerified: row.capacity_verified || 'synthetic',
          phone: row.phone,
          specialties: row.specialties ? row.specialties.split(',').map(s => s.trim()) : [],
          hasEmergency: row.has_emergency === 'Yes',
          hasTraumaCenter: row.has_trauma_center === 'Yes',
          hasBloodBank: row.has_blood_bank === 'Yes',
          totalBeds: parseInt(row.total_beds) || 0,
          icuBeds: parseInt(row.icu_beds) || 0,
          ventilators: parseInt(row.ventilators) || 0,
          ambulances: parseInt(row.ambulances) || 0,
          operatingTheaters: parseInt(row.operating_theaters) || 0,
          establishedYear: parseInt(row.established_year) || null,
          accreditation: row.accreditation,
          isActive: true
        });
      })
      .on('end', async () => {
        try {
          const created = await Hospital.insertMany(hospitals);
          resolve(created);
        } catch (err) {
          reject(err);
        }
      })
      .on('error', reject);
  });
}

async function createResourceEntries(hospitals) {
  const resources = hospitals.map(hospital => ({
    hospital: hospital._id,
    generalBeds: {
      total: hospital.totalBeds - hospital.icuBeds,
      available: Math.floor((hospital.totalBeds - hospital.icuBeds) * (0.2 + Math.random() * 0.3))
    },
    icuBeds: {
      total: hospital.icuBeds,
      available: Math.floor(hospital.icuBeds * (0.1 + Math.random() * 0.4))
    },
    ventilators: {
      total: hospital.ventilators,
      available: Math.floor(hospital.ventilators * (0.2 + Math.random() * 0.4))
    },
    operatingTheaters: {
      total: hospital.operatingTheaters,
      available: Math.floor(hospital.operatingTheaters * (0.3 + Math.random() * 0.4))
    },
    emergencyDoctors: {
      total: Math.max(2, Math.floor(hospital.totalBeds / 50)),
      available: Math.max(1, Math.floor(hospital.totalBeds / 100))
    },
    surgeons: {
      total: Math.max(1, Math.floor(hospital.totalBeds / 80)),
      available: Math.max(0, Math.floor(hospital.totalBeds / 160))
    },
    nurses: {
      total: Math.max(3, Math.floor(hospital.totalBeds / 10)),
      available: Math.max(1, Math.floor(hospital.totalBeds / 25))
    },
    bloodBankStatus: hospital.hasBloodBank 
      ? (Math.random() > 0.2 ? 'available' : 'limited')
      : 'unavailable',
    ambulancesAvailable: Math.floor(hospital.ambulances * (0.3 + Math.random() * 0.5)),
    acceptingEmergencies: hospital.hasEmergency ? (Math.random() > 0.1) : false,
    divertStatus: Math.random() > 0.9 ? 'partial' : 'none',
    dataSource: 'synthetic'
  }));

  return await HospitalResource.insertMany(resources);
}

async function createDemoUsers(hospitals) {
  const users = [
    {
      name: 'Admin User',
      email: process.env.ADMIN_EMAIL || 'admin@resqalloc.demo',
      password: process.env.ADMIN_PASSWORD || 'admin123demo',
      role: 'admin',
      phone: '9999999999'
    },
    {
      name: 'Demo Responder',
      email: 'responder@resqalloc.demo',
      password: 'responder123',
      role: 'responder',
      phone: '9999999998'
    },
    {
      name: 'Hospital Staff (NIMS)',
      email: 'staff@resqalloc.demo',
      password: 'staff123',
      role: 'hospital_staff',
      phone: '9999999997',
      assignedHospital: hospitals[0]?._id
    },
    {
      name: 'Hospital Staff (Apollo)',
      email: 'staff2@resqalloc.demo',
      password: 'staff123',
      role: 'hospital_staff',
      phone: '9999999996',
      assignedHospital: hospitals[3]?._id // Apollo Hospitals
    }
  ];

  const createdUsers = [];
  for (const userData of users) {
    const user = await User.create(userData);
    createdUsers.push(user);
  }

  return createdUsers;
}

seed();
