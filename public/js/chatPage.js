let typing = false;
let lastTypingTime;
$(document).ready(()=>{

    socket.emit("join room", chatId)
    socket.on("typing",()=> $(".typingDots").show());
    socket.on("stop typing",()=> $(".typingDots").hide());


    $.get(`/api/chats/${chatId}`,(data)=>{
        $("#chatName").text(getChatName(data))
    })
    $.get(`/api/chats/${chatId}/messages`,(data)=>{
       let messages =[]
       let lastSenderId= ""

       data.forEach((message, index)=>{
           const html = createMessageHtml(message, data[index+1], lastSenderId)
           messages.push(html)

           lastSenderId = message.sender._id;
       });
       
       const messagesHtml = messages.join("");
       addMessagesHtmlToPage(messagesHtml)
       scrollTobBottom(false);
       markAllmessageAsRead();

       $(".loadingSpinnercontainer").remove()
       $(".chatContainer").css("visibility","visible")

    });

})

function addMessagesHtmlToPage(html){
    $(".chatMessages").append(html);

}


$("#chatNameButton").click((e)=>{
    const chatName = $("#chatNameTextBox").val().trim();

    $.ajax({
        url: "/api/chats/"+ chatId,
        type: "PUT",
        data: {chatName},
        success: (data,status, xhr)=>{
            if(xhr.status !== 204){
                return alert('could not update chat name');
            }else{
                location.reload()
            }
        }
    })
})

$(".sendMessageButton").click(()=>{
    messageSubmitted();
})


$(".inputTextBox").keydown((event)=>{
    updateTyping();
    if(event.which == 13){
        messageSubmitted();
        return false
    }
})

function updateTyping(){
    if(!connected) return;
    if(!typing){
        typing= true;
        socket.emit("typing", chatId);
    }
    lastTypingTime = new Date().getTime();
    let timerLength= 3000

    setTimeout(() => {
    let timeNow = new Date().getTime()
    let timeDiff = timeNow - lastTypingTime;
    if(timeDiff >= timerLength && typing){
        socket.emit("stop typing", chatId);
        typing = false;
    }
}, timerLength);
}

function messageSubmitted(){
    const content= $(".inputTextBox").val().trim();
    if(content != ""){
        sendMessage(content)
        $(".inputTextBox").val("");
        socket.emit("stop typing", chatId);
        typing = false;
    }
 
}

function sendMessage(content){
    $.post("/api/messages",{content, chatId}, (data, status, xhr)=>{
        if(xhr.status !== 201){
            alert('Could not send message');
            $(".inputTextBox").val(content);
            return;
        }

        addChatMessageHtml(data)

       if(connected){
            socket.emit('new message', data);
       }
    })
    
}

function addChatMessageHtml(message){
    if(!message || !message._id){
        alert("Message is not valid")
        return;
    }

    const messageDiv = createMessageHtml(message, null, "");

    addMessagesHtmlToPage(messageDiv)
    scrollTobBottom(true);
    
}

function createMessageHtml(message, nextMessage, lastSenderId){
    const sender = message.sender;
    const senderName = sender.firstName + " " + sender.lastName;

    const currentSenderId = sender._id;
    const nextSenderId = nextMessage != null ? nextMessage.sender._id :"";

    const isFirst = lastSenderId != currentSenderId;
    const isLast = nextSenderId != currentSenderId;

    const isMine = message.sender._id == userLoggedIn._id;
    let liClassName = isMine ? "mine" : "theirs"

    let nameElement ="";
    if(isFirst){
        liClassName += " first";

        if(!isMine){
            nameElement =`<span class='senderName'>${senderName}</span>`
        }
    }

    let profileImage =""
    if(isLast){
        liClassName += " last";
        profileImage = `<img src='${sender.profilePic}' />`
    }
    let imageContainer=""
    if(!isMine){
        imageContainer= `<div class='imageContainer'>
        ${profileImage}
        </div>`
    }
  
    return `<li class='message ${liClassName}'>
            ${imageContainer}
                <div class='messageContainer'>
                    ${nameElement}
                    <span class='messageBody'>
                        ${message.content}
                    </span>
                </div>
            </li>`;
}

function scrollTobBottom(animated){
    let container = $(".chatMessages")
    let scrollHeight = container[0].scrollHeight;

    if(animated){
        container.animate({ scrollTop: scrollHeight}, "slow");
    }else{
        container.scrollTop(scrollHeight);
    }
}

function markAllmessageAsRead(){
    $.ajax({
        url: `/api/chats/${chatId}/messages/markAsRead`,
        type:"PUT",
        success:()=> refreshMessagesBadge()
    })
}