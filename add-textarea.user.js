// ==UserScript==
// @name         add textarea
// @namespace    https://github.com/horyu/
// @description  文字数カウントにメモ用テキストエリアを追加
// @include      https://phonypianist.sakura.ne.jp/convenienttool/strcount.html
// @version      0.0.1
// @run-at       document-end
// @grant        none
// ==/UserScript==

(() => {
    'use strict';
    const p = document.querySelector('.container > p');
    const ta = document.createElement('textarea');
    ta.style = 'width: 100%';
    p.insertAdjacentElement('afterend', ta);
})();
