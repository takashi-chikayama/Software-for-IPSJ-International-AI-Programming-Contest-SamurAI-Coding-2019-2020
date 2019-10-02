#include "field.hh"

struct StepLog {
  int step;
  int plans[4];
  int actions[4];
  Agent agents[4];
  int scores[2];
  int timeLeft[4];
  StepLog(object &json);
  StepLog(int step, int p[], int a[], const Agent agts[], int t[], int s[]);
  object json();
};

struct Configuration: Field {
  int steps;
  Configuration(object &json);
  Configuration
  (const Configuration &prev, const int plans[], int actions[], int scores[]);
  Configuration(const Configuration &cnf);
  object json();
};

struct GameLog: Configuration {
  GameLog(object &json);
  GameLog(Configuration &cfg, vector <StepLog> &stepLogs);
  GameLog(GameLog &gl);
  vector <StepLog> plays;
  object json();
};
