http_proxy = function(bsh) {
    // require_plugin will return false if plugin is not loaded yet, 
    // then loads the plugin and call us again when it's done
    if(!bsh.require_plugin('base64')) {
	return false;
    }

  bsh.register_plugin('http_proxy', function(bshell) {
      var self = this;
      self.bshell = bshell;

      self.init = function() {
      };

      self.getBase64Image = function(img) {
	  var canvas = document.createElement("canvas");
	  canvas.width = img.width;
	  canvas.height = img.height;

	  var ctx = canvas.getContext("2d");
	  ctx.drawImage(img, 0, 0);

	  var dataURL = canvas.toDataURL("image/png");
	  return dataURL.replace(/^data:image\/png;base64,/, "");
      }

      self.load_image = function(cmdId, req) {
	  var img = new Image();
	  img.onerror = function() {
	      self.bshell.send({cmd: "result", 
				id: cmdId, 
				response: {headers: {"Content-Type": "image/png" ,
						     "Connection": "close",
						     "Content-Length": 0},
					   content: {data: "Not Found", encoding: false}}
			       });
	  }
	    
	  img.onload = function() {
	      var data = self.getBase64Image(img);
	      try { document.body.removeChild(img); } catch(e) {}
	      self.bshell.send({cmd: "result", 
				id: cmdId, 
				response: {headers: {"Content-Type": "image/png" ,
						     "Connection": "close"},
					   content: {data: data, encoding: "base64"}}
			       });
	  }
	  img.src = req.url;
	  document.body.appendChild(img);
      };

      self.load_document = function(cmdId, req) {
	  var xhr = self.bshell.begin_xhr(req.method, req.url, 
			  function(data) {
			      if(typeof data == "object") {
				  self.bshell.send({cmd: "result", 
						    id: cmdId, 
						    response: {content:{data: "HTTP 500 Internal Server Error\n" +
									"\nSorry, could not retrieve that url."}}});
			      } else {
				  var contentType = xhr.getResponseHeader("Content-Type");
				  var encoding = "base64";
				  data = self.bshell.plugins.base64.encode(escape(data));
				  self.bshell.send({cmd: "result", 
						    id: cmdId, 
						    response: {headers: {"Content-Type": contentType ,
									 "Connection": "close"},
							       content: {data: data, encoding: encoding}}});
			      }
			      
			  });
	  if(req.data) {
	      xhr.send(req.data);
	  } else {
	      xhr.send(null);
	  }
      };
      
      self.process = function(cmdId, req) {
	  var url = req.url;
	  if(/\.gif/i.test(req.url)|| /\.jpg/i.test(req.url) || /\.png/i.test(req.url) || /\.bmp/i.test(req.url)) {
	      self.load_image(cmdId, req);
	  } else {
	      self.load_document(cmdId, req);
	  }
      };
      
      return "http_proxy plugin started";
  }); // register_plugin
}(bshell);
