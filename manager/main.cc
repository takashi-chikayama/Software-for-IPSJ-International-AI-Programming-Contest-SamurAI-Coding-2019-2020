#include <iostream>
#include <fstream>
#include <sstream>
#include <cstdarg>
#include <unistd.h>
#include "playgame.hh"

void openErrorCheck(ifstream &s, const string &fileName, const string &kind) {
  if (s.fail()) {
    cerr << "Failed to open " << kind << ": " << fileName << endl;
    exit(1);
  }
}

void readLogData(value &logData, const string &fileName) {
  ifstream logInput(fileName);
  openErrorCheck(logInput, fileName, "game log");
  string logDataString((istreambuf_iterator<char>(logInput)),
  		       istreambuf_iterator<char>());
  logInput.close();
  string errors = parse(logData, logDataString);
  if (!errors.empty()) {
    cerr << "Error while parsing game log file: " << fileName << endl
	 << errors << endl;
    exit(1);
  }
}

void usageError(const char *msg, const char *msg2 = nullptr) {
  cerr << msg;
  if (msg2 != nullptr) cerr << " " << msg2;
  cerr << endl;
  exit(1);
}

void verifyPlays(const GameLog &gamelog) {
  int step = 0;
  const Field *currentField = &gamelog;
  cout << "Step " << step++ << endl;
  cout << *currentField;
  int scores[2] = { 0, 0 };
  for (auto play: gamelog.plays) {
    int actions[4];
    cout << "Play plans: ";
    for (int a = 0; a != 4; a++) {
      cout << " " << play.plans[a];
    }
    cout << endl;
    currentField = new
      Field(*currentField, play.plans, actions, scores);
    cout << "Step " << step++ << endl;
    cout << *currentField;
    for (int a = 0; a != 4; a++) {
      if (play.actions[a] != actions[a]) {
	cerr << "Action of agent " << a << " differ: "
	     << "should be " << play.actions[a] << " but is " << actions[a]
	     << endl;
	exit(1);
      }
    }	  
    for (int t = 0; t != 2; t++) {
      if (play.scores[t] != scores[t]) {
	cerr << "Score of " << t << " differ: "
	     << "should be " <<  play.scores[t] << " but is " << scores[t]
	     << endl;
	exit(1);
      }
    }
  }
}

const char *OPTIONS = "SD:";
char *dumpPath = nullptr;
int playerNumber = 0;

int main(int argc, char *argv[]) {
  for (int opt = getopt(argc, argv, OPTIONS);
       opt != -1;
       opt = getopt(argc, argv, OPTIONS)) {
    switch (opt) {
    case 'S':			// Game summary output to stderr
      stepSummary = true;
      break;
    case 'D':			// Dump communication log
      dumpPath = optarg;
      break;
    default:
      usageError("Invalid option specified");
      exit(1);
    }
  }
  if (argc == optind) {
    usageError("Game log file path is not specified");
  }
  value logData;
  readLogData(logData, argv[optind]);
  if (!logData.is<object>()) {
    usageError("Invalid log data in ", argv[optind]);
  }
  GameLog gamelog(logData.get<object>());
  if (argc == optind+1) {
    verifyPlays(gamelog);
  } else if (argc == optind+3) {
    gamelog.plays.clear();
    char **playerPaths = argv+optind+1;
    vector <StepLog> playLogs = playGame(gamelog, playerPaths, dumpPath);
    GameLog result(gamelog, playLogs);
    cout << value(result.json()) << endl;
  } else {
    usageError("Two player paths must be specified");
  }
  return 0;
}
