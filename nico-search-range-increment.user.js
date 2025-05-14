// ==UserScript==
// @name         Nico Super Search Month Increment Helper
// @namespace    https://github.com/horyu/
// @version      2025.5.14
// @description  ニコニコ超検索( https://gokulin.info/search/ )の検索条件フォームに「Next Month Range」ボタンを追加します。ボタンをクリックすると現在の投稿日Toを基準に、投稿日From（翌月1日）・投稿日To（翌月最終日）・再生数Min（経過月数x840）を設定します。
// @author       horyu (https://github.com/horyu/)
// @match        https://gokulin.info/search/result.php*
// @grant        none
// ==/UserScript==

(function () {
  "use strict";
  // Get input elements for From/To date and play count min strictly by DOM info
  const fromInput = document.querySelector('input#dateform1[name="dn"][type="date"]');
  const toInput = document.querySelector('input#dateform2[name="dx"][type="date"]');
  const playCountMinInput = document.querySelector('input[name="vn"][type="number"]');

  const PLAY_COUNT_PER_MONTH = 840;

  const button = document.createElement("button");
  button.textContent = "Next Month Range";
  button.type = "button";
  button.className = "search-submit";
  button.addEventListener("click", () => {
    if (!fromInput || !toInput || !playCountMinInput) {
      alert("Input element not found.");
      return;
    }
    if (!toInput.value) {
      alert("To (date) is not set.");
      return;
    }

    // Use toInput date as base, set From to the 1st of next month, To to the last day of next month
    const base = new Date(toInput.value);
    const fromDate = new Date(base.getFullYear(), base.getMonth() + 1, 1); // 1st of next month
    const toDate = new Date(base.getFullYear(), base.getMonth() + 2, 0);  // last day of next month

    // Set in yyyy-mm-dd format
    const pad = (n) => n.toString().padStart(2, "0");
    const format = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
    fromInput.value = format(fromDate);
    toInput.value = format(toDate);

    // Calculate elapsed months (difference in months between now and From)
    const now = new Date();
    let months = (now.getFullYear() - fromDate.getFullYear()) * 12 + (now.getMonth() - fromDate.getMonth());
    if (now.getDate() < fromDate.getDate()) months--;
    if (months < 0) months = 0;
    playCountMinInput.value = months * PLAY_COUNT_PER_MONTH;
  });

  // Insert the button before the search button
  const searchBtn = document.querySelector('button.search-submit');
  if (searchBtn && searchBtn.parentNode) {
    searchBtn.parentNode.insertBefore(button, searchBtn);
  }
})();
