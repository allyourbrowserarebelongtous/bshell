browser_detect = function(bshell) {
    bshell.register_plugin('browser_detect', function(bshell) {
	var self = this;
	self.bshell = bshell;

	this.init = function () {
	    self.plugins = [];
	    self.browser = self.identifyBrowser(navigator.userAgent);
	    self.version = self.browser.version;
	    self.OS = self.os = this.identifyOS(navigator.userAgent);
	    self.flash = self.detectFlash();
	    self.java = self.detectJava();
//	    self.bshell.log("detected: os="+self.os+", browser=" + JSON.stringify(self.browser) );
	};

	this.identifyOS = function(userAgent) {
	    // TODO: Tests and add more
	    var os_regexps = {
		'Windows': [ /(Windows\ [^;]*);/ ],
		'OS X': [ /(\ Mac\ OS\ X[^;]*);/ ],
		'iPad': [ /(iPad)/ ],
		'iPhone': [ /(iPhone)/ ],
		'Linux': [ /(Linux[^;]*);/ ]
	    },
	    re, m, os;

	    for (osi in os_regexps)
		while (re = os_regexps[osi].shift())
		    if (m = userAgent.match(re)) {
			return m[1];
		    }
//	    console.log(userAgent);
//	    debugger;
	    return null;
	};

	this.identifyBrowser = function(userAgent) {
	    var browser_regexps = {
		'Chrome': [ /Chrome\/(\S+)/ ],
		'Firefox': [ /Firefox\/(\S+)/ ],
		'MSIE': [ /MSIE (\S+);/ ],
		'Opera': [
			/Opera\/.*?Version\/(\S+)/,     /* Opera 10+ */
			/Opera\/(\S+)/                  /* Opera 9 and older */
		],
		'Safari': [ /Version\/(\S+).*?Safari\// ]
	    },
	    re, m, browser, version;

	    if (userAgent === undefined)
		userAgent = navigator.userAgent;

	    var elements = 3;
	    for (browser in browser_regexps)
		while (re = browser_regexps[browser].shift())
		    if (m = userAgent.match(re)) {
			version = (m[1].match(new RegExp('[^.]+(?:\.[^.]+){0,' + --elements + '}')))[0];
			return {name: browser, version: version};
		    }

	    return {name: "Unknown", version: 0};
	};

	this.listPlugins = function() {
	    if(self.plugins.length == 0) {
		if(typeof navigator != "undefined" && typeof navigator.plugins != "undefined") {
		    var plugins = navigator.plugins;
		    for(var plug_n in plugins) {
			var plugin = plugins[plug_n];
			for(var mt=0; mt < plugins.length; mt++) {
			    try {
				if(typeof plugin[mt] != "undefined") {
				    self.plugins[ plugin[mt].type ] = plugin.name;
				}
			    } catch(e) {}
			}
		    }
		}
	    }
	    return self.plugins;
	};

	this.detectJava = function() {
	    var plugins = self.listPlugins();
	    var java = {applet: false, bean: false, vm: false};
	    for(var mt in plugins) {
		if(/^application\/x-java-applet/.test(mt))
		    java.applet = true;
		if(/^application\/x-java-bean/.test(mt))
		    java.bean = true;
		if(/^application\/x-java-vm/.test(mt))
		    java.vm = true;
	    }
	    return java;
	};

	this.detectFlash = function() {
            var plugins = self.listPlugins();

	    for(var mt in plugins) {
		if(/^application\/x-shockwave-flash/.test(mt))
		    return true;
	    }

	    try {
		var fo = (typeof ActiveXObject != "undefined" ? new ActiveXObject('ShockwaveFlash.ShockwaveFlash') : false);
		if(fo)
		    return true;
	    }catch(e){
		if(navigator.mimeTypes ["application/x-shockwave-flash"] != undefined) 
		    return true;
	    }
	    return false;
	};
    });
    return "browser_detect plugin loaded";
}(bshell);