#include "players.hh"

const int FailureAvoidPercentage = 70;
const int WaitChanceThresh = -2;
const int StrollDepth = 5;

static int gatheredInfo(int depth, CellInfo &start, const GameInfo &info) {
  int gathered = 0;
  vector <CellInfo *> newInfo;
  for (CellInfo *n: start.eightNeighbors) {
    if (!n->inspected) {
      gathered += 1;
      n->inspected = true;
      newInfo.push_back(n);
    }
  }
  int best = 0;
  if (depth != 0) {
    depth -= 1;
    for (CellInfo *n: start.eightNeighbors) {
      best = max(best, gatheredInfo(depth, *n, info));
    }
  }
  for (CellInfo *n: newInfo) n->inspected = false;
  return gathered + best;
}

int planDog(GameInfo &info) {
  if (info.step == 0) initFieldMap(info);
  int id = info.id;
  int avoidPlan =
    info.plans[id] != info.actions[id] && // Plan failed
    rand()%100 > FailureAvoidPercentage ? // should be avoided
    info.plans[id] : -2;		  // with certain probability
  Cell pos = info.positions[id];
  CellInfo &myCell = cells[pos.x][pos.y];
  vector <CellInfo *> moveCandidates;
  for (CellInfo *n: myCell.eightNeighbors) {
    n->inspected = true;
    if (noAgentsIn(n->position, info) && noHolesIn(n->position, info)) {
      moveCandidates.push_back(n);
    }
  }
  Cell samuraiPos = info.positions[id - 2];
  CellInfo *samuraiCell = &cells[samuraiPos.x][samuraiPos.y];
  Cell oppPos = info.positions[1 - id%2];
  CellInfo *oppCell = &cells[oppPos.x][oppPos.y];
  if (info.revealedTreasure.find(pos) != info.revealedTreasure.end()) {
    // The dog is in the cell with known gold
    bool friendCanDig = false;
    bool oppCanDig = false;
    for (CellInfo *p: myCell.fourNeighbors) {
      if (p == samuraiCell) friendCanDig = true;
      else if (p == oppCell) oppCanDig = true;
    }
    // If opponent samurai can dig, but friend samurai can't,
    // then sit there still to prevent opponent's digging.
    if (oppCanDig && !friendCanDig) return -1;
  }
  Cell candidate;
  int largestDiff = numeric_limits<int>::min();
  int largestAmount = 0;
  for (auto s: info.sensedTreasure) {
    CellInfo *sensed = &cells[s.first.x][s.first.y];
    int distDiff = 
      samuraiDistance(oppCell, sensed, info.holes) -
      samuraiDistance(samuraiCell, sensed, info.holes);
    if (distDiff > largestDiff ||
	(distDiff == largestDiff && s.second > largestAmount)) {
      // Check the distances of friend and opponent samurai.
      // Also check if any other agents are in the gold cell.
      if (noAgentsIn(s.first, info)) {
	// If not, going to the cell can be a candidate plan
	largestDiff = distDiff;
	largestAmount = s.second;
	candidate = s.first;
      }
    }
  }
  if (largestDiff >= 0) {
    // If the friend samurai is closer to the treasure cell
    // go there (and bark).
    return directionOf(pos, candidate);
  } else if (largestDiff > WaitChanceThresh) {
    // Else if the distance difference is not large,
    // stand still waiting for a next chance.
    return -1;
  }
  // Start strolling to gather as much info as possible
  int maxInfo = 0;
  vector <int> bestPlans;
  for (CellInfo *c: moveCandidates) {
    int gathered = gatheredInfo(StrollDepth, *c, info);
    if (gathered >= maxInfo) {
      int plan = directionOf(pos, c->position);
      if (plan != avoidPlan) {
	if (gathered > maxInfo) {
	  bestPlans.clear();
	  maxInfo = gathered;
	}
	bestPlans.push_back(plan);
      }
    }
  }
  return bestPlans[rand()%bestPlans.size()];
}
