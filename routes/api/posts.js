const express = require('express');
const app = express();
const bodyParser = require('body-parser')
const router = express.Router();
const User = require('../../schemas/UserSchema')
const Post = require('../../schemas/PostSchema');
const Notification = require('../../schemas/NotificationSchema');

app.set("view engine", "pug");
app.set("views","views");

app.use(bodyParser.urlencoded({extended: false}))

router.get("/", async(req, res, next) => {

    let searchObj = req.query;

    if(searchObj.isReply !== undefined){
        const isReply = searchObj.isReply === "true";
        searchObj.replyTo= { $exists: isReply};
        delete searchObj.isReply;
        
    }

    if(searchObj.search){
        searchObj.content= { $regex: searchObj.search, $options: "i"}
        delete searchObj.search;
    }

    if(searchObj.followingOnly){
        const followingOnly = searchObj.followingOnly == "true";

        if(followingOnly){
            if(!req.session.user.following){
                req.session.user.following= []
            }
            let objectIds= [];
            req.session.user.following.forEach(user=>{
                objectIds.push(user)
            })
            objectIds.push(req.session.user._id)
            searchObj.postedBy= { $in: objectIds};    
        }
        delete searchObj.followingOnly;
        
    }


    const results = await getPosts(searchObj);
    res.status(200).send(results)
})

router.get("/:id", async(req, res, next) => {
    const postId= req.params.id

    let postData =  await getPosts({_id: req.params.id});
   

    let results ={
        postData
    }

    if(postData.replyTo){
        results.replyTo = postsData.replyTo
    }
    results.replies = await getPosts({replyTo: req.params.id})

    res.status(200).send(results)
 })

router.delete("/:id", async (req, res, next)=>{

    const postdeleted = await Post.findByIdAndDelete(req.params.id)
        .catch((error)=>{
            console.log(error)
            res.sendStatus(400)
        })
    res.status(202).send('deleted succesfuly')
})

router.put("/:id", async (req, res, next)=>{
    
    if(req.body.pinned !== undefined){
        await Post.updateMany({postedBy: req.session.user}, {pinned: false})
        .catch((error)=>{
            console.log(error)
            res.sendStatus(400)
        }) 
    }

    await Post.findByIdAndUpdate(req.params.id, req.body)
    .catch((error)=>{
        console.log(error)
        res.sendStatus(400)
    }) 
    
    res.sendStatus(204)


  
})

router.post("/",async (req,res, next)=>{
  
    if(!req.body.content){
        console.log('Content param not sent with request');
        return res.sendStatus(400);
    }

    const postData = {
        content: req.body.content,
        postedBy: req.session.user
    }

    if(req.body.replyTo){
        postData.replyTo = req.body.replyTo
    }
    const postCreated = await Post.create(postData)
    let newPost = await User.populate(postCreated, {path:"postedBy"})
    newPost = await Post.populate(newPost, {path:"replyTo"})
    if(newPost.replyTo !== undefined){
        await Notification.insertNotification(newPost.replyTo.postedBy, req.session.user._id, "reply", newPost._id)

    }
    res.status(201).send(newPost)
 
    if(!postCreated){
        res.sendStatus(400)
    }

})

router.put("/:id/like",async (req,res, next)=>{
    const postId =req.params.id;
    const userId = req.session.user._id;
    
    let isLiked = req.session.user.likes && req.session.user.likes.includes(postId);

    const option = isLiked ? "$pull" :"$addToSet"
    req.session.user = await User.findByIdAndUpdate(userId,{ [option]:{ likes: postId}},{new: true})
        .catch(error=>{
            console.log(error);
            res.sendStatus(400);
        })

  
  
    // Insert post like
    const post =  await Post.findByIdAndUpdate(postId,{ [option]:{ likes: userId}},{new: true})
    .catch(error=>{
        console.log(error);
        res.sendStatus(400);
    })

    if(!isLiked){
        await Notification.insertNotification(post.postedBy, req.session.user._id, "postLike", post._id)

    }

    res.status(200).send(post)

})

router.post("/:id/retweet", async (req, res, next) => {
    var postId = req.params.id;
    var userId = req.session.user._id;

    // Try and delete retweet
    var deletedPost = await Post.findOneAndDelete({ postedBy: userId, retweetData: req.params.id })
    .catch(error => {
        console.log(error);
        res.sendStatus(400);
    })

    var option = deletedPost != null ? "$pull" : "$addToSet";

    var repost = deletedPost;

    if (repost == null) {
        repost = await Post.create({ postedBy: userId, retweetData: req.params.id })
        .catch(error => {
            console.log(error);
            res.sendStatus(400);
        })
    }

    // Insert user like
    req.session.user = await User.findByIdAndUpdate(userId, { [option]: { retweets: repost._id } }, { new: true })
    .catch(error => {
        console.log(error);
        res.sendStatus(400);
    })

    // Insert post like
    var post = await Post.findByIdAndUpdate(postId, { [option]: { retweetUsers: userId } }, { new: true })
    .catch(error => {
        console.log(error);
        res.sendStatus(400);
    })

    if(!deletedPost){
         await Notification.insertNotification(post.postedBy, req.session.user._id, "retweet", post._id)

    }

    res.status(200).send(post)
})

async function getPosts(filter){
    let results = await Post.find(filter)
    .populate('postedBy')
    .populate('retweetData')
    .populate('replyTo')
    .sort({"createdAt":-1})

    results = await User.populate(results,{path:'replyTo.postedBy'})
    return await User.populate(results,{path:'retweetData.postedBy'})
}
module.exports = router;