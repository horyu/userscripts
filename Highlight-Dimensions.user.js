// ==UserScript==
// @name         Highlight Dimensions
// @author       horyu (https://github.com/horyu/)
// @namespace    https://github.com/horyu/
// @description  PDFかOpenAccessのあるarticleを強調表示
// @match        https://app.dimensions.ai/discover/publication*
// @version      2020.2.15
// @run-at       document-end
// @grant        none
// @noframes
// ==/UserScript==

'use strict';
const observer = new MutationObserver(mutationObserverCallback);
const config = { childList: true, subtree: true };
const timerId = setInterval(() => {
    const divHasArts = document.querySelector('.resultList');
    if (divHasArts) {
        observer.observe(divHasArts, config);
        clearInterval(timerId)
    }
}, 100);

function mutationObserverCallback(mutations) {
    try {
        mutations.forEach(mutation => {
            const node = mutation.target;
            if (node.nodeType != Node.ELEMENT_NODE) return;
            if (node.matches('.__readcube-access-button')) {
                const article = node.closest('.resultList__item');
                article.style.backgroundColor = '#cfc';
                console.log(article.querySelector('.resultList__item__title__primary').innerText);
            }
        });
    } catch (e) {
        console.log(e);
    }
}
