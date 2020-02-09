// ==UserScript==
// @name        PeingNetImageToText
// @author      horyu (https://github.com/horyu/)
// @description 質問箱の質問テキストを画像の下に追加します。個別の質問ページのみ対応。
// @namespace   https://github.com/horyu
// @match       https://peing.net/*/q/*
// @version     0.0.1
// @run-at      document-end
// @noframes
// ==/UserScript==

const img = document.querySelector('#item-id img[alt]');
if (img) {
    const span = document.createElement('span');
    span.setAttribute('style', 'white-space: break-spaces;');
    span.textContent = img.alt;
    img.closest('h1').appendChild(span);
}
