// ==UserScript==
// @name         Always desktop NicoDic
// @author       horyu (https://github.com/horyu/)
// @namespace    https://github.com/horyu
// @description  モバイル版ニコニコ大百科をデスクトップ版にリダイレクト
// @match        https://dic.nicovideo.jp/t/*
// @version      0.2
// @run-at       document-start
// @grant        none
// @noframes
// ==/UserScript==

// this script is inspired by `Always desktop Wikipedia`.
// https://greasyfork.org/en/scripts/22673-always-desktop-wikipedia
location.href = location.href.replace("//dic.nicovideo.jp/t/", "//dic.nicovideo.jp/");
