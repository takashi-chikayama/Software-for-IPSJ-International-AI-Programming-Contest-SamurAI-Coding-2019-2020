// Constructor
//   Constructors of Player class objects are given the following arguments.
//     size: Number of cells in one side of the field
//     maxSteps: The maximum number of steps in the game

// Game infomation
//   The following arguments are passed to the action planner function.
//     step: The current step number (starts from zero)
//     holes: List of cells with a hole
//     golds: List of cells known to embed some gold
//     detected: List of cells embedded gold,
//	 still hidden but detected by the agent (dog) and not dug out yet
//       This argument is always null for samurai
//     agents: List of cells of agents are in
//     plans: List of action plans the agents made in the previous step
//     actions: List of actions actually made in the previous step
//     scores: The list of the amount of gold so far obtained
//       The amount by the team belonging to comes first
//     remaining: The total amount of embedded gold still remaining
//
// Positions are given as an object { x: xpos, y: ypos },
// where xpos and ypos are x- and y- coorindates of the cell position.
//
// The items in the lists "agents", "plans", and "actions",
// are ordered [Firend Samurai, Opponent Samurai, Friend Dog, Opponent Dog]

// Agent actions
//   Actions planned and possibly taken are one of the following
//     -1: No action; stay in the same cell
//     0..7: Move to an adjacent cell
//     8..15: Dig a hole in an adjacent cell
//     16..23: Plug up the hole in an adjacen cell
//   Directions of the adjacent cells are between 0 and 7, inclusive,
//   which is given as the action number modulo 8.

// Player: Plans an action for each step
//   plan(gameState): Function to plan an action
//   seq: Role of the player

// Distance for a samurai
function distance(from, to, holes) {
  let next0 = [from];
  let next1 = [];
  let next2 = [];
  const reached = [from];
  try {
    for (let dist = holes.includes(from) ? 1 : 0;
	 ;
	 dist++) {
      for (let i = 0; i != next0.length; i++) {
	const p = next0[i];
	if (p == to) return dist;
	for (let dir = 0; dir != 8; dir += 2) {
	  var adj = p.neighbors[dir];
	  if (adj == to) throw dist;
	  if (adj != null && !reached.includes(adj)) {
	    reached.push(adj);
	    if (holes.includes(adj)) {
	      next2.push(adj);
	    } else {
	      next1.push(adj);
	    }
	  }
	}
      }
      next0 = next1;
      next1 = next2;
      next2 = [];
    }
  } catch(d) {
    return d;
  }
}

function directionOf(from, to) {
  return [3, 2, 1, 4, -1, 0, 5, 6, 7][3*(to.x-from.x+1)+to.y-from.y+1];
}

class GreedySamurai {
  constructor(size, maxSteps) {
    this.size = size;
    this.maxSteps = maxSteps;
    this.prevPos = null;
  }
  plan(step, holes, golds, detected,
       agents, plans, actions, scores, remaining) {
    const pos = agents[0];
    // If an adjacent cell is with known to have gold, dig it
    let maxGold = null;
    let bestDir = -1;
    for (let dir = 0; dir != 8; dir += 2) {
      const adj = pos.neighbors[dir];
      if (adj != null && !agents.includes(adj) && golds.includes(adj) &&
	  (maxGold == null || maxGold.gold < adj.gold)) {
	maxGold = adj;
	bestDir = dir;
      }
    }
    if (maxGold != null) {
      this.prevPos = pos;
      return bestDir + 8;
    }
    // Otherwise, rush to the nearest known gold
    let bestMove = -1;
    let closest = Infinity;
    let bestAmount = 0;
    for (let dir = 0; dir != 8; dir += 2) {
      const adj = pos.neighbors[dir];
      if (adj != null && !agents.includes(adj)) {
	if (plans[0] == actions[0] || dir != plans[0]) {
	  golds.forEach(c => {
	    const dist = distance(adj, c, holes);
	    if (dist < closest ||
		(dist == closest && c.gold > bestAmount)) {
	      bestMove = dir;
	      closest = dist;
	      bestAmount = c.gold;
	      if (holes.includes(adj)) {
		bestMove += 16;	// plug hole
	      }
	    }
	  });
	}
      }
    }
    if (bestMove >= 0) {
      this.prevPos = pos;
      return bestMove;
    }
    // No known gold
    // Try to approach the dog, hoping it to find some gold
    const dogPos = agents[2];
    let dogDist = Infinity;
    let bestDest = null;
    for (let dir = 0; dir != 8; dir += 2) {
      const adj = pos.neighbors[dir];
      // Avoid going back to the previous position
      if (adj != null && adj != this.prevPos &&
	  !agents.includes(adj)) {
	const adjDist = distance(adj, dogPos, holes);
	if (2 < adjDist && adjDist < dogDist) {
	  bestDest = adj;
	  dogDist = adjDist;
	  bestDir = dir;
	}
      }
    }
    if (bestDest != null) {
      // If some good move is found
      bestMove = bestDir;
      if (holes.includes(bestDest)) bestMove += 16;
      if (plans[0] == actions[0] || plans[0] != bestMove) {
	// If the move is not the same as one failed in the previous step,
	// try to do it
	this.prevPos = pos;
	return bestMove;
      }
    }
    // If no good move is found, don't move
    this.prevPos = pos;
    return -1;
  }
}

