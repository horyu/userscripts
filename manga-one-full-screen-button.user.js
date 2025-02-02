// ==UserScript==
// @name         マンガワン　全画面ボタン
// @namespace    https://github.com/horyu/
// @version      2025.2.2
// @description  マンガワンの更新日時の横に全画面ボタンを追加
// @author       horyu (https://github.com/horyu/)
// @match        https://manga-one.com/viewer/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=manga-one.com
// @grant        none
// @run-at       document-idle
// ==/UserScript==

var button = document.createElement("button");
button.textContent = "全画面";
button.style.marginLeft = "10px";
button.style.border = "1px solid white";
button.style.padding = "0 3px";
button.onclick = () => document.querySelector('[alt="full-screen"]').closest('button').click();

var intervalId = setInterval(() => {
    if (document.querySelector('h1 + span')) {
        clearInterval(intervalId);
        document.querySelector('h1 + span').insertAdjacentElement("beforeend", button);
    }
}, 111);
