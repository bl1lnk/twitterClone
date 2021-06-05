const mongoose = require('mongoose');
mongoose.set('useFindAndModify', false);
require('dotenv').config()
class Database {
    constructor(){
        this.connect();
   
    }
    connect(){
        mongoose.connect(process.env.DB_URL,{ useNewUrlParser: true, useUnifiedTopology: true})
    .then(()=>{ console.log("database connection successful")})
    .catch((err)=>{ console.log(`database connetion error ${err}`)})
    }
    x = 5
}

module.exports= new Database();