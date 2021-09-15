// ==UserScript==
// @name         ニコニコ静画（漫画）用　ボタン追加
// @namespace    https://github.com/horyu/
// @version      0.4
// @description  ニコニコ漫画のヘッダーに、左右クリックでページスクロールするボタンと次エピソードへの移動ボタンを追加します。（左右キー入力でページスクロールする機能も入ってます）
// @run-at       document-end
// @match        *://seiga.nicovideo.jp/watch/mg*
// @grant        none
// ==/UserScript==

(function(){
    'use strict';
    const lis = Array.from(document.querySelectorAll('#page_contents > li'));
    const scrollBy = (offset) => {
        const activeLi = document.querySelector('li.active.below');
        const target = lis[lis.indexOf(activeLi) + offset];
        if (target) {
            target.scrollIntoView({'block': 'center'});
            window.scrollBy(0, -20);
        }
    };
    // 左右キーで移動、Ctrlを押していたらエピソードを移動
    {
        //                37 ←    39 →
        const offsets = {'37': 1, '39': -1};
        document.addEventListener('keydown', (event) => {
            const offset = offsets[event.which];
            if (offset) {
                if (!event.ctrlKey) {
                    scrollBy(offset);
                } else {
                    const selector = offset === 1 ? 'a.next' : 'a.prev';
                    const a = document.querySelector(selector);
                    a.click();
                }
            }
        }, false);
    }
    // ヘッダーにボタンを追加
    const intervalID = setInterval(() => {
        const header = document.querySelector('div.common-header-171vphh');
        if (!header) {
            return;
        }
        clearInterval(intervalID);
        const addButton = (btn) => {
            const li = document.createElement('li');
            li.appendChild(btn);
            header.insertAdjacentElement('afterbegin', li);
        }
        // ボタン：次のエピソード
        {
            const btn = document.createElement('button');
            btn.textContent = '次エ';
            const a = document.querySelector('a.next');
            // 次エピソードがない場合は押せないようにしておく
            if (a.classList.contains('disabled')) {
                btn.disabled = true;
            } else {
                btn.onclick = () => {
                    a.click();
                };
            };
            addButton(btn);
        }
        // ボタン：左右クリックでページスクロール
        {
            const btn = document.createElement('button');
            btn.textContent = '↓|↑';
            btn.onclick = () => {
                scrollBy(1);
            };
            btn.oncontextmenu = (event) => {
                scrollBy(-1);
                event.preventDefault();
            };
            addButton(btn);
        }
    }, 10);

})();
