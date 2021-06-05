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

router.get("/", async (req, res, next) => {
    let searchObj= {userTo: req.session.user._id, notificationType: {$ne:"newMessage"} }

    if(req.query.unreadOnly !== undefined && req.query.unreadOnly == "true"){
        searchObj.opened = false
    }
    const notifications = await Notification.find(searchObj)
        .populate("userTo")
        .populate("userFrom")
        .sort({ createdAt: -1})
        .catch(error=>{
            console.log(error)
            res.sendStatus(400)
        })

    res.status(200).send(notifications);
})

router.get("/latest", async (req, res, next) => {
 
    const notifications = await Notification.findOne({userTo: req.session.user._id,})
        .populate("userTo")
        .populate("userFrom")
        .sort({ createdAt: -1})
        .catch(error=>{
            console.log(error)
            res.sendStatus(400)
        })

    res.status(200).send(notifications);
})


router.put("/:id/markAsOpened", async (req, res, next) => {

    await Notification.findByIdAndUpdate(req.params.id, {opened: true})
        .catch(error=>{
            console.log(error)
            res.sendStatus(400)
        })

    res.sendStatus(204);
})


router.put("/markAsOpened", async (req, res, next) => {

    await Notification.updateMany({userTo: req.session.user._id},{opened: true})
        .catch(error=>{
            console.log(error)
            res.sendStatus(400)
        })

    res.sendStatus(204);
})


module.exports = router;