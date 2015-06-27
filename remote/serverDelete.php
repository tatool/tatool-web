<?php
require("config.php");

// Provide headers for CORS
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET");
header("Access-Control-Allow-Headers: Origin, Content-Type, Accept, Authorization, X-Request-With");
header("Access-Control-Allow-Credentials: true");
header("Content-Type: application/json");

// Process Delete
$moduleId = filter_var($_GET['moduleId'], FILTER_SANITIZE_STRING);

if ((!isset($moduleId) || is_null($moduleId))) {
  header('HTTP/1.1 500 Internal Server Error');
  echo json_decode("{'message': 'Missing data!'}");
  exit;
}

$path = $tatoolwebpath . $moduleId;

// check if path exists
if (file_exists($path)) {
  deleteDir($path);
  exit;
} else {
  echo json_decode("{'message': 'No data to remove'}");
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