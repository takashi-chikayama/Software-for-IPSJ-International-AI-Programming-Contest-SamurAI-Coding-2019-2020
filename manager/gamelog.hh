#include "field.hh"

struct StepLog {
  int plans[4];
  int actions[4];
  int scores[2];
  StepLog(object &json);
  StepLog(int p[], int a[], int s[]);
  object json();
};

struct Configuration: Field {
  int timeLimit;
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
