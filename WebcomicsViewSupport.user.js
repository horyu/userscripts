// ==UserScript==
// @name         Web漫画アンテナ 表示支援
// @namespace    https://github.com/horyu/
// @version      2024.12.4
// @description  ➀一度表示したEntryをローカルストレージに保存し、同一名の漫画のEntryがあれば追加表示する ②NG登録したサイトのEntryを半透明にする ③指定日時以前のEntryを非表示にするフィルターをヘッダーに追加する
// @author       horyu
// @match        https://webcomics.jp
// @match        https://webcomics.jp/?p=*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=webcomics.jp
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_listValues
// @grant        GM_registerMenuCommand
// ==/UserScript==

var NG_SITES = `
サンプル1
サンプル2
`;
var NG_SITE_SET = new Set(NG_SITES.split("\n").slice(1, -1));

/**
 * @typedef Info
 * @property {HTMLElement} entry
 * @property {string} title
 * @property {string} site
 * @property {string} detailHref
 * @property {string} ymd 2022/02/02
 */

/**
 * @typedef SavedInfo
 * @property {string} title
 * @property {string} site
 * @property {string} detailHref
 * @property {string} ymd 2022/02/02
 */

function main() {
  if (!shouldStart()) {
    return;
  }
  var entries = Array.from(document.querySelectorAll("#main .entry"));
  var infos = entries.map(parse);
  var savedInfosMap = loadSavedInfosMap(infos);
  console.log(infos, savedInfosMap);
  for (var info of infos) {
    updateStyleIfNgSite(info);
    insertSavedInfos(info, savedInfosMap[info.title]);
  }
  for (var info of infos) {
    saveInfo(info, savedInfosMap[info.title]);
  }

  addYmdFilter(infos);
  registerMenuCommands();
}

/**
 * 新作タイプが選択されているかどうかを判定する
 * @returns {boolean}
 * @throws {Error}
 */
function shouldStart() {
  var types = Array.from(document.querySelectorAll("#main > .top-type > a"));
  var texts = types.map((a) => a.textContent);
  if (
    types.length !== 3 ||
    !texts.every((t) => /^(人気|公式|ユーザー|新作)$/.test(t))
  ) {
    console.warn(types, texts);
    throw Error(`type が 「人気/公式/ユーザー/新作」から増減した？`);
  }
  return texts.at(-1) !== "新作";
}

/**
 * entry から Info を取得する
 * @param {Element} entry
 * @throws {Error}
 * @returns {Info}
 */
function parse(entry) {
  var title = entry.querySelector(".entry-title").textContent.trim();
  var site = entry.querySelector(".entry-site").textContent.trim();
  var detailHref = entry.querySelector(".entry-detail a").getAttribute("href");

  // N時間前 | N分前 | yyyy/mm/dd
  // 2023/9/2~ N時間前 | N分前 | m月d日
  var dateText = entry.querySelector(".entry-date").textContent.trim();
  var date;
  if (dateText.endsWith("時間前")) {
    var ma = dateText.match(/^(\d+)時間前$/);
    if (!ma) {
      throw Error(`時間前のパースに失敗した: ${dateText}`);
    }
    if (new Date().getHours() < parseInt(ma[1])) {
      date = new Date(new Date() - 86400 * 1000);
    } else {
      date = new Date();
    }
  } else if (dateText.endsWith("分前")) {
    if (!/^\d+分前$/.test(dateText)) {
      throw Error(`分前のパースに失敗した: ${dateText}`);
    }
    // N分前は当日とする
    date = new Date();
  } else {
    var ma = dateText.match(/^(\d+)月(\d+)日$/);
    if (!ma) {
      throw Error(`月日のパースに失敗した: ${dateText}`);
    }
    date = new Date(
      // 1月に表示される12月表記はおそらく年越し前のコンテンツ
      new Date().getFullYear() - ((new Date().getMonth() == 0 && parseInt(ma[1]) === 12) ? 1 : 0),
      parseInt(ma[1]) - 1,
      parseInt(ma[2])
    );
  }
  /** @type {string} */
  var ymd = date.toLocaleDateString("sv-SE").replaceAll("-", "/");

  if (
    !title ||
    !site ||
    !detailHref ||
    !ymd ||
    !/^\d{4}\/\d{2}\/\d{2}$/.test(ymd)
  ) {
    console.warn({ entry, title, site, detailHref, ymd, dateText, date });
    throw Error(`title, site, detailHref, ymd が取得できなかった`);
  }

  return {
    entry,
    title,
    site,
    detailHref,
    ymd,
  };
}

