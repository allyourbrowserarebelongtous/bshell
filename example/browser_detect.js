function(bshell) {
    if(!bshell.require_plugin('browser_detect')) {
	return false;
    }

    var bd = bshell.plugins.browser_detect;
    return {browser: bd.browser,
	    os: bd.os,
	    flash: bd.flash,
	    java: bd.java};
}(bshell);