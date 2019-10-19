// ==UserScript==
// @name        Twitter Image Viewer
// @namespace   https://github.com/horyu
// @description 左側のメインメニューに追加された「View」ボタンで現在のタイムラインから取得できた画像をビューアーのように開きます。[画像の右側クリック/右キー入力]で次の画像、[画像の左側クリック/左キー入力]で前の画像、Escでビューアーを終了します。デフォルトでは「Twitter Image Asist for React version」が必要となります、
// @include     https://twitter.com/*
// @version     0.1.0
// @run-at      document-end
// @noframes
// @require     https://gist.githubusercontent.com/horyu/148a014c447b4a9fbedad1b85e5be77f/raw/82bf75a13c191cf2698332f119c7f8485622dde4/wheelzoom.js
// ==/UserScript==

'use strict';

document.addEventListener('DOMContentLoaded', () => {
    addStyle();
    addViewButton();
});

//
// addStyle
//

const cssPrefix = 'horyususerscript-tiv';

function addStyle() {
    const style = document.createElement('style');
    style.textContent = `
.${cssPrefix}-root {
    z-index: 9999;
    position: fixed;
    top: 0;
    bottom: 0;
    left: 0;
    right: 0;
    background-color: rgba(0, 0, 0, 0.5);
}

.${cssPrefix}-img {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    max-width: calc(100% - 10px);
    max-height: calc(100% - 10px);
    object-fit: contain;
    -moz-user-select: none;
    user-select: none;
}
`;
    document.head.appendChild(style);
}

//
// addViewButton
//

function addViewButton() {
    const ov = new OreViewer();
    const btn = document.createElement('button');
    btn.innerText = 'View';
    btn.onclick = () => {
        ov.start(getImgURLs(true));
    }
    btn.oncontextmenu = (e) => {
        e.preventDefault();
        ov.start(getImgURLs(false));
        return false;
    }
    const intervalID = setInterval(() => {
        const ele = document.querySelector('[aria-label="メインメニュー"]');
        if (ele) {
            ele.appendChild(btn);
            clearInterval(intervalID);
        }
    }, 1000);
};

class OreViewer {
    constructor() {
        this.root = document.createElement('div');
        this.root.className = `${cssPrefix}-root`;
        this.root.style.display = 'none';
        let isSimpleClick = true;
        this.root.onmousedown = () => {
            isSimpleClick = true;
        };
        this.root.onmousemove = () => {
            isSimpleClick = false;
        };
        this.root.onmouseup = (e) => {
            if (isSimpleClick){
                // クリックが画面の右側なら +1 左側なら -1
                const diff = (e.clientX > this.root.clientWidth/2 ? 1 : -1);
                this.addIndex(diff);
            }
        };
        document.addEventListener('keydown', (e) => {
            if (this.root.style.display === 'none') return;
            switch (e.key) {
                case 'ArrowLeft':
                    this.addIndex(-1);
                    break;
                case 'ArrowRight':
                    this.addIndex(1);
                    break;
                case 'Escape':
                    this.root.style.display = 'none';
                    break;
            }
        });
        document.body.appendChild(this.root);
    }
    start(urls) {
        if (urls.length === 0) return;
        this.index = 0;
        this.urls = urls;
        const img = document.createElement('img'); // preload
        for (const url of urls) img.src = url; // preload
        this.root.style.display = '';
        this.setImg();
    }
    addIndex(diff) {
        this.index += diff;
        if ((this.index < 0) || (this.index === this.urls.length)) {
            this.root.style.display = 'none';
        } else {
            this.setImg();
        }
    }
    setImg() {
        const oldChild = this.root.firstChild;
        const newChild = document.createElement('img');
        newChild.src = this.urls[this.index];
        newChild.className = `${cssPrefix}-img`;
        this.root.appendChild(newChild);
        if (oldChild) oldChild.remove();
        window.wheelzoom(newChild);
    }
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
    console.log(imgURLs);
    return imgURLs;
}
