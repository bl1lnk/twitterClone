const express = require('express');
const app = express();
const router = express.Router();
const bodyParser = require('body-parser');
const User = require('../schemas/UserSchema')
const bcrypt = require('bcrypt')
const { urlencoded } = require('body-parser');

app.set("view engine", "pug");
app.set("views","views");

app.use(bodyParser.urlencoded({extended: false}))
router.get("/",(req,res, next)=>{
    res.status(200).render("register");
})

router.post("/", async (req,res, next)=>{
    let {firstName, lastName, username, email, password, passwordConf} = req.body
    firstName = firstName.trim()
    lastName = lastName.trim()
    username = username.trim()
    email = email.trim()

    let payload =  req.body

    if(firstName && lastName && email && username && password){
       const user = await  User.findOne({
            $or: [
                {username},
                {email}
            ]
        })
        .catch((error)=>{
            console.log(error)
            payload.errorMessage = "Something went wrong.";
            res.status(200).render("register", payload);
        })

        if(!user){
            let data = req.body
            data.password = await bcrypt.hash(password, 10)
            const userCreated = await User.create(data)
            req.session.user = userCreated
                return res.redirect('/');
        }else {
            if(email == user.email){
                payload.errorMessage = "Email already in use."
            }else
            payload.errorMessage = "Username already in use."
        }
        res.status(200).render("register", payload);
    }else{
        payload.errorMessage = "Make sure each field has a valid value";
        res.status(200).render("register", payload);
    }
   
})

module.exports = router;