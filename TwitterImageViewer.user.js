// ==UserScript==
// @name        Twitter Image Viewer
// @namespace   https://github.com/horyu
// @description ViewerjsをTwitterで使えるようにします。左側のメインメニューに追加された「View」ボタンで現在のタイムラインから取得できた画像をで開きます。デフォルトでは「Twitter Image Asist for React version」が必要となります、
// @include     https://twitter.com/*
// @version     0.0.5
// @run-at      document-end
// @noframes
// @grant       GM_getResourceText
// @require     https://cdnjs.cloudflare.com/ajax/libs/viewerjs/1.3.7/viewer.min.js
// @resource    ViewerjsCSS https://cdnjs.cloudflare.com/ajax/libs/viewerjs/1.3.7/viewer.min.css
// ==/UserScript==

'use strict';

// https://fengyuanchen.github.io/viewerjs/
// https://github.com/fengyuanchen/viewerjs#options
const viewerOptions = {
    backdrop: true,
    button: false,
    navbar: true,
    title: false,
    toolbar: true,
    tooltip: false,
    movable: true,
    zoomable: true,
    rotatable: true,
    scalable: true,
    transition: false,
    fullscreen: true,
    keyboard: true,
    backdrop: true,
    loop: true,
    loading: true,
};

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
    document.head.appendChild(styleEle);
}

//
// addViewButton
//

function addViewButton() {
    const btn = document.createElement('button');
    btn.innerText = 'View';
    btn.onclick = () => {
        setViewer(true);
    }
    btn.oncontextmenu = (e) => {
        e.preventDefault();
        setViewer(false);
        return false;
    }
    const id = setInterval(() => {
        const ele = document.querySelector('[aria-label="メインメニュー"]');
        if (ele) {
            ele.appendChild(btn);
            clearInterval(id);
        }
    }, 1000);
};

/* global Viewer */
function setViewer(specificAccount) {
    const galleryDiv = document.createElement('div');
    galleryDiv.style.display = 'none';
    const imgURLs = getImgURLs(specificAccount);
    imgURLs.forEach(url => {
        const img = document.createElement('img');
        img.src = url;
        galleryDiv.appendChild(img);
    });
    document.body.appendChild(galleryDiv);
    const gallery = new Viewer(galleryDiv, viewerOptions);
    gallery.view(0);
    galleryDiv.addEventListener('hidden', () => {
        galleryDiv.remove();
    });
}

function getImgURLs(specificAccount) {
    const targetDivs = [];
    const containerSelector = '.horyususerscript-container';
    const rowDiv = document.querySelector('.horyususerscript-row-container');
    if (rowDiv) {
        targetDivs.push(rowDiv);
        let afterRow = false;
        document.querySelectorAll(containerSelector).forEach(div => {
            if (afterRow) {
                targetDivs.push(div);
            } else if (div === rowDiv) {
                afterRow = true;
            }
        });
        if (specificAccount) {
            const getName = (div) => div.closest('article').querySelector('a').getAttribute('href');
            const accountName = getName(rowDiv);
            for (let i = targetDivs.length - 1; i >= 0; i--) {
                if (getName(targetDivs[i]) !== accountName) targetDivs.splice(i, 1);
            }
        }
    } else {
        document.querySelectorAll(containerSelector).forEach(div => {
            targetDivs.push(div);
        });
    }
    const imgURLs = [];
    targetDivs.forEach(div => {
        Array.from(div.querySelectorAll('a'))
            .sort((x, y) => x.style.order > y.style.order)
            .forEach(a => imgURLs.push(a.getAttribute('href')));
    });
    return imgURLs;
}

//
// init()
//

init();
