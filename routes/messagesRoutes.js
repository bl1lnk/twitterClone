const express = require('express');
const app = express();
const bcrypt = require('bcrypt')
const bodyParser = require('body-parser')
const User = require('../schemas/UserSchema')
const Chat = require('../schemas/ChatSchema')
const mongoose = require('mongoose')
const router = express.Router();



router.get("/",(req,res, next)=>{

    var payload = {
        pageTitle: "Inbox",
        userLoggedIn: req.session.user,
        userLoggedInJs: JSON.stringify(req.session.user),
    }

    res.status(200).render("inboxPage", payload);
})


router.get("/new",(req,res, next)=>{
    var payload = {
        pageTitle: "new Message",
        userLoggedIn: req.session.user,
        userLoggedInJs: JSON.stringify(req.session.user),
    }
    
    res.status(200).render("newMessage", payload);
})

router.get("/:chatId", async (req,res, next)=>{
    const userId = req.session.user._id;
    const chatId = req.params.chatId
    const isValidId=  mongoose.isValidObjectId(chatId)


    var payload = {
        pageTitle: "Chat",
        userLoggedIn: req.session.user,
        userLoggedInJs: JSON.stringify(req.session.user),
        
    }


    let chat = await Chat.findOne({ _id:chatId, users:{ $elemMatch: {$eq: userId}}}).populate("users")
   
    
    
    if(!isValidId){
        payload.errorMessage = "Chat does not exists or you do not have permission to view it"
        return res.status(200).render("chatPage", payload);
    }
    const userFound= await User.findById(chatId);
    if(userFound){
        chat = await getChatByUserId(userFound._id, userId)
    }

    if(!chat){
        payload.errorMessage = "Chat does not exists or you do not have permission to view it"
    }else{
       
        payload.chat = chat
    }
  
    
    res.status(200).render("chatPage", payload);
})

async function getChatByUserId(userLoggedInId, otherUserId){
    return await Chat.findOneAndUpdate({
        isGroupChat: false,
        users:{
            $size: 2,
            $all:[
                { $elemMatch: {$eq: mongoose.Types.ObjectId(userLoggedInId)}},
                { $elemMatch: {$eq: mongoose.Types.ObjectId(otherUserId)}},
            ]
        }
    },{
        $setOnInsert:{
            users:[userLoggedInId, otherUserId]
        }
    },{
        new: true,
        upsert: true
    }).populate("users");

}

module.exports = router;