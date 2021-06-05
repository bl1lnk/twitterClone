const express = require('express');
const app = express();
const bodyParser = require('body-parser')
const router = express.Router();
const User = require('../../schemas/UserSchema')
const Post = require('../../schemas/PostSchema');
const Chat = require('../../schemas/ChatSchema');
const Notification = require('../../schemas/NotificationSchema');
const Message = require('../../schemas/MessageSchema');

const { json } = require('body-parser');

app.set("view engine", "pug");
app.set("views","views");

app.use(bodyParser.urlencoded({extended: false}))

router.post("/", async (req, res, next) => {
    if(!req.body.content || !req.body.chatId) {
        console.log("Invalid data passed into request");
        return res.sendStatus(400);
    }

    var newMessage = {
        sender: req.session.user._id,
        content: req.body.content,
        chat: req.body.chatId
    };

    Message.create(newMessage)
    .then(async message => {
        message = await message.populate("sender").execPopulate();
        message = await message.populate("chat").execPopulate();
        message = await User.populate(message, { path:"chat.users"});

        const chat =await Chat.findByIdAndUpdate(req.body.chatId, { latestMessage: message })
        .catch(error => console.log(error));

        insertNotifications(chat, message)
        res.status(201).send(message);
    })
    .catch(error => {
        console.log(error);
        res.sendStatus(400);
    })
})


async function insertNotifications(chat, message) {
    chat.users.forEach(async userId=>{
  
        if(userId == message.sender._id.toString()) return;
        let noti = await  Notification.insertNotification(userId, message.sender._id, "newMessage", message.chat._id)

    })
}

module.exports = router;