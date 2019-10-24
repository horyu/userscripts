// ==UserScript==
// @name        Twitter Image Suport
// @namespace   https://github.com/horyu
// @description タイムライン（TL）の画像を左クリックすると専用のViewerで画像を開き、中クリックすると新規タブで画像だけを開きます。メインバーのViewボタンでTLの画像ツイートをまとめてViewerで開きます。詳細はスクリプト内部のコメントに記述してあります。
// @include     https://twitter.com/*
// @version     0.1.6
// @run-at      document-start
// @noframes
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
画像の拡大縮小：マウスホイールで画像を拡大縮小
　　　　　　　　※拡大縮小しすぎると表示が崩れる可能性あり
画像の移動：画像をドラッグで移動
画像のリセット：ホイールクリックで画像の拡大縮小と位置をリセット
拡大表示の切替：fキーでViewerで開く画像を拡大表示に する・しない を切替
　　　　　　　　※ 元画像が大きい場合は大きいまま

■オプション（この行から10～12行下）
swapLeftRight：Viewerの左側クリック・左キーと右側クリック・右キーで表示する画像を逆に
             　する（true）・しない（false）
expandImg：Viewerで画像を開く時、画像を拡大表示に標準で する（true）・しない（false）
backgroundAlpha：Viewerの黒背景の透明度 0.0（透明）～1.0（不透明）
*/
//
// オプション ここから
//
const options = {
    swapLeftRight   : false,
    expandImg       : true,
    backgroundAlpha : 0.5,
};
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
const wrapperClassName = `${cssPrefix}-wrapper`;

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
background-color: rgba(0, 0, 0, ${parseFloat(options.backgroundAlpha) || 0.5});
padding: 5px;
}

.${wrapperClassName} {
width: 100%;
height: 100%;
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
        if (isNonTargetElement(ele)) return;
        if (e.button === 0) { // 左クリック
            e.preventDefault();
            const art = ele.closest('article');
            if (!art) return;
            const imgs = extractImgs(art);
            const index = imgs.indexOf(ele);
            const imgURLs = imgs.map(extractImgURL);
            OreViewer.start(imgURLs, index);
        } else if (e.button === 1) { // 中クリック
            e.preventDefault();
            const imgURL = extractImgURL(ele);
            window.open(imgURL);
        }
    }, true);
    if (window.chrome) {
        document.addEventListener('auxclick', e => {
            const ele = e.target;
            if (isNonTargetElement(ele)) return;
            e.preventDefault();
            const imgURL = extractImgURL(ele);
            window.open(imgURL);
        }, true);
    }
}

function isNonTargetElement(ele) {
    // IMGではない || タイムライン内ではない（＝多分個人ページ右上のメディア）
    // || 画像ツイートのIMGではない(＝多分画像リンク付きツイート)
    return ((ele.nodeName !== 'IMG') ||
            (!ele.closest('[data-testid="primaryColumn"]')) ||
            (ele.alt !== '画像'));
}

function extractImgs(art) {
    const imgs = Array.from(art.querySelectorAll('img[alt="画像"]'));
    // 引用部分のIMGを後ろから削除
    for (let i = imgs.length - 1; i >= 0; i--) {
        if (imgs[i].closest('[role="blockquote"]')) imgs.splice(i, 1);
    }
    // 公式では 0 1                          |0|1|
    //          2 3 の順に表示されるが構造が |2|3| なので並び替え
    if (imgs.length === 4) [imgs[1], imgs[2]] = [imgs[2], imgs[1]];
    return imgs;
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
        if (OreViewer.isVisible()) return; // 連打対策
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
}

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
        if (startIndex === -1) {
            alert('個別ツイートが見つかりません。\n' +
                  '個別ツイートが読み込まれる所までスクロールしてください。');
            return [];
        }
        for (let i = startIndex; i < tweetDivs.length; i++) targetDivs.push(tweetDivs[i]);
        if (specificAccount) {
            const getName = div => {
                // [data-testid="tweet"] がないと ○○さんがリツイート のAにつかまる
                const a = div.querySelector('[data-testid="tweet"] a');
                if (!a) return; // 個別ツイートの次のDIVは空
                return a.getAttribute('href');
            };
            const targetAccountName = getName(tweetDivs[startIndex]);
            // 対象アカウントではないDIVを後ろから削除
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
        if (!art) return;
        const imgs = extractImgs(art);
        imgs.forEach(img => {
            imgURLs.push(extractImgURL(img));
        });
    });
    return imgURLs;
}

