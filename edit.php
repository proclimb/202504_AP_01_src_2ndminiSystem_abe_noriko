<?php

/**
 * 更新・削除画面
 *
 * ** 更新・削除画面は、ダッシュボード、更新・削除確認の2画面から遷移してきます
 * * **
 * ** 【説明】
 * **   更新・削除では、入力チェックと画面遷移をjavascriptで行います
 * **   そのため、登録の時とは違い、セッションを使用しないパターンのプログラムになります
 * **
 * ** 各画面毎の処理は以下です
 * ** 1.DB接続情報、クラス定義をそれぞれのファイルから読み込む
 * ** 2.DBからユーザ情報を取得する為、$_GETからID情報を取得する
 * ** 3.ユーザ情報を取得する
 * **   1.Userクラスをインスタスタンス化する
 * **     ＊User(設計図)に$user(実体)を付ける
 * **   2.メソッドを実行じユーザー情報を取得する
 * ** 4.html を描画
 */

//  1.DB接続情報、クラス定義の読み込み
require_once 'Db.php';
require_once 'User.php';
require_once 'Validator.php';

session_cache_limiter('none');
session_start();

$id = $_GET['id'] ?? ($_POST['id'] ?? null);
$error_message = [];
$old = $_POST;

// 初期表示(GET)時はDBから取得
if ($_SERVER['REQUEST_METHOD'] === 'GET' && $id) {
    $user = new User($pdo);
    $old = $user->findById($id);
}

// 更新ボタン押下時（POST）
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['name'])) {
    $validator = new Validator();
    // 生年月日チェックをスキップし、本人確認書類の形式チェックも有効化（添付は必須ではない）
    if ($validator->validate($_POST, ['skip_birth_date' => true, 'check_documents' => true])) {
        // ファイルアップロード処理
        $uploadDir = sys_get_temp_dir();
        $fileFields = ['document1', 'document2'];
        foreach ($fileFields as $field) {
            if (isset($_FILES[$field]) && is_uploaded_file($_FILES[$field]['tmp_name'])) {
                $ext = pathinfo($_FILES[$field]['name'], PATHINFO_EXTENSION);
                $tmpFile = tempnam($uploadDir, $field . '_');
                // 拡張子を維持
                $newFile = $tmpFile . ($ext ? ('.' . $ext) : '');
                move_uploaded_file($_FILES[$field]['tmp_name'], $newFile);
                $_SESSION['edit_' . $field] = $newFile;
            } else {
                $_SESSION['edit_' . $field] = null;
            }
        }
        $_SESSION['edit_data'] = $_POST;
        header('Location: update.php');
        exit();
    } else {
        $error_message = $validator->getErrors();
        $old = $_POST;
    }
}
?>
<!DOCTYPE html>
<html lang="ja">

<head>
    <meta charset="UTF-8">
    <title>mini System</title>
    <link rel="stylesheet" href="style_new.css">
    <script src="postalcodesearch.js"></script>
    <script src="contact.js" defer></script>
</head>

