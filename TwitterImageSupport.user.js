// ==UserScript==
// @name        Twitter Image Suport
// @author      horyu (https://github.com/horyu/)
// @description タイムライン（TL）の画像を左クリックすると専用のViewerで画像を開き、中クリックすると新規タブで画像だけを開きます。メインバーのViewボタンでTLの画像ツイートをまとめてViewerで開きます。詳細はスクリプト内部のコメントに記述してあります。
// @namespace   https://github.com/horyu
// @include     https://twitter.com/*
// @version     0.2.5
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
  右クリック：TLの画像でViewerを起動（左クリックと同じ）
  中クリック：何もしない
[個別のツイートを開いたTLでメインバーのViewボタン]
  左クリック：個別ツイートのアカウントに限定して、個別ツイート以降の画像でViewerを起動
  右クリック：個別ツイート以降の画像でViewerを起動
  中クリック：何もしない

■Viewerの機能
Viewerの終了：EscキーでViewerを終了
画像の切替：画面の左側をクリック・左キーで前の画像、右側をクリック・右キーで次の画像に切替
　　　　　　※ 前か次の画像がない場合はViewerを終了
画像の拡大縮小：マウスホイールで画像を拡大縮小
　　　　　　　　※拡大縮小しすぎると表示が崩れる可能性あり
画像の移動：画像をドラッグで移動
画像のリセット：中クリックで画像の拡大縮小と位置をリセット
拡大表示の切替：fキーでViewerで開く画像を拡大表示に する・しない を切替
　　　　　　　　※ 元画像が大きい場合は大きいまま

■オプション（書き換える所はこの行から9～11行下）
swapLeftRight：Viewerの左側クリック・左キーと右側クリック・右キーで表示する画像の順番を逆に
             　する（true）・しない（false）
expandImg：Viewerで画像を開く時、標準で拡大表示に する（true）・しない（false）
backgroundAlpha：Viewerの黒背景の透明度 0.0（透明）～1.0（不透明）
*/
//
// オプション ここから
const OPTIONS = {
    swapLeftRight   : false,
    expandImg       : true,
    backgroundAlpha : 0.5,
};
// オプション ここまで
//

function init() {
    document.addEventListener('DOMContentLoaded', () => {
        const root = makeRoot();
        OreCanvas.initialize(root);
        OreViewer.initialize(root);
        addClickEventListener();
        addViewButton();
    });
}

//
// makeRoot
//

function makeRoot() {
    const root = document.createElement('div');
    root.style.cssText = `
z-index: 9999;
position: fixed;
top: 0; bottom: 0; left: 0; right: 0;
background-color: rgba(0, 0, 0, ${parseFloat(OPTIONS.backgroundAlpha) || 0.5});
padding: 5px;
`;
    document.body.appendChild(root);
    return root;
}

//
// OreCanvas
//

