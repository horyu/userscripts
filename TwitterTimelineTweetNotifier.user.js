// ==UserScript==
// @name         TwitterTimelineTweetNotifier
// @namespace    https://github.com/horyu/
// @version      0.8
// @author       horyu
// @description  window.TimelineTweetNotifier.addObserver('info', console.log);
// @match        https://x.com/*
// @match        https://twitter.com/*
// @run-at       document-start
// @grant        none
// ==/UserScript==

const log = console.log;

window.addEventListener('load', () => {
    document.body.addEventListener('DOMNodeInserted', patrol, false);
    //window.TimelineTweetNotifier.addObserver('info', console.log);
});

class TimelineTweet {
    constructor(element, url, viewCount) {
        this.element = element;
        this.url = url;
        this.viewCount = viewCount;
        this.cache = {};
    }

    get isFirst() {
        // 画面下のツイートが読み込まれた直後に消失判定部分に押し込まれることがあるので、
        // ユーザー視点では初めての出現でもDOM上では2回目の出現となることがある
        // 画面内に表示された時に何かを実行したいなら
        // this.elementがviewportに入ったかscrollイベントでチェックすればよい
        return this.viewCount === 1;
    }

    hide() {
        // 要素本体を隠すと空白部分がタイムラインに残ることがあるので、直下の子要素を隠す
        this.element.childNodes[0].style.display = "none";
    }

    getUserName(ignoreCache = false) {
        const cacheKey = '@getUserName@';
        if (!this.cache.hasOwnProperty(cacheKey) || ignoreCache) {
            // 最初のAはリツイートの場合など他アカウントになりうる
            // アイコンとIDのAのhrefを/区切りした最後が一致すれば当人のユーザー名
            const lastPaths = {};
            for (const a of this.cacheQuerySelectorAll(ignoreCache, 'a[href]')) {
                const lastPath = a.href.split('/').slice(-1)[0];
                if (lastPaths.hasOwnProperty(lastPath)) {
                    this.cache[cacheKey] = lastPath;
                    break;
                }
                lastPaths[lastPath] = true;
            }
        }
        return this.cache[cacheKey];
    }

    getDate(ignoreCache = false) {
        const time = this.cacheQuerySelector(ignoreCache, 'time');
        // プロモーションツイートの場合null
        if (null === time) return null;
        return new Date(time.dateTime);
    }

    hasQuote(ignoreCache = false) {
        // 引用した時のアカウントの小さいアイコン
        return null !== this.cacheQuerySelector(ignoreCache, '[role="presentation"]');
    }

    hasPhoto(ignoreCache = false) {
        // [data-testid="tweetPhoto"] は遅延読み込み対象
        return 0 !== this.cacheQuerySelectorAll(ignoreCache, 'a[href*="/photo/"]').length;
    }

    hasOwnPhoto(ignoreCache = false){
        const cacheKey = '@hasOwnPhoto@';
        if (!this.cache.hasOwnProperty(cacheKey) || ignoreCache) {
            // 自身の画像がある === 最初の画像を含む[aria-labelledby]が引用アイコンを持たない
            const eles = this.cacheQuerySelectorAll(ignoreCache, 'a[href*="/photo/"]');
            this.cache[cacheKey] = (0 !== eles.length) &&
                (null === eles[0].closest('[aria-labelledby]').querySelector('[role="presentation"]'));
        }
        return this.cache[cacheKey];
    }

    hasQuotePhoto(ignoreCache = false){
        const cacheKey = '@hasQuotePhoto@';
        if (!this.cache.hasOwnProperty(cacheKey) || ignoreCache) {
            // 引用の画像がある === 最後の画像を含む[aria-labelledby]が引用アイコンを持つ
            const eles = this.cacheQuerySelectorAll(ignoreCache, 'a[href*="/photo/"]');
            this.cache[cacheKey] = (0 !== eles.length) &&
                (null !== eles[eles.length - 1].closest('[aria-labelledby]').querySelector('[role="presentation"]'));
        }
        return this.cache[cacheKey];
    }

/*
    // [data-testid="placementTracking"] > [data-testid="videoPlayer"] が両方遅延読み込みなので
    // ツイートDIV発生後少し待たないと正しく判定できない
    // 呼ばれた時点で1回走査＆＆要素に MutationObserverでも設定して Promise を返す？
    hasVideo(ignoreCache = false) {
        return null !== this.cacheQuerySelector(ignoreCache, '[data-testid="videoPlayer"]');
    }

    hasOwnVideo(ignoreCache = false){
        const cacheKey = '@hasOwnVideo@';
        if (!this.cache.hasOwnProperty(cacheKey) || ignoreCache) {
        }
        return this.cache[cacheKey];
    }

    hasQuoteVideo(ignoreCache = false){
        const cacheKey = '@hasQuoteVideo@';
        if (!this.cache.hasOwnProperty(cacheKey) || ignoreCache) {
        }
        return this.cache[cacheKey];
    }
*/
    isRewteeted(ignoreCache = false) {
        // ～さんがリツイート
        return null !== this.cacheQuerySelector(ignoreCache, 'path[d^="M23.615"]');
    }

    isLiked(ignoreCache = false) {
        // ～さんがいいねしました
        // 通常のいいねボタンと同じpathなので、2個以上あったらリプライとする
        return 2 <= this.cacheQuerySelectorAll(ignoreCache, 'path[d^="M12 21"]').length;
    }

