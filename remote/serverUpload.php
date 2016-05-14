<?php
require("config.php");

use LZCompressor\LZString as LZString;

// respond to preflights
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
  // return only the headers and not the content
  // only allow CORS for POST request
  if (isset($_SERVER['HTTP_ACCESS_CONTROL_REQUEST_METHOD']) && $_SERVER['HTTP_ACCESS_CONTROL_REQUEST_METHOD'] == 'POST') {
    header("Access-Control-Allow-Origin: *");
    header("Access-Control-Allow-Methods: POST");
    header("Access-Control-Allow-Headers: Origin, Content-Type, Accept, Authorization, X-Request-With");
    header("Access-Control-Allow-Credentials: true");
  }
  exit;
}

// Provide headers for CORS
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Allow-Headers: Origin, Content-Type, Accept, Authorization, X-Request-With");
header("Access-Control-Allow-Credentials: true");
header("Content-Type: application/json");

// Process Upload
$raw = file_get_contents("php://input");
$json = json_decode($raw);

if ((!isset($json->moduleId) || is_null($json->moduleId)) || (!isset($json->sessionId) || is_null($json->sessionId)) || (!isset($json->userCode) || is_null($json->userCode)) ) {
	header('HTTP/1.1 500 Internal Server Error');
	echo json_decode("{'message': 'Missing data!'}");
	exit;
}

$user = filter_var($json->userCode, FILTER_SANITIZE_STRING);
$moduleId = filter_var($json->moduleId, FILTER_SANITIZE_STRING);
$moduleLabel = filter_var($json->moduleLabel, FILTER_SANITIZE_STRING);
$sessionId = str_pad($json->sessionId, 6, "0", STR_PAD_LEFT);
$data = LZString::decompressFromBase64($json->trialData);
$path = $tatoolwebpath . $moduleId . "/";
$filename = (is_null($moduleLabel) ? $moduleId : $moduleLabel) . "_" . $user . "_" . $sessionId;
$zipFilename = $moduleId . "_" . $user . '.zip';
$timestamp = ""; 
$extension = ".csv";



// create target module directory if it doesn't exist yet
if (!file_exists($path)) {
  mkdir($path, 0777, true);
}

// check if file already exists and append timestamp if it does
if (file_exists($path . $filename . $extension)) {
  $timestamp = "_" . time();
}

// write file
try {
	$fh = fopen($path . $filename . $timestamp . $extension, 'w');
	fwrite($fh, $data);
	fclose($fh);

  // add file to zip
  $zip = new ZipArchive;
  $res = $zip->open($path . $zipFilename, ZipArchive::CREATE);
  if ($res === TRUE) {
    $zip->addFile($path . $filename . $timestamp . $extension, $filename . $timestamp . $extension);
    $zip->close();
    echo json_decode("{'message': 'Data upload successful.'}");
  } else {
    header('HTTP/1.1 500 Internal Server Error');
    echo json_decode("{'message': 'Error creating archive file.'}");
  }
} catch (Exception $e) {
	header('HTTP/1.1 500 Internal Server Error');
	echo json_decode("{'message': 'Error creating file!.}");
	exit;
}

?>