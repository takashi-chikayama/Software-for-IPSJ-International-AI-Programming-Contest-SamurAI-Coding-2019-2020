#include "players.hh"
#include <algorithm>

int planSamurai(GameInfo &info) {
  int id = info.id;
  Cell pos = info.positions[id];
  if (pos.x+1 < info.size) {
    return 16+6;
  } else {
    return 16;
  }
}
