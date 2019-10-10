// ==UserScript==
// @name        Twitter Image Viewer
// @namespace   https://github.com/horyu
// @description ViewerjsをTwitterで使えるようにします。
// @include     https://twitter.com/*
// @version     0.0.1
// @run-at      document-end
// @noframes
// @grant       GM_getResourceText
// @require     https://cdnjs.cloudflare.com/ajax/libs/viewerjs/1.3.7/viewer.min.js
// @resource    ViewerjsCSS https://cdnjs.cloudflare.com/ajax/libs/viewerjs/1.3.7/viewer.min.css
// ==/UserScript==

'use strict';

function init() {
    document.addEventListener('DOMContentLoaded', () => {
        addStyle();
        addViewButton();
    });
}

//
// addStyle
//

function addStyle() {
    const styleEle = document.createElement('style');
    styleEle.textContent = GM_getResourceText('ViewerjsCSS');;
    document.head.append(styleEle);
}

//
// addViewButton
//

function addViewButton() {
    const btn = document.createElement('button');
    btn.innerText = 'View';
    btn.onclick = setViewer;
    const id = setInterval(() => {
        const ele = document.querySelector('[aria-label="メインメニュー"]');
        if (ele) {
            ele.append(btn);
            clearInterval(id);
        }
    }, 1000);
};

/* global Viewer */
function setViewer() {
    const galleryDiv = document.createElement('div');
    galleryDiv.style.display = 'none';
    const hrefs = getHrefs();
    hrefs.forEach(href => {
        const img = document.createElement('img');
        img.src = href;
        galleryDiv.appendChild(img);
    });
    document.body.appendChild(galleryDiv);
    const gallery = new Viewer(galleryDiv);
    gallery.view(0);
    galleryDiv.addEventListener('hidden', () => {
        galleryDiv.remove();
    });
}

function getHrefs() {
    let hrefs = [];
    document.querySelectorAll('.horyususerscript-container').forEach(div => {
        Array.from(div.querySelectorAll('a'))
            .sort((x, y) => x.style.order > y.style.order)
            .forEach(a => hrefs.push(a.getAttribute('href')));
    });
    return hrefs;
}

//
// init()
//

init();
