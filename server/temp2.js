const mongoose = require('mongoose');
mongoose.connect('mongodb+srv://fullstacksolutions101_db_user:343M42F0j3k0qjkb@cluster0.gg9wps1.mongodb.net/?appName=Cluster0', { useNewUrlParser: true, useUnifiedTopology: true })
.then(async () => {
  const db = mongoose.connection.db;
  const s2 = await db.collection('jobalerts').find({ recipients: new mongoose.Types.ObjectId('6a5eea44363eee61b6fb1584') }).toArray();
  console.log('Tony alerts:', s2.length);
  process.exit(0);
});
