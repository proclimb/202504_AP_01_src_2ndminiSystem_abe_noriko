/**
 * 各項目の入力を行う
 */

window.addEventListener('DOMContentLoaded', function () {
    var form = document.forms['edit'] || document.forms['form'];
    if (!form) return;

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
    requiredFields.forEach(function (field) {
        var el = form[field.name];
        if (el) {
            el.addEventListener('blur', function () {
                // 既存エラー削除
                removeElementsByClass('error');
                removeClass('error-form');
                if (el.value === '') {
                    errorElement(el, field.msg);
                }
            });
        }
    });

    // submit時のバリデーション（従来通り）
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
});


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

    // 2-2.error のスタイルを作成する
    newElement.className = "error";

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
        // 2.取得した全ての要素を削除する
        elements[0].parentNode.removeChild(elements[0]);
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