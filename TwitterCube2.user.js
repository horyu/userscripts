// ==UserScript==
// @name         Twitter Cube2
// @namespace    https://github.com/horyu
// @version      2020.6.2
// @description  Twitterでルービックキューブの記録を毎日ツイートする自分用。2桁秒向けの設定なので、1桁秒の人はコードを書き換える必要がある。
// @author       horyu (https://github.com/horyu/)
// @match        https://twitter.com/*
// @run-at       document-start
// @grant        GM_addStyle
// ==/UserScript==

'use strict';

const prefix = 'twitter-cube';
const rootId = `${prefix}-root`;
const timeClass = `${prefix}-time`;
const style = `
#${rootId} {
    z-index: 9999;
    position: fixed;
    bottom: 100px;
    left: 100px;
    height: 225px;
    width: 510px;
    padding: 10px;
    background-color: #BBB;
    border: 3px solid gray;
}
#${rootId} .${timeClass} {
    width: 36px;
}
#${rootId} input {
    width: 22px;
    -moz-appearance:textfield;
    ime-mode: inactive;
}
#${rootId} textarea,
#${rootId} button {
    width: 100%;
    box-sizing: border-box;
    resize: vertical;
    ime-mode: active;
}`;
const rootString = `
<div id="${rootId}">
    <form>
        <label>5_<input type="number" class="${timeClass}" /></label>
        <label>12_<input type="number" class="${timeClass}" /></label>
        <label>50_<input type="number" class="${timeClass}" /></label>
        <label>Mean_<input type="number" class="${timeClass}" /></label>
        <label>Worst_<input type="number" class="${timeClass}" /></label>
        <label>Count_<input type="number" name="count" /></label>
        <textarea rows="2" name="comment"></textarea>
        <button type="button">generate</button>
        <textarea rows="4" name="fulltext"></textarea>
        <button type="button">copy</button>
    </form>
</div>`;

function init() {
    document.addEventListener('DOMContentLoaded', () => {
        GM_addStyle(style);
        document.body.insertAdjacentHTML('beforeend', rootString);
        const root = document.getElementById(rootId);
        root.style.display = 'none';
        addFunc(root);
        addCubeButton(root);
    });
}

function addCubeButton(root) {
    const btn = document.createElement('button');
    btn.innerText = 'Cube';
    btn.onclick = () => {
        const rect = btn.getBoundingClientRect();
        root.style.left = `${rect.right + 15}px`;
        root.style.top = `${rect.top - 10}px`;
        root.style.display = root.style.display === 'none' ? '' : 'none';
        if (root.style.display === '') root.querySelector('input').focus();
    };
    const intervalID = setInterval(() => {
        const ele = document.querySelector('[aria-label="メインメニュー"]');
        if (ele) {
            ele.appendChild(btn);
            clearInterval(intervalID);
        }
    }, 1000);
}

function addFunc(root) {
    const form = root.querySelector('form');
    const feles = form.elements;
    const getLabelText = (ele) => ele.closest('label').textContent;
    root.querySelector('button').onclick = () => {
        let str = '今日のao';
        for (const input of form.querySelectorAll(`.${timeClass}`)) {
            const time = input.value;
            const len = time.length;
            const labelText = getLabelText(input);
            if (len === 4) {
                str += ' ' + labelText + time.slice(0, 2) + '.' + time.slice(2);
            } else if (len === 5) {
                str += ' ' + input.name + '_' + time[0] + ':' + time.slice(1, 3) + '.' + time.slice(3);
            } else if ((len === 0) && (labelText === '50_')) {
            } else {
                alert('入力エラー');
                input.focus();
                return;
            }
        }
        str += ` ${getLabelText(feles.count)}${feles.count.value}`;
        str += ` ${feles.comment.value}`;
        feles.fulltext.value = str;
    };
    const copyBtn = root.querySelector('button:last-of-type');
    copyBtn.onclick = () => {
        feles.fulltext.select();
        document.execCommand('copy');
        feles.fulltext.setSelectionRange(0, 0);
        copyBtn.focus();
        const btnText = copyBtn.textContent;
        copyBtn.textContent = (btnText === 'copy') ? 'copied' : btnText + '!';
    };
}

init();
