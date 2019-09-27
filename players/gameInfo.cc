#include "gameInfo.hh"

Cell::Cell(int x, int y): x(x), y(y) {}

Cell::Cell(istream &in) {
  in >> x >> y;
}

bool Cell::operator<(const Cell &another) const {
  return x < another.x || (x == another.x && y < another.y);
}

bool Cell::operator==(const Cell &another) const {
  return x == another.x && y == another.y;
}

ostream &operator<<(ostream &out, const Cell &cell) {
  out << "(" << cell.x << "," << cell.y << ")";
  return out;
}

GameInfo::GameInfo(istream &in) {
  in >> id >> size >> step >> maxSteps;
  int nHoles; in >> nHoles;
  while (nHoles-- > 0) holes.emplace(in);
  int nRevealed; in >> nRevealed;
  while (nRevealed-- > 0) {
    Cell at(in);
    int amount; in >> amount;
    revealedTreasure.emplace(at, amount);
  }
  int nSensed; in >> nSensed;
  while (nSensed-- > 0) {
    Cell at(in);
    int amount; in >> amount;
    sensedTreasure.emplace(at, amount);
  }
  for (auto &pos: positions) pos = Cell(in);
  for (auto &plan: plans) in >> plan;
  for (auto &action: actions) in >> action;
  in >> scores[0] >> scores[1];
  in >> remaining;
  in >> thinkTime;
}

ostream &operator<<(ostream &out, const GameInfo &info) {
  out << "Id: " << info.id << " "
      << "Size: " << info.size << " "
      << "Step: " << info.step << " "
      << "Max Steps: " << info.maxSteps << endl;
  out << "Holes:";
  for (auto h: info.holes) out << " " << h;
  out << endl;
  out << "Revealed:";
  for (auto g: info.revealedTreasure) out << " " << g.second << "@" << g.first;
  out << endl;
  out << "Sensed:";
  for (auto s: info.sensedTreasure) out << " " << s.second << "@" << s.first;
  out << endl;
  out << "Positions:";
  for (auto p: info.positions) out << " " << p;
  out << endl;
  out << "Plans:";
  for (auto p: info.plans) out << " " << p;
  out << endl;
  out << "Actions:";
  for (auto a: info.actions) out << " " << a;
  out << endl;
  out << "Scores: " << info.scores[0] << " " << info.scores[1] << endl;
  out << "Remaining: " << info.remaining << endl;
  out << "Think Time: " << info.thinkTime << endl;
  return out;
}
