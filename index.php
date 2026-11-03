<?php

// nginx на ROKMERE не читает .htaccess: перенаправляем главную до вывода HTML.
$host = strtolower(isset($_SERVER['HTTP_HOST']) ? $_SERVER['HTTP_HOST'] : '');
$isHttps = (isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== '' && $_SERVER['HTTPS'] !== 'off')
    || (isset($_SERVER['SERVER_PORT']) && (int) $_SERVER['SERVER_PORT'] === 443);

if ($host !== 'meylanavtovykup.ru' || !$isHttps) {
    $requestUri = isset($_SERVER['REQUEST_URI']) ? $_SERVER['REQUEST_URI'] : '/';
    $requestUri = str_replace(["\r", "\n"], '', $requestUri);
    if ($requestUri === '' || $requestUri[0] !== '/') {
        $requestUri = '/';
    }
    header('Location: https://meylanavtovykup.ru' . $requestUri, true, 301);
    exit;
}

if (isset($_SERVER['SCRIPT_NAME']) && $_SERVER['SCRIPT_NAME'] === '/index.php'
    && isset($_SERVER['REQUEST_URI']) && preg_match('#^/index\.php(?:\?|$)#', $_SERVER['REQUEST_URI'])) {
    $query = isset($_SERVER['QUERY_STRING']) && $_SERVER['QUERY_STRING'] !== ''
        ? '?' . str_replace(["\r", "\n"], '', $_SERVER['QUERY_STRING']) : '';
    header('Location: https://meylanavtovykup.ru/' . $query, true, 301);
    exit;
}

header('Content-Type: text/html; charset=UTF-8');
header('X-Content-Type-Options: nosniff');
readfile(__DIR__ . '/index.html');
