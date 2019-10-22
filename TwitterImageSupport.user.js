// ==UserScript==
// @name        Twitter Image Suport
// @namespace   https://github.com/horyu
// @description タイムライン（TL）の画像を左クリックすると専用のViewerで画像を開き、中クリックすると新規タブで画像だけを開きます。メインバーのViewボタンでTLの画像ツイートをまとめてViewerで開きます。
// @include     https://twitter.com/*
// @version     0.0.1
// @run-at      document-end
// @noframes
// @require     https://gist.githubusercontent.com/horyu/148a014c447b4a9fbedad1b85e5be77f/raw/82bf75a13c191cf2698332f119c7f8485622dde4/wheelzoom.js
// ==/UserScript==
'use strict';
/*
■クリックの詳細
[TL中の画像ツイートの画像]
  左クリック：そのツイートの画像でViewerを起動
  右クリック：ブラウザの標準
  中クリック：画像のみを新規タブで開く
[通常のTLでメインバーのViewボタン]
  左クリック：TLの画像でViewerを起動
  右クリック：TLの画像でViewerを起動
  中クリック：何もしない
[個別のツイートを開いたTLでメインバーのViewボタン]
  左クリック：個別ツイートのアカウントに絞って、個別ツイート以降の画像でViewerを起動
  右クリック：個別ツイート以降の画像でViewerを起動
  中クリック：何もしない

■Viewerの機能
Viewerの終了：EscキーでViewerを終了
画像の切替：画面の左側をクリック・左キーで前の画像、右側をクリック・右キーで次の画像に切替
　　　　　　※ 前か次の画像がない場合はViewerを終了
画像の拡大：マウスホイールで画像を拡大
画像の移動：拡大した状態の画像を左ドラッグで可視範囲を移動
拡大表示の切替：fキーでViewerで開く画像を拡大表示に する・しない を切替
　　　　　　　　※ 元画像が大きい場合は大きいまま

■オプション（この行から9～11行下）
swapLeftRight：Viewerの左側クリック・左キーと右側クリック・右キーで表示する画像を逆に
             　する（true）・しない（false）
expandImg：Viewerで画像を開く時、画像を拡大表示に標準で する（true）・しない（false）
backgroundAlpha：Viewerの黒背景の透明度 0.0（透明）～1.0（不透明）
*/
//
// オプション ここから
//
const swapLeftRight = false;
const expandImg = true;
const backgroundAlpha = 0.5;
//
// オプション ここまで
//

document.addEventListener('DOMContentLoaded', () => {
    setStyle();
    addClickListener();
    addViewButton();
});

//
// setStyle
//

const cssPrefix = 'horyususerscript-tis';
const rootClassName = `${cssPrefix}-root`;
const imgClassName = `${cssPrefix}-img`;