<body>
    <div>
        <h1>mini System</h1>
    </div>
    <div>
        <h2>更新・削除画面</h2>
    </div>
    <div>
        <form action="edit.php" method="post" name="edit" enctype="multipart/form-data" autocomplete="off">
            <input type="hidden" name="id" value="<?= htmlspecialchars($old['id'] ?? '') ?>">
            <h1 class="contact-title">更新内容入力</h1>
            <p>更新内容をご入力の上、「更新」ボタンをクリックしてください。</p>
            <p>削除する場合は「削除」ボタンをクリックしてください。</p>
            <div>
                <div>
                    <label>お名前<span>必須</span></label>
                    <input type="text" name="name" placeholder="例）山田太郎" value="<?= htmlspecialchars($old['name'] ?? '') ?>">
                    <?php if (isset($error_message['name'])) : ?>
                        <div class="error-msg"><?= htmlspecialchars($error_message['name']) ?></div>
                    <?php endif ?>
                </div>
                <div>
                    <label>ふりがな<span>必須</span></label>
                    <input type="text" name="kana" placeholder="例）やまだたろう" value="<?= htmlspecialchars($old['kana'] ?? '') ?>">
                    <?php if (isset($error_message['kana'])) : ?>
                        <div class="error-msg"><?= htmlspecialchars($error_message['kana']) ?></div>
                    <?php endif ?>
                </div>
                <div>
                    <label>性別<span>必須</span></label>
                    <?php $gender = $old['gender_flag'] ?? '1'; ?>
                    <label class="gender">
                        <input type="radio" name="gender_flag" value='1' <?= $gender == '1' ? 'checked' : '' ?>>男性</label>
                    <label class="gender">
                        <input type="radio" name="gender_flag" value='2' <?= $gender == '2' ? 'checked' : '' ?>>女性</label>
                    <label class="gender">
                        <input type="radio" name="gender_flag" value='3' <?= $gender == '3' ? 'checked' : '' ?>>その他</label>
                </div>
                <div>
                    <label>生年月日<span>必須</span></label>
                    <input type="text" name="birth_date" value="<?= htmlspecialchars($old['birth_date'] ?? '') ?>" readonly class="readonly-field">
                    <!-- edit.phpでは生年月日のエラーメッセージは表示しない -->
                </div>
                <div>
                    <label>郵便番号<span>必須</span></label>
                    <div class="postal-row">
                        <input class="half-width" type="text" name="postal_code" id="postal_code" placeholder="例）100-0001" value="<?= htmlspecialchars($old['postal_code'] ?? '') ?>">
                        <button type="button" class="postal-code-search" id="searchAddressBtn">住所検索</button>
                    </div>
                    <?php if (isset($error_message['postal_code'])) : ?>
                        <div class="error-msg2"><?= htmlspecialchars($error_message['postal_code']) ?></div>
                    <?php endif ?>
                </div>
                <div>
                    <label>住所<span>必須</span></label>
                    <input type="text" name="prefecture" id="prefecture" placeholder="都道府県" value="<?= htmlspecialchars($old['prefecture'] ?? '') ?>">
                    <input type="text" name="city_town" id="city_town" placeholder="市区町村・番地" value="<?= htmlspecialchars($old['city_town'] ?? '') ?>">
                    <input type="text" name="building" placeholder="建物名・部屋番号  **省略可**" value="<?= htmlspecialchars($old['building'] ?? '') ?>">
                    <?php if (isset($error_message['address'])) : ?>
                        <div class="error-msg"><?= htmlspecialchars($error_message['address']) ?></div>
                    <?php endif ?>
                </div>
                <div>
                    <label>電話番号<span>必須</span></label>
                    <input type="text" name="tel" placeholder="例）000-000-0000" value="<?= htmlspecialchars($old['tel'] ?? '') ?>">
                    <?php if (isset($error_message['tel'])) : ?>
                        <div class="error-msg"><?= htmlspecialchars($error_message['tel']) ?></div>
                    <?php endif ?>
                </div>
                <div>
                    <label>メールアドレス<span>必須</span></label>
                    <input type="text" name="email" placeholder="例）guest@example.com" value="<?= htmlspecialchars($old['email'] ?? '') ?>">
                    <?php if (isset($error_message['email'])) : ?>
                        <div class="error-msg"><?= htmlspecialchars($error_message['email']) ?></div>
                    <?php endif ?>
                </div>
                <div>
                    <label>本人確認書類（表）</label>
                    <input type="file" name="document1" id="document1" accept="image/png, image/jpeg, image/jpg">
                    <span id="filename1" class="filename-display"></span>
                    <div class="preview-container">
                        <img id="preview1" src="#" alt="プレビュー画像１" style="display: none; max-width: 200px; margin-top: 8px;">
                    </div>
                </div>
                <div>
                    <label>本人確認書類（裏）</label>
                    <input type="file" name="document2" id="document2" accept="image/png, image/jpeg, image/jpg">
                    <span id="filename2" class="filename-display"></span>
                    <div class="preview-container">
                        <img id="preview2" src="#" alt="プレビュー画像２" style="display: none; max-width: 200px; margin-top: 8px;">
                    </div>
                </div>
            </div>
            <button type="submit">更新</button>
            <a href="dashboard.php"><button type="button">ダッシュボードに戻る</button></a>
        </form>
        <form action="delete.php" method="post" name="delete">
            <input type="hidden" name="id" value="<?= htmlspecialchars($old['id'] ?? '') ?>">
            <button type="submit">削除</button>
        </form>
    </div>
</body>

</html>