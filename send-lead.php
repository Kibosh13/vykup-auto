<?php

const LEAD_RECIPIENT = '89992493135@mail.ru';
const ALLOWED_ORIGINS = [
    'https://meylanavtovykup.ru',
    'https://www.meylanavtovykup.ru',
    'https://kibosh13.github.io',
];

header('Content-Type: application/json; charset=UTF-8');
header('Cache-Control: no-store, max-age=0');
header('X-Content-Type-Options: nosniff');

$origin = isset($_SERVER['HTTP_ORIGIN']) ? $_SERVER['HTTP_ORIGIN'] : '';
if ($origin !== '' && !in_array($origin, ALLOWED_ORIGINS, true)) {
    respond(403, false, 'Источник запроса не разрешён.');
}
if ($origin !== '') {
    header('Access-Control-Allow-Origin: ' . $origin);
    header('Vary: Origin');
}

if ((isset($_SERVER['REQUEST_METHOD']) ? $_SERVER['REQUEST_METHOD'] : '') !== 'POST') {
    header('Allow: POST');
    respond(405, false, 'Разрешена только отправка формы.');
}

session_name('meylan_lead');
ini_set('session.use_strict_mode', '1');
session_set_cookie_params(0, '/', '', true, true);
session_start();

if (clean(postValue('company'), 100) !== '') {
    respond(200, true, 'Заявка принята.');
}

$lastSentAt = isset($_SESSION['last_lead_at']) ? (int) $_SESSION['last_lead_at'] : 0;
if ($lastSentAt > 0 && time() - $lastSentAt < 30) {
    respond(429, false, 'Повторную заявку можно отправить через 30 секунд.');
}

$model = clean(postValue('model'), 120);
$year = filter_var(postValue('year'), FILTER_VALIDATE_INT);
$mileage = filter_var(postValue('mileage'), FILTER_VALIDATE_INT);
$condition = postValue('condition');
$phone = clean(postValue('phone'), 40);
$comment = clean(postValue('comment'), 700);
$consent = postValue('consent');

$conditionLabels = [
    'excellent' => 'Отличное',
    'good' => 'Есть нюансы',
    'damaged' => 'После ДТП',
    'broken' => 'Не на ходу',
];
$currentYear = (int) date('Y');
$phoneDigits = preg_replace('/\D+/', '', $phone);
$phoneDigits = is_string($phoneDigits) ? $phoneDigits : '';

$isValid = textLength($model) >= 2
    && $year !== false && $year >= 1990 && $year <= $currentYear
    && $mileage !== false && $mileage >= 0 && $mileage <= 999999
    && array_key_exists($condition, $conditionLabels)
    && strlen($phoneDigits) >= 10 && strlen($phoneDigits) <= 15
    && $consent === 'yes';

if (!$isValid) {
    respond(422, false, 'Проверьте заполнение обязательных полей.');
}

$message = implode("\r\n", [
    'Новая заявка с сайта meylanavtovykup.ru',
    '',
    'Автомобиль: ' . $model,
    'Год выпуска: ' . $year,
    'Пробег: ' . number_format((int) $mileage, 0, ',', ' ') . ' км',
    'Состояние: ' . $conditionLabels[$condition],
    'Телефон: ' . $phone,
    'Комментарий: ' . ($comment !== '' ? $comment : '—'),
    '',
    'Дата заявки: ' . date('d.m.Y H:i:s') . ' MSK',
]);

$subject = '=?UTF-8?B?' . base64_encode('Новая заявка — MEYLAN АВТО') . '?=';
$headers = implode("\r\n", [
    'From: MEYLAN AVTO <no-reply@meylanavtovykup.ru>',
    'Reply-To: no-reply@meylanavtovykup.ru',
    'MIME-Version: 1.0',
    'Content-Type: text/plain; charset=UTF-8',
    'Content-Transfer-Encoding: 8bit',
]);

if (!mail(LEAD_RECIPIENT, $subject, $message, $headers)) {
    error_log('MEYLAN lead email could not be queued.');
    respond(500, false, 'Сервис отправки временно недоступен.');
}

$_SESSION['last_lead_at'] = time();
respond(200, true, 'Заявка отправлена.');

function postValue($key)
{
    $value = isset($_POST[$key]) ? $_POST[$key] : '';
    return is_string($value) ? $value : '';
}

function clean($value, $maxLength)
{
    $value = trim(strip_tags($value));
    $value = preg_replace('/[\r\n\t]+/u', ' ', $value);
    $value = is_string($value) ? $value : '';
    return function_exists('mb_substr')
        ? mb_substr($value, 0, $maxLength, 'UTF-8')
        : substr($value, 0, $maxLength);
}

function textLength($value)
{
    return function_exists('mb_strlen')
        ? mb_strlen($value, 'UTF-8')
        : strlen($value);
}

function respond($status, $success, $message)
{
    http_response_code($status);
    echo json_encode(
        ['success' => $success, 'message' => $message],
        JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES
    );
    exit;
}
