#include "players.hh"

const int MovePercentage = 80;

int planSamurai(GameInfo &info) {
  if (info.step == 0) initFieldMap(info);
  if (info.step == 5) exit(1);
  Cell pos = info.positions[info.id];
  CellInfo myCell = cells[pos.x][pos.y];
  int plan = -1;
  int trials = 10;
  while (--trials > 0) {
    auto n = myCell.fourNeighbors[rand()%myCell.fourNeighbors.size()];
    int dir = directionOf(myCell.position, n->position);
    bool noHole = noHolesIn(n->position, info);
    if (noAgentsIn(n->position, info)) {
      if (rand()%100 < MovePercentage && noHole) {
	plan = dir;
	break;
      } else if (noHole) {
	plan = dir+8;
	break;
      } else {
	plan = dir+16;
	break;
      }
    }
  }
  return plan;
}
