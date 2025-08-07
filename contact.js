// defer属性で読み込む前提で、グローバルスコープでformを先に取得
var form = document.forms['edit'] || document.forms['form'];

// 生年月日リアルタイムバリデーション
if (form) {
    var yearSel = form['birth_year'];
    var monthSel = form['birth_month'];
    var daySel = form['birth_day'];
    if (yearSel && monthSel && daySel) {
        var birthInputs = [yearSel, monthSel, daySel];
        birthInputs.forEach(function (el) {
            el.addEventListener('change', validateBirthDate);
        });
    }
    function validateBirthDate() {
        // 直後の.error-msg2を消す（重複防止）
        var birthDiv = yearSel.parentNode.parentNode;
        var next = birthDiv.querySelector('.error-msg2');
        if (next) {
            next.parentNode.removeChild(next);
        }
        var y = yearSel.value;
        var m = monthSel.value;
        var d = daySel.value;
        var msg = '';
        if (!y || !m || !d) {
            msg = '生年月日をすべて選択してください';
        } else {
            var dateObj = new Date(y, m - 1, d);
            if (dateObj.getFullYear() != y || dateObj.getMonth() != m - 1 || dateObj.getDate() != Number(d)) {
                msg = '存在しない日付です';
            } else {
                var today = new Date();
                today.setHours(0, 0, 0, 0);
                var inputDate = new Date(y, m - 1, d);
                if (inputDate > today) {
                    msg = '生年月日に未来の日付は指定できません';
                }
            }
        }
        if (msg) {
            var err = document.createElement('div');
            err.className = 'error-msg2';
            err.textContent = msg;
            birthDiv.appendChild(err);
        }
    }

    // ...既存のバリデーション処理...
    // 必須項目のblurイベントでエラーメッセージ表示
    var requiredFields = [
        { name: 'name', msg: 'お名前が入力されていません' },
        { name: 'kana', msg: 'ふりがなが入力されていません' },
        { name: 'postal_code', msg: '郵便番号が入力されていません' },
        { name: 'prefecture', msg: '都道府県が入力されていません' },
        { name: 'city_town', msg: '市区町村が入力されていません' },
        { name: 'tel', msg: '電話番号が入力されていません' },
        { name: 'email', msg: 'メールアドレスが入力されていません' }
    ];

    // 本人確認書類ファイルのリアルタイムチェック
    var fileFields = [
        { name: 'document1', label: '本人確認書類（表）' },
        { name: 'document2', label: '本人確認書類（裏）' }
    ];
    fileFields.forEach(function (field) {
        var el = form[field.name];
        if (el) {
            var checkFile = function () {
                // 親div内の.error-msgをすべて消す
                var parentDiv = el.closest('div');
                if (parentDiv) {
                    var errs = parentDiv.querySelectorAll('.error-msg');
                    errs.forEach(function (err) { err.remove(); });
                }
                el.classList.remove('error-form');
                if (el.files && el.files.length > 0) {
                    var file = el.files[0];
                    var type = file.type;
                    var name = file.name || '';
                    var ext = name.split('.').pop().toLowerCase();
                    var valid = (type === 'image/png' || type === 'image/jpeg');
                    // typeが空の場合は拡張子で判定
                    if (!valid && type === '' && (ext === 'png' || ext === 'jpg' || ext === 'jpeg')) {
                        valid = true;
                    }
                    if (!valid && parentDiv) {
                        var errDiv = document.createElement('div');
                        errDiv.className = 'error-msg';
                        errDiv.textContent = field.label + 'はPNGまたはJPEG形式のみアップロード可能です';
                        parentDiv.appendChild(errDiv);
                    }
                }
            };
            el.addEventListener('change', checkFile);
            el.addEventListener('input', checkFile);
        }
    });

    // 入力時（inputイベント）でリアルタイム簡易チェック
    requiredFields.forEach(function (field) {
        var el = form[field.name];
        if (el) {
            el.addEventListener('input', function () {
                // 直後の.error-msgを消す（重複防止）
                var next = el.nextElementSibling;
                if (next && next.classList && next.classList.contains('error-msg')) {
                    next.parentNode.removeChild(next);
                }
                el.classList.remove('error-form');
                // 各項目ごとにリアルタイム形式チェック（サーバサイドと同等の厳密さ）
                if (field.name === 'name') {
                    if (el.value === '') {
                        errorElement(el, field.msg);
                    } else if (el.value.length < 2) {
                        errorElement(el, '名前は2文字以上で入力してください');
                    } else if (el.value.length > 20) {
                        errorElement(el, '名前は20文字以内で入力してください');
                    } else if (/^(\s|　)|[\s　]$/.test(el.value)) {
                        errorElement(el, '前後の空白を削除してください');
                    } else if (!/^([\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FFFー　]+)$/.test(el.value)) {
                        errorElement(el, '日本語(漢字、ひらがな、カタカナ)で入力してください');
                    }
                } else if (field.name === 'kana') {
                    if (el.value === '') {
                        errorElement(el, field.msg);
                    } else if (/^[\s　]+|[\s　]+$/.test(el.value)) {
                        errorElement(el, '前後の空白を削除してください');
                    } else if (!/^[ぁ-んー\s　]+$/.test(el.value)) {
                        errorElement(el, 'ひらがなで入力してください');
                    } else if (el.value.length > 20) {
                        errorElement(el, 'ふりがなは20文字以内で入力してください');
                    }
                } else if (field.name === 'postal_code') {
                    if (el.value === '') {
                        errorElement(el, field.msg);
                    } else if (!/^\d{3}-\d{4}$/.test(el.value)) {
                        errorElement(el, '郵便番号の形式が正しくありません（例: 123-4567）');
                    }
                } else if (field.name === 'tel') {
                    const val = el.value;
                    const digits = val.replace(/[^0-9]/g, '');
                    const parts = val.split('-');
                    if (val === '') {
                        errorElement(el, field.msg);
                    } else if (/\s/.test(val)) {
                        errorElement(el, '空白を削除してください');
                    } else if (!/[0-9]/.test(val)) {
                        errorElement(el, '数字を入力してください');
                    } else if (!/^0\d{1,4}-\d{1,4}-\d{3,4}$/.test(val)) {
                        errorElement(el, '電話番号の形式が正しくありません（例: 090-1234-5678）');
                    } else if (val.length < 12 || val.length > 13) {
                        errorElement(el, '電話番号はハイフンを含めて12～13文字で入力してください');
                    } else if (parts.length === 3 && ['0000', '1111', '2222', '3333', '4444', '5555', '6666', '7777', '8888', '9999'].includes(parts[0])) {
                        errorElement(el, '電話番号が正しくありません（例: 090-1234-5678）');
                    }
                } else if (field.name === 'email') {
                    if (el.value === '') {
                        errorElement(el, field.msg);
                    } else if (!validateMail(el.value)) {
                        errorElement(el, '有効なメールアドレスを入力してください');
                    }
                } else {
                    if (el.value === '') {
                        errorElement(el, field.msg);
                    }
                }
            });
        }
    });

    // 名前バリデーション（全角日本語2～20文字）
    function validateName(val) {
        // 全角ひらがな・カタカナ・漢字・長音・全角スペースのみ、2～20文字
        return /^([\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FFFー　]{2,20})$/.test(val);
    }

    // 画面遷移直後に全必須項目の空欄を即時チェック（初回表示時のみ）
    // index.phpから遷移した場合はエラーを表示しない（全項目が空欄＝初回アクセス判定）
    var allEmpty = requiredFields.every(function (field) {
        var el = form[field.name];
        return el && el.value === '';
    });
    if (!allEmpty) {
        requiredFields.forEach(function (field) {
            var el = form[field.name];
            if (el && el.value === '') {
                errorElement(el, field.msg);
            }
        });
    }

    // 🔧 郵便番号 → 住所検索処理（ハイフン除去あり）
    const postalCodeSearchBtn = document.querySelector('#search-address-btn');
    if (postalCodeSearchBtn) {
        postalCodeSearchBtn.addEventListener('click', function () {
            const el = form.postal_code;

            // 🔁 既存のエラーメッセージを削除（重複防止）
            const next = el.nextElementSibling;
            if (next && next.classList && next.classList.contains('error-msg')) {
                next.parentNode.removeChild(next);
            }
            el.classList.remove('error-form');

            // 入力された郵便番号を取得（ハイフン削除）
            const rawPostalCode = el.value;
            const postalCode = rawPostalCode.replace(/-/g, '');

            // 郵便番号形式チェック
            if (!/^\d{7}$/.test(postalCode)) {
                errorElement(el, '郵便番号の形式が正しくありません（例: 123-4567）');
                return;
            }

            // 郵便番号から住所検索（API連携）
            fetch(`/api/search_address?postal_code=${postalCode}`)
                .then(response => response.json())
                .then(data => {
                    // データが取得できたら住所に自動入力
                    if (data.prefecture && data.city_town) {
                        form.prefecture.value = data.prefecture;
                        form.city_town.value = data.city_town;
                    } else {
                        // 該当なしのエラー（重複防止済み）
                        const next = el.nextElementSibling;
                        if (next && next.classList && next.classList.contains('error-msg')) {
                            next.parentNode.removeChild(next);
                        }
                        el.classList.remove('error-form');
                        errorElement(el, '郵便番号に該当する住所が見つかりません');
                    }
                })
                .catch(() => {
                    // 通信エラー時のエラー表示（重複防止済み）
                    const next = el.nextElementSibling;
                    if (next && next.classList && next.classList.contains('error-msg')) {
                        next.parentNode.removeChild(next);
                    }
                    el.classList.remove('error-form');
                    errorElement(el, '住所検索に失敗しました');
                });
        });
    }

    // submit時のバリデーション（サーバ側Validator.phpと同じ必須・形式チェック）
    /*
    form.addEventListener('submit', function (e) {
        var flag = true;
        removeElementsByClass("error");
        removeClass("error-form");

        // 必須チェック
        requiredFields.forEach(function (field) {
            var el = form[field.name];
            if (el && el.value === '') {
                errorElement(el, field.msg);
                flag = false;
            }
        });

        // ふりがな ひらがなチェック
        if (form.kana && form.kana.value !== '' && !validateKana(form.kana.value)) {
            errorElement(form.kana, "ひらがなを入れて下さい");
            flag = false;
        }

        // 郵便番号形式
        if (form.postal_code && form.postal_code.value !== '' && !/^\d{3}-\d{4}$/.test(form.postal_code.value)) {
            errorElement(form.postal_code, "郵便番号の形式が正しくありません（例: 123-4567）");
            flag = false;
        }

        // 電話番号形式
        if (form.tel && form.tel.value !== '' && !validateTel(form.tel.value)) {
            errorElement(form.tel, "電話番号が違います");
            flag = false;
        }

        // メールアドレス形式
        if (form.email && form.email.value !== '' && !validateMail(form.email.value)) {
            errorElement(form.email, "メールアドレスが正しくありません");
            flag = false;
        }

        // document1 のチェック
        var fileInput1 = form.document1;
        if (fileInput1 && fileInput1.files && fileInput1.files.length > 0) {
            var file1 = fileInput1.files[0];
            var type1 = file1.type;
            if (type1 !== "image/png" && type1 !== "image/jpeg") {
                errorElement(fileInput1, "ファイル形式は PNG または JPEG のみ許可されています");
                flag = false;
            }
        }
        // document2 のチェック
        var fileInput2 = form.document2;
        if (fileInput2 && fileInput2.files && fileInput2.files.length > 0) {
            var file2 = fileInput2.files[0];
            var type2 = file2.type;
            if (type2 !== "image/png" && type2 !== "image/jpeg") {
                errorElement(fileInput2, "ファイル形式は PNG または JPEG のみ許可されています");
                flag = false;
            }
        }

        if (!flag) {
            e.preventDefault();
        }
    });
    */
}


