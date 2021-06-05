const express = require('express');
const app = express();
const bcrypt = require('bcrypt')
const bodyParser = require('body-parser')
const User = require('../schemas/UserSchema')
const router = express.Router();


app.use(bodyParser.urlencoded({extended: false}))

router.get("/",(req,res, next)=>{
    if(req.session){
        req.session.destroy(()=>{
            res.redirect('/login')
        })
    }
})

module.exports = router;