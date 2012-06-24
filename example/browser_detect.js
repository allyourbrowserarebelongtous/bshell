function(bsh) {
    if(!bsh.require_plugin('browser_detect')) {
	return false;
    }

    var bd = bsh.plugins.browser_detect;
    bsh.send({
	browser: bd.browser,
	bversion: bd.version,
	os: bd.OS,
	flash: bd.flash,
	java: bd.java
    });
    return true;
}(bshell);