/**
 * エラーメッセージを表示する
 * @param {*} form メッセージを表示する項目
 * @param {*} msg 表示するエラーメッセージ
 */
var errorElement = function (form, msg) {
    // 1.項目タグに error-form のスタイルを適用させる
    form.className = "error-form";
    // 2.エラーメッセージの追加
    // 2-1.divタグの作成
    var newElement = document.createElement("div");
    // 2-2.error-msg のスタイルを作成する（PHP側と統一）
    newElement.className = "error-msg";
    // 2-3.エラーメッセージのテキスト要素を作成する
    var newText = document.createTextNode(msg);
    // 2-4.2-1のdivタグに2-3のテキストを追加する
    newElement.appendChild(newText);
    // 2-5.項目タグの次の要素として、2-1のdivタグを追加する
    form.parentNode.insertBefore(newElement, form.nextSibling);
}


/**
 * エラーメッセージの削除
 *   className が、設定されている要素を全件取得し、タグごと削除する
 * @param {*} className 削除するスタイルのクラス名
 */
var removeElementsByClass = function (className) {
    // 1.html内から className の要素を全て取得する
    var elements = document.getElementsByClassName(className);
    while (elements.length > 0) {
        elements[0].parentNode.removeChild(elements[0]);
    }
    // PHP側のエラーclassも削除
    if (className === "error") {
        var phpErrs = document.getElementsByClassName("error-msg");
        while (phpErrs.length > 0) {
            phpErrs[0].parentNode.removeChild(phpErrs[0]);
        }
    }
}