    isFollowed(ignoreCache = false) {
        // ～さんがフォロー
        return null !== this.cacheQuerySelector(ignoreCache, 'path[d^="M12.225"]');
    }

    isTopic(ignoreCache = false) {
        // トピック
        return null !== this.cacheQuerySelector(ignoreCache, 'path[d^="M12 1.75c-5.11"]');
    }

    isPromoted(ignoreCache = false) {
        // プロモーション
        return null !== this.cacheQuerySelector(ignoreCache, 'path[d^="M19.498"]');
    }

    isReplyed(ignoreCache = false) {
        // ～さんが返信しました
        // 通常のリプライボタンと同じpathなので、2個以上あったらリプライとする
        return 2 <= this.cacheQuerySelectorAll(ignoreCache, 'path[d^="M14.046"]').length;
    }

    cacheQuerySelector(ignoreCache, selector) {
        if (!this.cache.hasOwnProperty(selector) || ignoreCache) {
            this.cache[selector] = this.element.querySelector(selector);
        }
        return this.cache[selector];
    }

    cacheQuerySelectorAll(ignoreCache, selector) {
        if (!this.cache.hasOwnProperty(selector) || ignoreCache) {
            this.cache[selector] = Array.from(this.element.querySelectorAll(selector));
        }
        return this.cache[selector];
    }
}

window.TimelineTweetNotifier = new class {
    #observers = {};

    addObserver(key, func) {
        if (typeof func !== 'function') {
            throw new Error('第2引数が呼び出し可能ではない', func);
        }
        this.#observers[key] = func;
    }

    removeObserver(key) {
        delete this.observers[key];
    }

    notifyObservers(timelineTweet) {
        for (const [key, func] of Object.entries(this.#observers)) {
            //log('TimelineTweetNotifier: notify' , key);
            func(timelineTweet);
        }
    }
};

const notify = (ele, id, viewCount) => {
    window.TimelineTweetNotifier.notifyObservers(new TimelineTweet(ele, id, viewCount));
}

const patrol = (() => {
    const viewCountMap = new Map();
    return (e) => {
        // 追加された要素がDIVではないか追加先がDIVではないなら終わり
        // 一度ホームのタイムラインが読み込まれた後のrelatedNodeはツイートDIVの親要素固定
        if (e.target.tagName !== "DIV" || e.relatedNode.tagName !== "DIV" ) return;
        //log(e);
        const tweetDivs = getNewTweetDivs();
        if (tweetDivs.length === 0) return;
        //log(tweetDivs);
        const tweetUrls = tweetDivs.map(extractTweetUrl);

        tweetDivs.forEach((tweetDiv, i) => {
            const tweetUrl = tweetUrls[i];
            // URLが取得できなかった場合はプロモーションツイート
            // その場合は現れる度に新規要素のはず
            if (tweetUrl === null) {
                notify(tweetDiv, tweetUrl, 1);
                return;
            }

            const count = viewCountMap.get(tweetUrl);
            if (count === undefined) {
                viewCountMap.set(tweetUrl, 1);
                notify(tweetDiv, tweetUrl, 1);
                //log("初登場", tweetId, tweetDiv);
            } else {
                viewCountMap.set(tweetUrl, count + 1);
                notify(tweetDiv, tweetUrl, count + 1);
                //log("再登場", count + 1, tweetId);
            }
        });
    };
})();

// 新規追加されたツイートDiv配列を返す
const getNewTweetDivs = (() => {
    const divSet = new WeakSet();
    let preTweetArticles = [];
    return () => {
        // リプライのモーダルウィンドウのツイートを弾くために [data-testid="primaryColumn"] を指定
        const tweetArticles = Array.from(document.querySelectorAll('[data-testid="primaryColumn"] [data-testid="tweet"]'));
        // 前回取得した時と同じ取得結果の場合は新規追加なし
        if (arrayEquals(preTweetArticles, tweetArticles)) return [];

        // ツイートが1個以下しか取得できていない場合、
        // どこがツイートDivの親か特定が難しいので空配列を返す
        if (tweetArticles.length < 2) {
            //log("tweetArticles.length < 2");
            return [];
        };
        //log(tweetArticles);

        // 先頭のツイート2つの共通する親要素を取得してその親要素の子要素をツイートDivとして返す
        // 先頭から2番目に配置されがちで階層構造が異なるプロモーションツイートに対応するため
        // contains を用いて共通の親かチェックする
        let divHasTweetDivs = null;
        const result = [];
        let [p0, p1] = tweetArticles;
        const isViewedP0 = divSet.has(p0);
        divSet.add(p0);
        while (p0 !== null) {
            const parentElement = p0.parentElement;
            if (parentElement.contains(p1)) {
                divHasTweetDivs = parentElement;
                if (!isViewedP0) {
                    result.push(p0);
                }
                break;
            }
            p0 = parentElement;
        }
        for (let i = 1; i < tweetArticles.length; i++) {
            let pi = tweetArticles[i];
            if (!divSet.has(pi)) {
                divSet.add(pi);
                while (pi.parentElement !== divHasTweetDivs) pi = pi.parentElement;
                result.push(pi);
            }
        }
        preTweetArticles = tweetArticles;
        return result;
    };
})();

const extractTweetUrl = (tweetDiv) => {
    const a = tweetDiv.querySelector('[href*="/status/"]');
    // プロモーションツイートの場合nullになる
    if (a !== null) return a.href;
    return null;
};

const arrayEquals = (a, b) => {
  return a.length === b.length &&
    a.every((val, index) => val === b[index]);
};
