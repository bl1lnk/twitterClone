
//Globals
let cropper;
let timer;
let selectedUsers =[];

$(document).ready(()=>{
    refreshMessagesBadge();
    refreshNotificationsBadge();
})
$("#postTextarea, #replyTextarea").keyup(event=>{
    let textbox = $(event.target)
    let value = textbox.val().trim()
    
    const isModal = textbox.parents('.modal').length == 1;

    let submitButton = isModal ? $("#submitReplyButton") : $("#submitPostButton");

   
    if(value.length > 0){
        submitButton.prop('disabled', false)
        return 
    }
    submitButton.prop('disabled', true)
})


$("#replyModal").on("show.bs.modal",(event)=>{
    const button = $(event.relatedTarget)
    const postId = getPostIdFromElement(button)
    $('#submitReplyButton').data("id", postId)

    $.get(`/api/posts/${postId}`, results=>{
        outputPosts(results.postData,$('#originalPostContainer'));

     })
})

$("#deletePostModal").on("show.bs.modal",(event)=>{
    const button = $(event.relatedTarget)
    const postId = getPostIdFromElement(button)
    $('#deletePostButton').data("id", postId)
})


$("#unpinModal").on("show.bs.modal",(event)=>{
    const button = $(event.relatedTarget)
    const postId = getPostIdFromElement(button)
    $('#unpinPostButton').data("id", postId)
})

$("#confirmPinModal").on("show.bs.modal",(event)=>{
    const button = $(event.relatedTarget)
    const postId = getPostIdFromElement(button)
    $('#pinPostButton').data("id", postId)
})


$("#deletePostButton").click((e)=>{
    const postId = $(e.target).data("id");
    
    $.ajax({
        url:`/api/posts/${postId}`,
        type: "DELETE",
        success:(data, status, xhr)=>{
            location.reload()
        }
    })
})

$("#pinPostButton").click((e)=>{
    const postId = $(e.target).data("id");
    
    $.ajax({
        url:`/api/posts/${postId}`,
        type: "PUT",
        data: {pinned: true},
        success:(data, status, xhr)=>{

            if(xhr.status != 204){
                alert('could not pin the post')
                return;
            }
            location.reload()
        }
    })
})


$("#unpinPostButton").click((e)=>{
    const postId = $(e.target).data("id");
    
    $.ajax({
        url:`/api/posts/${postId}`,
        type: "PUT",
        data: {pinned: false},
        success:(data, status, xhr)=>{

            if(xhr.status != 204){
                alert('could not pin the post')
                return;
            }
            location.reload()
        }
    })
})

$("#filePhoto").change(function(){


    if(this.files && this.files[0]){
        let reader = new FileReader();
        reader.onload = (e) =>{
            var image =document.getElementById('imagePreview')
            image.src= e.target.result
         
            if(cropper){
                cropper.destroy()
            }

            cropper = new Cropper(image,{
                aspectRatio: 1 / 1,
                background: false
            })
        }
        reader.readAsDataURL(this.files[0])
    }
})
$("#coverPhoto").change(function(){


    if(this.files && this.files[0]){
        let reader = new FileReader();
        reader.onload = (e) =>{
            var image =document.getElementById('coverPreview')
            image.src= e.target.result
         
            if(cropper){
                cropper.destroy()
            }

            cropper = new Cropper(image,{
                aspectRatio: 16 / 9,
                background: false
            })
        }
        reader.readAsDataURL(this.files[0])
    }
})

$("#imageUploadtButton").click(()=>{
    const canvas = cropper.getCroppedCanvas();

    if(!canvas){
        alert("Could not upload image. make sure its image file")
        return;
    }

    canvas.toBlob((blob)=>{
        var formData = new FormData();
        formData.append("croppedImage", blob)
        
        $.ajax({
            url: "/api/users/profilePicture",
            type:"POST",
            data:formData,
            processData: false,
            contentType: false,
            success: ()=> location.reload()
        })
    })

})

$("#coverPhotoButton").click(()=>{
    const canvas = cropper.getCroppedCanvas();

    if(!canvas){
        alert("Could not upload image. make sure its image file")
        return;
    }

    canvas.toBlob((blob)=>{
        var formData = new FormData();
        formData.append("croppedImage", blob)
        
        $.ajax({
            url: "/api/users/coverPhoto",
            type:"POST",
            data:formData,
            processData: false,
            contentType: false,
            success: ()=> location.reload()
        })
    })

})