function setStyle() {
    const style = document.createElement('style');
    style.textContent = `
.${rootClassName} {
    z-index: 9999;
    position: fixed;
    top: 0;
    bottom: 0;
    left: 0;
    right: 0;
    background-color: rgba(0, 0, 0, ${parseFloat(backgroundAlpha) || 0.5});
}

.${imgClassName} {
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
    document.head.append(style);
}

//
// addClickListener()
//

function addClickListener() {
    document.addEventListener('click', e => {
        const ele = e.target;
        // IMGではない || タイムライン内ではない（＝多分個人ページ右上のメディア）
        // || ViewerのIMGである || 画像ツイートのIMGではない(＝多分画像リンク付きツイート)
        if ((ele.nodeName !== 'IMG') ||
            (!ele.closest('[data-testid="primaryColumn"]')) ||
            (ele.className === imgClassName) ||
            (ele.alt !== "画像")) return;
        if (e.button === 1) { // 中クリック
            e.preventDefault();
            const imgURL = extractImgURL(ele);
            window.open(imgURL);
        } else if (e.button === 0) { // 左クリック
            e.preventDefault();
            //e.stopPropagation();
            const art = ele.closest('article');
            if (!art) return;
            const imgs = Array.from(art.querySelectorAll('img[alt="画像"]'));
            // 公式では 1 2                          |1|2|
            //          3 4 の順に表示されるが構造が |3|4| なので並び替え
            if (imgs.length == 4) [imgs[1], imgs[2]] = [imgs[2], imgs[1]];
            const index = imgs.indexOf(ele);
            const imgURLs = imgs.map(extractImgURL);
            OreViewer.start(imgURLs, index);
        }
    }, true);
}

function extractImgURL(img) {
    const url = new URL(img.src);
    url.searchParams.delete('name');
    return url.toString();
}

//
// addViewButton
//

function addViewButton() {
    const btn = document.createElement('button');
    btn.innerText = 'View';
    btn.onclick = () => {
        // 連打対策
        if (OreViewer.isVisible) return;
        OreViewer.start(getImgURLs(true));
    }
    btn.oncontextmenu = e => {
        e.preventDefault();
        OreViewer.start(getImgURLs(false));
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

function getImgURLs(specificAccount) {
    const tweetDivs = Array.from(document.querySelectorAll(
        '[data-testid="primaryColumn"] [aria-label^="タイムライン:"] > div > div > div'
    ));
    let targetDivs = [];
    // 個別ツイートの有無
    if (location.pathname.includes('/status/')) {
        // 個別ツイートなら ツイートソースラベル が表示されている（はず）
        const startIndex = tweetDivs.findIndex(div => !!div.querySelector(
            'a[href="https://help.twitter.com/using-twitter/how-to-tweet#source-labels"]'
        ));
        if (startIndex == -1) {
            alert(
                "個別ツイートが見つかりません。\n" +
                "個別ツイートが読み込まれる所までスクロールしてください。"
            );
            return [];
        }
        for (let i = startIndex; i < tweetDivs.length; i++) targetDivs.push(tweetDivs[i]);
        if (specificAccount) {
            const getName = div => {
                // [data-testid="tweet"] がないと ○○さんがリツイート の a につかまる
                const a = div.querySelector('[data-testid="tweet"] a');
                if (!a) return; // 個別ツイートの次の div は空
                return a.getAttribute('href');
            };
            const targetAccountName = getName(tweetDivs[startIndex]);
            // 対象アカウントではない div を後ろから削除していく
            for (let i = targetDivs.length - 1; i >= 0; i--) {
                if (getName(targetDivs[i]) !== targetAccountName) targetDivs.splice(i, 1);
            }
        }
    } else {
        targetDivs = tweetDivs;
    }
    const imgURLs = [];
    targetDivs.forEach(div => {
        const art = div.querySelector(':scope > div > article');
        if (!art) return;;
        // ユーザーアイコンIMGと画像ツイートIMGの違いが [alt="画像"]
        const imgs = art.querySelectorAll('img[alt="画像"]');
        if (imgs.length == 4) [imgs[1], imgs[2]] = [imgs[2], imgs[1]];
        imgs.forEach(img => {
            imgURLs.push(extractImgURL(img));
        });
    });
    return imgURLs;
}

//
// OreViewer
//

const OreViewer = new (class {
    constructor(reverse, resize) {
        this.root = document.createElement('div');
        this.root.className = rootClassName;
        this.hide();
        let isSimpleClick = true;
        this.root.onmousedown = () => {
            isSimpleClick = true;
        };
        this.root.onmousemove = () => {
            isSimpleClick = false;
        };
        this.root.onmouseup = e => {
            if (isSimpleClick && (e.button === 0)) {
                // クリックが画面の右側なら +1(次の画像) 左側なら -1(前の画像)
                let diff = (e.clientX > (this.root.clientWidth / 2) ? 1 : -1);
                if (reverse) diff *= -1;
                this.addIndex(diff);
            }
        };
        this.resize = resize;
        document.addEventListener('keydown', e => {
            if (!this.isVisible) return;
            switch (e.key) {
                case 'ArrowLeft':
                    this.addIndex(reverse ? 1 : -1);
                    break;
                case 'ArrowRight':
                    this.addIndex(reverse ? -1 : 1);
                    break;
                case 'f':
                case 'F':
                    this.resize = !this.resize;
                    this.setImg();
                    break;
                case 'Escape':
                    this.hide();
                    break;
            }
        });
        document.body.appendChild(this.root);
    }
    start(urls, index = 0) {
        if (urls.length === 0) return;
        this.index = index;
        this.imgs = urls.map(url => {
            const img = document.createElement('img');
            img.src = url;
            img.className = imgClassName;
            return img;
        });
        this.show();
        this.setImg();
    }
    addIndex(diff) {
        this.index += diff;
        if ((this.index < 0) || (this.index >= this.imgs.length)) {
            this.hide();
        } else {
            this.setImg();
        }
    }
    setImg() {
        const oldImg = this.root.firstChild;
        const oriImg = this.imgs[this.index];
        const newImg = oriImg.cloneNode();
        const func = () => {
            if (this.resize) this.resizeImg(newImg, oriImg);
            // wheelzoom が src を書き換えるので load を remove
            newImg.removeEventListener('load', func);
            window.wheelzoom(newImg);
        };
        newImg.addEventListener('load', func);
        this.root.appendChild(newImg);
        if (oldImg) oldImg.remove();
    }
    resizeImg(newImg, oriImg) {
        const imageRatio = oriImg.naturalHeight / oriImg.naturalWidth;
        const windowRatio = window.innerHeight / window.innerWidth;
        // 画像の横縦比がウィンドウの横縦比より 大きい・同じ / 小さい
        if (imageRatio >= windowRatio) {
            newImg.height = window.innerHeight;
        } else {
            newImg.width = window.innerWidth;
        }
    }
    get isVisible() {
        return this.root.style.display === '';
    }
    show() {
        this.root.style.display = '';
    }
    hide() {
        this.root.style.display = 'none';
    }
})(!!swapLeftRight, !!expandImg);