/**
 * 適応スタイルの削除
 *   className を、要素から削除する
 *
 * @param {*} className
 */
var removeClass = function (className) {

    // 1.html内から className の要素を全て取得する
    var elements = document.getElementsByClassName(className);
    while (elements.length > 0) {
        // 2.取得した要素からclassName を削除する
        elements[0].className = "";
    }
}

/**
 * メールアドレスの書式チェック
 * @param {*} val チェックする文字列
 * @returns true：メールアドレス、false：メールアドレスではない
 */
var validateMail = function (val) {

    // メールアドレスの書式が以下であるか(*は、半角英数字と._-)
    // ***@***.***
    // ***.***@**.***
    // ***.***@**.**.***
    if (val.match(/^[A-Za-z0-9]{1}[A-Za-z0-9_.-]*@[A-Za-z0-9_.-]+.[A-Za-z0-9]+$/) == null) {
        return false;
    } else {
        return true;
    }
}

/**
 * 電話番号のチェック
 * @param {*} val チェックする文字列
 * @returns true：電話番号、false：電話番号ではない
 */
var validateTel = function (val) {

    // 半角数値と-(ハイフン)のみであるか
    if (val.match(/^[0-9]{2,4}-[0-9]{2,4}-[0-9]{3,4}$/) == null) {
        return false;
    } else {
        return true;
    }
}

/**
 * ひらがなのチェック
 * @param {*} val チェックする文字列
 * @returns true：ひらがなのみ、false：ひらがな以外の文字がある
 */
var validateKana = function (val) {

    // ひらがな(ぁ～ん)と長音のみであるか
    if (val.match(/^[ぁ-んー]+$/) == null) {
        return false;
    } else {
        return true;
    }
}
