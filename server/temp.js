const mongoose = require('mongoose');
mongoose.connect('mongodb+srv://fullstacksolutions101_db_user:343M42F0j3k0qjkb@cluster0.gg9wps1.mongodb.net/?appName=Cluster0', { useNewUrlParser: true, useUnifiedTopology: true })
.then(async () => {
  const db = mongoose.connection.db;
  const users = await db.collection('users').find({ _id: { $in: [new mongoose.Types.ObjectId('6a32142093fd1e45912ded78'), new mongoose.Types.ObjectId('6a3a7cc01679a4afbb0e6dab')] } }).toArray();
  console.log('Users:', users.map(u => u.name));
  process.exit(0);
});
