const express = require('express');
const app = express();
const bcrypt = require('bcrypt')
const bodyParser = require('body-parser')
const User = require('../schemas/UserSchema')
const router = express.Router();

app.set("view engine", "pug");
app.set("views","views");

app.use(bodyParser.urlencoded({extended: false}))

router.get("/",(req,res, next)=>{
    res.status(200).render("login");
})
router.post("/",async (req,res, next)=>{
    
    let payload = req.body;

    if(req.body.logUsername && req.body.logPassword){
        const user = await  User.findOne({
            $or: [
                {username: payload.logUsername},
                {email: payload.logUsername}
            ]
        })
        .catch((error)=>{
            console.log(error)
            payload.errorMessage = "Something went wrong.";
            res.status(200).render("login", payload);
        })

        if(user){
            const result = await bcrypt.compare(req.body.logPassword, user.password)
            if(result){
                req.session.user = user
                return res.redirect('/')
            }
        }
        payload.errorMessage = "Login credentials incorrect."
        return res.status(200).render('login',payload)
    }
    payload.errorMessage = "Meke sure each field has a valid value"
    res.status(200).render("login");
})

module.exports = router;