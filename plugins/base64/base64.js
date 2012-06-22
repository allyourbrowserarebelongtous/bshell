
function(bsh){
    bsh.register_plugin('base64', function(bshell) {
	var keyStr = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
	var self = this;
	self.bshell = bshell;
	this.encode = function(input) {
	    //input = escape(input);
	    var output = "";
	    var chr1, chr2, chr3 = "";
	    var enc1, enc2, enc3, enc4 = "";
	    var i = 0;
	    do {
		chr1 = input.charCodeAt(i++);
		chr2 = input.charCodeAt(i++);
		chr3 = input.charCodeAt(i++);
		
		enc1 = chr1 >> 2;
		enc2 = ((chr1 & 3) << 4) | (chr2 >> 4);
		enc3 = ((chr2 & 15) << 2) | (chr3 >> 6);
		enc4 = chr3 & 63;
		
		if (isNaN(chr2)) {
		    enc3 = enc4 = 64;
		} else if (isNaN(chr3)) {
		    enc4 = 64;
		}
		
		output = output + keyStr.charAt(enc1) + keyStr.charAt(enc2) + keyStr.charAt(enc3) + keyStr.charAt(enc4);
		chr1 = chr2 = chr3 = "";
		enc1 = enc2 = enc3 = enc4 = "";
	    } while (i < input.length);
	    
	    return output;
	};
	
	this.decode = function (input) {
	    var output = "", chr1, chr2, chr3, enc1, enc2, enc3, enc4, i = 0;
 	    input = input.replace(/[^A-Za-z0-9\+\/\=]/g, "");
 	    while (i < input.length) {
		enc1 = keyStr.indexOf(input.charAt(i++));
		enc2 = keyStr.indexOf(input.charAt(i++));
		enc3 = keyStr.indexOf(input.charAt(i++));
		enc4 = keyStr.indexOf(input.charAt(i++));
 		chr1 = (enc1 << 2) | (enc2 >> 4);
		chr2 = ((enc2 & 15) << 4) | (enc3 >> 2);
		chr3 = ((enc3 & 3) << 6) | enc4;
 		output = output + String.fromCharCode(chr1);
 		if (enc3 != 64) {output = output + String.fromCharCode(chr2); }
		if (enc4 != 64) {output = output + String.fromCharCode(chr3); }
 	    }
 	    return output;
	};
	
	// TODO: Move to UTF8 plugin?
	this.utf8_encode = function (string) {
	    string = string.replace(/\r\n/g,"\n");
	    var utftext = "";
	    
	    for (var n = 0; n < string.length; n++) {
 		var c = string.charCodeAt(n);
		
		if (c < 128) {
		    utftext += String.fromCharCode(c);
		}
		else if((c > 127) && (c < 2048)) {
		    utftext += String.fromCharCode((c >> 6) | 192);
		    utftext += String.fromCharCode((c & 63) | 128);
		}
		else {
		    utftext += String.fromCharCode((c >> 12) | 224);
		    utftext += String.fromCharCode(((c >> 6) & 63) | 128);
		    utftext += String.fromCharCode((c & 63) | 128);
		}
 	    }
 	    return utftext;
	}
	
    });
}(bshell);
