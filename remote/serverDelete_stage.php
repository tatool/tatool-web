<?php
require("config_stage.php");

// Provide headers for CORS
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET");
header("Access-Control-Allow-Headers: Origin, Content-Type, Accept, Authorization, X-Request-With");
header("Access-Control-Allow-Credentials: true");
header("Content-Type: application/json");

// Process Delete
$moduleId = filter_var($_GET['moduleId'], FILTER_SANITIZE_STRING);
$userCode = $_GET['userCode'];

if ((!isset($moduleId) || is_null($moduleId))) {
  header('HTTP/1.1 500 Internal Server Error');
  echo json_decode("{'message': 'Missing data!'}");
  exit;
}

$path = $tatoolwebpath . $moduleId;
  
if (!isset($userCode) || is_null($userCode)) {
  // check if path exists
  if (file_exists($path)) {
    deleteDir($path);
    exit;
  } else {
    echo json_decode("{'message': 'No data to remove'}");
    exit;
  }
} else {
  $filesCSV = glob($path .  "/*_" . $userCode . '_*.csv');
  foreach ($filesCSV as $file) {
    @unlink($file);
  }
  $filesZIP = glob($path .  "/" . $moduleId . "_" . $userCode . '.zip');
  foreach ($filesZIP as $file) {
    @unlink($file);
  }
  exit;
}

function deleteDir($path) {

  if (empty($path)) { 
    return false;
  }

  return is_file($path) ?
    @unlink($path) : array_map(__FUNCTION__, glob($path.'/*')) == @rmdir($path);
}

?>