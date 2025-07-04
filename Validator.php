<?php

class Validator
{
    private $error_message = [];

    // 呼び出し元で使う
    public function validate($data, $options = [])
    {
        $this->error_message = [];

        // 名前
        if (empty($data['name'])) {
            $this->error_message['name'] = '名前が入力されていません';
        } elseif (mb_strlen($data['name']) > 20) {
            $this->error_message['name'] = '名前は20文字以内で入力してください';
        } elseif (preg_match('/^(\s|　)|[\s　]$/u', $data['name'])) {
            $this->error_message['name'] = '前後の空白を削除してください';
        } elseif (!preg_match('/^[\p{Han}\p{Hiragana}\p{Katakana}ー\s　]+$/u', $data['name'])) {
            $this->error_message['name'] = '日本語(漢字、ひらがな、カタカナ)で入力してください';
        }

        // ふりがな
        if (empty($data['kana'])) {
            $this->error_message['kana'] = 'ふりがなが入力されていません';
        } elseif (preg_match('/[^ぁ-んー]/u', $data['kana'])) {
            $this->error_message['kana'] = 'ひらがなで入力してください';
        } elseif (mb_strlen($data['kana']) > 20) {
            $this->error_message['kana'] = 'ふりがなは20文字以内で入力してください';
        }

        // 生年月日（スキップ可能）
        if (empty($options['skip_birth_date'])) {
            if (empty($data['birth_year']) || empty($data['birth_month']) || empty($data['birth_day'])) {
                $this->error_message['birth_date'] = '生年月日が入力されていません';
            } elseif (!$this->isValidDate($data['birth_year'] ?? '', $data['birth_month'] ?? '', $data['birth_day'] ?? '')) {
                $this->error_message['birth_date'] = '生年月日が正しくありません';
            } else {
                $inputDate = sprintf('%04d-%02d-%02d', (int)$data['birth_year'], (int)$data['birth_month'], (int)$data['birth_day']);
                $today = date('Y-m-d');
                if ($inputDate > $today) {
                    $this->error_message['birth_date'] = '生年月日は未来の日付は入力できません';
                }
            }
        }

        // 郵便番号
        if (empty($data['postal_code'])) {
            $this->error_message['postal_code'] = '郵便番号が入力されていません';
        } elseif (!preg_match('/^[0-9]{3}-[0-9]{4}$/', $data['postal_code'] ?? '')) {
            $this->error_message['postal_code'] = '郵便番号の形式が正しくありません（例: 123-4567）';
        }

        // 住所
        if (empty($data['prefecture']) || empty($data['city_town'])) {
            $this->error_message['address'] = '住所(都道府県もしくは市区町村・番地)が入力されていません';
        } elseif (mb_strlen($data['prefecture']) > 10) {
            $this->error_message['address'] = '都道府県は10文字以内で入力してください';
        } elseif (mb_strlen($data['city_town']) > 50 || mb_strlen($data['building']) > 50) {
            $this->error_message['address'] = '市区町村・番地もしくは建物名は50文字以内で入力してください';
        }

        // 電話番号
        if (empty($data['tel'])) {
            $this->error_message['tel'] = '電話番号が入力されていません';
        } elseif (preg_match('/\s/', $data['tel'])) {
            $this->error_message['tel'] = '空白を削除してください';
        } elseif (!preg_match('/[0-9]/', $data['tel'])) {
            $this->error_message['tel'] = '数字を入力してください';
        } elseif (!preg_match('/^0\d{1,4}-\d{1,4}-\d{3,4}$/', $data['tel'] ?? '')) {
            $this->error_message['tel'] = '電話番号の形式が正しくありません（例: 090-1234-5678）';
        }

        // メールアドレス
        if (empty($data['email'])) {
            $this->error_message['email'] = 'メールアドレスが入力されていません';
        } elseif (!filter_var($data['email'], FILTER_VALIDATE_EMAIL)) {
            $this->error_message['email'] = '有効なメールアドレスを入力してください';
        }

        return empty($this->error_message);
    }


    // エラーメッセージ取得
    public function getErrors()
    {
        return $this->error_message;
    }

    // 生年月日の日付整合性チェック
    private function isValidDate($year, $month, $day)
    {
        return checkdate((int)$month, (int)$day, (int)$year);
    }
}
