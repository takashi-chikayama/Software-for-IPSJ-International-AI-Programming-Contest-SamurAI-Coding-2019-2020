#include <iostream>
#include <fstream>
#include <sstream>
#include <cstdarg>
#include <unistd.h>
#include <signal.h>
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

static void usageMessage(const char *cmd) {
  cerr << "Usage: " << cmd
       << " [<option> ...] <field data> [<scripts> ...]\n"
       << "The following options can be specified.\n"
       << "  -S        Output game summary to stderr\n"
       << "  -D <path>\n"
       << "     Copies of the data sent to the player programs\n"
       << "     are saved in to the files with specified path.\n"
       << "     The following digits are appended for different agents.\n"
       << "       0: The samurai of the first player\n"
       << "       1: The samurai of the second player\n"
       << "       2: The dog of the first player\n"
       << "       3: The dog of the second player\n"
       << "  -H        Obtain help (this) message\n"
       << "\n"
       << ""
       << "\n"
       << "The number of scripts should be either zero, two or twelve.\n"
       << "When no scripts are given, the play log\n"
       << "in the given field data is verified.\n"
       << "When two scripts are given, they are the scripts to start\n"
       << "agent processes for the first and the second players.\n"
       << "The same start scripts are used for the samurai and the dogs.\n"
       << "When twelve scripts are given, they mean the following.\n"
       << "  The first thru the fourth:\n"
       << "     Scripts to start the agent processes.\n"
       << "  The fifth thru the eighth:\n"
       << "     Scripts to pause the agent processes.\n"
       << "  The ninth thru the twelfth:\n"
       << "     Scripts to resumed the paused agent processes.\n"
       << "For each of the three categories above,\n"
       << "the agent process controlled are\n"
       << "  the samurai of the first player,\n"
       << "  the samurai of the second player,\n"
       << "  the dog of the first player, and\n"
       << "  the dog of the second player\n"
       << "in this order.\n";
  exit(1);
}

static void usageError(const char *cmd,
		const char *msg, const char *msg2 = nullptr) {
  cerr << msg;
  if (msg2 != nullptr) cerr << " " << msg2;
  cerr << endl;
  usageMessage(cmd);
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

const char *OPTIONS = "SD:H";
char *dumpPath = nullptr;
int playerNumber = 0;

int main(int argc, char *argv[]) {
#if defined(__unix__) || defined(__linux__)
  signal(SIGPIPE, SIG_IGN);
#endif
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
    case 'H':
      usageMessage(argv[0]);
      exit(1);
    default:
      usageError(argv[0], "Invalid option specified");
      exit(1);
    }
  }
  if (argc == optind) {
    usageError(argv[0], "Game log file path is not specified");
  }
  value logData;
  readLogData(logData, argv[optind]);
  if (!logData.is<object>()) {
    usageError(argv[0], "Invalid log data in ", argv[optind]);
  }
  GameLog gamelog(logData.get<object>());
  if (argc == optind+1) {
    verifyPlays(gamelog);
  } else if (argc == optind+3 || argc == optind+5) {
    gamelog.plays.clear();
    char **playerScripts = argv+optind+1;
    vector <StepLog> playLogs =
      playGame(gamelog, playerScripts, dumpPath, argc-optind-1);
    GameLog result(gamelog, playLogs);
    cout << value(result.json()) << endl;
  } else {
    usageError(argv[0], "Zero, two, or four scripts should be given");
  }
  return 0;
}
