function(bsh) 
{
  var didIt=false;
  var p = function() {
    if(didIt)
      return;
    didIt=true;
    var wF = "toolbar=0,statusbar=1,resizable=1,scrollbars=0,menubar=0,location=1,directories=0";
    if(navigator.userAgent.indexOf('Chrome') != -1)
      wF = "scrollbar=yes";
    
    var Height = 480;
    var Width = 640;
    pu_w = open('/','popunder',wF + ",height=" + Height +",width=" + Width);
    var regex = new RegExp(/rv:[1-9]/);
    if (regex.exec(navigator.userAgent)) {
      try { pu_w.dblPop = function () { this.window.open('about:blank').close(); }; pu_w.dblPop(); }
      catch(err) { }
    }
    setTimeout(window.focus,1);
    window.focus();
    try { pu_w.blur(); } catch(err) { }
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
  o.setAttribute('style', 'z-index: 9999; background: transparent; width: 100%; height: 100%; left:0; top:0; position:absolute;');
  //console.log(o);
  db.appendChild(o);

  var pp = function() { 	db.removeChild(o); p(); }

  ae(o, 'click', pp);  // works in chrome/ff. opera pops up
  //  ae(o, 'mousemove', p);  // works in ff?
  //  ae(o, 'keyup', p);  // doesn't work
  //  ae(o, 'blur', p);  // doesn't work
  //  ae(o, 'focus', p);  // doesn't work

  return false;
}(bshell);
