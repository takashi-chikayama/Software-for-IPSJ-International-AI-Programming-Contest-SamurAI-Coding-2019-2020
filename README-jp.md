# SamurAI Coding 2019-20 のためのソフトウェア

## 文書
### ゲームルール
SamurAI Dig Here ゲームのルールは以下のファイルにあります.
* 日本語版: [documents/rules-jp.html](documents/rules-jp.html)
* 英語版: [documents/rules.html](documents/rules.html)
### ゲーム管理システム
ゲーム管理システムのマニュアルは以下のファイルにあります.
* 英語版: [documents/manager.html](documents/manager.html)
* 日本語版: [documents/manager-jp.html](documents/manager-jp.html)
### ウェブページ
ゲームログを可視化するウェブページのマニュアルは以下のファイルにあります.
The manuals for the game log visualizer web page are in the following files.
* 英語版: [documents/help.html](documents/help.html)
* 日本語版: Japanese version: [documents/help-jp.html](documents/help-jp.html)
### 戦術のヒント
ありそうなゲームの戦術が以下のファイルにあります.
* 英語版: [documents/tactics.html](documents/tactics.html)
* 日本語版: [documents/tactics-jp.html](documents/tactics-jp.html)

## はじめに
### 必要なもの

* C++ 開発環境 (C++11 以上のコンパイラと標準ライブラリ)
* ウェブブラウザ

    ウェブブラウザは文書を読むため, ゲームのリプレイを見るため,
    そしてゲームの競技場の構成を編集するのに使います.
    動作確認済みの OS とブラウザの組は以下があります.

** Windows: Edge (44.18362.387.0), Chrome (77.0.3865.120), Firefox (69.0.3)
** MacOS: Safari (13.0.2), Chrome (77.0.3865.120), Firefox (69.0.3)
** Ubuntu: Chrome (77.0.3865.90), Firefox (69.0.2), Opera (64.0.3417.61)

### インストール

トップレベルのディレクトリで以下を実行してください.
```
$ make all
```
これで以下のソフトウェアができます.
* manager/manager
   ゲーム管理システム
* players/simplePlayer
   単純な AI プレイヤの例
* players/randomPlayer
   ランダムなプレイをするプレイヤ
* players/timeoutPlayer
   ときどき停止してしまうプレイヤ

## テスト

### テストラン
トップレベルのディレクトリで以下を実行してください.
```
$ make testrun
```
これで単純なプレイヤふたつの間でゲームを行い, 結果を [samples/testout.dighere](samples/testout.dighere) に書き出します.

### 結果の可視化

ウェブページ [webpage/dighere.html](webpage/dighere.html)
をウェブブラウザで開いてください.
![Image](icons/import.png "import button") をクリックすると,
ファイル選択ダイアログが出るので,
ゲームログ [samples/testout.dighere](samples/testout.dighere)
を選んで読み込んでください.
そしてプレイボタンを押せば記録したゲームの進行を可視化することができます.

ページ右上のクエスチョンマークのアイコンのボタンを押せば, このウェブページの使い方のマニュアルを表示できます.

## 著者

* **Takashi Chikayama** - *Initial version*

## ライセンス

このソフトウェア MIT ライセンスに従って配布します.  詳しくは [LICENSE.md](LICENSE.md) をご覧ください.

プロジェクトの一部 (picojson) は Cybozu Labs, Inc. と Kazuho Oku にライセンスされています.  詳しくは [manager/picojson.h](manager/picojson.h) をご覧ください.

## 謝辞

情報処理学会プログラミングコンテスト委員会のメンバーはゲームの設計やシステムのテストに協力しました.  委員は下記の皆さんです.

* 委員:
平石 拓 (京都大学, 委員長), 鷲崎弘宜 (早稲田大学，エグゼクティブアドバイザー), 近山隆 (東京大学名誉教授), 高田眞吾 (慶應義塾大学), 小林祐樹 (日立製作所） 坂本一憲 (WillBooster合同会社), 田中哲朗 (東京大学), 三輪 誠 (豊田工業大学), 長 健太 (東芝デジタルソリューションズ） 寺田 努 (神戸大学), 河内谷清久仁 (日本アイ・ビー・エム), 深澤紀子 (鉄道総合技術研究所), 横山大作 (明治大学）
