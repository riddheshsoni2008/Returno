import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Resolve current directory for ESM
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '.env') });

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('Error: MONGODB_URI environment variable is missing.');
  process.exit(1);
}

// Import New Models
import Business from './src/models/Business.js';
import Customer from './src/models/Customer.js';
import Checkin from './src/models/Checkin.js';

async function runMigration() {
  try {
    console.log('Connecting to database...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB successfully.');

    const db = mongoose.connection.db;

    // 1. Get list of collections in the database
    const collections = await db.listCollections().toArray();
    const collectionNames = collections.map(c => c.name);
    console.log('Existing collections:', collectionNames);

    // ==========================================
    // STEP 1: Migrate campaigns -> businesses.campaigns
    // ==========================================
    if (collectionNames.includes('campaigns')) {
      console.log('\n--- Migrating campaigns to businesses... ---');
      const oldCampaigns = await db.collection('campaigns').find({}).toArray();
      console.log(`Found ${oldCampaigns.length} campaigns to migrate.`);

      let migratedCampaignsCount = 0;
      for (const oldCamp of oldCampaigns) {
        const business = await Business.findById(oldCamp.businessId);
        if (!business) {
          console.warn(`Warning: Business with ID ${oldCamp.businessId} not found for campaign "${oldCamp.title}". Skipping.`);
          continue;
        }

        // Check if campaign already embedded
        const exists = business.campaigns.some(c => c._id.toString() === oldCamp._id.toString());
        if (!exists) {
          business.campaigns.push({
            _id: oldCamp._id,
            title: oldCamp.title,
            description: oldCamp.description,
            requiredStamps: oldCamp.requiredStamps,
            rewardTitle: oldCamp.rewardTitle,
            isActive: oldCamp.isActive !== undefined ? oldCamp.isActive : true,
            expiryDate: oldCamp.expiryDate,
            pointsPerCheckin: oldCamp.pointsPerCheckin !== undefined ? oldCamp.pointsPerCheckin : 10,
            streakBonusMultiplier: oldCamp.streakBonusMultiplier !== undefined ? oldCamp.streakBonusMultiplier : 1,
            maxStreak: oldCamp.maxStreak !== undefined ? oldCamp.maxStreak : 30,
            joinQrToken: oldCamp.joinQrToken,
            createdAt: oldCamp.createdAt,
            updatedAt: oldCamp.updatedAt
          });
          await business.save();
          migratedCampaignsCount++;
        }
      }
      console.log(`Successfully embedded ${migratedCampaignsCount} campaigns inside Business documents.`);
    } else {
      console.log('\nSkipping Campaign migration: "campaigns" collection does not exist.');
    }

    // ==========================================
    // STEP 2: Migrate customercampaigns & rewards -> customers.joinedCampaigns
    // ==========================================
    if (collectionNames.includes('customercampaigns')) {
      console.log('\n--- Migrating customercampaigns and rewards to customers... ---');
      const oldCustomerCampaigns = await db.collection('customercampaigns').find({}).toArray();
      console.log(`Found ${oldCustomerCampaigns.length} customer enrollments to migrate.`);

      let migratedEnrollmentsCount = 0;
      for (const cc of oldCustomerCampaigns) {
        const customer = await Customer.findById(cc.customerId);
        if (!customer) {
          console.warn(`Warning: Customer with ID ${cc.customerId} not found. Skipping.`);
          continue;
        }

        // Check if enrollment already embedded
        const exists = customer.joinedCampaigns.some(
          jc => jc.campaignId.toString() === cc.campaignId.toString()
        );

        if (!exists) {
          // Resolve businessId (if not stored in old enrollment, fetch from campaign)
          let businessId = cc.businessId;
          if (!businessId) {
            const biz = await Business.findOne({ "campaigns._id": cc.campaignId });
            businessId = biz ? biz._id : null;
          }

          if (!businessId) {
            console.warn(`Warning: Could not find businessId for campaign ID ${cc.campaignId}. Skipping enrollment.`);
            continue;
          }

          // Fetch rewards earned by this customer for this campaign
          let mappedRewards = [];
          if (collectionNames.includes('rewards')) {
            const oldRewards = await db.collection('rewards').find({
              customerId: cc.customerId,
              campaignId: cc.campaignId
            }).toArray();

            mappedRewards = oldRewards.map(r => ({
              _id: r._id,
              rewardTitle: r.rewardTitle,
              status: r.status || 'unredeemed',
              unlockedAt: r.unlockedAt || r.createdAt || new Date(),
              redeemedAt: r.redeemedAt
            }));
          }

          customer.joinedCampaigns.push({
            campaignId: cc.campaignId,
            businessId: businessId,
            currentStreak: cc.currentStreak !== undefined ? cc.currentStreak : 0,
            longestStreak: cc.longestStreak !== undefined ? cc.longestStreak : 0,
            totalPoints: cc.totalPoints !== undefined ? cc.totalPoints : 0,
            totalCheckins: cc.totalCheckins !== undefined ? cc.totalCheckins : 0,
            lastCheckinDate: cc.lastCheckinDate,
            joinedAt: cc.joinedAt || cc.createdAt || new Date(),
            rewards: mappedRewards
          });

          await customer.save();
          migratedEnrollmentsCount++;
        }
      }
      console.log(`Successfully embedded ${migratedEnrollmentsCount} enrollments and rewards inside Customer documents.`);
    } else {
      console.log('\nSkipping Enrollment migration: "customercampaigns" collection does not exist.');
    }

    // ==========================================
    // STEP 3: Migrate visits -> checkins
    // ==========================================
    if (collectionNames.includes('visits')) {
      console.log('\n--- Migrating visits to checkins... ---');
      const oldVisits = await db.collection('visits').find({}).toArray();
      console.log(`Found ${oldVisits.length} visits to migrate.`);

      let migratedVisitsCount = 0;
      for (const visit of oldVisits) {
        // Prevent duplicate migrations
        const exists = await Checkin.findOne({
          campaignId: visit.campaignId,
          billNumber: visit.billNumber.trim().toUpperCase()
        });

        if (!exists) {
          // Resolve businessId from campaign
          const biz = await Business.findOne({ "campaigns._id": visit.campaignId });
          if (!biz) {
            console.warn(`Warning: Business not found for campaign ID ${visit.campaignId}. Skipping visit stamp.`);
            continue;
          }

          await Checkin.create({
            customerId: visit.customerId,
            businessId: biz._id,
            campaignId: visit.campaignId,
            billNumber: visit.billNumber.trim().toUpperCase(),
            amount: visit.amount,
            pointsAwarded: 0,
            streakAtCheckin: 0,
            location: visit.location,
            createdAt: visit.createdAt || new Date(),
            updatedAt: visit.updatedAt || new Date()
          });
          migratedVisitsCount++;
        }
      }
      console.log(`Successfully migrated ${migratedVisitsCount} visit stamps to Checkin documents.`);
    } else {
      console.log('\nSkipping Visit migration: "visits" collection does not exist.');
    }

    console.log('\n==========================================');
    console.log('Migration successfully completed!');
    console.log('==========================================');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

runMigration();
