const mongoose = require("mongoose")



const db = async()=>
{
    try{
        const con = await mongoose.connect('mongodb+srv://AbhishekDb:Abhishek@cluster0.bm2nmnb.mongodb.net/')
        console.log(`mongodb connected: ${con.connection.host}`)

    } catch(error){
        console.error(error);
    }
    

}
module.exports = db