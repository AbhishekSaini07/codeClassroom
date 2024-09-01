// models/user.js

const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: String,
  resetToken: String,
  resetTokenExpiry: Date,
});

// Hash the password before saving it to the database
userSchema.pre('save', async function (next) {
  try {
    if (!this.isModified('password')) {
      return next();
    }

    const hashedPassword = await bcrypt.hash(this.password, 10);
    this.password = hashedPassword;
    next();
  } catch (error) {
    return next(error);
  }
});

// Add a method to the User model for authenticating users
userSchema.statics.authenticate = async function (email, password) {
  const user = await this.findOne({ email });

  if (user && (await bcrypt.compare(password, user.password))) {
    return user;
  }

  return null;
};

const User = mongoose.model('User', userSchema);

module.exports = User;
