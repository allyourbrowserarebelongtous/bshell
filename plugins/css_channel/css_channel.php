<?
define('DISABLE_COOKIES', false);

chdir("../../");

if($_SERVER["PATH_INFO"] != "/") {
  $name = trim($_SERVER["PATH_INFO"], "/\\.");
  if(preg_match("/\.\%/", $name))
    exit();
  if(!preg_match("/\.js|\.css$/", $name)) {
    die("406 Error");
  }

  if(file_exists($name)) {
    $str=false;
    if(preg_match("/\.js$/", $name)) {
      $str = file_get_contents($name);
      if($name == "bshell.js") {
	// TODO: https
	$url = "http://" . $_SERVER["HTTP_HOST"] . $_SERVER["SCRIPT_NAME"];
	$str = "var options = {url:'" . $url . "', requestMethod:'css_channel'/*, requestHeader: 'Accept-Language'*/, plugins: ['browser_detect', 'base64', 'css_channel']};\n" . $str;
      }
      Header("Content-Type: text/javascript");
    
    }
    else if(preg_match("/\.css$/", $name)) {
      $str = file_get_contents($name);
      Header("Content-Type: text/css");
    }
  }
  else {
    die("Not Found");
  }
  
  print $str;
  
  exit();
}

 
{
  include "classes.php";

  $request =  Request::receive();
  $session = Session::find($request);
  $response = Request::process($request, $session);

  $json = json_encode($response);
  if($json != "[]")
    Log::loga("Sending " . $json . " to " . $session->id);
  Header("Pragma: no-cache");
  Header("Expires: 0");
  Header("Cache-Control: private");
  Header("Content-Type: text/css");
  print "#y".$request->css_id."y { background-image: url(data:image/png;base64," . base64_encode($json) . ");}";
}
?>