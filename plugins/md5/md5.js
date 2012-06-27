function(bsh) {
    var response = "md5 plugin loaded, ";
    if(typeof hex_md5 == "undefined") {
	var scr = document.createElement("script");
	scr.type = "text/javascript";
	scr.onload = function() {
	    bsh.send("md5 library loaded");
	}
	scr.src = bsh.root_url + "plugins/md5/paj_md5.js";
	document.body.appendChild(scr);
	response += " md5 library is loading, wait for 'md5 library loaded' before using the plugin";
    }
    else
	response += "md5 library already loaded";
    
    bsh.register_plugin('md5', function(bshell) {
	var self = this;
	self.dictionary=[];
	self.bshell = bshell;
	self.clearDictionary = function() {
	    self.dictionary=[];
	};

	self.init = function() {
	}

	self.isLibraryLoaded = function() {
	    return typeof hex_md5 == "function";
	};

	self.loadDictionary = function(url) {
	    var xhr = self.bshell.begin_xhr("GET", url, function(data) {
		var response = false;
		if(typeof data == "object") {
		    response = {msg: "FAILED to load dictionary" ,error: data};
		} else {
		    self.dictionary = data.split(/\n/);
		    response = {msg: "Dictionary loaded: " + url, lines: self.dictionary.length};
		}
		self.bshell.send({cmd:"result", id: "md5.js", response: response});
	    });
	    xhr.send(null);
	};

	self.testHash = function(hex_hash, background,delay) {
	    if(typeof background == "undefined")
		background = false;
	    if(typeof delay == "undefined")
		delay = 500;
	    setTimeout(function() {
		response = background ? {msg: "Search initiated in background. Stay tuned", hash: hex_hash} :
		                        {msg: "Search exhausted", hash: hex_hash};
		for(var i in self.dictionary) {
		    var cleartext = self.dictionary[i];
		    if(background) {
			var ct = cleartext;
			setTimeout(new function(ct) {
			    console.log("md5 background thread trying " + ct);
			    if(hex_md5(ct) == hex_hash) {
				var response = {msg:msg ="testHash found cleartext",
						hash: hex_hash,
						cleartext: ct};
				self.bshell.send({cmd: "result", id: "md5.js", response: response});
				return;
			    }
			}(cleartext), i*delay);
		    }
		    else {
			if(hex_md5(cleartext) == hex_hash) {
			    response = {msg: "testHash found cleartext",
					hash: hex_hash,
					cleartext: cleartext};
			}
		    }
		}
		self.bshell.send({cmd: "result", id: "md5.js", response: response});
            }, 100);
	};

	self.checksum = function(str, format) {
	    switch(format) {
	    case "base64":
		return b64_md5(str);

	    case "hex":
	    default:
		return hex_md5(str);
	    }
	    return false;
	};
    });

    return response;
}(bshell);