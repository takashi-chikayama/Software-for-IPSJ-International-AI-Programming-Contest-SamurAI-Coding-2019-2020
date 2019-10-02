#include "players.hh"

const int MovePercentage = 80;

int planDog(GameInfo &info) {
  if (info.step == 0) initFieldMap(info);
  Cell pos = info.positions[info.id];
  CellInfo &myCell = cells[pos.x][pos.y];
  int plan = -1;
  int trials = 10;
  while (--trials > 0) {
    auto n = myCell.eightNeighbors[rand()%myCell.eightNeighbors.size()];
    int dir = directionOf(myCell.position, n->position);
    bool noHole = noHolesIn(n->position, info);
    if (noAgentsIn(n->position, info)) {
      if (rand()%100 < MovePercentage && noHole) {
	plan = dir;
	break;
      }
    }
  }
  return plan;
}
