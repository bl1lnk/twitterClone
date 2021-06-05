$(document).ready(()=>{
   if(selectedTab ==="replies"){
    loadReplies()
   }else{
    loadPosts()
   }
})


function loadPosts(){
    $.get("/api/posts", {postedBy:profileUserId, pinned: true},result=>{
        outputPinnedPost(result, $('.pinnedPostContainer'))
    })
    
    $.get("/api/posts", {postedBy:profileUserId, isReply: false},result=>{
        outputPosts(result, $('.postContainer'))
    })

}
function loadReplies(){
    $.get("/api/posts", {postedBy:profileUserId, isReply: true},result=>{
        outputPosts(result, $('.postContainer'))
    })
}

function outputPinnedPost (results, container){

    if(results.length ===0){
        container.hide();
        return;
    }
    container.html("");

    results.forEach(result=>{
        let html = createPostHtml(result)
        container.append(html);
    });

    
}
