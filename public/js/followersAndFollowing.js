$(document).ready(()=>{
    if(selectedTab ==="followers"){
     loadFollowers()
    }else{
     loadFollowing()
    }
 })
 
 
 function loadFollowers(){
     $.get(`/api/users/${profileUserId}/followers`, result=>{
        outputUsers(result.followers, $('.resultsContainer'))
     })
 }
 function loadFollowing(){
     $.get(`/api/users/${profileUserId}/following`,result=>{
        outputUsers(result.following, $('.resultsContainer'))
     })
 }
 