$("#userSearchTextbox").keydown((event)=>{
    clearTimeout(timer)

    let textbox = $(event.target);
    let value = textbox.val();


    if(value == "" && (event.which == 8 ||event.keyCode== 8)){
        selectedUsers.pop();
        updateSelectedUsersHtml();
        $(".resultsContainer").html("");

        if(selectedUsers.length == 0){
            $('#createChatButton').prop('disabled', true)
        }
        return;
    }

    timer = setTimeout(()=>{
        value = textbox.val().trim();

        if(value ==""){
            $(".resultsContainer").html("");
        }else{
            searchUsers(value)
        }

    },1000)

})

$("#createChatButton").click((event)=>{
   const data = JSON.stringify(selectedUsers);

   $.post("/api/chats", {users: data}, chat=>{
       if(!chat || !chat._id) return alert('Invalid response from server')
       window.location.href= `/messages/${chat._id}`;
   })

})


function searchUsers(searchTerm){
    $.get("/api/users",{search: searchTerm}, results=>{
        outputSelectableUsers(results,$(".resultsContainer"))
    })
}

function outputSelectableUsers(results, container){
    container.html("")
    if(results.length == 0){
        container.append('<span class="noResults">No results found</span>')
    }
    results.forEach(result=>{
        if(result._id == userLoggedIn._id || selectedUsers.some(u=>u._id == result._id)){
            return;
        }

        let html =createUserHtml(result, false)
        var element=$(html);
        element.click(()=>{
            userSelected(result)
        })
        container.append(element)
    })
}

function userSelected(user){
    selectedUsers.push(user);
    updateSelectedUsersHtml()
    $("#userSearchTextbox").val("").focus();
    $(".resultsContainer").html("");
    $("#createChatButton").prop("disabled",false);
}

function updateSelectedUsersHtml(){
    var elements=[];
    selectedUsers.forEach(user=>{
        var name = user.firstName + " " +user.lastName
        var userElement = $(`<span class="selectedUser">${name}</span>`)
        elements.push(userElement)
    })

    $(".selectedUser").remove();
    $("#selectedUsers").prepend(elements)
}

$("#replyModal").on("hidden.bs.modal",(event)=>{
    $('#originalPostContainer').html("")
})

$("#submitPostButton, #submitReplyButton").click((event)=>{
    const button = $(event.target)
    let textbox = $(event.target)
   
    const isModal = textbox.parents('.modal').length == 1;
    textbox = isModal ? $('#replyTextarea') :$('#postTextarea');

    const data = {
        content: textbox.val()
    }

    if(isModal){
        const id = button.data().id;
        if(!id)
        return alert('Button id is null')
        data.replyTo = id
    }
    $.post("/api/posts", data, (postData)=>{
        if(postData.replyTo){
            emitNotification(postData.replyTo.postedBy)
            location.reload()
        }else{
            const html = createPostHtml(postData)
            $(".postsContainer").prepend(html);
            textbox.val("");
            button.prop("disabled", true)
        }
    
    })
})

$(document).on("click",".likeButton",(event)=>{
  const button = $(event.target)
  const postId = getPostIdFromElement(button)
   if(!postId){
       return;
   }
   $.ajax({
       url:`/api/posts/${postId}/like`,
       type: "PUT",
       success:(postData)=>{
             button.find("span").text(postData.likes.length || "")
             if(postData.likes.includes(userLoggedIn._id)) {
                 button.addClass("active");
                 emitNotification(postData.postedBy)
             }else{
                button.removeClass("active");
             }
       }
   })
})


$(document).on("click",".retweetButton",(event)=>{
  const button = $(event.target)
  const postId = getPostIdFromElement(button)
   if(!postId){
       return;
   }
   $.ajax({
       url:`/api/posts/${postId}/retweet`,
       type: "POST",
       success:(postData)=>{
        
             button.find("span").text(postData.retweetUsers.length || "")
             if(postData.retweetUsers.includes(userLoggedIn._id)) {
                 button.addClass("active");
                 emitNotification(postData.postedBy)
             }else{
                button.removeClass("active");
             }
       }
   })
})

$(document).on("click",".post",(event)=>{
    const element = $(event.target)
    const postId = getPostIdFromElement(element)

    if(postId && !element.is("button")){
        window.location=href ='/posts/' +postId
    }

})


