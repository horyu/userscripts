// ==UserScript==
// @name         マンガワン　全画面ボタン
// @namespace    https://github.com/horyu/
// @version      2025.7.20
// @description  マンガワンの更新日時の横に全画面ボタンを追加
// @author       horyu (https://github.com/horyu/)
// @match        https://manga-one.com/manga/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=manga-one.com
// @grant        none
// @run-at       document-end
// ==/UserScript==

var button = document.createElement("button");
button.textContent = "全画面";
button.style.marginLeft = "10px";
button.style.border = "1px solid white";
button.style.padding = "0 3px";
button.onclick = () => document.querySelector('[alt="full-screen"]').closest('button').click();

function addButtonIfNeeded() {
    var targetElement = document.querySelector('h1 + span');
    if (targetElement && button.parentNode !== targetElement) {
        targetElement.insertAdjacentElement("beforeend", button);
    }
}

// URL変更の監視
let currentUrl = location.href;

// MutationObserverを使用した要素監視（継続的に監視）
var observer = new MutationObserver((mutations) => {
    // URL変更をチェック
    if (location.href !== currentUrl) {
        currentUrl = location.href;
        // 新しいページに移動したので少し待ってからチェック
        setTimeout(addButtonIfNeeded, 100);
    }
    addButtonIfNeeded();
});

// DOM全体の変更を監視開始
observer.observe(document.body, {
    childList: true,
    subtree: true
});

// 初回チェック
addButtonIfNeeded();
