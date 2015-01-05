<?php

// Provide headers for CORS
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET");
header("Access-Control-Allow-Headers: Origin, Content-Type, Accept, Authorization, X-Request-With");
header("Access-Control-Allow-Credentials: true");
header("Content-Type: application/json");

// Process Upload
$moduleId = $_GET['moduleId'];

if ((!isset($moduleId) || is_null($moduleId))) {
  echo "error";
  header('HTTP/1.1 500 Internal Server Error');
  echo json_decode("{'message': 'Missing data!'}");
  exit;
}

$path = "/home/outerlim/tatoolweb-stage/" . $moduleId;

// check if file exists
if (file_exists($path)) {
  deleteDir($path);
  exit;
} else {
  echo "No data available";
}

function deleteDir($path) {
    if (empty($path)) { 
        return false;
    }
    echo $path;
    /*
    return is_file($path) ?
            @unlink($path) :
            array_map(__FUNCTION__, glob($path.'/*')) == @rmdir($path);
            */
}

?>