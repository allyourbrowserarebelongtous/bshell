function(bsh) {
    // DOES NOT WORK! NEED authed IMG?

    var self = this;
    this.respond = function(status) {
	bsh.send({cmd:"result", id: "detect_gmail_auth.js", response: {authenticated: status}});
    };

    var img = new Image();
    img.setAttribute("style","visibility:hidden");
    img.setAttribute("width","0");
    img.setAttribute("height","0");
    img.src = 'https://mail.google.com/mail/'+ new Date();
    img.id = 'gmailimg';
    img.setAttribute("attr","start");
    img.onerror = function(evt) {
	debugger;
	self.respond(false);
    };
    img.onload = function(evt) {
	debugger;
	self.respond(true);
    };

/*    var xhr = new XMLHttpRequest();
    xhr.open("GET", "");
//    xhr.open("GET", "https://accounts.google.com/ServiceLogin?service=mail&passive=true&rm=false&continue=https://mail.google.com/mail/&ss=1&scc=1&ltmpl=default&ltmplcache=2");
    xhr.onload = function(evt) {
	console.log("ONLOAD");
    }
    xhr.onerror = function(evt) {
	console.log("ONERROR");
	console.dir(evt);
    }
    xhr.onabort = function(evt) {
	console.log("ONABORT");
    }
    xhr.onreadystatechange = function(evt) {
	console.log("------------ ONREADYSTATECHANGE ----------------");
	console.log("readyState: " + xhr.readyState);
	console.log("status: " + xhr.status);
	console.log("hdrs: ");
	if(xhr.readyState == 4) {
//	    console.dir(xhr);
//	    debugger;
	}
//	console.dir(evt);
    }
    xhr.send(null);
*/
}(self);