<?php
class UserAddress
{
    private $pdo;

    // DB接続情報
    public function __construct($pdo)
    {
        $this->pdo = $pdo;
    }

    /**
     * 郵便番号から都道府県・市区町村を取得
     */
    public function getAddressByPostalCode(string $postalCode): ?array
    {
        $sql = "SELECT prefecture, city_town
                FROM postal_master
                WHERE postal_code = :postal_code
                LIMIT 1";

        $stmt = $this->pdo->prepare($sql);
        $stmt->execute([':postal_code' => $postalCode]);

        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        return $result ?: null;
    }

    /**
     * 住所登録
     */
    public function create(array $data): bool
    {
        $sql = "INSERT INTO user_addresses (
                    user_id, postal_code, prefecture, city_town, building, created_at
                )
                VALUES (
                    :user_id, :postal_code, :prefecture, :city_town, :building, NOW()
                )";

        try {
            $stmt = $this->pdo->prepare($sql);
            return $stmt->execute([
                ':user_id'     => $data['user_id'],
                ':postal_code' => $data['postal_code'],
                ':prefecture'  => $data['prefecture'],
                ':city_town'   => $data['city_town'],
                ':building'    => $data['building'],
            ]);
        } catch (PDOException $e) {
            return false;
        }
    }

    /**
     * ユーザーIDから住所取得
     */
    public function findByUserId(int $userId): ?array
    {
        $sql = "SELECT * FROM user_addresses WHERE user_id = :user_id LIMIT 1";

        try {
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute([':user_id' => $userId]);
            $address = $stmt->fetch(PDO::FETCH_ASSOC);
            return $address ?: null;
        } catch (PDOException $e) {
            return null;
        }
    }

    /**
     * ユーザーIDで住所更新
     */
    public function updateByUserId(array $data): bool
    {
        $sql = "UPDATE user_addresses
                SET postal_code = :postal_code,
                    prefecture = :prefecture,
                    city_town = :city_town,
                    building = :building
                WHERE user_id = :user_id";

        try {
            $stmt = $this->pdo->prepare($sql);
            return $stmt->execute([
                ':postal_code' => $data['postal_code'],
                ':prefecture'  => $data['prefecture'],
                ':city_town'   => $data['city_town'],
                ':building'    => $data['building'],
                ':user_id'     => $data['user_id'],
            ]);
        } catch (PDOException $e) {
            return false;
        }
    }

    /**
     * 住所の正規化
     * - 全角数字 → 半角
     * - スペース除去
     * - ハイフンを統一
     * - カッコ内の内容を削除
     * - 漢数字（一〜十）をアラビア数字に変換
     */
    private function normalizeAddress(string $str): string
    {
        $str = mb_convert_kana($str, 'n'); // 全角→半角
        $str = preg_replace('/[　\s]/u', '', $str); // 空白除去
        $str = str_replace(['ー', '―', '－'], '-', $str); // ハイフン統一
        $str = preg_replace('/（.*?）/u', '', $str); // 全角カッコ内削除
        $str = str_replace(
            ['一', '二', '三', '四', '五', '六', '七', '八', '九', '十'],
            ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'],
            $str
        );
        return $str;
    }

    /**
     * 郵便番号と住所の整合性チェック
     * - 郵便番号と都道府県でaddress_masterから住所候補を取得
     * - 入力された市区町村・番地部分とマスタの住所を正規化して比較
     *
     * @param string $postalCode 郵便番号
     * @param string $prefecture 都道府県
     * @param string $cityTown 市区町村・番地
     * @return bool 一致すれば true、そうでなければ false
     */
    public function checkAddressMatch(string $postalCode, string $prefecture, string $cityTown): bool
    {
        // 郵便番号を半角数字に統一しハイフン削除
        $postalCode = mb_convert_kana(str_replace('-', '', trim($postalCode)), 'n');
        $normPref = $this->normalizeAddress($prefecture);
        $normInputCityTown = $this->normalizeAddress($cityTown);

        $sql = "
            SELECT city, town
            FROM address_master
            WHERE postal_code = :postal_code
            AND prefecture = :prefecture
        ";

        try {
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute([
                ':postal_code' => $postalCode,
                ':prefecture' => $normPref,
            ]);

            $results = $stmt->fetchAll(PDO::FETCH_ASSOC);
            if (!$results) {
                // マスタに該当住所なし
                return false;
            }

            foreach ($results as $row) {
                $masterCity = $this->normalizeAddress($row['city']);
                $masterTown = $this->normalizeAddress($row['town']);

                // 「以下に掲載がない場合」などはスキップ
                if ($masterTown === '以下に掲載がない場合' || $masterTown === '') {
                    continue;
                }

                $fullMasterAddress = $masterCity . $masterTown;

                // 入力住所がマスタ住所を含む、またはマスタ住所が入力住所を含むならOKと判断
                if (
                    mb_strpos($normInputCityTown, $fullMasterAddress) !== false
                    || mb_strpos($fullMasterAddress, $normInputCityTown) !== false
                ) {
                    return true;
                }
            }

            // どれもマッチしなければfalse
            return false;
        } catch (PDOException $e) {
            // 例外時はfalse
            return false;
        }
    }
}
