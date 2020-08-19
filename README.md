# Separo-rs

Separoは[@gfngfn](https://github.com/gfngfn)氏によって考案された2人対戦用ボードゲームです。
ルールの詳細は、@gfngfn氏の個人ウェブページ[佛陀ヶ谷](http://buddhagaja.soregashi.com/boardgame.html#jump_boardgame_separo)で配布されています。

[![終局図1](https://github.com/ToruNiina/separo-rs/blob/master/separo.png)](https://toruniina.github.io/separo-rs/)

Separo-rsは、Separoをプレイするソフトウェアと、Webインターフェースを提供します。
ソフトウェアと対局できるほか、ソフトウェア同士の対局を見守ったり、人間が交互にプレイすることも可能です。

実装しているアルゴリズムは以下の通りです。Random以外は1秒間探索を行います。

- Random
  - 可能な手から一様乱数で手を選びます。最弱です。
- Naive MC
  - 原始モンテカルロアルゴリズムです。可能な手からランダムプレイアウトを行い、勝率が最大の手を選択します。
  - [Brügmann, Bernd (1993)](http://www.ideanest.com/vegos/MonteCarloGo.pdf)
- UCT MC
  - 信頼上限(UCB1)スコアを用いたモンテカルロ木探索アルゴリズムです。
  - [Kocsis, Levente; Szepesvári, Csaba (2006)](https://doi.org/10.1007/11871842_29)

このレポジトリは、[rustwasm/rust-webpack-template](https://github.com/rustwasm/rust-webpack-template)をもとに作成されています。

## Build

### Prerequisites

- Rust
- Node.js

### How to run in debug mode

勝手にブラウザが開きます。変更があるとリロードされます。

```console
$ npm start
```
### How to build in release mode

dist/以下にWebページが生成されるので、そこで`http-server`とかを立ててください。

```console
$ npm run build
```

## Disclaimer

- JSのベストプラクティスに詳しくないので、万一、CPU使用率が上がりすぎたり、メモリを食い尽くして落ちたりしても責任は取りません。
- 数回の対局を除き、デバッグをほぼしていないので、プレイ中に落ちるかも知れません。
  - その場合Issue報告を上げてくれると嬉しいです。

## Licensing terms

MIT.
