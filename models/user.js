const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  email : {
    type: String,
    required: true,
    unique: true,
    
    },
    password : String,
  
    full_name : String,
    token : String,
  
    perms : {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  }
});

module.exports = mongoose.model('User', userSchema);
