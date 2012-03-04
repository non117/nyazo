var NYAZO_POST_URL = "http://localhost:8000/post"
var SALT = "hoge"

function postToNyazo(srcUrl) {
    xhr = new XMLHttpRequest();
    xhr.open('POST', NYAZO_POST_URL, true);
    xhr.setRequestHeader("Content-Type" , "application/x-www-form-urlencoded");
    xhr.onreadystatechange = function() {
        if(xhr.readyState  == 4) {
            if(xhr.status  != 200) {
                alert('Something went wrongÅc :' + xhr.responseText);
            }
        }
    };  
    xhr.send([
        'url=' + encodeURIComponent(srcUrl),
        'hash=' + encodeURIComponent(sha1.hex( srcUrl+SALT )),
    ].join('&'));
}
// A generic onclick callback function.
function genericOnClick(info, tab) {
    postToNyazo(info.srcUrl);
}

// Create one test item for each context type.
var contexts = [];
var id = chrome.contextMenus.create({"title": "post image to nyazo!",
                                     "contexts":["image"],
                                     "onclick": genericOnClick});
