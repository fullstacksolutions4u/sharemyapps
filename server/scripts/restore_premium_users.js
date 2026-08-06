require('dotenv').config({ path: '../.env' });
const mongoose = require('mongoose');
const { ObjectId } = mongoose.Types;

async function fix() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to DB');

  const User = require('../models/User');
  const SessionRequest = require('../models/SessionRequest');

  // 1. Restore Tony's SessionRequest
  const tonyRequest = {
    _id: new ObjectId('6a6f6b6104020fca2aeada6d'),
    user: new ObjectId('6a5eea44363eee61b6fb1584'),
    serviceKey: 'ats_compatible_resume_cover_letter_optimization',
    serviceLabel: 'Download ATS Support Resume & Cover letter',
    serviceType: 'document',
    message: '',
    status: 'completed',
    meetLink: '',
    adminNotes: '',
    instructions: '',
    completionFeedback: '',
    completionLink: 'http://drive.google.com',
    coverLetterLink: 'http://drive.google.com',
    createdAt: new Date('2026-08-02T16:08:01.909Z'),
    updatedAt: new Date('2026-08-02T16:11:01.132Z')
  };

  const existingTony = await SessionRequest.findById(tonyRequest._id);
  if (!existingTony) {
    await SessionRequest.create(tonyRequest);
    console.log("Restored Tony's SessionRequest");
  } else {
    console.log("Tony's SessionRequest already exists");
  }

  // 2. Give Varun Krishna premium services
  const varun = await User.findOne({ name: { $regex: /Varun Krishna/i } });
  if (varun) {
    const existingVarun = await SessionRequest.findOne({
      user: varun._id,
      serviceKey: 'ats_compatible_resume_cover_letter_optimization'
    });

    if (!existingVarun) {
      await SessionRequest.create({
        user: varun._id,
        serviceKey: 'ats_compatible_resume_cover_letter_optimization',
        serviceLabel: 'ATS Compatible Resume & Cover Letter Optimization',
        serviceType: 'document',
        status: 'completed',
        completionLink: 'admin-granted',
        createdAt: new Date(),
        updatedAt: new Date()
      });
      console.log("Granted premium services to Varun Krishna");
    } else {
      console.log("Varun Krishna already has premium services");
      if (existingVarun.status !== 'completed' || !existingVarun.completionLink) {
         existingVarun.status = 'completed';
         existingVarun.completionLink = existingVarun.completionLink || 'admin-granted';
         await existingVarun.save();
         console.log("Updated Varun Krishna's existing request to be completed.");
      }
    }
  } else {
    console.log('Could not find user Varun Krishna');
  }

  mongoose.connection.close();
}

fix().catch(console.error);
