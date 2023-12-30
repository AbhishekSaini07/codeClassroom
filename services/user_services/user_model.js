const mongoose = require("mongoose");
const UserSchema = mongoose.Schema({
    name:{
        require: true,
        type: String
    }
})