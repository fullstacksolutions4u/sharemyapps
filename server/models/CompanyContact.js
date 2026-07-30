const mongoose = require('mongoose');

const companyContactSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true, 
    unique: true, 
    trim: true 
  },
  emails: [{ 
    type: String, 
    trim: true,
    lowercase: true 
  }],
}, { timestamps: true });

module.exports = mongoose.model('CompanyContact', companyContactSchema);
