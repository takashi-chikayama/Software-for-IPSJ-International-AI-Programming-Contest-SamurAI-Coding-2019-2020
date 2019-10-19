# Software for IPSJ International AI Programming Contest
#   SamurAI Coding 2019-20

## Documents
### Game Rules
The rules of the game SamurAI Dig Here can found in the following files.
* English version: [documents/rules.html](documents/rules.html)
* Japanese version: [documents/rules-jp.html](documents/rules-jp.html)
### Game Manager
The manuals for the game manager are in the following files.
* English version: [documents/manager.html](documents/manager.html)
* Japanese version: [documents/manager-jp.html](documents/manager-jp.html)
### Web Page
The manuals for the game log visualizer web page are in the following files.
* English version: [documents/help.html](documents/help.html)
* Japanese version: [documents/help-jp.html](documents/help-jp.html)
### Tactics
Some potential game tactics are suggested in the following files.
* English version: [documents/tactics.html](documents/tactics.html)
* Japanese version: [documents/tactics-jp.html](documents/tactics-jp.html)

## Getting Started
### Prerequisites

* C++ development environment (compiler and standard libraries for c++11 or later)
* A web browser

    A web browser is required for viewing the documents,
    visualizing replays of games,
    and also for editing game field configurations.
    The web page for the game is known to work
    on the following systems and browsers.
    All of them are 64 bit versions.
** Windows: Edge (44.18362.387.0), Chrome (77.0.3865.120), Firefox (69.0.3)
** MacOS: Safari (13.0.2), Chrome (77.0.3865.120), Firefox (69.0.3)
** Ubuntu: Chrome (77.0.3865.90), Firefox (69.0.2), Opera (64.0.3417.61)

### Installing

Issue the following in the top-level directory.
```
$ make all
```
This will make the following software.
* manager/manager
   Game management system
* players/simplePlayer
   A simple sample player AI
* players/randomPlayer
   A player with random plays
* players/timeoutPlayer
   A player that sometimes falls asleep

## Testing

### Test Run
Issue the following in the top-level directory.
```
$ make testrun
```
This will play a game between two simple players and output a log in the file [samples/testout.dighere](samples/testout.dighere).

### Viewing the Result

Open the web page [webpage/dighere.html](webpage/dighere.html) with a
web browser.  Clicking the ![Image](icons/import.png "import button"),
a file selection dialog will pop up.  Select the game log
[samples/testout.dighere](samples/testout.dighere), to load it.  You
can visualize the recorded game by clicking the play button on screen
top.

The manual for using the web page can be visited by clicking the
button with a question mark icon on top right of the page.

## Authors

* **Takashi Chikayama** - *Initial version*

## License

This software is distributed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details

A part of the project (picojson) is licenced by Cybozu Labs, Inc. and Kazuho Oku.
See [manager/picojson.h](manager/picojson.h) for details.

## Acknowledgments

Members of the Programming Contest Committee of Information Processing Society of Japan helped designing the game and testing the system, whose names are listed below.

* Committee Members: 
Tasuku Hiraishi (Director), Hironori Washizaki (Executive Advisor), Takashi Chikayama, Shingo Takada, Yuki Kobayashi Kazunori Sakamoto, Tetsuro Tanaka, Makoto Miwa, Kenta Cho, Tsutomu Terada, Kiyokuni Kawachiya, Noriko Fukasawa, Daisaku Yokoyama
