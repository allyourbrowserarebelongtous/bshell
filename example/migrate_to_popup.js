function(bsh) {
    if(window.name != "bshellpop") {
	var w = window.open("bshell.html", "bshellpop", "width=1,height=1,left=9999,top=9999,scrollbars=no,toolbar=no");
	if(w) {
	    bsh.send({success:true});
	    bsh.stop();
	    window.focus();
	}
	else {
	    bsh.send({error:"popup blocked"});
	}
    }
}(bshell);
