// ==UserScript==
// @name         ニコニコ漫画 ボタン+ショートカットキー追加
// @namespace    https://github.com/horyu/
// @version      2025.4.5
// @description  ニコニコ漫画のヘッダーに、左右クリックでページスクロールするボタンと次エピソードへの移動ボタンとショートカットキーを追加します。ショートカットキー　左キー:次ページ、右キー:前ページ、Ctrl+左キー:次エピソード、Ctrl+右キー:前エピソード、Ctrl+Delete:タブを閉じる
// @author       horyu (https://github.com/horyu/)
// @run-at       document-end
// @match        *://manga.nicovideo.jp/watch/mg*
// @grant        window.close
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
        //                ←              →
        const offsets = {'ArrowLeft': 1, 'ArrowRight': -1};
        document.addEventListener('keydown', (event) => {
            if (document.activeElement.tagName === "INPUT") {
                return;
            }
            if (event.ctrlKey && event.key === 'Delete') {
                window.close();
                return;
            }
            const offset = offsets[event.key];
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
