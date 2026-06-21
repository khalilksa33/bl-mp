<?php
$c = stream_context_create(['http' => ['ignore_errors' => true]]);
echo file_get_contents('http://localhost:8080/api/health', false, $c);
echo "\n";
echo file_get_contents('http://localhost:8080/api/tenants', false, $c);
