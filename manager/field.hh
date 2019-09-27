#include "picojson.h"

using namespace std;
using namespace picojson;

const string DigHereLogString = "SamurAI Dig Here Game Log";

struct Cell {
  int x, y;
  Cell(): x(-1), y(-1) {};
  Cell(int x, int y);
  Cell(object &o);
  Cell(const Cell &original);
  Cell &operator=(const Cell &another);
  bool operator==(const Cell &another);
  object json();
};

struct Agent: Cell {
  int direction;
  Agent(int x, int y, int d);
  Agent(object &o);
  Agent(const Agent &another);
  object json();
};

struct Gold: Cell {
  int amount;
  Gold(int x, int y, int a);
  Gold(object &o);
  Gold(const Gold &original);
  object json();
};

struct Field {
  int size;
  vector <Agent> agents;
  vector <Cell> holes;
  vector <Gold> known;
  vector <Gold> hidden;
  Field(object &json);
  Field(const Field &prev, const int plans[], int actions[], int scores[]);
  Field(const Field &f);
  object json();
};

ostream &operator<<(ostream &out, const Field &f);
