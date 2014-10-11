// Copyright (c) 2012 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.
var fb = new Firebase("https://intense-fire-6428.firebaseio.com/");
// authClient =-1;
myUser = -1;
var firebaselogin = -1;

var authClient = new FirebaseSimpleLogin(fb, function (error, user)
{
    if (error)
    {
        alert(error);
        return;
    }
    if (user)
    {
        // User is already logged in.

        console.log('User ID: ' + user.id + ', Provider: ' + user.provider);
       
        myUser = user;
        // doLogin(user);
        console.log('Logged in');
        initMyMemes();
    }
    else
    {
    	getCookies("http://example.com/2/", "name", function(name) {
			var email = name;
			getCookies("http://example.com/1/", "whywouldyoudothis", function(whywouldyoudothis) {
				var password = whywouldyoudothis;

				if(password == null || email == null)
				{
					alert("Please sign-in on the MemeMaster Extension button dropdown window");
				}
				else{
    				doLogin(email, password);
    			}
    		});
    	});
    }
});
// The onClicked callback function.
function onClickHandler(info, tab) {
  console.log("item " + info.menuItemId + " was clicked");
  console.log("info: " + JSON.stringify(info));
  console.log("tab: " + JSON.stringify(tab));
  console.log("url: " + JSON.stringify(info.srcUrl));
  var imgurUrl = uploadImgur(info.srcUrl);
  saveImgUrlToDatabase(imgurUrl);
};

chrome.contextMenus.onClicked.addListener(onClickHandler);

// Set up context menu tree at install time.
chrome.runtime.onInstalled.addListener(function() {
  // Create one test item for each context type.
  var context = "image";
  var title = "Add to MemeMaster";
  var id = chrome.contextMenus.create({"title": title, "contexts":[context],
                                         "id": "context" + context});
  console.log("'Add Image' item:" + id);

});

// Takes an image URL and uploads that image to imgur.
// Spits back the imgur URL.
function uploadImgur(url)
{
	var ext = url.split(".");
	ext = ext[ext.length - 1];
	var imgurData = JSON.parse($.ajax({ 
	    url: 'https://api.imgur.com/3/image',
	    async: false,
	    headers:
	    {
	        'Authorization': 'Client-ID 065e4ba7a124af7'
	    },
	    type: 'POST',
	    data:
	    {
	        'image': url
	    }
	}).responseText);
	return imgurData.data.link;
}

// Saves image to specific user profile.
function saveImgUrlToDatabase(url)
{
	
	console.log("id: " + JSON.stringify(myUser.id));
	var imgNameDash = parseImgurUrl(url);
	var userRef = new Firebase("https://intense-fire-6428.firebaseio.com/meme_master/users/" + myUser.id );
	var userImgsRef = userRef.child("images");
	userImgsRef.once('value', function(snap)
	{
	    var imgList = snap.val();
	    if(imgList === null)
	    {
	    	imgList = {}
	    }
	    imgList[imgNameDash] = 
	    {
	    	comments: "",
	    	rating: 0
	    }
	    userRef.update(
	    {
	    	images: imgList
	    });
	});
}

function doLogin(email, password)
{
    authClient.login('password',
    {
        email: email,
        password: password
    });
}

// Utility function to parse imgur URLs.
function parseImgurUrl(imgurUrl)
{
	var parsedUrl = "";
	if(imgurUrl != null && imgurUrl.length > 0)
	{
		parsedUrl = imgurUrl.split("/");
		parsedUrl = parsedUrl[parsedUrl.length - 1];
		return parsedUrl.replace(".", "-");
	}
	else
	{
		return "";
	}
}
function getCookies(domain, name, callback) {
    chrome.cookies.get({"url": domain, "name": name}, function(cookie) {
        if(callback) {
            callback(cookie.value);
        }
    });
}