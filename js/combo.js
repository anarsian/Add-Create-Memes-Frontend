var fb = new Firebase("https://intense-fire-6428.firebaseio.com/");
myUser = -1;
var newUser = false;

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
        console.log('Logged in')
        document.getElementById("registration_background").click();
        // Display welcome message if user is logged in.
        $(".loginForm").css("opacity", 0);
        setTimeout(function()
        {
        	$(".loginForm").hide("fast", function()
        	{
        		$(".customUserFields").show("fast", function()
        		{
        			if(newUser)
        			{
        				newUser = false;
        				var userRef = new Firebase("https://intense-fire-6428.firebaseio.com/meme_master/users/" + myUser.id + "/");
        				var username = $("#registration_username").val();
    					userRef.update(
    					{
    						nickname: username
    					});
        			}
        			var nicknameRef = fb.child("meme_master/users/" + myUser.id + "/nickname");
        			nicknameRef.once('value', function(snap)
    				{
    					$("#user_welcome_message").html("Welcome&nbsp;&nbsp;" + snap.val() + "!&nbsp;&nbsp;|&nbsp;&nbsp;");
    				});
        			$(".customUserFields").css("opacity", 1);
        		});
        	});
        }, 500);
    }
    else
    {
		// User is logged out.
		console.log('Logged out');
		// Display login/signup buttons.
		$(".customUserFields").css("opacity", 0);
		setTimeout(function()
		{
			$(".customUserFields").hide("fast", function()
			{
				$(".loginForm").show("fast", function()
				{
					$(".loginField").hide("fast", function()
					{
						$(".button").show("fast", function()
						{
							$(".loginForm").css("opacity", 1);
							$(".button").css("opacity", 1);
						});
					});
				});
			});
		}, 350);
	}
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
	var imgNameDash = parseImgurUrl(url);
	var userRef = new Firebase("https://intense-fire-6428.firebaseio.com/meme_master/users/" + myUser.id);
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

// Utility function to parse tags.
function parseTags(text)
{
	if(text != null && text.length > 0)
	{
		return text.split(/, ?/);
	}
	else
	{
		return "";
	}
}

