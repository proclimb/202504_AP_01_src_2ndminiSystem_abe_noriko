<?php

/**
 * DB接続処理
 *
 * ** DB接続処理は、呼び出されたファイルにDB接続処理の結果を返します
 *
 * **
 * **
 * **
 * **
 * **
 */
// 1.DB接続設定
$host = 'localhost';
$dbname = 'minisystem_relation';
$user = 'root';
$password = 'proclimb';
$charset = 'utf8mb4';

// 2.DSN（データべース名）
$dsn = "mysql:host=$host;dbname=$dbname;charset=$charset";

// 3.エラー時に例外を投げる設定
$options = [
    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,           // 例外を投げる
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,      // 連想配列で取得
    PDO::ATTR_EMULATE_PREPARES => false,                   // 本物のプリペアドステートメントを使用
];

// 4.PDOをインスタンス化
try {
    $pdo = new PDO($dsn, $user, $password, $options);
    return $pdo;
} catch (PDOException $e) {
    // エラーログに記録（error_log はサーバーのログファイルなどに書き込みます）
    error_log("DB接続に失敗しました: " . $e->getMessage());
    // ユーザー画面にエラーメッセージを表示して処理停止
    die("DB接続に失敗しました");
}
