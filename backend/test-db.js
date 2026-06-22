import mongoose from 'mongoose';
import 'dotenv/config';

async function test() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log("Connected to MongoDB");
  const Customer = mongoose.model('Customer', new mongoose.Schema({}, { strict: false }));
  const customer = await Customer.findOne({ "joinedCampaigns.cyclesRefreshed": { $exists: true } });
  console.log("Customer with refreshed cycles:", customer ? JSON.stringify(customer.joinedCampaigns, null, 2) : "None");
  process.exit(0);
}
test();