// Utility function to parse search queries.
function parseSearch(query)
{
	if(query != null && query.length > 0)
	{
		return query.split(/ /);
	}
	else
	{
		return "";
	}
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

// Archives images in order for fast searching and loading
// of images.
function saveImgMetaData(imgurUrl, tags, title)
{
	// Only perform this function if a URL is supplied.
	if(imgurUrl != null && imgurUrl.length > 0)
	{
		var imgNameDash = parseImgurUrl(imgurUrl);
		var fbRef = new Firebase("https://intense-fire-6428.firebaseio.com/meme_master/");
		var imgsRef = fbRef.child("images");
		imgsRef.once('value', function(snap)
		{
			var imgList = snap.val();
			// If there are no images inside of Firebase, add current image
			// in.
			if(imgList === null)
			{
				imgList = {};
			}
			if(imgurUrl != null && imgurUrl.length > 0)
			{
				imgList[imgNameDash] = 
				{
					title: title,
					tags: tags
				}
			}
			else
			{
				imgList[imgNameDash] = 
				{
					tags: tags
				}
			}
			fbRef.update(
			{
				images: imgList
			});
		});
	}
	// Only add tags into Firebase if user supplied tags.
	if(tags != null && tags.length > 0)
	{
		var fbRef = new Firebase("https://intense-fire-6428.firebaseio.com/meme_master/");
		var tagsRef = fbRef.child("tags");
		tagsRef.once('value', function(snap)
		{
			var tagsList = snap.val();
			// If there are no tags inside of Firebase, then push all current tags
			// into Firebase
			if(tagsList === null)
			{
				tagsList = {}
				for(var i = 0; i < tags.length; i++)
				{
					tagsList[tags[i]] = [imgNameDash];
				}
			}
			// Otherwise, get all the current tags and update their values.
			else
			{
				for(var i = 0; i < tags.length; i++)
				{
					if(tagsList[tags[i]] == null)
					{
						tagsList[tags[i]] = [];
					}
					tagsList[tags[i]].push(imgNameDash);
				}
			}
			fbRef.update(
			{
				tags: tagsList
			});
		});
	}
}

// Dynamically load content from new page into current page.
function loadPage(url, section)
{
	$(section).css("opacity", 0);

	$(section).load(url + " " + section, function()
	{
		var contentId = $(section + " " + section).attr("id");
		var contentHtml = $(section + " " + section).html();
		$(section).html(contentHtml);
		$(section).removeAttr("id");
		$(section).attr("id", contentId);
		$(section).css("opacity", 1);
	});
}

// Meme filters
function initFilters()
{

	$("#filter-all").css("color", "rgb(255, 137, 41)");
	$("#filter-custAll").css("color", "rgb(255, 137, 41)");
	$("#filter-all").click(function()
	{
	    $("#filter-top").css("color", "rgb(140, 140, 140)");
	    $("#filter-new").css("color", "rgb(140, 140, 140)");
	    $("#filter-trending").css("color", "rgb(140, 140, 140)");
	    $("#filter-all").css("color", "rgb(255, 137, 41)");
	    $(".is-top").show("slow");
	    $(".is-trending").show("slow");
	    $(".is-new").show("slow");
	}); 
	$("#filter-top").click(function()
	{
	    $("#filter-all").css("color", "rgb(140, 140, 140)");
	    $("#filter-new").css("color", "rgb(140, 140, 140)");
	    $("#filter-trending").css("color", "rgb(140, 140, 140)");
	    $("#filter-top").css("color", "rgb(255, 137, 41)");
	    $(".is-top").show("slow");
	    $(".is-trending").hide("slow");
	    $(".is-new").hide("slow");
	}); 
	$("#filter-trending").click(function()
	{
	    $("#filter-top").css("color", "rgb(140, 140, 140)");
	    $("#filter-new").css("color", "rgb(140, 140, 140)");
	    $("#filter-all").css("color", "rgb(140, 140, 140)");
	    $("#filter-trending").css("color", "rgb(255, 137, 41)");
	    $(".is-top").hide("slow");
	    $(".is-trending").show("slow");
	    $(".is-new").hide("slow");
	}); 
	$("#filter-new").click(function()
	{
	    $("#filter-top").css("color", "rgb(140, 140, 140)");
	    $("#filter-all").css("color", "rgb(140, 140, 140)");
	    $("#filter-trending").css("color", "rgb(140, 140, 140)");
	    $("#filter-new").css("color", "rgb(255, 137, 41)");
	    $(".is-top").hide("slow");
	    $(".is-trending").hide("slow");
	    $(".is-new").show("slow");
	});

	$("#filter-cust1").click(function()
	{
	    $("#filter-custAll").css("color", "rgb(140, 140, 140)");
	    $("#filter-cust2").css("color", "rgb(140, 140, 140)");
	    $("#filter-cust3").css("color", "rgb(140, 140, 140)");
	    $("#filter-cust4").css("color", "rgb(140, 140, 140)");
	    $("#filter-cust1").css("color", "rgb(255, 137, 41)");
	    $(".is-cust1").show("slow");
	    $(".is-cust2").hide("slow");
	    $(".is-cust3").hide("slow");
	    $(".is-cust4").hide("slow");
	}); 
	$("#filter-cust2").click(function()
	{
	    $("#filter-custAll").css("color", "rgb(140, 140, 140)");
	    $("#filter-cust1").css("color", "rgb(140, 140, 140)");
	    $("#filter-cust3").css("color", "rgb(140, 140, 140)");
	    $("#filter-cust4").css("color", "rgb(140, 140, 140)");
	    $("#filter-cust2").css("color", "rgb(255, 137, 41)");
	    $(".is-cust2").show("slow");
	    $(".is-cust1").hide("slow");
	    $(".is-cust3").hide("slow");
	    $(".is-cust4").hide("slow");
	}); 
	$("#filter-cust3").click(function()
	{
	    $("#filter-custAll").css("color", "rgb(140, 140, 140)");
	    $("#filter-cust1").css("color", "rgb(140, 140, 140)");
	    $("#filter-cust2").css("color", "rgb(140, 140, 140)");
	    $("#filter-cust4").css("color", "rgb(140, 140, 140)");
	    $("#filter-cust3").css("color", "rgb(255, 137, 41)");
	    $(".is-cust3").show("slow");
	    $(".is-cust1").hide("slow");
	    $(".is-cust2").hide("slow");
	    $(".is-cust4").hide("slow");
	}); 
	$("#filter-cust4").click(function()
	{
	    $("#filter-custAll").css("color", "rgb(140, 140, 140)");
	    $("#filter-cust1").css("color", "rgb(140, 140, 140)");
	    $("#filter-cust2").css("color", "rgb(140, 140, 140)");
	    $("#filter-cust3").css("color", "rgb(140, 140, 140)");
	    $("#filter-cust4").css("color", "rgb(255, 137, 41)");
	    $(".is-cust1").hide("slow");
	    $(".is-cust2").hide("slow");
	    $(".is-cust3").hide("slow");
	    $(".is-cust4").show("slow");
	}); 
	$("#filter-custAll").click(function()
	{
	    $("#filter-custAll").css("color", "rgb(255, 137, 41)");
	    $("#filter-cust1").css("color", "rgb(140, 140, 140)");
	    $("#filter-cust2").css("color", "rgb(140, 140, 140)");
	    $("#filter-cust3").css("color", "rgb(140, 140, 140)");
	    $("#filter-cust4").css("color", "rgb(140, 140, 140)");
	    $(".is-cust1").show("slow");
	    $(".is-cust2").show("slow");
	    $(".is-cust3").show("slow");
	    $(".is-cust4").show("slow");
	}); 
}

// lightbox functions
function loadThumbnails()
{
	$(".imgFrame").each(function()
	{
		var url = $(this).attr("data-img");
		$(this).css("background", "url(\"" + url + "\")");
		$(this).css("background-repeat", "no-repeat");
		$(this).css("background-size", "100% auto");
		$(this).css("background-position", "center");
	});
}

function initLightboxClickHandlers()
{
	console.log("initLightboxClickHandlers loaded");
	$(document).one("click", ".tag", function()
	{
		console.log("tag click handlers loaded");
		var tag = $(this).html();
		// $(".tag").each(function()
		// {
		// 	$(".tag").off("click");
		// });

		document.getElementById("lightbox_background").click();
		// Load search page.
		var url = "search.html"
		history.pushState('', 'New URL: ' + url, url);

		// Dynamically loads page
		loadPage(url, "main");
		loadPage(url, "title");
		loadPage(url, ".filterLinks");
		reloadFavIcon();

		// Populate the page with search results.
		var tagsRef = new Firebase("https://intense-fire-6428.firebaseio.com/meme_master/tags");
		tagsRef.once('value', function(snap)
		{
			var tags = snap.val();
			var imgList = [];
			var searchResults = {};
			imgList = tags[tag];
			// console.log(imgList);
			if(imgList)
			{
				for(var j = 0; j < imgList.length; j++)
				{
					searchResults[imgList[j]] = imgList[j];
				}
			}
			// console.log(searchResults);
			var htmlString = "";
		    for (var key in searchResults)
		    {
				if (searchResults.hasOwnProperty(key))
				{
					var imgID = key.replace("-", ".");
					var imgURL = "https://i.imgur.com/" + imgID;
					htmlString += "<div class='imgFrame lightboxLink border' data-img='" + imgURL + "'>\n</div>\n"
				}
		    }
		    $("#meme_gallery").html(htmlString);
		    // Since click handlers are lost, must reload the scripts.
		    loadThumbnails();
		    initLightboxClickHandlers();
		});
	});

	$(".lightboxLink").click(function(e)
	{
		$("#lightbox_background").css("opacity", 1);
		$("#lightbox_background").css("z-index", 10);

		var url = $(this).attr("data-img");

		// Fill function buttons with data.
		$("#lightbox_picture").attr("src", url);
		$("#copy_link_button").attr("data-clipboard-text", url);
		$("#save_pic_button").attr("href", url);
		$("#save_pic_button").attr("download", url);

		var imgNameDash = parseImgurUrl(url);

		var imgsRef = new Firebase("https://intense-fire-6428.firebaseio.com/meme_master/images");
		imgsRef.once('value', function(snap)
		{
			var imgList = snap.val();
			var title = imgList[imgNameDash].title;
			var tags = imgList[imgNameDash].tags;
			// Set the title for the lightbox img.
			$("#img_title").html(title);

			// Display tags at the bottom.
			var htmlString = "";
			for(var i = 0; i < tags.length; i++)
			{
				htmlString += "<span class='tag'>" + tags[i] + "</span>" + "\n";
			}
			$("#tag_container").html(htmlString);
		});

		// Display user comments.
		var userImgsRef = new Firebase("https://intense-fire-6428.firebaseio.com/meme_master/users/" + myUser.id + "/images/");
		var currentImgRef = userImgsRef.child(imgNameDash);
		currentImgRef.once('value', function(snap)
		{
			var userImg = snap.val();
			var comment = userImg.comments;

			$("#comment_box").val(comment);
		});

		// Comment button saves comments.
		$("#comment_submit_button").click(function()
		{
			var comment = $("#comment_box").val();
			var userImgsRef = new Firebase("https://intense-fire-6428.firebaseio.com/meme_master/users/" + myUser.id + "/images/");
			var currentImgRef = userImgsRef.child(imgNameDash);
			currentImgRef.update(
			{
				comments: comment
			});
		});

		// Get the current star rating.
		currentImgRef.once('value', function(snap)
		{
			var userImg = snap.val();
			console.log(userImg);
			var rating = userImg.rating;

			if(rating > 0)
			{
				document.getElementById("star" + rating).checked = true;
			}
		});

		// Allow user to change the current rating.
		$("#star1").click(function()
		{
			document.getElementById("star1").checked = true;
			currentImgRef.update(
			{
				rating: 1
			});
		});
		$("#star2").click(function()
		{
			document.getElementById("star2").checked = true;
			currentImgRef.update(
			{
				rating: 2
			});
		});
		$("#star3").click(function()
		{
			document.getElementById("star3").checked = true;
			currentImgRef.update(
			{
				rating: 3
			});
		});
		$("#star4").click(function()
		{
			document.getElementById("star4").checked = true;
			currentImgRef.update(
			{
				rating: 4
			});
		});
		$("#star5").click(function()
		{
			document.getElementById("star5").checked = true;
			currentImgRef.update(
			{
				rating: 5
			});
		});
	});

	$("#lightbox_background").click(function(data, handler)
	{
		if(data.target == this)
		{
			$("#lightbox_background").css("opacity", 0);
			setTimeout(function()
			{
				$("#lightbox_background").css("z-index", -5);
			}, 300);
			$("#meme_gallery").css("position", "");
			$("#star1").unbind("click");
			$("#star2").unbind("click");
			$("#star3").unbind("click");
			$("#star4").unbind("click");
			$("#star5").unbind("click");
			$("#comment_submit_button").unbind("click");
			lightboxReset();
		}
	});
	$("#copy_pic_button").click(function()
	{
		alert("This feature is not yet implemented.");
	});
}

function lightboxReset()
{
	$("#img_title").html("");
	$("#tag_container").html("");
	document.getElementById("star1").checked = false;
	document.getElementById("star2").checked = false;
	document.getElementById("star3").checked = false;
	document.getElementById("star4").checked = false;
	document.getElementById("star5").checked = false;
	$("#comment_box").val("");
}

// Reloads favicon after each dynamic page load
function reloadFavIcon()
{
	var link = document.createElement('link');
    link.type = "image/x-icon";
    link.rel = "shortcut icon";
    link.href = "../images/favicon.png";
    document.getElementsByTagName('head')[0].appendChild(link);
}

function initMyMemes()
{
	var htmlString = "";
	var userRef = new Firebase("https://intense-fire-6428.firebaseio.com/meme_master/users/" + myUser.id);
	var userImgsRef = userRef.child("images");
	userImgsRef.once('value', function(snap)
	{
	    var imgList = snap.val();
	    for (var key in imgList)
	    {
	    	console.log(key);
			if (imgList.hasOwnProperty(key))
			{
				var imgID = key.replace("-", ".");
				var imgLink = "https://i.imgur.com/" + imgID;
				htmlString += "\n<div class='imgFrame lightboxLink border' data-img='" + imgLink + "'>\n</div>";
			}
	    }
	    $("#meme_gallery").html(htmlString);
	    // Since click handlers are lost, must reload the scripts.
	    loadThumbnails();
	    initLightboxClickHandlers();
	    initFilters();  
	});
}

function initMainPage()
{
	var htmlString = "";
	var imagesRef = new Firebase("https://intense-fire-6428.firebaseio.com/meme_master/images");
	imagesRef.once('value', function(snap)
	{
		var imgList = snap.val();
		var filter = "";
		for (var key in imgList)
		{
			var random = Math.floor((Math.random() * 3) + 1);
			switch(random)
			{
				case 1:
					filter = "is-trending";
					break;
				case 2:
					filter = "is-new";
					break;
				case 3:
					filter = "is-top";
					break;
			}

			if (imgList.hasOwnProperty(key))
			{
				var imgID = key.replace("-", ".");
				var imgLink = "https://i.imgur.com/" + imgID;
				htmlString += "\n<div class='imgFrame lightboxLink border " + filter + "' data-img='" + imgLink + "'>\n</div>";
			}
		}
		$("#meme_gallery").html(htmlString);
		loadThumbnails();
		initLightboxClickHandlers();
		initFilters();
	});
}

// Sidebar functions
function initSidebarHover()
{
	$('#sidebar').hover(function ()
	{
	    $("#sidebar").css("transform", "translateX(90%)");
	}, function()
	{
		$("#sidebar").css("transform", "translateX(0%)");
	});
}

function initSidebarClickHandler()
{

	$(".sidebar_button").click(function(e)
	{
		// Prevent page from loading normally.
		e.preventDefault();

		// Remove sidebar menu highlight for being active.
		$(".sidebar_menu_item").each(function()
		{
			$(this).removeClass("is-active");
		});

		// Add highlighting for the menu item just pressed.
		$(this).parent(".sidebar_menu_item").addClass("is-active");

		// Grab the url for the page to be loaded.
		var url = $(this).attr("href");
		history.pushState('', 'New URL: ' + url, url);

		// Dynamically loads page and its respective title
		loadPage(url, "main");
		loadPage(url, "title");
		reloadFavIcon();

		// Load filter links if it's not the createMemes page which doesn't
		// need filters.
		if(url != "CreateMemes.html")
		{
			// Load filter links from new page.
			$(".filterLinks").css("opacity", 1);
			loadPage(url, ".filterLinks");

			// Since click handlers are lost, must reload the scrips.
			setTimeout(function()
			{	
				// Load special script for my memes page.
				if(url == "myMemes.html")
				{
					initMyMemes();
				}
				else if(url == "index.html")
				{
					// Since click handlers are lost, must reload the scripts.
					initMainPage();
				}
			}, 350);
		}
		else
		{
			$(".filterLinks").css("opacity", 0);
			$.getScript("../js/previewz.js");
		}
	});
}

// Login functions
function initLoginFieldClickHandlers()
{
	$("#login_button").click(function()
	{
		$(".button").css("opacity", 0);
		setTimeout(function()
		{
			$(".button").hide("fast", function()
			{
				$(".loginField").show("fast", function()
				{
					$(".loginField").css("opacity", 1);
				});
			});
		}, 350);
	});
	$("#logout_button").click(function()
	{
		authClient.logout();
	});
	$("#submit_login").click(function()
	{
		console.log('Trying to login: ' + $("#login_email").val());

		var email = $("#login_email").val();
		var password = $("#login_password").val();

		doLogin(email, password);
	});
	$("#cancel_login").click(function()
	{
		$(".loginField").css("opacity", 0);
		setTimeout(function()
		{
			$(".loginField").hide("fast", function()
			{
				$(".button").show("fast", function()
				{
					$(".button").css("opacity", 1);
				});
			});
		}, 500);
	});
}

// User registration functions

function initRegistration()
{
	$("#register_button").click(function(e)
	{
		$("#registration_background").css("opacity", 1);
		$("#registration_background").css("z-index", 10);
	});

	$("#registration_background").click(function(data, handler)
	{
		if(data.target == this)
		{
			$("#registration_background").css("opacity", 0);
			setTimeout(function()
			{
				$("#registration_background").css("z-index", -5);
			}, 300);
			$("#meme_gallery").css("position", "");
		}
	});
	$("#sign_up_button").click(function(e)
	{
		e.preventDefault();
		registerUser();
	});
}

// Search bar functions

// Login functions
function initSearchBar()
{
	$("#search_box").focusout(function()
	{
		$("#search_box").val("");
	});
	$("#search_box").keypress(function(e)
	{
		// If enter button pressed, do a search.
		if(e.which == 13)
		{
			e.preventDefault();

			// Obtain tags to use.
			var query = $("#search_box").val();
			console.log("Searching for " + query);
			var searchTerms = parseSearch(query);
			// console.log(searchTerms);

			// Load search page.
			var url = "search.html"
			history.pushState('', 'New URL: ' + url, url);

			// Dynamically loads page
			loadPage(url, "main");
			loadPage(url, "title");
			loadPage(url, ".filterLinks");
			reloadFavIcon();

			// // Populate the page with search results.
			var tagsRef = new Firebase("https://intense-fire-6428.firebaseio.com/meme_master/tags");
			tagsRef.once('value', function(snap)
			{
				var tags = snap.val();
				var imgList = [];
				var searchResults = {};
				for(var i = 0; i < searchTerms.length; i++)
				{
					imgList = tags[searchTerms[i]];
					if(imgList)
					{
						for(var j = 0; j < imgList.length; j++)
						{
							searchResults[imgList[j]] = imgList[j];
						}
					}
				}
				// console.log(searchResults);
				var htmlString = "";
			    for (var key in searchResults)
			    {
					if (searchResults.hasOwnProperty(key))
					{
						var imgID = key.replace("-", ".");
						var imgURL = "https://i.imgur.com/" + imgID;
						htmlString += "<div class='imgFrame lightboxLink border' data-img='" + imgURL + "'>\n</div>\n"
					}
			    }
			    $("#meme_gallery").html(htmlString);
			    // Since click handlers are lost, must reload the scripts.
			    loadThumbnails();
			    initLightboxClickHandlers();
			});
		}
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

function registerUser()
{
	var email = $("#registration_email").val();
	var password = $("#registration_password").val();
	authClient.createUser(email, password, function (error, user)
	{
	    if (!error)
	    {
	    	newUser = true;
	        console.log('registering new user');
	        doLogin(email, password);
	    }
	    else
	    {
	        alert(error);
	    }
	});
}

$(document).ready(function()
{
	reloadFavIcon();
	initLoginFieldClickHandlers();
	initSearchBar();
	initSidebarHover();
	initSidebarClickHandler();
	initFilters();
	loadThumbnails();
	initLightboxClickHandlers();
	initRegistration();
	if(document.URL === "https://cse134-135-2014.github.io/cse134_group11/HW3/html/index.html" ||
		document.URL === "https://cse134-135-2014.github.io/cse134_group11/HW3/html/")
	{
		initMainPage();
	}

	// Copy to clipboard stuff.
	var client = new ZeroClipboard($("#copy_link_button"),
	{
		moviePath: "http://www.paulund.co.uk/playground/demo/zeroclipboard-demo/zeroclipboard/ZeroClipboard.swf",
		debug: false
	});
});