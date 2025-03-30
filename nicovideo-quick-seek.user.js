// ==UserScript==
// @name         ニコニコ動画 10秒戻る・送るボタンを右クリックで先頭・末尾へ
// @namespace    https://github.com/horyu/
// @version      2025.3.30
// @description  ニコニコ動画 10秒戻るボタンを右クリックで動画先頭へ、10秒送るボタン右クリックで動画末尾へ
// @author       horyu (https://github.com/horyu/)
// @run-at       document-idle
// @match        https://www.nicovideo.jp/watch/*
// @grant        none
// ==/UserScript==

(function(){
    'use strict';
    var prevButton, nextButton, currentTime;
    var intervalId = setInterval(() => {
        prevButton = document.querySelector('[aria-label="10 秒戻る"]');
        nextButton = document.querySelector('[aria-label="10 秒送る"]');
        currentTime = document.querySelector('[aria-label="video - currentTime"]');
        if (prevButton && nextButton && currentTime) {
            clearInterval(intervalId);
            var target = currentTime.previousElementSibling;
            prevButton.addEventListener('contextmenu', (e) => {
                target.dispatchEvent(new MouseEvent('click', {
                    bubbles: true
                }));
                e.preventDefault();
            }, true);
            nextButton.addEventListener('contextmenu', (e) => {
                target.dispatchEvent(new MouseEvent('click', {
                    bubbles: true,
                    clientX: target.getBoundingClientRect().right + 1,
                }));
                e.preventDefault();
            }, true);
        }
    }, 111);
})();