//
// OreCanvas
//

const OreCanvas = (() => {
    let canvas;
    let ctx;
    let wrapper;
    function initialize(newCanvas, newWrapper) {
        canvas = newCanvas;
        ctx = canvas.getContext('2d');
        wrapper = newWrapper;
        trackTransforms(ctx);
        ctx.save();
        addDragAndZoom();
    }

    let img;
    let expand;
    let drawFunc;
    function setImg(newImg, expandImg) {
        canvas.width = wrapper.clientWidth;
        canvas.height = wrapper.clientHeight;
        img = newImg;
        expand = expandImg;
        ctx.restore();
        ctx.save();
        if (!expand && (newImg.width < canvas.width) && (newImg.height < canvas.height)) {
            drawFunc = drawImageOriginal;
        } else {
            drawFunc = drawImageScaled;
        }
        drawFunc();
    }

    // https://stackoverflow.com/questions/5189968/zoom-canvas-to-mouse-cursor#answer-5526721
    function trackTransforms(ctx) {
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        let xform = svg.createSVGMatrix();

        const savedTransforms = [];
        const save = ctx.save;
        ctx.save = () => {
            savedTransforms.push(xform.translate(0, 0));
            return save.call(ctx);
        };
        const restore = ctx.restore;
        ctx.restore = () => {
            xform = savedTransforms.pop();
            return restore.call(ctx);
        };

        const scale = ctx.scale;
        ctx.scale = (sx, sy) => {
            xform = xform.scaleNonUniform(sx, sy);
            return scale.call(ctx, sx, sy);
        };
        const translate = ctx.translate;
        ctx.translate = (dx, dy) => {
            xform = xform.translate(dx, dy);
            return translate.call(ctx, dx, dy);
        };
        const transform = ctx.transform;
        ctx.transform = (a, b, c, d, e, f) => {
            const m2 = svg.createSVGMatrix();
            m2.a = a; m2.b = b; m2.c = c; m2.d = d; m2.e = e; m2.f = f;
            xform = xform.multiply(m2);
            return transform.call(ctx, a, b, c, d, e, f);
        };
        const pt = svg.createSVGPoint();
        ctx.transformedPoint = (x, y) => {
            pt.x = x; pt.y = y;
            return pt.matrixTransform(xform.inverse());
        }
    }

    function addDragAndZoom() {
        let lastX = canvas.width / 2;
        let lastY = canvas.height / 2;
        let dragStart = null;
        let dragged = false;
        canvas.addEventListener('mousedown', e => {
            if (e.button === 0) { // 左クリック
                lastX = e.offsetX;
                lastY = e.offsetY;
                dragStart = ctx.transformedPoint(lastX, lastY);
                dragged = false;
            } else if (e.button === 1) { // 中クリック
                e.preventDefault();
                setImg(img, expand);
            }
        });
        canvas.addEventListener('mousemove', e => {
            lastX = e.offsetX;
            lastY = e.offsetY;
            if (dragStart) {
                const pt = ctx.transformedPoint(lastX, lastY);
                ctx.translate(pt.x - dragStart.x, pt.y - dragStart.y);
                redraw();
            }
            dragged = true;
        });
        canvas.addEventListener('mouseup', () => {
            dragStart = null;
        });

        const scaleFactor = 1.1;
        const zoom = delta => {
            const pt = ctx.transformedPoint(lastX, lastY);
            ctx.translate(pt.x, pt.y);
            const factor = Math.pow(scaleFactor, delta);
            ctx.scale(factor, factor);
            ctx.translate(-pt.x, -pt.y);
            redraw();
        }

        const handleScroll = e => {
            const delta = e.detail ? -e.detail / 10 : e.wheelDelta ? e.wheelDelta / 80 : 0;
            if (delta) zoom(delta);
            e.preventDefault();
            return false;
        };
        canvas.addEventListener('DOMMouseScroll', handleScroll); // Firefox
        canvas.addEventListener('mousewheel', handleScroll); // Chrome
    }

    function redraw() {
        const p1 = ctx.transformedPoint(0, 0);
        const p2 = ctx.transformedPoint(canvas.width, canvas.height);
        ctx.clearRect(p1.x, p1.y, p2.x - p1.x, p2.y - p1.y);
        drawFunc();
    }

    // https://stackoverflow.com/questions/23104582/scaling-an-image-to-fit-on-canvas#answer-23105310
    function drawImageOriginal() {
        ctx.drawImage(img, (canvas.width - img.width) / 2, (canvas.height - img.height) / 2);
    }

    // https://stackoverflow.com/questions/23104582/scaling-an-image-to-fit-on-canvas#answer-23105310
    function drawImageScaled() {
        const hRatio = canvas.width / img.width;
        const vRatio = canvas.height / img.height;
        const ratio = Math.min(hRatio, vRatio);
        const centerShiftX = (canvas.width - img.width * ratio) / 2;
        const centerShiftY = (canvas.height - img.height * ratio) / 2;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, img.width, img.height,
                      centerShiftX, centerShiftY, img.width * ratio, img.height * ratio);
    }

    return { initialize, setImg };
})();

