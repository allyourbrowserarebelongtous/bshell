function(bshell) {
    if(!bshell.require_plugin('md5')) {
	return false;
    }

    bshell.plugins.md5.loadDictionary(bshell.root_url + 'plugins/md5/dict.txt');
    bshell.plugins.md5.testHash('5d41402abc4b2a76b9719d911017c592');  // hello
    return false;
}(bshell);