class SnoopyDog {
  constructor(size, maxSteps) {
    this.size = size;
    this.maxSteps = maxSteps;
    this.inspected = [];
  }
  plan(step, holes, golds, detected,
       agents, plans, actions, scores, remaining) {
    const pos = agents[2];
    pos.neighbors.forEach(adj => {
      if (adj != null && !this.inspected.includes(adj)) {
	this.inspected.push(adj);
      }
    });
    let barkPos = null;
    let bestMove = null;
    const samuraiPos = agents[0];
    const oppPos = agents[1];
    if (golds.some(g => g.x == pos.x && g.y == pos.y)) {
      // If the dog is in the cell with known gold
      if (pos.neighbors.includes(oppPos) &&
	  !pos.neighbors.includes(samuraiPos)) {
	// If the opponent samurai can dig it, and friend samurai cannnot,
	// stay in the cell to prevent opponent's digging
	return -1;
      }
    }
    detected.forEach(d => {
      // When an adjacent cell has some hidden gold
      if (!agents.includes(d) &&
	  distance(samuraiPos, d, holes) < distance(oppPos, d, holes)) {
	// If the cell is not occupied
	// and the friend samurai is closer than the opponent,
	// then move to that cell and bark
	bestMove = directionOf(pos, d);
      } else {
	// If the opponent samurai is closer or with the same distance,
	// stay there and wait for another chance
	bestMove = -1;
      }
    });
    if (bestMove != null) return bestMove;
    // Otherwise, walk about to gather more info
    function infoGain(steps, start, already, visited, inspected) {
      if (steps == 0) return 0;
      steps -= 1;
      const seen = already.concat();
      let newGain = 0;
      start.neighbors.forEach(adj => {
	if (adj != null &&
	    !inspected.includes(adj) && !already.includes(adj)) {
	  seen.push(adj);
	  newGain += 1;
	}
      });
      let maxGain = 0;
      start.neighbors.forEach(adj => {
	if (adj != null && !visited.includes(adj)) {
	  visited.push(adj);
	  const gain = infoGain(steps, adj, seen, visited, inspected);
	  if (gain > maxGain) {
	    maxGain = gain;
	  }
	  visited.splice(-1, 1);
	}
      });
      return maxGain + newGain;
    }
    let maxGain = -1;
    pos.neighbors.forEach(adj => {
      if (adj != null &&
	  !agents.includes(adj) && !holes.includes(adj) &&
	  Math.abs(directionOf(pos, adj) - actions[2]) != 4) {
	const gain = infoGain(6, adj, [], [adj], this.inspected);
	if (gain > maxGain) {
	  bestMove = directionOf(pos, adj);
	  maxGain = gain;
	}
      }
    });
    if (bestMove != null &&
	(plans[2] == actions[2] || plans[2] != bestMove)) {
      return bestMove;
    }
    // No good move
    const moveCand =
	  pos.neighbors.filter(
	    adj => adj != null && !agents.includes(adj) && !holes.includes(adj))
	  .map(cand => directionOf(pos, cand));
    // Don't go back
    moveCand.filter(cand => Math.abs(cand - actions[2]) != 4);
    // If no adjacent cells are availabe, just stand still
    if (moveCand == []) return -1;
    return moveCand[Math.floor(moveCand.length*random.gen())];
  }
}