const OreCanvas = (() => {
    let wrapper, canvas, ctx;
    function initialize(root) {
        wrapper = document.createElement('div');
        wrapper.style.cssText = `width: 100%; height: 100%;`;
        canvas = document.createElement('canvas');
        wrapper.appendChild(canvas);
        root.appendChild(wrapper);
        ctx = canvas.getContext('2d');
        trackTransforms(ctx); // ctxを機能拡張
        ctx.save(); // 初期位置・初期拡大縮小を保存
        addDragAndZoom(); // ドラッグとズーム機能を追加
    }

    let img, expand, drawFunc;
    function setImg(newImg, expandImg) {
        canvas.width = wrapper.clientWidth;
        canvas.height = wrapper.clientHeight;
        img = newImg;
        expand = expandImg;
        ctx.restore(); // 初期位置・初期拡大縮小を復元
        ctx.save(); // 初期位置・初期拡大縮小を保存
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
        canvas.addEventListener('mousedown', e => {
            if (e.button === 0) { // 左クリック
                lastX = e.offsetX;
                lastY = e.offsetY;
                dragStart = ctx.transformedPoint(lastX, lastY);
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
        if (window.chrome) canvas.addEventListener('mousewheel', handleScroll); // Chrome
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

const OreViewer = ((expandImg, swapLeftRight) => {
    const [left, right] = (swapLeftRight ? [1, -1] : [-1, 1]); // 1が次の画像 -1が前の画像
    let root;
    function initialize(rootEle) {
        // root の設定
        root = rootEle;
        hide();
        let isSimpleClick = false;
        root.onmousedown = e => {
            isSimpleClick = (e.button === 0);
        };
        root.onmousemove = () => {
            isSimpleClick = false;
        };
        root.onmouseup = e => {
            if (isSimpleClick) {
                // 左クリックが画面の左側か右側か
                const diff = (e.clientX < (root.clientWidth / 2) ? left : right);
                addIndex(diff);
            }
        };
        // キーボードイベントの登録
        document.addEventListener('keydown', e => {
            if (!isVisible()) return; // OreViewerが不可視なら無視
            switch (e.key) {
                case 'ArrowLeft':
                    addIndex(left);
                    break;
                case 'ArrowRight':
                    addIndex(right);
                    break;
                case 'f':
                case 'F':
                    expandImg = !expandImg;
                    setImg();
                    break;
                case 'Escape':
                    hide();
                    break;
            }
        });
    }
    let index, imgs;
    function start(urls, newindex = 0) {
        if (urls.length === 0) return;
        show();
        index = newindex;
        imgs = urls.map(url => {
            const img = document.createElement('img');
            img.src = url;
            return img;
        });
        setImg();
    }
    function addIndex(diff) {
        index += diff;
        if ((index < 0) || (index >= imgs.length)) {
            hide();
        } else {
            setImg();
        }
    }
    function setImg() {
        const img = imgs[index];
        if (img.complete) OreCanvas.setImg(img, expandImg);
        img.onload = () => OreCanvas.setImg(img, expandImg);
    }
    function isVisible() {
        return (root.style.display === '');
    }
    function show() {
        root.style.display = '';
    }
    const emptyImg = new Image;
    function hide() {
        root.style.display = 'none';
        OreCanvas.setImg(emptyImg); // show() したときに前のIMGが表示されうるので空IMGを登録
    }
    return { initialize, start, isVisible };
})(!!OPTIONS.expandImg, !!OPTIONS.swapLeftRight);

//
// addClickEventListener
//

function addClickEventListener() {
    document.addEventListener('click', e => {
        const ele = e.target;
        const clickedImgURL = extractClickedImgURL(ele);
        if (!clickedImgURL) return;
        if (e.button === 0) { // 左クリック
            const art = ele.closest('article');
            if (!art) return;
            e.preventDefault();
            const quoteDiv = ele.closest('[role="blockquote"]');
            const imgs = extractImgs(quoteDiv || art, !!quoteDiv);
            const imgURLs = imgs.map(extractImgURL);
            const index = imgURLs.indexOf(clickedImgURL);
            OreViewer.start(imgURLs, index);
        } else if (e.button === 1) { // 中クリック
            e.preventDefault();
            window.open(clickedImgURL);
        }
    }, true);
    if (window.chrome) {
        // スマホ版左スワイプによるカメラ画像ツイートは拾わない
        // [原因] 該当DIV要素上の中クリックはオートスクロールになる → clickとauxclickが不発
        // [理由] そもそも該当ツイートが少なくてmousedownとmouseupで書くほどの価値はない
        document.addEventListener('auxclick', e => {
            if (e.button !== 1) return;
            const ele = e.target;
            const clickedImgURL = extractClickedImgURL(ele);
            if (!clickedImgURL) return;
            e.preventDefault();
            window.open(clickedImgURL);
        }, true);
    }
}

// クリック対象が(対象IMG || 対象IMGを含む何か) ? extractImgURL(img) : undefined
function extractClickedImgURL(ele) {
    if (ele.nodeName === 'IMG') {
        // タイムライン内（!= 個人ページ右上のメディア)
        // && 画像ツイートのIMG(!= 多分画像リンク付きツイート or ヘッダー画像)
        if ((ele.closest('[data-testid="primaryColumn"]')) &&
            (ele.src.startsWith('https://pbs.twimg.com/media'))) {
            return extractImgURL(ele);
        }
    } else { // スマホ版左スワイプによるカメラ画像ツイートならIMGを拾う
        if (!ele.closest('[role="link"]')) return;
        const img = ele.querySelector('img');
        if (img) return extractClickedImgURL(img);
    }
}

function extractImgs(ele, isQuote) {
    const imgs = Array.from(ele.querySelectorAll('img[src^="https://pbs.twimg.com/media"]'));
    if (!isQuote) { // 引用部分のIMGを後ろから削除
        for (let i = imgs.length - 1; i >= 0; i--) {
            if (imgs[i].closest('[role="blockquote"]')) imgs.splice(i, 1);
        }
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
    // 個別ツイートなら targetDivs を加工
    if (location.pathname.includes('/status/')) {
        // 個別ツイートなら ツイートソースラベル が表示されている（はず）
        const startIndex = tweetDivs.findIndex(div => !!div.querySelector(
            'a[href="https://help.twitter.com/using-twitter/how-to-tweet#source-labels"]'
        ));
        if (startIndex === -1) {
            alert('個別ツイートが見つかりません。' +
                  '個別ツイートが読み込まれる所までスクロールしてください。' +
                  '意図が分かる方はブラウザの表示を縮小してもいいです。');
            return [];
        }
        tweetDivs.splice(0, startIndex); // 個別ツイートより前のDIVを全削除
        if (specificAccount) {
            const targetAccountName = extractAccountName(tweetDivs[0]);
            // 対象アカウントではないDIVを後ろから削除
            for (let i = tweetDivs.length - 1; i >= 0; i--) {
                if (extractAccountName(tweetDivs[i]) !== targetAccountName) {
                    tweetDivs.splice(i, 1);
                }
            }
        }
    }
    const imgURLs = [];
    tweetDivs.forEach(div => {
        const art = div.querySelector(':scope > div > article');
        if (!art) return;
        const imgs = extractImgs(art);
        if (imgs.length > 0) {
            // IMGを抽出できたDIVは seagreen で縁取る
            div.style.cssText = `border-style: solid; border-color: rgb(46, 139, 87, .5);`;
            imgs.forEach(img => {
                imgURLs.push(extractImgURL(img));
            });
        }
    });
    return imgURLs;
}

function extractAccountName(div) {
    // [data-testid="tweet"] がないと ○○さんがリツイート のAにつかまる
    const a = div.querySelector('[data-testid="tweet"] a');
    if (!a) return; // 個別ツイートの次のDIVは空
    return a.getAttribute('href');
}

init();
