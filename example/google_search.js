
function(bshell) {

    var query = 'browser';

    var searchGoogle = function(query) {
	
	var script = document.createElement('script');
	script.defer = true;
	script.type = "text/javascript";
	script.src = "https://ajax.googleapis.com/ajax/services/search/web?callback=callback&lstkp=0&rsz=large&hl=en&q=" + escape(query) + "&v=1.0";

	callback = function (results) {
	    bshell.send({query: query, results: results});
	};

	document.body.appendChild(script);
    }

    searchGoogle(query);
    return false;
}(bshell);