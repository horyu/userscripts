// ==UserScript==
// @name         SoundCloud Repeat
// @namespace    https://github.com/horyu/
// @version      2022.5.26
// @description  REPEAT_NUMBER 回繰り返す（＝REPEAT_NUMBER + 1 回再生する）
// @author       horyu (https://github.com/horyu/)
// @match        https://soundcloud.com/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=soundcloud.com
// @run-at       document-idle
// @grant        none
// ==/UserScript==
const REPEAT_NUMBER = 2;

setInterval(() => {
    // 再生中かつ再生時間が 00:01 の時に更新する
    const isPlaying = document.querySelector('.playControls__play').classList.contains('playing');
    if (isPlaying) {
        const now = parseInt(document.querySelector('.playbackTimeline__progressWrapper').getAttribute('aria-valuenow'));
        if (now === 1) {
            update();
        }
    }
}, 1000);

let preHref = null;
let count = 0;
const update = () => {
    const href = document.querySelector('.playbackSoundBadge__titleLink').href;
    if (preHref === href) {
        count++;
    } else {
        count = 0;
        preHref = href;
    }
    if (REPEAT_NUMBER <= count) {
        setRepeatMode('m-all');
    } else {
        setRepeatMode('m-one');
    }
    console.log(count, document.title);
};

const setRepeatMode = (className) => {
    const repeatButton = document.querySelector('.playControls__repeat button');
    for (let i=0; i<6; i++) {
        if (repeatButton.classList.contains(className)) {
            return;
        }
        repeatButton.click();
    }
    throw new Error('モードの切り替えに失敗');
};
