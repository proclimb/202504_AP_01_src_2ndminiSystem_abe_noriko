<?php

/**
 * 更新完了画面
 *
 * ** 更新完了画面は、更新確認画面から遷移してきます
 *
 * ** 更新完了画面で行う処理は以下です
 * ** 1.DBへ更新する為、$_POSTから入力情報を取得する
 * ** 2.DBへユーザ情報を更新する
 * **   1.DBへ接続
 * **     ※接続出来なかった場合は、エラーメッセージを表示する
 * **   2.ユーザ情報を更新する
 * ** 3.html を描画
 * **   更新完了のメッセージを表示します
 */

session_start();

//  1.DB接続情報、クラス定義の読み込み
require_once 'Db.php';
require_once 'User.php';
require_once 'Address.php';
require_once 'FileBlobHelper.php';

// 2. 入力データ取得
// 2-1. ユーザーデータ取得

// セッションから入力データを取得
if (!isset($_SESSION['edit_data'])) {
    echo "セッションが切れています。やり直してください。";
    exit;
}
$editData = $_SESSION['edit_data'];
$id = $editData['id'];
$userData = [
    'name'         => $editData['name'],
    'kana'         => $editData['kana'],
    'gender_flag'  => $editData['gender_flag'],
    'tel'          => $editData['tel'],
    'email'        => $editData['email'],
];

// 2-2. 住所データも取得
$addressData = [
    'user_id'      => $id,
    'postal_code'  => $editData['postal_code'],
    'prefecture'   => $editData['prefecture'],
    'city_town'    => $editData['city_town'],
    'building'     => $editData['building'],
];

// 3. トランザクション開始
try {
    $pdo->beginTransaction();

    // 3. ユーザー＆住所クラスを生成
    $user = new User($pdo);
    // 4. 各テーブルのupdateメソッドを呼び出し
    $user->update($id, $userData);


    $address = new UserAddress($pdo);
    $address->updateByUserId($addressData); // user_id付きのデータを渡す


    // 6. edit.phpからセッション経由で受け取った一時ファイルをBLOB化
    $doc1 = $_SESSION['edit_document1'] ?? null;
    $doc2 = $_SESSION['edit_document2'] ?? null;
    $blobs = null;
    if ($doc1 || $doc2) {
        $blobs = [
            'front' => $doc1 && file_exists($doc1) ? file_get_contents($doc1) : null,
            'back'  => $doc2 && file_exists($doc2) ? file_get_contents($doc2) : null,
        ];
    }


    // 7. BLOB が null でなければ（いずれかアップロードされたなら）user_documents に登録
    if ($blobs && ($blobs['front'] !== null || $blobs['back'] !== null)) {
        $expiresAt = null;
        $user->saveDocument(
            $id,
            $blobs['front'],
            $blobs['back'],
            $expiresAt
        );
    }

    // 一時ファイル削除とセッションunset
    foreach (['edit_document1', 'edit_document2'] as $key) {
        if (!empty($_SESSION[$key]) && file_exists($_SESSION[$key])) {
            @unlink($_SESSION[$key]);
        }
        unset($_SESSION[$key]);
    }

    // 8. トランザクションコミット
    $pdo->commit();
    // セッションデータを削除
    unset($_SESSION['edit_data']);
} catch (Exception $e) {
    // いずれかで例外が発生したらロールバックしてエラー表示
    $pdo->rollBack();
    // 本番環境ならログ出力してエラーページへリダイレクトなどが望ましい
    echo "エラーが発生しました。詳細: " . htmlspecialchars($e->getMessage(), ENT_QUOTES);
    exit;
}

// 4.html の描画
?>
<!DOCTYPE html>
<html lang="ja">

<head>
    <meta charset="UTF-8">
    <title>完了画面</title>
    <link rel="stylesheet" href="style_new.css">
</head>

<body>
    <div>
        <h1>mini System</h1>
    </div>
    <div>
        <h2>更新完了画面</h2>
    </div>
    <div>
        <div>
            <h1>更新完了</h1>
            <p>
                更新しました。<br>
            </p>
            <a href="index.php">
                <button type="button">TOPに戻る</button>
            </a>
        </div>
    </div>
</body>

</html>