#include <iostream>
#include <fstream>
#include <sstream>
#include <iomanip>
#include <string>
#include <unistd.h>
#include <stdio.h>
#include <signal.h>
#include <chrono>
#include "playgame.hh"

using namespace chrono;

pid_t playerIds[4];
FILE *toPlayers[4];
FILE *fromPlayers[4];

bool stepSummary = false;

static const int dx[] = { 0,-1,-1,-1, 0, 1, 1, 1 };
static const int dy[] = { 1, 1, 0,-1,-1,-1, 0, 1 };

static void sendGameInfo
(FILE *out, int id, int step,
 const Configuration &l,
 const int plans[], const int actions[], const int scores[]) {
  fprintf(out, "%d\n%d\n%d\n%d\n", id, l.size, step, l.steps);
  fprintf(out, "%d", (int)l.holes.size());
  for (auto h: l.holes) fprintf(out, " %d %d", h.x, h.y);
  fprintf(out, "\n");
  fprintf(out, "%d", (int)l.known.size());
  for (auto g: l.known) fprintf(out, " %d %d %d", g.x, g.y, g.amount);
  fprintf(out, "\n");
  int x = l.agents[id].x;
  int y = l.agents[id].y;
  vector <Gold> sensed;
  if (id >= 2) {
    for (int k = 0; k != 8; k++) {
      int nx = x+dx[k];
      int ny = y+dy[k];
      auto found =
	find_if(l.hidden.begin(), l.hidden.end(),
		[nx, ny](auto &g) { return g.x == nx && g.y == ny; });
      if (found != l.hidden.end())
	sensed.push_back(*found);
    }
  }
  fprintf(out, "%d", (int)sensed.size());
  for (auto s: sensed) {
    fprintf(out, " %d %d %d", s.x, s.y, s.amount);
  }
  fprintf(out, "\n");
  for (int p = 0; p != 4; p++) {
    if (p != 0) fprintf(out, " ");
    fprintf(out, "%d %d", l.agents[p].x, l.agents[p].y);
  }
  fprintf(out, "\n");
  for (int p = 0; p != 4; p++) {
    if (p != 0) fprintf(out, " ");
    fprintf(out, "%d", plans[p]);
  }
  fprintf(out, "\n");
  for (int p = 0; p != 4; p++) {
    if (p != 0) fprintf(out, " ");
    fprintf(out, "%d", actions[p]);
  }
  fprintf(out, "\n");
  fprintf(out, "%d %d\n", scores[0], scores[1]);
  int remaining = 0;
  for (auto &g: l.known) remaining += g.amount;
  for (auto &g: l.hidden) remaining += g.amount;
  fprintf(out, "%d\n", remaining);
  fprintf(out, "2000\n");	 // think time
}

vector <StepLog> playGame
(const Configuration &initialConf,
 char *playerNames[],
 char *dumpPath) {
  const Configuration *config = &initialConf;
  int coordWidth = config->size > 10 ? 2 : 1;
  int totalGolds = 0;
  for (auto g: initialConf.known) totalGolds += g.amount;
  for (auto g: initialConf.hidden) totalGolds += g.amount;
  FILE *dump[4];
  if (dumpPath != nullptr) {
    for (int p = 0; p != 4; p++) {
      const char *digits[] = { "0", "1", "2", "3" };
      string path(dumpPath);
      path.append(digits[p]);
      dump[p] = fopen(path.c_str(), "w");
      if (dump[p] == nullptr) {
	perror("Failed to open dump file: ");
	exit(1);
      }
    }
  }
  for (int p = 0; p != 4; p++) {
    int pipeOut[2];
    int pipeIn[2];
    if (pipe(pipeOut) < 0) {
      perror("Failed to open a pipe output to a player");
      exit(1);
    }
    if (pipe(pipeIn) < 0) {
      perror("Failed to open a pipe input from a player");
      exit(1);
    }
    pid_t pid = fork();
    if (pid < 0) {
      perror("Failed to fork a player process");
      exit(1);
    } else if (pid == 0) {
      close(pipeOut[1]); dup2(pipeOut[0], 0);
      close(pipeIn[0]); dup2(pipeIn[1], 1);
      execl(playerNames[p%2], playerNames[p%2], (char *)NULL);
      perror("Failed to exec a player");
      exit(1);
    }
    playerIds[p] = pid;
    close(pipeOut[0]); toPlayers[p] = fdopen(pipeOut[1], "w");
    close(pipeIn[1]); fromPlayers[p] = fdopen(pipeIn[0], "r");
  }
  vector <StepLog> stepLogs;
  int scores[] = { 0, 0 };
  int plans[] = { -1, -1, -1, -1 };
  int actions[] = { -1, -1, -1, -1 };
  int timeLeft[4];
  fill(timeLeft, timeLeft+4, initialConf.thinkTime);
  for (int step = 0; step < config->steps; step++) {
    if (scores[0] + scores[1] == totalGolds) break;
    if (stepSummary) {
      cerr << "Step: " << step+1 << endl;
      if (config->known.size() != 0) {
	cerr << "Golds known:";
	for (auto g: config->known) {
	  cerr << " " << g.amount << "@(" << setw(coordWidth) << g.x << ","
	       << setw(coordWidth) << g.y << ")";
	}
	cerr << endl;
      }
    }
    for (int p = 0; p != 4; p++) {
      sendGameInfo(toPlayers[p], p, step, *config,
		   plans, actions, scores);
      if (dumpPath != nullptr) {
	sendGameInfo(dump[p], p, step, *config,
		     plans, actions, scores);
	fflush(dump[p]);
      }
      fflush(toPlayers[p]);
      steady_clock::time_point sentAt = steady_clock::now();
      fscanf(fromPlayers[p], "%d", &plans[p]);
      steady_clock::time_point receivedAt = steady_clock::now();
      milliseconds elapsed = duration_cast<milliseconds>(receivedAt - sentAt);
      timeLeft[p] -= elapsed.count();
    }
    Configuration *next =
      new Configuration(*config, plans, actions, scores);
    stepLogs.emplace_back(step, plans, actions, next->agents, timeLeft, scores);
    if (stepSummary) {
      for (int p = 0; p != 4; p++) {
	cerr << "Agent " << p
	     << "@(" << setw(coordWidth) << config->agents[p].x << ","
	     << setw(coordWidth) << config->agents[p].y << ") ";
	int targetX = config->agents[p].x + dx[plans[p]%8];
	int targetY = config->agents[p].y + dy[plans[p]%8];
	cerr << (plans[p] < 8 ? "move" : plans[p] < 16 ? "dig " : "plug")
	     << " (" << setw(coordWidth) << targetX
	     << "," << setw(coordWidth) << targetY << ")"
	     << (plans[p] != actions[p] ? "X" : "")
	     << endl;
      }
      cerr << "Scores are " << scores[0] << ":" << scores[1] << endl;
    }
    config = next;
  }
  for (int p = 0; p != 4; p++) {
    fclose(toPlayers[p]);
    fclose(fromPlayers[p]);
    if (dumpPath != nullptr) fclose(dump[p]);
  }
  return stepLogs;
}
