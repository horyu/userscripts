// ==UserScript==
// @name         e-typing Shortcuts
// @namespace    https://github.com/horyu/
// @version      0.2
// @description  iframeに自動フォーカス ＆ ボタンショートカットの追加（Ctrl+Enter:スタート・もう一回、Alt+Enter:ミスだけ）
// @match        https://www.e-typing.ne.jp/*
// @run-at       document-end
// @grant        none
// ==/UserScript==

(function () {
    'use strict';
    const observer = new MutationObserver(mutationObserverCallback);
    observer.observe(document.body, { childList: true, subtree: true });

    function mutationObserverCallback(mutations) {
        try {
            // continue break するためにforEachではなくfor文を使用
            for (let mutation of mutations) {
                let iframe = [...mutation.addedNodes].find(node => node.tagName === 'IFRAME');
                if (!iframe) {
                    continue;
                }
                iframe.onload = () => {
                    addShortcuts(iframe.contentWindow.document);
                    iframe.contentWindow.focus();
                };
                break;
            };
        } catch (e) {
            console.log(e);
        }
    }

    function addShortcuts(doc) {
        doc.addEventListener('keydown', (event) => {
            if (event.ctrlKey && event.key === 'Enter') {
                clickById('start_btn');
                clickById('replay_btn');
            } else if (event.altKey && event.key === 'Enter') {
                clickById('miss_only_btn');
            }
        });
        const clickById = (id) => {
            const btn = doc.getElementById(id);
            if (btn) {
                btn.click();
            }
        };
    }

})();