$(document).on("click",".followButton",(e)=>{
   const button = $(e.target);
   const userId = button.data().user;
   
   $.ajax({
    url:`/api/users/${userId}/follow`,
    type: "PUT",
    success:(data, xhr, status)=>{
        if(xhr.status == 404){
            alert('User not found')
            return;
        }

          let difference =1
          if(data.following && data.following.includes(userId)) {
              button.addClass("following");
              button.text('Following');
              emitNotification(userId);
          }else{
             button.removeClass("following");
             button.text('Follow')
             difference = -1
          }
        
          const followersLabel = $('#followersValue')
          if(followersLabel.length != 0){
            const followerstext = followersLabel.text();
            followersLabel.text(parseInt(followerstext) + difference)
          }
    }
})

})

$(document).on("click", ".notification.active",(e)=>{
    const container= $(e.target);
    const notificationId = container.data().id;
    const href = container.attr("href")
    e.preventDefault();

    const callback = ()=> window.location = href
    markNotificationAsOpened(notificationId, callback)
})

function getPostIdFromElement(element){
    const isRoot = element.hasClass('post');
    let rootElement = isRoot ? element: element.closest(".post");
    const postId = rootElement.data().id;
    if(!postId){
        return alert('Post id undefined')
    }
    return postId;
    
}
function createPostHtml(postData,largeFont= false){

    if(postData === null) return alert("post object is null")
    const postedBy =  postData.postedBy;
    // creating retweet conent
    const isRetweet= postData.retweetData !== undefined;
    const retweetedBy = isRetweet ? postData.postedBy.username : null;
    postData = isRetweet ? postData.retweetData: postData
    //


    if(postedBy && !postedBy._id){
        return console.log('user is not populated')
    }
    const displayName = postedBy.firstName + " " + postedBy.lastName
    const timestamp = timeDifference(new Date(), new Date(postData.createdAt));

    const  likeButtonActiveClass = postData.likes.includes(userLoggedIn._id) ? "active" :"";
    const  retweetButtonActiveClass = postData.retweetUsers.includes(userLoggedIn._id) ? "active" :"";
    const largeFontClass = largeFont ? "largeFont" : "";

    let retweetText= ''
    if(isRetweet){
        retweetText = `<span> 
                        <i class='fas fa-retweet'></i>
                        Retweeted by <a href='/profile/${retweetedBy}'> @${retweetedBy}</a>
                        </span>`
    }
    let replyFlag=""
    if(postData.replyTo && postData.replyTo._id){
        if(!postData.replyTo._id){
            return alert('Reply to is not populated')
        }

        const replyToUsername = postData.replyTo.postedBy.username
        replyFlag= `<div class='replyFlag'>
                    Replying to <a href=''> @${replyToUsername}</a>            
        </div>`
    }

    let buttons=""
    let pinnedPostText= ""
    if(postData.postedBy._id == userLoggedIn._id){

        let pinnedClass=""
        let dataTarget = "#confirmPinModal";
        if(postData.pinned){
            dataTarget= '#unpinModal';
            pinnedClass = "active"
            pinnedPostText= "<i class='fas fa-thumbtack'></i> <span>Pinned post</span>"
        }
        buttons = `
        <button class='pinButton ${pinnedClass}' data-id="${postData._id}" data-toggle="modal" data-target="${dataTarget}">
            <i class='fas fa-thumbtack'></i>
        </button>

        <button data-id="${postData._id}" data-toggle="modal" data-target="#deletePostModal">
            <i class='fas fa-times'></i>
        </button>
        `
    }


    return `<div class='post ${largeFontClass}' data-id=${postData._id}>
        <div class='postActionContainer'>
        ${retweetText}
       
        </div>
    <div class='mainContentContainer'>
        <div class='userImageContainer'>
            <img src='${postedBy.profilePic}'>
        </div>
        <div class='postContentContainer'>
        <div class='pinnedPostText'> ${pinnedPostText} </div>
            <div class='header'>
                <a href='/profile/${postedBy.username}' class='displayName'>${displayName}</a>
                <span class='username'>@${postedBy.username}</span>
                <span class='date'>${timestamp}</span>
                ${buttons}
            </div>
            ${replyFlag}
            <div class='postBody'>
                <span>${postData.content}</span>
            </div>
            <div class='postFooter'>
                <div class='postButtonContainer'>
                 <button data-toggle='modal' data-target='#replyModal'>
                        <i class='far fa-comment'></i>
                    </button>
                </div>
                <div class='postButtonContainer green'>
                    <button class='retweetButton ${retweetButtonActiveClass}'>
                        <i class='fas fa-retweet'></i>
                        <span>${postData.retweetUsers.length || ""}</span>
                    </button>
                </div>
                <div class='postButtonContainer red'>
                    <button class='likeButton ${likeButtonActiveClass}'>
                        <i class='far fa-heart'></i>
                        <span>${postData.likes.length || ""}</span>
                    </button>
                </div>
            </div>
        </div>
    </div>
</div>`;
}

