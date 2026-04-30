const mongoose = require('mongoose');

const uri = "mongodb+srv://mt:mt123!!!@cluster0.0zs6w.mongodb.net/waleed_first_web?retryWrites=true&w=majority";

const storeSchema = new mongoose.Schema({
  name: String,
  slug: String,
  trackingUrl: String,
}, { strict: false });

const Store = mongoose.model('Store', storeSchema);

async function check() {
  try {
    await mongoose.connect(uri);
    console.log('Connected to DB');

    const stores = await Store.find({ name: /TESting/i });
    console.log('Found stores:', JSON.stringify(stores, null, 2));

    await mongoose.disconnect();
  } catch (err) {
    console.error(err);
  }
}

check();
