// ==UserScript==
// @name         Nico Playlist Player
// @namespace    https://github.com/horyu/
// @version      2025.5.11
// @description  ニコニコ超検索( https://gokulin.info/search/ )の検索結果から動画のプレイリストを作成し、ニコニコ動画で連続再生する。拡張機能のメニューからプレイリストを空にできる。
// @author       horyu (https://github.com/horyu/)
// @match        https://gokulin.info/search/result.php*
// @match        https://www.nicovideo.jp/watch/*
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_registerMenuCommand
// ==/UserScript==

(function () {
  "use strict";

  // Constants
  const PLAYLIST_KEY = "nicoPlaylist";

  // Helper function to wait for a specific time
  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  // Helper function to wait for an element to appear
  const waitForElement = async (selector, timeout = 10000, interval = 100) => {
    let elapsed = 0;
    while (elapsed < timeout) {
      const element = document.querySelector(selector);
      if (element) {
        return element;
      }
      await sleep(interval);
      elapsed += interval;
    }
    return null;
  };

  // Playlist utility functions
  /** @returns {Array<string>} */
  const getPlaylist = () => GM_getValue(PLAYLIST_KEY, []);
  const savePlaylist = (playlist) => GM_setValue(PLAYLIST_KEY, playlist);

  // Register a menu command to clear the playlist (available on all matched pages)
  GM_registerMenuCommand('Clear Playlist', () => {
    savePlaylist([]);
    alert('Playlist cleared.');
  });

  // Function to create and play playlist from search result page
  async function createAndPlayPlaylist() {
    const videoLinks = Array.from(document.querySelectorAll("#result-box .title a")).map(
      (a) => a.href
    );

    if (videoLinks.length === 0) {
      console.error("No video links found on this page.");
      return;
    }

    savePlaylist(videoLinks);
    console.log("Video playlist saved. Starting play", videoLinks);

    // Open the first video in a new tab
    window.open(videoLinks[0], "_blank");
  }

  // Function to add a play button on the search page
  function addPlayButton() {
    const resultArticle = document.querySelector("article.result");
    if (!resultArticle) {
      console.error("Result article not found.");
      return;
    }

    const button = document.createElement("button");
    button.textContent = "Create & Play Playlist";
    button.className = "search-submit";
    button.addEventListener("click", createAndPlayPlaylist);

    resultArticle.insertBefore(button, resultArticle.firstChild);
  }

  // Function to handle NicoNico video page
  async function handleVideoPage() {
    const videoPlaylist = getPlaylist();

    if (videoPlaylist.length === 0) {
      console.log("No videos in the playlist.");
      return;
    }

    // Wait for the content element to appear
    if ((await waitForElement('[aria-label="nicovideo-content"]')) === null) {
      console.error(`"Content element not found on the page.`);
      return;
    }

    // Check if the current video is in the playlist
    const currentUrl = window.location.href;
    const currentIndex = videoPlaylist.indexOf(currentUrl);
    if (currentIndex === -1) {
      console.log("Current video is not in the playlist. Skipping script execution.");
      return;
    }

    // Update the page title with the current position in the playlist
    const totalVideos = videoPlaylist.length;
    document.title = `${currentIndex + 1}/${totalVideos} ${document.title}`;

    // Monitor play progress
    const totalTimeElement = document.querySelector("div span.white-space_nowrap:last-child");
    const currentTimeElement = document.querySelector("div span.white-space_nowrap:first-child");
    if (!totalTimeElement || !currentTimeElement) {
      alert("Could not find elements displaying playback time on the page.");
      return;
    }

    // Wait for the video to finish playing
    while (true) {
      // totalTimeElement may fluctuate by 1 second, so keep watching it while the video is playing.
      // e.g. https://www.nicovideo.jp/watch/sm1091180 (02:00 → 01:59)
      if (currentTimeElement.textContent === totalTimeElement.textContent) {
        break;
      }
      // For some videos, the "next video" popup appears before the video actually ends.
      // e.g. https://www.nicovideo.jp/watch/sm1464024 (03:10)
      if (document.querySelector('[data-element-name="next_video_confirmation_play_now"]')) {
        break;
      }
      await sleep(900);
    }

    // Open the next video in the playlist
    if (currentIndex + 1 < totalVideos) {
      console.log("Current video finished playing. Moving to the next video in the playlist...");
      window.location.href = videoPlaylist[currentIndex + 1];
    } else {
      console.log("No more videos in the playlist.");
    }
  }

  // Main script logic
  if (window.location.href.startsWith("https://gokulin.info/search/result.php")) {
    addPlayButton();
  } else if (window.location.href.startsWith("https://www.nicovideo.jp/watch/")) {
    handleVideoPage();
  }
})();
