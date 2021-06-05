const express = require('express');
const app = express();
const bodyParser = require('body-parser')
const router = express.Router();
const User = require('../../schemas/UserSchema')
const Post = require('../../schemas/PostSchema');
const Chat = require('../../schemas/ChatSchema');
const Message = require('../../schemas/MessageSchema');
const { json } = require('body-parser');

app.set("view engine", "pug");
app.set("views","views");

app.use(bodyParser.urlencoded({extended: false}))

router.post("/", async(req, res, next) => {
    let {users} = req.body
    if(!users){
        console.log('Users param not with requests')
        return res.sendStatus(400);
    }

     users = JSON.parse(users)
     if(users.length ===0){
         console.log("Users array is empty")
         return res.sendStatus(400)
     }
     users.push(req.session.user);

     const chatData = {
         users,
         isGroupChat:true,
     }

     const chatgroup = await Chat.create(chatData)
        .catch((error)=>{
            console.log(error)
            res.sendStatus(400)
        })
     res.status(200).send(chatgroup)
})

router.get("/", async (req, res, next) => {
    Chat.find({ users: { $elemMatch: { $eq: req.session.user._id } }})
    .populate("users")
    .populate("latestMessage")
    .sort({ updatedAt: -1 })
    .then(async results => {

        if(req.query.unreadOnly !== undefined && req.query.unreadOnly == "true") {

            results = results.filter(r => r.latestMessage && !r.latestMessage.readBy.includes(req.session.user._id));
        }

        results = await User.populate(results, { path: "latestMessage.sender" });
        res.status(200).send(results)
    })
    .catch(error => {
        console.log(error);
        res.sendStatus(400);
    })
})


router.get("/:chatId", async (req, res, next) => {
    Chat.findOne({ _id: req.params.chatId, users: { $elemMatch: { $eq: req.session.user._id } }})
    .populate("users")
    .then(results => res.status(200).send(results))
    .catch(error => {
        console.log(error);
        res.sendStatus(400);
    })
})
router.get("/:chatId/messages", async(req, res, next) => {

     Message.find({chat: req.params.chatId})
     .populate("sender")
     .then(results=> res.status(200).send(results))
     .catch(error=>{
         console.log(error)
         res.sendStatus(400)
     })
})

router.put("/:chatId/messages/markAsRead", async(req, res, next) => {

    Message.updateMany({chat: req.params.chatId}, { $addToSet: {readBy: req.session.user._id} })
    .then(()=> res.sendStatus(204))
    .catch(error=>{
        console.log(error)
        res.sendStatus(400)
    })



})



router.put("/:chatId", async(req, res, next) => {
    
    // elem match= elment match -- eq = equal 
    const chatName = await Chat.findByIdAndUpdate(req.params.chatId, req.body)
        .catch((error)=>{
            console.log(error)
            res.sendStatus(400)
        })
    res.sendStatus(204)

})

module.exports = router;