/**
 * Storage から過去データを取得する
 * @param {Info[]} infos
 * @returns {{[title: string]: SavedInfo[]}}
 */
function loadSavedInfosMap(infos) {
  var map = {};
  for (var info of infos) {
    var savedInfos = GM_getValue(info.title);
    map[info.title] = savedInfos ?? [];
  }
  return map;
}

/**
 * NG サイトの場合は半透明にする
 * @param {Info} info
 **/
function updateStyleIfNgSite(info) {
  if (NG_SITE_SET.has(info.site)) {
    info.entry.style.opacity = 0.5;
  }
}

/**
 * 過去データを挿入する
 * @param {Info} info
 * @param {SavedInfo[]} savedInfos
 */
function insertSavedInfos(info, savedInfos) {
  var insertInfos = savedInfos.filter(
    (pastInfo) => pastInfo.site !== info.site
  );
  if (insertInfos.length === 0) {
    return;
  }

  var html = "";
  for (var insertInfo of insertInfos) {
    const style = NG_SITE_SET.has(insertInfo.site) ? "opacity: 0.5;" :"";
    html += `<div class="entry-date" style="${style}">${insertInfo.ymd} - <a href="${insertInfo.detailHref}">${insertInfo.site}</a></div>`;
  }
  info.entry.style.minHeight = `${100 + 16 * insertInfos.length}px`;

  info.entry
    .querySelector(".entry-title")
    .insertAdjacentHTML("beforebegin", html);
}

/**
 * Storage を更新する
 * @param {Info} info
 * @param {SavedInfo[]} savedInfos
 */
function saveInfo(info, savedInfos) {
  if (savedInfos.some((pastInfo) => pastInfo.site === info.site)) {
    return;
  }
  const saveInfos = [
    ...savedInfos,
    {
      title: info.title,
      site: info.site,
      detailHref: info.detailHref,
      ymd: info.ymd,
    },
  ];
  saveInfos.sort((a, b) => b.ymd.localeCompare(a.ymd));

  GM_setValue(info.title, saveInfos);
}

/**
 * ヘッダーに日付フィルターを追加する
 * @param {Info[]} infos
 */
function addYmdFilter(infos) {
  var input = document.createElement("input");
  input.type = "date";
  input.style.marginTop = "6px";
  input.value = GM_getValue("@YmdFilter", "2022-02-02");

  var filter = () => {
    var replacedYmd = input.value.replaceAll("-", "/");
    for (var info of infos) {
      if (info.ymd < replacedYmd) {
        info.entry.style.display = "none";
      } else {
        info.entry.style.removeProperty("display");
      }
    }
  };

  input.addEventListener("change", () => {
    filter();
    GM_setValue("@YmdFilter", input.value);
  });
  filter();

  document
    .querySelector("#header .searchbar")
    .insertAdjacentElement("beforebegin", input);
}

/**
 * 保存した情報を表示するメニューコマンドを登録する
 */
function registerMenuCommands() {
  GM_registerMenuCommand("List", () => {
    console.log(GM_listValues());
  });
  GM_registerMenuCommand("ListDetail", () => {
    var detail = GM_listValues().reduce((acc, key) => {
      acc[key] = GM_getValue(key);
      return acc;
    }, {});
    console.log(detail);
  });
}

main();
