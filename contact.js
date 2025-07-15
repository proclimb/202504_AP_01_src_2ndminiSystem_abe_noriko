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
                // 各項目ごとにリアルタイム形式チェック
                if (field.name === 'name') {
                    if (el.value === '') {
                        errorElement(el, field.msg);
                    } else if (!validateName(el.value)) {
                        errorElement(el, 'お名前は全角日本語2～20文字で入力してください');
                    }
                } else if (field.name === 'kana') {
                    if (el.value === '') {
                        errorElement(el, field.msg);
                    } else if (!validateKana(el.value)) {
                        errorElement(el, 'ひらがなのみ入力できます');
                    }
                } else if (field.name === 'postal_code') {
                    if (el.value === '') {
                        errorElement(el, field.msg);
                    } else if (!/^\d{3}-\d{4}$/.test(el.value)) {
                        errorElement(el, '郵便番号の形式が正しくありません（例: 123-4567）');
                    }
                } else if (field.name === 'tel') {
                    if (el.value === '') {
                        errorElement(el, field.msg);
                    } else if (!validateTel(el.value)) {
                        errorElement(el, '電話番号が違います');
                    }
                } else if (field.name === 'email') {
                    if (el.value === '') {
                        errorElement(el, field.msg);
                    } else if (!validateMail(el.value)) {
                        errorElement(el, 'メールアドレスが正しくありません');
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

    // submit時のバリデーション（サーバ側Validator.phpと同じ必須・形式チェック）
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
