// ==UserScript==
// @name         Highlight Dimensions
// @namespace    https://github.com/horyu/
// @description  PDFかOpenAccessのあるarticleを強調表示
// @include      https://app.dimensions.ai/discover/publication*
// @version      0.0.1
// @run-at       document-end
// @grant        none
// ==/UserScript==

(() => {
    'use strict';
	const observer = new MutationObserver(mutationObserverCallback);
    const divHasArticles = document.getElementsByClassName('resultList__item')[0].parentNode;
    const config = { childList: true, subtree: true };
    observer.observe(divHasArticles, config);

    function mutationObserverCallback(mutations) {
        try {
            mutations.forEach(mutation => {
                const node = mutation.target;
                if (node.nodeType != Node.ELEMENT_NODE) {
                    return;
                }
                if (node.matches('.__readcube-access-button')) {
                    const article = node.closest('.resultList__item');
                    article.style.backgroundColor = '#cfc';
                    console.log(article.getElementsByClassName('resultList__item__title__primary')[0].innerText);
                }
            });
        } catch (e) {
            console.log(e);
        }
    }
})();