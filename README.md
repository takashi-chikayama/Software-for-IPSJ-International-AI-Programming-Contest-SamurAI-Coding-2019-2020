# Software-for-IPSJ-International-AI-Programming-Contest-SamurAI-Coding-2019-2020

## Documents

The rules of the game SamurAI Dig Here found in the following files.

* [documents/rules.html](documents/rules.html)
* [documents/rules-jp.html](documents/rules-jp.html)

## Getting Started
### Prerequisites

* C++ development environment (compiler and standard libraries for c++11 or later)
* A web browsers

The web browser is used to view the documents, to show replays of
games, and also to edit game field configuration.

### Installing

Issue the following in the top-level directory.
```
$ make all
```
This will make the following software.
* manager/manager
   Game management system
* players/simplePlayer
   Sample player AI
* players/randomPlayer
   Player with random plays
* players/timeoutPlayer
   Player that sometimes fall asleep

## Testing

### Test Run
Issue the following in the top-level directory.
```
$ make testrun
```
This will play a game between two simple players and output a log in the file [samples/testout.dighere](samples/testout.dighere).

### Viewing the Result

Open the web page [webpage/dighere.html](webpage/dighere.html) with a web browser.
Go to the edit mode by clicking a button with a pencil and paper icon on the screen top.
Then click the import button with the icon of the globe and a down arrow,
bringing up a file selection dialog.
Select the game log  [samples/testout.dighere](samples/testout.dighere).
Then click exit the edit mode by clicking a button with a pencil and paper icon on the screen top (now the icon shows the pencil upside-down).
You can now view the game by clicking the play button on screen top.

The manual for using the web page can be visited by clicking the button with a question mark icon on top right of the page.

## Authors

* **Takashi Chikayama** - *Initial version*

## License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details

A part of the project (picojson) is licenced by Cybozu Labs, Inc. and Kazuo Oku.
See [manager/picojson.h](manager/picojson.h) for details.

## Acknowledgments

Members of the Programming Contest Committee of Information Processing Society of Japan and SamurAI Coding Game Design and Development Support team helped testing the system, whose names are listed below.

* Committee Members: 
Tasuku Hiraishi (Director), Hironori Washizaki (Executive Advisor), Takashi Chikayama, Shingo Takada, Yuki Kobayashi Kazunori Sakamoto, Tetsuro Tanaka, Makoto Miwa, Kenta Cho, Tsutomu Terada, Kiyokuni Kawachiya, Noriko Fukasawa, Daisaku Yokoyama
