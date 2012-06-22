function(bshell) {
    /* Needs: Flash and plugin detection*/
    bshell.register_plugin('browser_detect', function(bshell) {
	var self = this;
	self.bshell = bshell;
	this.init = function () {
	    self.browser = self.searchString(self.dataBrowser) || "Unknown";
	    self.version = self.searchVersion(navigator.userAgent)
		    || self.searchVersion(navigator.appVersion)
		    || "an unknown version";
	    self.OS = self.searchString(self.dataOS) || "Unknown";
	};
		
	this.searchString = function (data) {
	    for (var i=0;i<data.length;i++)	{
		var dataString = data[i].string;
		var dataProp = data[i].prop;
		self.versionSearchString = data[i].versionSearch || data[i].identity;
		if (dataString) {
		    if (dataString.indexOf(data[i].subString) != -1)
			return data[i].identity;
		}
		else if (dataProp)
		    return data[i].identity;
	    }
	};

	this.searchVersion = function (dataString) {
	    var index = dataString.indexOf(self.versionSearchString);
	    if (index == -1) return;
	    return parseFloat(dataString.substring(index + self.versionSearchString.length+1));
	};

	this.dataBrowser = [
	    {
		string: navigator.userAgent,
		subString: "Chrome",
		identity: "Chrome"
	    },
	    { 	string: navigator.userAgent,
		subString: "OmniWeb",
		versionSearch: "OmniWeb/",
		identity: "OmniWeb"
	    },
	    {
		string: navigator.vendor,
		subString: "Apple",
		identity: "Safari",
		versionSearch: "Version"
	    },
	    {
		prop: window.opera,
		identity: "Opera",
		versionSearch: "Version"
	    },
	    {
		string: navigator.vendor,
		subString: "iCab",
		identity: "iCab"
	    },
	    {
		string: navigator.vendor,
		subString: "KDE",
		identity: "Konqueror"
	    },
	    {
		string: navigator.userAgent,
		subString: "Firefox",
		identity: "Firefox"
	    },
	    {
		string: navigator.vendor,
		subString: "Camino",
		identity: "Camino"
	    },
	    {		// for newer Netscapes (6+)
		string: navigator.userAgent,
		subString: "Netscape",
		identity: "Netscape"
	    },
	    {
		string: navigator.userAgent,
		subString: "MSIE",
		identity: "Internet Explorer",
		versionSearch: "MSIE"
	    },
	    {
		string: navigator.userAgent,
		subString: "Gecko",
		identity: "Mozilla",
		versionSearch: "rv"
	    },
	    { 		// for older Netscapes (4-)
		string: navigator.userAgent,
		subString: "Mozilla",
		identity: "Netscape",
		versionSearch: "Mozilla"
	    }
	];

	this.dataOS = [
	    {
		string: navigator.platform,
		subString: "Win",
		identity: "Windows"
	    },
	    {
		string: navigator.platform,
		subString: "Mac",
		identity: "Mac"
	    },
	    {
		string: navigator.userAgent,
		subString: "iPhone",
		identity: "iPhone/iPod"
	    },
	    {
		string: navigator.platform,
		subString: "Linux",
		identity: "Linux"
	    }
	];

	this.init();
    });

}(bshell);