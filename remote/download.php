<?php
require("config.php");

// Provide headers for CORS
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET");
header("Access-Control-Allow-Headers: Origin, Content-Type, Accept, Authorization, X-Request-With");
header("Access-Control-Allow-Credentials: true");
header("Content-Type: application/json");

// Process Upload
$moduleId = $_GET['moduleId'];
$userCode = $_GET['userCode'];
$niceFileName = $_GET['fileName'] . '.zip';

if ((!isset($moduleId) || is_null($moduleId)) || (!isset($niceFileName) || is_null($niceFileName)) ) {
  echo "error";
  header('HTTP/1.1 500 Internal Server Error');
  echo json_decode("{'message': 'Missing data!'}");
  exit;
}

$path = $tatoolwebpath . $moduleId . "/";

if (!isset($userCode) || is_null($userCode)) {
  $filename = $moduleId . '.zip';
  // generate all user zip
  $zip = new ZipArchive;
  $res = $zip->open($path . $filename, ZipArchive::CREATE);
  if ($res === TRUE) {
    $files_zip = glob($path . $moduleId . '_*.zip');
    foreach ($files_zip as $file) {
      $zip->addFile($file, basename($file));
    }
    $zip->close();
  } else {
    header('HTTP/1.1 500 Internal Server Error');
    echo json_decode("{'message': 'Error creating archive file.'}");
  }
} else {
  $filename = $moduleId . "_" . $userCode . '.zip';
}

  // check if file exists
if (file_exists($path . $filename)) {
  $finfo = finfo_open(FILEINFO_MIME_TYPE);
  $mimeType = finfo_file($finfo, $filename);

  header("Content-Type: $mimeType");
  header('Content-Disposition: attachment; filename="' . $niceFileName . '";');

  print readfile($path . $filename);
  exit;
} else {
  echo "No data available";
}

?>