// ==UserScript==
// @name        Twitter Image Asist for React version
// @namespace   https://github.com/horyu
// @description 画像ツイートにopenボタン（Ctrlキー・[左右中]クリックの組み合わせあり）とか追加します。基本は左クリックor中クリック。
// @include     https://twitter.com/*
// @version     0.1.5
// @run-at      document-start
// @noframes
// @grant       GM.openInTab
// ==/UserScript==

'use strict';

function init() {
    document.addEventListener('DOMNodeInserted', process);
    document.addEventListener('DOMContentLoaded', setStyle);
}

function process() {
    const parent = document.querySelector('div[data-testid="primaryColumn"]');
    if (parent !== null) {
        const arts = Array.from(parent.getElementsByTagName('article'));
        // ユーザーアイコンimgと画像ツイートimgの違いがパット見 [alt="画像"]
        const artsHasImg = arts.filter(art => art.querySelector('img[alt="画像"]'));
        artsHasImg.forEach(art => {
            if (!alreadyVisitedArts.has(art)) {
                alreadyVisitedArts.add(art);
                const container = makeContainer(art);
                addOpenButton(container);
                observeImgs(art, container);
            }
        });
    }
}

function makeContainer(art) {
    const container = document.createElement('div');
    container.className = prefixed('-container');
    // 個別ツイート画面のトップツイート用
    if (art.dataset.testid == 'tweetDetail') {
        const divHasIconRow = art.querySelector('img[alt=""]').closest('article > div');
        divHasIconRow.after(container);
        container.classList.add(prefixed('-row-container'));
    } else { // 通常のツイート用
        const divHasIcon = art.querySelector('div[data-testid="tweet"] > div');
        divHasIcon.append(container);
    }
    return container;
}

function addOpenButton(container) {
    const btn = document.createElement('button');
    btn.innerText = 'open';
    btn.oncontextmenu = () => false;
    btn.onmousedown = (e) => {
        e.preventDefault();
    };
    btn.addEventListener('mousedown', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const as = Array.from(container.getElementsByTagName('a'));
        // order で要素を並び替える
        as.sort((a, b) => a.style.order < b.style.order);
        // 右クリック or 中クリック なら逆にする
        if (e.button != 0) as.reverse();
        // ctrlキーがON or 中クリック ならバックグラウンドで開く
        const openFunc = ((e.ctrlKey || (e.button == 1)) ? GM.openInTab : window.open);
        as.forEach(a => {
            openFunc(a.href);
        });
    }, true);
    container.prepend(btn);
}

// （2枚目以降の）画像読み込みが遅延で行われるので監視する
function observeImgs(art, container) {
    const func = (e) => {
        e.stopPropagation();
        if (art.dataset.hasFourImg) return;
        const imgs = art.querySelectorAll('img[alt="画像"]');
        imgs.forEach((img, index) => {
            if (!alreadyVisitedImgs.has(img)) {
                alreadyVisitedImgs.add(img);
                addImageCopy(container, img, index);
            }
        });
        if (imgs.length === 4) {
            art.dataset.hasFourImg = true;
            // 4枚画像の表示は [[0 1] [2 3]] だが、構造は [[0 2] [1 3]] なので1と2のorderを交換
            const as = art.getElementsByClassName(prefixed('-orig-link'));
            [as[1].style.order, as[2].style.order] = ['2', '1'];
        }
    };
    func(new Event('initialize'));
    art.addEventListener('DOMNodeInserted', func);
}

function addImageCopy(container, img, order) {
    const src = img.src;
    const url = new URL(src);
    url.searchParams.delete('name');
    const origSrc = url.toString();
    container.insertAdjacentHTML(
        'beforeend',
        `<a class="${cssPrefix}-orig-link" href="${origSrc}" target="_blank" style="order: ${order}"><img src="${src}"></a>`
    );
}

//
// Util
//

const alreadyVisitedArts = new WeakSet();
const alreadyVisitedImgs = new WeakSet();

const cssPrefix = 'horyususerscript';

function prefixed(str) {
    return cssPrefix + str;
}

//
// setStyle
//

const style = `
.${cssPrefix}-container {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
}

.${cssPrefix}-container.${cssPrefix}-row-container {
    margin-bottom: 5px;
    justify-content: start;
}

.${cssPrefix}-container > button {
    margin-top: 5px;
}

.${cssPrefix}-orig-link {
    margin: 5px 0 0 5px;
}

.${cssPrefix}-orig-link img {
    max-width: 60px;
    max-height: 60px;
    vertical-align: middle;
}

/* リプライの縦棒 */
* + .r-432wen {
    position: absolute;
    height: 100%;
    z-index: -1;
}
`;

function setStyle() {
    const styleEl = document.createElement('style');
    styleEl.textContent = style;
    document.head.append(styleEl);
}

//
// init()
//

init();