function timeDifference(current, previous) {

    var msPerMinute = 60 * 1000;
    var msPerHour = msPerMinute * 60;
    var msPerDay = msPerHour * 24;
    var msPerMonth = msPerDay * 30;
    var msPerYear = msPerDay * 365;

    var elapsed = current - previous;

    if (elapsed < msPerMinute) {
        if (elapsed/1000 < 30) return 'Just now'
         return Math.round(elapsed/1000) + ' seconds ago';   
    }

    else if (elapsed < msPerHour) {
         return Math.round(elapsed/msPerMinute) + ' minutes ago';   
    }

    else if (elapsed < msPerDay ) {
         return Math.round(elapsed/msPerHour ) + ' hours ago';   
    }

    else if (elapsed < msPerMonth) {
        return  Math.round(elapsed/msPerDay) + ' days ago';   
    }

    else if (elapsed < msPerYear) {
        return  Math.round(elapsed/msPerMonth) + ' months ago';   
    }

    else {
        return 'approximately ' + Math.round(elapsed/msPerYear ) + ' years ago';   
    }
}

function outputPosts (results, container){
    container.html("");

    if(!Array.isArray(results)){
 
        results = [results];
      
    }
    results.forEach(result=>{
        let html = createPostHtml(result)
        container.append(html);
    });

    if(results.length === 0){
        container.append("<span class='noResults'> Nothing to show.</span>")
    }
}

function outputPostsWithReplies(results, container){

    container.html("");

    if(results.replyTo && results.replyTo._id){
        let html = createPostHtml(results.replyTo)
        container.append(html);
    }
 
    let mainPostHtml = createPostHtml(results.postData[0], true)

  container.append(mainPostHtml);

    results.replies.forEach(result=>{
        let html = createPostHtml(result)
        container.append(html);
    });


}

function outputUsers(results, container){
    container.html("")
    if(results.length == 0){
        container.append('<span class="noResults">No results found</span>')
    }
    results.forEach(result=>{
        const html =createUserHtml(result, true)
        container.append(html)
    })
}

function createUserHtml(userData, showFollowButton){

  const name = userData.firstName + " " + userData.lastName
  const isFollowing = userLoggedIn.following && userLoggedIn.following.includes(userData._id);
  const text = isFollowing ? "Following": "Follow";
  const  buttonClass = isFollowing ? "followButton following": "followButton";
  let followbutton= ""
  if(showFollowButton && userLoggedIn._id != userData._id){
      followbutton = `<div class='followButtonContainer'>
                          <button class='${buttonClass}' data-user='${userData._id}'>${text}</button>
                      </div>`
  }
  return `<div class='user'>
              <div class='userImageContainer'>
                  <img src='${userData.profilePic}' />
              </div>
              <div class='userDetailsContainer'>
                  <div class='header'>
                      <a href='/profile/${userData.username}'>${name}</a>
                      <span class='username'>@${userData.username}</span>
                  </div>
              </div>
              ${followbutton}
          </div>`
}


function getChatName(chatData){
    let chatName = chatData.chatName

    if(!chatName){
        let otherChatUsers = getOtherChatUsers(chatData.users);
        let namesArray = otherChatUsers.map((user)=> user.firstName +" "+ user.lastName);
        chatName = namesArray.join(", ")
    }   
    return chatName
}

function getOtherChatUsers(users){
    if(users.length == 1) return users;

    return users.filter(user=> user._id !== userLoggedIn._id)
}

function messageReceived(newMessage){
    let x = $(`[data-room="${newMessage.chat._id}"]`)
    console.log(x)
    if ($(`[data-room="${newMessage.chat._id}"]`).length ==0){
         //Show popup
         showMessagePopup(newMessage);
    }else{
        addChatMessageHtml(newMessage)
    }
    refreshMessagesBadge()
}

function markNotificationAsOpened(notificationId = null, callback = null){
    if(callback == null) callback = () =>location.reload();

    const url = notificationId != null ? `/api/notifications/${notificationId}/markAsOpened` : "/api/notifications/markAsOpened"

    $.ajax({
        url,
        type:"PUT",
        success: ()=>{
            callback();
        }

    })
}

