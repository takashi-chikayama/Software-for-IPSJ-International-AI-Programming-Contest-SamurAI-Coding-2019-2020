#include "fieldMap.hh"
#include <unordered_set>

CellInfo **cells;

void initFieldMap(GameInfo &info) {
  cells = new CellInfo*[info.size];
  for (int x = 0; x != info.size; x++) {
    cells[x] = new CellInfo[info.size];
  }
  static const int dx[] = { 0,-1,-1,-1, 0, 1, 1, 1 };
  static const int dy[] = { 1, 1, 0,-1,-1,-1, 0, 1 };
  for (int x = 0; x != info.size; x++) {
    for (int y = 0; y != info.size; y++) {
      CellInfo &c = cells[x][y];
      c.position = Cell(x, y);
      for (int k = 0; k != 8; k++) {
	int nx = x + dx[k];
	int ny = y + dy[k];
	if (0 <= nx && nx < info.size &&
	    0 <= ny && ny < info.size) {
	  c.eightNeighbors.push_back(&cells[nx][ny]);
	  if (k%2 == 0) c.fourNeighbors.push_back(&cells[nx][ny]);
	}
      }
    }
  }
}

int samuraiDistance
(CellInfo *from, CellInfo *to, set <Cell> &holes) {
  stack <CellInfo*> next0;
  stack <CellInfo*> next1;
  stack <CellInfo*> next2;
  next0.push(from);
  stack <CellInfo*> *np0 = &next0;
  stack <CellInfo*> *np1 = &next1;
  stack <CellInfo*> *np2 = &next2;
  unordered_set <CellInfo*> visited;
  for (int dist = 0; ; dist++) {
    while (!np0->empty()) {
      CellInfo *c = np0->top(); np0->pop();
      if (visited.count(c) == 0) {
	visited.insert(c);
	for (auto n: c->fourNeighbors) {
	  if (n == to) return dist;
	  if (holes.count(n->position) == 0) {
	    np1->push(n);
	  } else {
	    np2->push(n);
	  }
	}
      }
    }
    np0 = np1; np1 = np2; np2 = np0;
  }
}
