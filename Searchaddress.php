<?php
require_once 'Db.php'; // $pdo を読み込む
require_once 'UserAddress.php'; // UserAddress クラスを読み込む

header('Content-Type: application/json');

// 郵便番号の取得と整形
$postal_code = $_POST['postal_code'] ?? '';

if (!$postal_code) {
    echo json_encode([]);
    exit;
}

// 全角→半角、ハイフン除去、前後空白除去
$postal_code = mb_convert_kana($postal_code, 'n');      // 数字を半角に変換
$postal_code = str_replace('-', '', $postal_code);      // ハイフンを除去
$postal_code = trim($postal_code);                      // 前後の空白を除去

// UserAddress クラスを使って住所取得
$userAddress = new UserAddress($pdo);
$address = $userAddress->getAddressByPostalCode($postal_code);

// 結果を JSON で返却（見つからない場合は空配列）
echo json_encode($address ?: []);