function refreshMessagesBadge(){
    $.get("/api/chats",{ unreadOnly: true}, (data)=>{

        var numResults = data.length;
     
        if(numResults > 0){
            $("#messageBadge").text(numResults).addClass("active");
         
        }else{
            $("#messageBadge").text("").removeClass("active");
        }
    })
}

function refreshNotificationsBadge(){
    $.get("/api/notifications",{ unreadOnly: true}, (data)=>{

        var numResults = data.length;
  
        if(numResults > 0){
            $("#notificationsBadge").text(numResults).addClass("active");
         
        }else{
            $("#notificationsBadge").text("").removeClass("active");
        }
    })
}


function showNotificationPopup(data){
    const html = createNotificationHtml(data);
    let element = $(html);
    element.hide().prependTo("#notificationList").slideDown("fast");

    setTimeout(()=> element.fadeOut(400), 5000)
}


function showMessagePopup(data){
    if(!data.chat.latestMessage._id){
        data.chat.latestMessage = data;
    }
    const html = createChatHtml(data.chat);
    let element = $(html);
    element.hide().prependTo("#notificationList").slideDown("fast");

    setTimeout(()=> element.fadeOut(400), 5000)
}

function createChatHtml(chatData){
    var chatName= getChatName(chatData)
    const image = getChatImageElements(chatData); 
    const latestMessage= getLatestMessage(chatData.latestMessage)
    
    const activeClass= 
    !chatData.latestMessage || chatData.latestMessage.readBy.includes(userLoggedIn._id) ? "" :"active"

    return `<a href='/messages/${chatData._id}' class='resultListItem ${activeClass}'>
                ${image}
                <div class='resultsDetailsContainer ellipsis'>
                    <span class='heading ellipsis'> ${chatName}</span>
                    <span class='subText ellipsis'> ${latestMessage}</span>
                </div>
            </a>`;
}

function getLatestMessage(latestMessage){
    if(latestMessage){
  
        const sender = latestMessage.sender;
        return `${sender.firstName} ${sender.lastName}: ${latestMessage.content}`
    }

    return "New chat";
}
function getChatImageElements(chatData){
    let otherChatUsers = getOtherChatUsers(chatData.users);

    let groupChatClass= "";
    let chatImage = getUserChatImageLElement(otherChatUsers[0]);

    if(otherChatUsers.length > 1){
        groupChatClass= "groupChatImage";
        chatImage += getUserChatImageLElement(otherChatUsers[1])
 
    }
    return `<div class='resultsImageContainer ${groupChatClass}'>${chatImage}</div>`
}

function getUserChatImageLElement(user){
    if(!user || !user.profilePic){
        return alert('User passed into function is invalid')
    }

    return `<img src=${user.profilePic} alt='User profile pic'/>`
}

function outputNotificationList(notifications, container){
    notifications.forEach(notification=>{
        const html = createNotificationHtml(notification);
        container.append(html);
    })


    if(notifications.length == 0){
        container.append("<span class='noResults'>Nothing to show. </span>")
    }
}

function createNotificationHtml(notification){
    const userFrom = notification.userFrom;
    const text = getNotificationText(notification)
    const href=getNotificationUrl(notification)
    let className = notification.opened ? "": "active";

    return `<a href='${href}' class='resultListItem notification ${className}' data-id='${notification._id}'>
        <div class='resultsImageContainer'>
            <img src='${userFrom.profilePic}'>
        </div>
        <div class='resultDetailsContainer ellipsis'>
            <span class='ellipsis'>
            ${text}
            </span>
        </div>
    </a>`
}

function getNotificationText(notification){
    const userFrom = notification.userFrom

    if(!userFrom || !userFrom.firstName){
        return alert("user from data not populated")
    }

    const userFromName = `${userFrom.firstName} ${userFrom.lastName}`;
    let text;
    
    if(notification.notificationType == "retweet"){
        text= `${userFromName} retweeted one of your posts`;
    }else if(notification.notificationType == "postLike"){
        text= `${userFromName} liked one of your posts`;
    }else if(notification.notificationType == "reply"){
        text= `${userFromName} replied one of your posts`
    }else if(notification.notificationType == "follow"){
        text= `${userFromName} followed you`;
    }

    return `<span class='ellipsis'>${text}</span>`;
}

function getNotificationUrl(notification){
    
    let url="#";
    
    if(notification.notificationType == "follow"){
        url = `/profile/${notification.entityId}`;
    }else{
        url = `/posts/${notification.entityId}`;
    }

    return url;
}
