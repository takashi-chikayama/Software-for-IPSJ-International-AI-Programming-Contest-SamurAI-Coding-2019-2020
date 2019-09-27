#include "gameInfo.hh"
#include <vector>
#include <stack>
#include <limits>

struct CellInfo {
  Cell position;
  vector <CellInfo*> fourNeighbors;
  vector <CellInfo*> eightNeighbors;
  bool inspected = false;
  bool noGold = false;
  inline bool operator<(const CellInfo another) const {
    return position < another.position;
  }
};

extern CellInfo **cells;

extern void initFieldMap(GameInfo &info);

extern int samuraiDistance(CellInfo *from, CellInfo *to, set <Cell> &holes);

inline int directionOf(Cell &from, Cell &to) {
  static int directions[] = {3, 2, 1, 4, -1, 0, 5, 6, 7};
  return directions[3*(to.x-from.x+1)+to.y-from.y+1];
}

inline bool noAgentsIn(const Cell &c, const GameInfo &info) {
  for (int p = 0; p != 4; p++) {
    if (info.positions[p] == c) return false;
  }
  return true;
}

inline bool noHolesIn(const Cell &c, const GameInfo &info) {
  return info.holes.count(c) == 0;
}