//
// OreViewer
//

const OreViewer = new (class {
    constructor(swapLeftRight, expandImg) {
        const [left, right] = (swapLeftRight ? [1, -1] : [-1, 1]); // 1が次の画像 -1が前の画像
        this.expandImg = expandImg;
        // root とイベントの設定
        this.root = document.createElement('div');
        this.root.className = rootClassName;
        let isSimpleClick = true;
        this.root.onmousedown = () => {
            isSimpleClick = true;
        };
        this.root.onmousemove = () => {
            isSimpleClick = false;
        };
        this.root.onmouseup = e => {
            if (isSimpleClick && (e.button === 0)) {
                // クリックが画面の左側か右側か
                const diff = (e.clientX < (this.root.clientWidth / 2) ? left : right);
                this.addIndex(diff);
            }
        };
        document.addEventListener('keydown', e => {
            if (!this.isVisible()) return;
            switch (e.key) {
                case 'ArrowLeft':
                    this.addIndex(left);
                    break;
                case 'ArrowRight':
                    this.addIndex(right);
                    break;
                case 'f':
                case 'F':
                    this.expandImg = !this.expandImg;
                    this.setImg();
                    break;
                case 'Escape':
                    this.hide();
                    break;
            }
        });
        // OreCanvasの設定
        const wrapper = document.createElement('div');
        wrapper.className = wrapperClassName;
        this.root.appendChild(wrapper);
        const canvas = document.createElement('canvas');
        wrapper.appendChild(canvas);
        OreCanvas.initialize(canvas, wrapper);
        this.emptyImg = new Image;
        // DOMに追加
        this.hide(); // OreCanvas設定前に hide() するとOreCanvasの設定ができなくなる
        document.body.appendChild(this.root);
    }
    start(urls, index = 0) {
        if (urls.length === 0) return;
        this.index = index;
        this.imgs = urls.map(url => {
            const img = document.createElement('img');
            img.src = url;
            return img;
        });
        this.setImg();
        this.show();
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
        const img = this.imgs[this.index];
        if (img.complete) OreCanvas.setImg(img, this.expandImg);
        img.onload = () => OreCanvas.setImg(img, this.expandImg);
    }
    isVisible() {
        return (this.root.style.display === '');
    }
    show() {
        this.root.style.display = '';
    }
    hide() {
        this.root.style.display = 'none';
        OreCanvas.setImg(this.emptyImg); // show() したときに前のIMGが表示されうるので空IMGを登録
    }
})(!!options.swapLeftRight, !!options.expandImg);
