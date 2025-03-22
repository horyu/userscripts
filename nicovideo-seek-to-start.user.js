// ==UserScript==
// @name         ニコニコ動画 10秒戻るボタンを右クリックで動画先頭へ
// @namespace    https://github.com/horyu/
// @version      2025.3.22
// @description  ニコニコ動画 10秒戻るボタンを右クリックで動画先頭へ
// @author       horyu (https://github.com/horyu/)
// @run-at       document-idle
// @match        https://www.nicovideo.jp/watch/*
// @grant        none
// ==/UserScript==

(function(){
    'use strict';
    var prevButton, currentTime;
    var intervalId = setInterval(() => {
        prevButton = document.querySelector('[aria-label="10 秒戻る"]');
        currentTime = document.querySelector('[aria-label="video - currentTime"]');
        if (prevButton && currentTime) {
            clearInterval(intervalId);
            prevButton.addEventListener('contextmenu', (e) => {
                currentTime.previousElementSibling.dispatchEvent(new MouseEvent('click', {
                    bubbles: true
                }));
                e.preventDefault();
            }, true);
        }
    }, 111);
})();
