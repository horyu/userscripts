// ==UserScript==
// @name         GitHub Remove is:open
// @namespace    https://github.com/horyu/
// @version      2022.8.18
// @description  Remove default "is:open" from issues search filter
// @author       horyu
// @match        https://github.com/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=github.com
// @run-at       document-end
// @grant        none
// ==/UserScript==
let preHref = null;
const f = () => {
    if (preHref != location.href && location.href.endsWith('/issues?q=is%3Aissue+is%3Aopen+sort%3Aupdated-desc')) {
        const ele = document.getElementById('js-issues-search');
        if (ele && ele.value === "is:issue is:open sort:updated-desc ") {
            ele.value = "is:issue sort:updated-desc ";
        } else {
            return; // stop updating preHref
        }
    }
    preHref = location.href;
};
f();

const observer = new MutationObserver(f);
observer.observe(document.body, { attributes: true, childList: true });
