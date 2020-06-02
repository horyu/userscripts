このリポジトリは、作ったユーザースクリプトを（追加できる内容であれば）適当に追加していくところです。

---

__PeingNetImageToText__

<a href="PeingNetImageToText.user.js?raw=true">Install Link</a>

質問箱の質問テキストを画像の下に追加します。個別の質問ページのみ対応。

![ScreenShot](https://raw.githubusercontent.com/horyu/userscripts/master/imgs/PeingNetImageToText.png)

---

__Highlight Dimensions__

<a href="Highlight-Dimensions.user.js?raw=true">Install Link</a>

論文検索サイト [Dimensions](https://app.dimensions.ai/discover/publication) で `View PDF` か `Open Access` に該当する article 要素をハイライトします。

![ScreenShot](https://raw.githubusercontent.com/horyu/userscripts/master/imgs/Highlight-Dimensions.png)

---

__e-typing Shortcuts__

<a href="e-typing-Shortcuts.user.js?raw=true">Install Link</a>

タイピング練習が行えるサイト [e-typing](https://www.e-typing.ne.jp/) に自動フォーカス機能とキーボードショートカットを追加します。

- `Ctrl + Enter` : 「スタート」ボタンと「もう一回」ボタンのクリック
- `Alt + Enter` : 「ミスだけ」ボタンのクリック

---

__add textarea__

<a href="add-textarea.user.js?raw=true">Install Link</a>

様々な条件による文字数カウントをリアルタイムで表示してくれる愛用サイト [文字数カウント - Sundry Street](https://phonypianist.sakura.ne.jp/convenienttool/strcount.html) に、メモを書き込むためのテキストエリアを追加します。

---

__NicoManga ScrollButton__

<a href="NicoManga-ScrollButton.user.js?raw=true">Install Link</a>

ニコニコ漫画（ニコニコ静画）のヘッダーに、左右クリックでページスクロールするボタンと次エピソードへの移動ボタンを追加します。左右キーの入力でページスクロールする機能も入ってます。

![ScreenShot](https://raw.githubusercontent.com/horyu/userscripts/master/imgs/NicoManga-ScrollButton.png)


---

__Always desktop NicoDic__

<a href="Always-Desktop-NicoDic.user.js?raw=true">Install Link</a>

モバイル版ニコニコ大百科をデスクトップ版にリダイレクトします。

---

__Twitter Image Support__

<a href="TwitterImageSupport.user.js?raw=true">Install Link</a>

タイムライン（TL）の画像を左クリックすると専用のViewerで画像を開き、中クリックすると新規タブで画像だけを開きます。メインバーのViewボタンでTLの画像ツイートをまとめてViewerで開きます。詳しくは下の詳細をクリックして読んでください。

<details>
<summary>詳細</summary>

```
■クリックの詳細
[TL中の画像ツイートの画像]
  左クリック：そのツイートの画像でViewerを起動
  右クリック：ブラウザの標準
  中クリック：画像のみを新規タブで開く
[通常のTLでメインバーのViewボタン]
  左クリック：TLの画像でViewerを起動
  右クリック：TLの一度も開いていない画像でViewerを起動
  中クリック：何もしない
[個別のツイートを開いたTLでメインバーのViewボタン]
  左クリック：個別ツイートのアカウントに限定して、個別ツイート以降の画像でViewerを起動
  右クリック：TLの一度も開いていない画像でViewerを起動
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

■オプション
swapLeftRight：Viewerの左側クリック・左キーと右側クリック・右キーで表示する画像の順番を逆に
             　する（true）・しない（false）
expandImg：Viewerで画像を開く時、標準で拡大表示に する（true）・しない（false）
backgroundAlpha：Viewerの黒背景の透明度 0.0（透明）～1.0（不透明）
```
</details>

---

__Twitter Cube2__

<a href="TwitterCube2.user.js?raw=true">Install Link</a>

Twitterでルービックキューブの記録を毎日ツイートする自分用。2桁秒向けの設定なので、1桁秒の人はコードを書き換える必要がある。
