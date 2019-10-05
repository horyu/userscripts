// ==UserScript==
// @name        Twitter Image Asist for React version
// @namespace   https://github.com/horyu
// @description 画像ツイートにopenボタン（Ctrlキー・[左右中]クリックの組み合わせあり）とか追加します。基本は左クリックor中クリック。
// @include     https://twitter.com/*
// @version     0.3.1
// @run-at      document-end
// @noframes
// @grant       GM.openInTab
// ==/UserScript==

'use strict';

function init() {
    document.addEventListener('DOMContentLoaded', () => {
        observer.connect();
        setStyle();
    });
}

//
// observer
//

let divHasdivs = null;
const observer = new MutationObserver((mutations) => {
    //console.log(mutations.reduce((acc, mutation) => acc.concat(...mutation.addedNodes), []));
    if (document.body.contains(divHasdivs)) {
        // 追加要素が divHasdivs 内ならば
        if (mutations.some((mutation) => Array.from(mutation.addedNodes).some((ele) => divHasdivs.contains(ele)))) {
            // 要素の追加を行うから observer を一時的に切る
            observer.disconnect();
            scanDivHasDivs();
            observer.connect();
        }
    } else {
        const parent = document.body.querySelector('[data-testid="primaryColumn"] [aria-label^="タイムライン:"]');
        if (parent) {
            divHasdivs = parent.firstChild.firstChild;
            console.log('divHasdivs:', divHasdivs);
        }
    }
});
observer.connect = () => {
    observer.observe(document, {subtree: true, childList: true});
};

const alreadyVisitedDivs = new WeakSet();
function scanDivHasDivs() {
    for (const div of divHasdivs.children) {
        if (alreadyVisitedDivs.has(div)) continue;
        const art = div.querySelector(':scope > div > article');
        if (!art) {
            alreadyVisitedDivs.add(div);
            continue;
        }
        // ユーザーアイコンimgと画像ツイートimgの違いが [alt="画像"]
        if (art.querySelector('img[alt="画像"]')) {
            //console.log('img[alt="画像"]: ', art);
            alreadyVisitedDivs.add(div);
            const container = makeContainer(art);
            addOpenButton(container);
            observeImgs(art, container);
        }
    }
}

function makeContainer(art) {
    const container = document.createElement('div');
    container.className = `${cssPrefix}-container`;
    // 個別ツイート用
    if (art.querySelector('a[href="https://help.twitter.com/using-twitter/how-to-tweet#source-labels"]')) {
        const divHasIconRow = art.querySelector('div[data-testid="tweet"]');
        divHasIconRow.after(container);
        container.classList.add(`${cssPrefix}-row-container`);
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
    btn.onmousup = (e) => {
        e.preventDefault();
        e.stopPropagation();
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

// 2枚目以降の画像読み込みが遅延で行われるので短時間監視する
const alreadyVisitedImgs = new WeakSet();
function observeImgs(art, container) {
    const func = (e) => {
        e.stopPropagation();
        const imgs = art.querySelectorAll('img[alt="画像"]');
        imgs.forEach((img) => {
            if (!alreadyVisitedImgs.has(img)) {
                alreadyVisitedImgs.add(img);
                observer.disconnect();
                addImageCopy(container, img); // 要素の追加を行うから observer を一時的に切る
                observer.connect();
            }
        });
    };
    func(new Event('initialize'));
    art.addEventListener('DOMNodeInserted', func);
    setTimeout(() => {
        art.removeEventListener('DOMNodeInserted', func);
    }, 3000);
}

function addImageCopy(container, img) {
    const src = img.src;
    const url = new URL(src);
    url.searchParams.delete('name');
    const origSrc = url.toString();
    let order = 1; // モバイルアプリで左にスワイプしてやる画像ツイート用
    const a = img.closest('a'); // 通常の画像ツイート用
    if (a) order = a.href.slice(-1);
    container.insertAdjacentHTML(
        'beforeend',
        `<a class="${cssPrefix}-orig-link" href="${origSrc}" target="_blank" style="order: ${order}"><img src="${src}"></a>`
    );
}

//
// setStyle
//

const cssPrefix = 'horyususerscript';

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
    const styleEle = document.createElement('style');
    styleEle.textContent = style;
    document.head.append(styleEle);
}

//
// init()
//

init();
