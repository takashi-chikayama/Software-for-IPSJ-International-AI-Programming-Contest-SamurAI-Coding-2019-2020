let field;
let background;
let backgroundDirt;
let groundLayer;
let agentLayer;
let diamondLayer;
let fieldSize;
let fieldWidth, fieldHeight, topMargin;
let cellWidth, cellHeight, halfWidth, halfHeight;
let cells;

let holeProb = 0.07;
let goldProb = 0.06;
let goldKnownProb = 0.1;
let maxGold2 = 10;

let maxSteps;
let playUntil;
let playTempo = 60;
let stepInterval = playTempo*1000/60;
let frameRate = 20;
let numSubsteps = frameRate*stepInterval/1000;
let midStep = Math.floor((numSubsteps+1)/2);
let currentStep;
let substep = 0;

let showingHidden = false;

let goldShown = [];

let backgroundColor = "rgb(120,80,40)";
let editingBackgroundColor = "rgb(120,120,120)";
let lawnColor = "rgb(40,160,40)";
let scoreColor = "rgb(255,255,0)";
let clockColor = "rgb(0,255,255)";
let scores = [];

const barkSoundFile = '../sounds/bark.mp3';
const tickSoundFile = '../sounds/tick-mono.mp3';
const goldSoundFile = '../sounds/gold.mp3';
const scoopSoundFile = '../sounds/scoop-mono.mp3';
const plugSoundFile = '../sounds/plug-mono.mp3';
const beepSoundFile = '../sounds/beep.mp3';
const gongSoundFile = '../sounds/gong.mp3';
let bgm = new Audio('../sounds/hanasaka.mp3');
bgm.loop = true;

function createSVG(tag) {
  return document.createElementNS(field.namespaceURI, tag);
}

// AgentAttributes: Describes the permanent attribute of an agent
//   seq: Agent's sequence number
//     0, 1: samurai, 2, 3: dog,
//     0, 2: red team, 1, 3: blue team
//   image: SVG image element for the agent
//     Changing agent's appearnce is by channging its 'href' attribute
//   player: Player object that plans an action for each step

class AgentAttributes {
  constructor(seq, player) {
    this.seq = seq;
    this.player = player;
    this.image = createSVG('image');
  }
}

// Distance for a samurai
function distance(from, to, holes) {
  let next0 = [from];
  let next1 = [];
  let next2 = [];
  const reached = [from];
  for (let dist = holes.includes(from) ? 1 : 0;
       ;
       dist++) {
    for (let i = 0; i != next0.length; i++) {
      const p = next0[i];
      if (p == to) return dist;
      for (let dir = 0; dir != 8; dir++) {
	const adj = p.neighbors[dir];
	if (adj == to) return dist;
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
}

// Agent actions
//   Actions planned and possibly taken are one of the following
//     -1: No action; stay in the same cell
//     0..7: Move to an adjacent cell
//     8..15: Dig a hole in an adjacent cell
//     16..23: Plug up the hole in an adjacen cell
//   Direction of the adjacent cell is action modulo 8.

// player: Plans an action for each step
//   plan(gameState): Function to plan an action
//   seq: Role of the player

class Player {
  constructor(role) {
    this.role = role;
  };
  plan(gameInfo) {
    return -1;
  }
}

class GreedySamurai extends Player {
  plan(gameInfo) {
    const agent = gameInfo.agents[this.role];
    const holes = gameInfo.holes;
    function makeDistMap(pos, initDir, dist, map) {
      for (let dir = 0; dir != 8; dir += 2) {
	const adj = pos.neighbors[dir];
	if (adj != null &&
	    map[adj.x][adj.y].dist > dist) {
	  map[adj.x][adj.y] = { dir: initDir, dist: dist }
	  makeDistMap(adj, initDir,
		      dist + (holes.includes(adj) ? 2 : 1),
		      map);
	}
      }
    }
    function planSamuraiMove(pos, dogPos) {
      const distMap = [];
      for (let x = 0; x != fieldSize; x++) {
	distMap[x] = [];
	for (let y = 0; y != fieldSize; y++) {
	  distMap[x][y] = { dir: -1, dist: Infinity };
	}
      }
      distMap[pos.x][pos.y] = { dir: -1, dist: 0 };
      for (let dir = 0; dir != 8; dir += 2) {
	const adj = pos.neighbors[dir];
	if (adj != null && gameInfo.agents.every(a => a.at != adj)) {
	  makeDistMap(adj, dir,
		      (holes.includes(adj) ? 2 : 1), distMap);
	}
      }
      let bestMove = -1;
      let closest = Infinity;
      gameInfo.knownGolds.forEach(
	g => {
	  const entry = distMap[g.at.x][g.at.y];
	  if (entry.dist < closest) {
	    bestMove = entry.dir;
	    if (holes.includes(pos.neighbors[bestMove])) {
	      bestMove += 16;
	    }
	    closest = entry.dist;
	  }
	});
      if (bestMove < 0) {
	// No known gold
	// Try to approach the dog so for it may find some gold
	let dogDist = Infinity;
	for (let dir = 0; dir != 8; dir += 2) {
	  const adj = pos.neighbors[dir];
	  if (adj != null && !gameInfo.agents.some(a => a.at == adj)) {
	    const adjDist = distance(adj, dogPos, holes);
	    if (2 < adjDist && adjDist < dogDist) {
	      bestMove = dir;
	      dogDist = adjDist;
	      if (holes.includes(adj)) bestMove += 16;
	    }
	  }
	}
      }
      if (agent.planned == agent.action || agent.planned != bestMove) {
	return bestMove;
      } else {
	return -1;
      }
    }
    const pos = agent.at;
    // Samurai will try to dig an adjacent known gold cell
    for (let dir = 0; dir != 8; dir += 2) {
      const adj = pos.neighbors[dir];
      if (adj != null &&
	  gameInfo.knownGolds.some(g => g.at == adj)) {
	return dir + 8;
      }
    }
    // Try to reach the nearest known gold
    let bestMove = planSamuraiMove(pos, gameInfo.agents[this.role+2].at);
    if (bestMove == -1) {
      // No gold known,
      // can't approach known golds (surrounded by other agents?), or
      // the planned move is the same as that of the previous step that failed,
      // choose a random move
      let moveCand = [];
      for (let dir = 0; dir != 8; dir += 2) {
	const adj = pos.neighbors[dir];
	if (adj != null && !gameInfo.agents.some(a => a.at == adj)) {
	  moveCand.push(dir);
	}
      }
      if (moveCand != []) {
	bestMove = moveCand[Math.floor(moveCand.length*random.gen())];
      }
    }
    return bestMove;
  }
}

class SnoopyDog extends Player {
  constructor(role) {
    super(role);
    this.known = [];
    for (let x = 0; x != fieldSize; x++) {
      this.known[x] = [];
      for (let y = 0; y != fieldSize; y++) {
	this.known[x][y] = false;
      }
    }
  }
  plan(gameInfo) {
    //// Plan for a dog ////
    const agent = gameInfo.agents[this.role];
    const pos = agent.at;
    pos.neighbors.forEach(
      adj => {
	if (adj != null) this.known[adj.x][adj.y] = true;
      });
    const holes = gameInfo.holes;
    let barkCand = [];
    let moveCand = [];
    for (let dir = 0; dir != 8; dir++) {
      const adj = pos.neighbors[dir];
      if (adj != null &&
	  !holes.includes(adj) &&
	  !gameInfo.agents.some(a => a.at == adj)) {
	if (gameInfo.hiddenGolds.some(g => g.at == adj)) {
	  barkCand.push(dir);
	} else {
	  moveCand.push(dir);
	}
      }
    }
    // When an adjacent cell has some hidden gold
    // and the friend samurai is closer to that cell
    // than the the enemy samurai,
    // move to that cell and bark.
    for (let b = 0; b != barkCand.length; b++) {
      const dir = barkCand[b];
      const gpos = pos.neighbors[dir];
      if (distance(gpos, gameInfo.agents[this.role-2].at, holes) <
	  distance(gpos, gameInfo.agents[(this.role+1)%2].at, holes)) {
	return dir;
      }
    }
    // Otherwise, try to gather as much information as possible
    if (moveCand.length != 0) {
      let bestMove = -1;
      let bestInfo = 0;
      let infoObtained = 0;
      moveCand.forEach(
	m => {
	  let info = 0;
	  pos.neighbors[m].neighbors.forEach(
	    n => { if (n != null && !this.known[n.x][n.y]) info++; });
	  if (info > bestInfo) bestMove = m;
	});
      if (bestMove >= 0 &&
	  (agent.planned == agent.action || agent.planned != bestMove)) {
	return bestMove;
      }
      return moveCand[Math.floor(moveCand.length*random.gen())];
    } else {
      return -1;
    }
  }
}

// agentState: Describes the current state of an agent
//   attributes: agentAttributes class objects, describing unchanging state
//   at: Cell on which the agent is (see below for cell records)
//   direction: Directions (0..7) of the agent
//   planned: Action the agent planned (may not be successful made)
//   action: Action actually taken
//   obtained: Amount of gold obtained

class AgentState {
  constructor(attributes, at, direction) {
    this.attributes = attributes;
    this.at = at;
    this.direction = direction;
    this.planned = -1;
    this.action = -1;
    this.obtained = 0;
  }
}

// Cell
//   Attributes of a cell that won't change as game proceeds
//   x, y: Cell coordinates
//   isCorner: Initial position of one of the agents
//   holeImage: SVG image element for a hole in the cell
//   diamond: SVG polygon element covering the cell area
//   cx, cy; Coordinates in the SVG
//   neighbors: Array of neighboring cells (8 elements)
//     null if the neighbor would be out of the field.

class Cell {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.neighbors = [];
    this.holeImage = createSVG('image');
    this.diamond = createSVG('polygon');
    this.isCorner =
      (x == 0 || x == fieldSize-1) && (y == 0 || y == fieldSize-1)
  }
  resize() {
    this.cx = (fieldSize+this.x-this.y)*cellWidth/2;
    this.cy = (this.x+this.y+1)*halfHeight + topMargin;
    const hole = this.holeImage;
    hole.setAttribute('x', this.cx-0.3*cellWidth);
    hole.setAttribute('y', this.cy-0.5*cellHeight);
    hole.setAttribute('width', 0.6*cellWidth);
    hole.setAttribute('height', 0.5*cellWidth);
    hole.setAttribute('href', holeImage);
    const diamond = this.diamond;
    diamond.setAttribute(
      'points',
      (this.cx-cellWidth/2+1) + "," + (this.cy) + " " +
	(this.cx) + "," + (this.cy-cellHeight/2+1) + " " +
	(this.cx+cellWidth/2-1) + "," + (this.cy) + " " +
	(this.cx) + "," + (this.cy+cellHeight/2-1));
    diamond.style.fill = "rgba(1,1,1,0)";
    diamond.style.strokeWidth = "2px";
    diamond.style.stroke = "none";
    diamondLayer.appendChild(diamond);
  }
  setNeighbors() {
    const directions = [
      [0, 1], [-1, 1], [-1, 0], [-1, -1],
      [0, -1], [1, -1], [1, 0], [1, 1] ];
    for (let d = 0; d != 8; d++) {
      let nx = this.x + directions[d][0];
      let ny = this.y + directions[d][1];
      this.neighbors[d] =
	0 <= nx && nx < fieldSize && 0 <= ny && ny < fieldSize ?
	cells[nx][ny] : null;
    }
  }
}

const twoDigits = [
  "00", "01", "02", "03", "04", "05", "06", "07", "08", "09",
  "10", "11", "12", "13", "14", "15", "16", "17", "18", "19"
];

// Image files
const samuraiStanding = [];
const samuraiDigging = [];
const samuraiDug = [];
const dogSitting = [];
const dogBarking = [];
const holeImage = "../icons/hole.png";
const goldImage = "../icons/gold";

for (let k = 0; k != 8; k++) {
  samuraiStanding[2*k] =
    "../icons/samurai-standing-" + k + ".png";
  samuraiDigging[2*k] =
    "../icons/samurai-digging-" + k + ".png";
  samuraiDug[2*k] = "../icons/samurai-dug-" + k + ".png";
}
for (let k = 0; k != 16; k++) {
  dogSitting[k] = "../icons/dog-poses" + twoDigits[k] + ".png";
  dogBarking[k] = "../icons/dog-barking" + twoDigits[k] + ".png";
}

const arrowImages = [
  "../icons/south.png",
  "../icons/west.png",
  "../icons/north.png",
  "../icons/east.png"
];

const arrowDigImages = [
  "../icons/south-dig.png",
  "../icons/west-dig.png",
  "../icons/north-dig.png",
  "../icons/east-dig.png"
];

let manualAgent = -1;
let targetsShown = [];

function toggleManualPlay(ev, reset) {
  stopAutoPlay();
  manualAgent = reset ? -1 : (manualAgent+2)%3 - 1;
  setManualPlay(manualAgent);
}

function setManualPlay(manualAgent) {
  const manualIcons = ["manual", "red-hand", "blue-hand"];
  manualButton.src = "../icons/" + manualIcons[manualAgent+1] + ".png";
  stepRecords[currentStep].redraw(true);
}

function drawGoldImage(cell, group) {
  group.setAttribute(
    "transform",
    "translate(" + cell.cx + "," + cell.cy + ")" +
      "scale(" + (0.9*cellWidth) + ")");
  groundLayer.appendChild(group);
}

function makeGoldImage(cell, amount) {
  const gold = createSVG('image');
  gold.setAttribute('x', -0.3);
  gold.setAttribute('y', -0.35);
  gold.setAttribute('width', 0.6);
  gold.setAttribute('height', 0.6);
  const figIndex = Math.min(10, Math.max(10*Math.abs(amount)/maxGold2/2, 5));
  gold.setAttribute('href', goldImage + twoDigits[figIndex] + ".png");
  const amnt = createSVG('text');
  amnt.setAttribute('x', 0);
  amnt.setAttribute('y', 0);
  amnt.setAttribute('font-size', 0.3);
  amnt.setAttribute('font-family', 'roman');
  amnt.setAttribute('font-weight', 'bold');
  amnt.setAttribute('style', 'text-shadow:1px 1px black');
  amnt.setAttribute('text-anchor', 'middle');
  amnt.setAttribute('fill', scoreColor);
  amnt.innerHTML = Math.abs(amount);
  amnt.style.pointerEvents = "none";
  const group = createSVG('g');
  group.appendChild(gold);
  group.appendChild(amnt);
  return group;
}

function repositionAgent(a, init) {
  const image = a.attributes.image;
  const isDog = a.attributes.seq >= 2;
  const pos = substepPosition(a, init);
  image.setAttribute(
    'x', (fieldSize+pos.x-pos.y)*cellWidth/2
      - (isDog ? 0.4 : 0.8) *cellWidth);
  image.setAttribute(
    'y', (pos.x+pos.y+1)*halfHeight + topMargin
      - (isDog ? 1.7 : 2.3)*cellHeight);
}

function randomConfig() {
  const config = {
    size: 10, steps: 100, agents: [], holes: [], golds: []
  };
  for (let na = 0; na != 4; ) {
    const x = Math.floor(config.size*random.gen());
    const y = Math.floor(config.size*random.gen());
    if (config.agents.every(a => a.x != x || a.y != y)) {
      config.agents.push({x: x, y: y});
      na++;
    }
  }
  const numHoles = Math.floor((config.size*config.size-4)*holeProb);
  for (let nh = 0; nh != numHoles; ) {
    const x = Math.floor(config.size*random.gen());
    const y = Math.floor(config.size*random.gen());
    if (config.agents.every(a => a.x != x || a.y != y) &&
	config.holes.every(h => h.x != x || h.y != y)) {
      config.holes.push({x: x, y: y});
      nh++;
    }
  }
  const numGolds = Math.floor((config.size*config.size-4)*goldProb);
  for (let ng = 0; ng != numGolds; ) {
    const x = Math.floor(config.size*random.gen());
    const y = Math.floor(config.size*random.gen());
    if (config.agents.every(a => a.x != x || a.y != y) &&
	config.holes.every(h => h.x != x || h.y != y) &&
	config.golds.every(h => h.x != x || h.y != y)) {
      const amount = 2*Math.floor(maxGold2*random.gen()+1);
      config.golds.push({x: x, y: y, amount: amount});
      ng++;
    }
  }
  return config;
}

function drawOrRemoveGolds(golds) {
  golds.forEach(g => {
    if (!goldShown.includes(g)) {
      drawGoldImage(g.at, g.image);
      goldShown.push(g);
    }
  });
  const goldToRemove = [];
  goldShown.forEach(g => {
    if (!golds.includes(g)) {
      groundLayer.removeChild(g.image);
      goldToRemove.push(g);
    }
  });
  goldToRemove.forEach(g => goldShown.splice(goldShown.indexOf(g), 1));
}

// Game State Record for Each Game Step
//   stepNumber: Step sequence number (start from 0)
//   agents: Array of agent states (see below for agent records)
//   golds: Array of the amounts of gold already dug out (2 elems)
//   goldRemaining: Amount of gold not dug out yet
//   knownGolds: Array of info on *known* embedded golds
//      { at: cell, amount: gold amount, image: SVG image }
//   hiddenGolds: Array of cells with *hidden* embedded golds
//      { at: cell, amount: gold amount }
//   dogsBark: Whether dogs bark or not (2-elem array of bool)
//   holes: Array of cells with a hole
//   dug: Array of cells dug out in this step
//   plugged: Array of cells plugged in this step

class GameState {
  constructor(prevGameState, commandPlay, config) {
    if (prevGameState == null) {
      // The first step of a game; Initialize everything
      this.stepNumber = 0;
      this.dug = [];
      this.plugged = [];
      this.goldRemaining = 0;
      // Set holes
      this.holes = [];
      config.holes.forEach(h => this.holes.push(cells[h.x][h.y]));
      // Prepare golds
      this.knownGolds = [];
      this.hiddenGolds = [];
      config.golds.forEach(g => {
	const cell = cells[g.x][g.y];
	this.hiddenGolds.push({
	  at: cell, amount: g.amount,
	  image: makeGoldImage(cell, g.amount)
	});
	this.goldRemaining += g.amount;
      });
      this.golds = [0, 0];
      this.dogsBark = [false, false];
      // Initialize agents
      const agentPlayers = [
	new GreedySamurai(0), new GreedySamurai(1),
	new SnoopyDog(2), new SnoopyDog(3)
      ];
      this.agents = [];
      for (let a = 0; a != 4; a++) {
	const pos = config.agents[a];
	this.agents.push(
	  new AgentState(
	    new AgentAttributes(a, agentPlayers[a]),
	    cells[pos.x][pos.y],
	    2*Math.floor(4*random.gen())));
      }
      remainingLabel.innerHTML = this.goldRemaining;
    } else {
      this.stepNumber = prevGameState.stepNumber + 1;
      function invalidAction(role, plan, targetPos, prev) {
	return (
	  plan < -1 || plan >= 24 || // Invalid plan value
	  targetPos === null || // or trying to go beyond an edge
	  (role < 2 && plan%2 != 0) || // or diagonal move/dig/plug by samurai
	  (role >= 2 && plan >= 8) ||  // or dig by a dog
	  prev.agents.some(b => (b.at == targetPos)) // or someone is there
	);
      }
      // Copy cells, gold and hole info from the previous state
      this.goldRemaining = prevGameState.goldRemaining;
      this.holes = Array.from(prevGameState.holes);
      this.dug = [];
      this.plugged = [];
      this.hiddenGolds = Array.from(prevGameState.hiddenGolds);
      this.knownGolds = Array.from(prevGameState.knownGolds);
      this.golds = Array.from(prevGameState.golds);
      this.dogsBark = [false, false];
      // Plan actions
      const plannedPositions = [];
      const plannedDig = [null, null];
      const plannedPlug = [null, null];
      // Decide plans of agents
      this.agents = [];
      for (let a = 0; a != 4; a++) {
	const agent = prevGameState.agents[a];
	const newAgent =	// Default is to stay still
	  new AgentState(agent.attributes, agent.at, agent.direction);
	this.agents[a] = newAgent;
	const plan =
	      (a == manualAgent && commandPlay !== undefined) ?
	      commandPlay :
	      agent.attributes.player.plan(prevGameState);
	const targetPos = agent.at.neighbors[plan%8];
	plannedPositions[a] = agent.at;
	newAgent.planned = plan;
	newAgent.action = -1;
	if (plan >= 0) {
	  newAgent.direction = plan % 8;
	  if (!invalidAction(a, plan, targetPos, prevGameState)) {
	    if (plan < 8 && !prevGameState.holes.includes(targetPos)) {
	      plannedPositions[a] = targetPos;
	      newAgent.action = plan;
	    } else if (plan < 16) {
	      if (!this.holes.includes(targetPos)) {
		plannedDig[a] = targetPos;
		newAgent.action = plan;
	      }
	    } else if (this.holes.includes(targetPos)) {
	      plannedPlug[a] = targetPos;
	      newAgent.action = plan;
	    }
	  }
	}
      }
      // Process movements
      for (let role = 0; role != 4; role++) {
	let conflict = false;
	for (let b = 0; b != 4; b++) {
	  if (role != b && plannedPositions[role] == plannedPositions[b]) {
	    conflict = true;
	    break;
	  }
	}
	if (!conflict) {
	  let pos = plannedPositions[role];
	  this.agents[role].at = pos;
	  // Dogs make embedded gold known to everyone
	  if (role >= 2) {
	    this.hiddenGolds.forEach(
	      g => {
		if (g.at == pos) {
		  this.hiddenGolds = this.hiddenGolds.filter(h => h != g);
		  this.knownGolds.push(g);
		  this.dogsBark[role-2] = true;
		}
	      });
	  }
	} else {
	  this.agents[role].action = -1;
	}
      }
      // Process digging
      for (let a = 0; a != 2; a++) {
	const dug = plannedDig[a];
	const digTogether = (dug == plannedDig[1-a]);
	if (dug != null) {
	  if (this.agents.some(b => b.at == dug)) {
	    // Position to be dug out is occupied by another agent
	    this.agents[a].action = -1;
	    continue;
	  }
	  let grec = null;
	  this.hiddenGolds.forEach(g => { if (g.at == dug) grec = g; });
	  this.knownGolds.forEach(g => { if (g.at == dug) grec = g; });
	  if (grec != null) {
	    let goldAmount = grec.amount;
	    if (goldAmount != 0) {
	      this.goldRemaining -= goldAmount;
	      if (digTogether) {
		this.golds[0] += goldAmount/2;
		this.golds[1] += goldAmount/2;
		this.agents[0].obtained = goldAmount/2;
		this.agents[1].obtained = goldAmount/2;
	      } else {
		this.golds[a] += goldAmount;
		this.agents[a].obtained = goldAmount/2;
	      }
	      this.hiddenGolds = this.hiddenGolds.filter(c => c != grec);
	      this.knownGolds = this.knownGolds.filter(c => c != grec);
	    }
	    this.dug.push(grec);
	  }
	  this.holes.push(dug);
	}	  
	if (digTogether) break;
      }
      // Process plugging
      for (let a = 0; a != 2; a++) {
	const plugged = plannedPlug[a];
	if (plugged != null) {
	  this.holes.splice(this.holes.indexOf(plugged), 1);
	  this.plugged.push(plugged);
	}
      }
    }
  }
  redraw(init) {
    if (init || substep == midStep) {
      // Remove manual play targets, if any
      disableTargets();
      // Draw or remove holes
      for (let x = 0; x != fieldSize; x++) {
	for (let y = 0; y != fieldSize; y++) {
	  const cell = cells[x][y];
	  if (this.holes.includes(cell)) {
	    groundLayer.appendChild(cell.holeImage);
	  } else if (cell.holeImage.parentNode == groundLayer) {
	    groundLayer.removeChild(cell.holeImage);
	  }
	}
      }
      for (let x = 0; x != fieldSize; x++) {
	for (let y = 0; y != fieldSize; y++) {
	  cells[x][y].setNeighbors();
	}
      }
      // Draw or remove golds
      drawOrRemoveGolds(this.knownGolds);
      if (editMode) drawOrRemoveGolds(this.hiddenGolds);
      // Update scores 
      for (let t = 0; t != 2; t++) {
	scores[t].innerHTML = this.golds[t];
      }
      remainingLabel.innerHTML = this.goldRemaining;
      currentStepLabel.innerHTML = this.stepNumber + "/" + maxSteps;
    }
    // Draw agents
    this.agents.forEach(a => {
      const image = a.attributes.image;
      const isDog = a.attributes.seq >= 2;
      if (init) {
	const w = (isDog ? 0.8 : 1.7)*cellWidth;
	const h = w * (isDog ? 154/122: 273/301);
	image.setAttribute('width', w);
	image.setAttribute('height', h);
      }
      const team = a.attributes.seq%2;
      if (a.attributes.seq >= 2) {
	if (substep == 0) {
	  image.setAttribute('href',	
			     dogSitting[8*team + a.direction])
	}
	if (this.dogsBark[team]) {
	  if (init || substep == midStep) {
	    let c = a.at;
	    image.setAttribute('href',
    			       dogBarking[8*team + a.direction]);
	  }
	  if (substep == midStep) {
	    new Audio(barkSoundFile).play();
	  }
	}
      } else {
	if (init) {
	  if (a.action < 8) {
	    image.setAttribute('href', samuraiStanding[8*team + a.direction]);
	  } else {
	    image.setAttribute('href', samuraiDug[8*team + a.direction]);
	  }
	} else if (substep == 0) {
	  if (a.planned < 8) {
	    image.setAttribute('href', samuraiStanding[8*team + a.direction]);
	  } else {
	    image.setAttribute('href', samuraiDigging[8*team + a.direction]);
	  }
	} else if (substep == midStep) {
	  if (a.action >= 8) {
	    image.setAttribute('href', samuraiDug[8*team + a.direction]);
	  } else if (a.planned >= 8) {
	    image.setAttribute('href', samuraiStanding[8*team + a.direction]);
	  }
	}
	if (substep == midStep) {
	  if (8 <= a.action && a.action < 16) {
	    new Audio(scoopSoundFile).play();
	    if (a.obtained != 0) new Audio(goldSoundFile).play();
	  } else if (16 <= a.action) {
	    new Audio(plugSoundFile).play();
	  }
	}
      }
      repositionAgent(a, init);
    });
    let agts = Array.from(this.agents);
    agts.sort((a1, a2) => (a1.at.x+a1.at.y
			  ) - (a2.at.x+a2.at.y));
    agts.forEach(a => agentLayer.appendChild(a.attributes.image));
    // Remove arrows and remove mouse handlers for cells
    if (manualAgent >= 0 && (init || substep == midStep)) {
      // Draw arrows and show diamonds on candidate positions
      class MouseEnterHandler {
	constructor(diamond) { this.diamond = diamond; }
	handleEvent(ev) {
	  this.diamond.style.stroke = "rgb(200,0,0)";
	}
      };
      class MouseLeaveHandler {
	constructor(diamond) { this.diamond = diamond; }
	handleEvent(ev) {
	  this.diamond.style.stroke = "none";
	}
      };
      class MouseClickHandler {
	constructor(diamond, direction) {
	  this.diamond = diamond;
	  this.direction = direction;
	}
	handleEvent(ev) {
	  actionCommand(ev, 2*this.direction);
	}
      }
      const apos = this.agents[manualAgent].at;
      // Show arrow images
      for (let dir = -1; dir != 4; dir++) {
	const pos = dir < 0 ? apos : apos.neighbors[2*dir];
	if (pos == apos ||
	    (pos != null && this.agents.every(a => a.at != pos))) {
	  let arrow = null;
	  if (pos != apos) {
	    arrow = createSVG('image');
	    arrow.setAttribute('href',
			       (this.holes.includes(pos) ?
				arrowDigImages: arrowImages)[dir]);
	    arrow.setAttribute('width', 0.4*cellWidth);
	    arrow.setAttribute('height', 0.4*cellHeight);
	    arrow.setAttribute('x', pos.cx-0.2*cellWidth);
	    arrow.setAttribute('y', pos.cy-0.2*cellHeight);
	    arrow.setAttribute('opacity', 0.7);
	    diamondLayer.appendChild(arrow);
	  }
	  const diamond = pos.diamond;
	  const enterHandler = new MouseEnterHandler(diamond);
	  diamond.addEventListener('mouseenter', enterHandler);
	  const leaveHandler = new MouseLeaveHandler(diamond);
	  diamond.addEventListener('mouseleave', leaveHandler);
	  const clickHandler = new MouseClickHandler(diamond, dir);
	  diamond.addEventListener('click', clickHandler);
	  targetsShown.push({
	    diamond: diamond, arrow: arrow,
	    enter: enterHandler, leave: leaveHandler, click: clickHandler
	  });
	}
      }
    }
  }
}

let stepRecords = [];

function speedChange(delta) {
  playTempo = Math.min(240, Math.max(24, playTempo+delta));
  stepsPerMin.innerHTML = playTempo;
  playUntil = 0;
}

function speedWheel(ev) {
  let delta = ev.deltaY > 0 ? -4 : 4;
  if (ev.ctrlKey) delta *= 10;
  speedChange(delta);
}

function speedControl(ev) {
  let delta = ev.shiftKey ? 4 : -4;;
  if (ev.ctrlKey) delta *= 10;
  speedChange(delta);
}

let hideWhileEdit;
let showWhileEdit;

const topBarButtons = [
  "rewind", "stepBackward", "playStop", "stepForward", "fastForward",
  "speedometer", "clock", "reinitialize", "goldImage", "manual",
  "edit", "help", "load", "save", "remove", "import", "export"];
const infoLabels = ["stepsPerMin", "currentStepLabel", "remainingLabel"];

function resizeField() {
  // Remove everything in the field
  while (field.hasChildNodes()) field.removeChild(field.firstChild);
  diamondLayer = createSVG('g');
  for (let x = 0; x != fieldSize; x++) {
    for (let y = 0; y != fieldSize; y++) {
      cells[x][y].resize();
      diamondLayer.appendChild(cells[x][y].diamond);
    }
  }
  field.setAttribute('width', fieldWidth+"px");
  field.setAttribute('height', fieldHeight+"px");
  const buttonSize = Math.max(10, fieldWidth/25) + "px";
  topBarButtons.forEach(id => {
    const button = document.getElementById(id);
    button.style.height = buttonSize;
  });
  const fontSize = Math.max(14, fieldWidth/25) + "px";
  infoLabels.forEach(
    name => document.getElementById(name).style.fontSize = fontSize);
  background = createSVG('g');
  backgroundDirt = createSVG('rect');
  backgroundDirt.setAttribute('x', 0);
  backgroundDirt.setAttribute('y', 0);
  backgroundDirt.setAttribute('width', fieldWidth);
  backgroundDirt.setAttribute('height', fieldHeight);
  backgroundDirt.setAttribute(
    'style', "fill:"+
      (editMode ? editingBackgroundColor : backgroundColor));
  background.appendChild(backgroundDirt);
  const lawn = createSVG('polygon');
  lawn.setAttribute(
    'points',
    fieldWidth/2 + ',' + topMargin + ' ' +
      fieldWidth + ',' + (fieldSize*halfHeight + topMargin) + ' ' +
      fieldWidth/2 + ',' + (fieldSize*cellHeight+topMargin) + ' ' +
      0 + ',' + (fieldSize*halfHeight+topMargin));
  lawn.setAttribute('style', "fill:"+lawnColor);
  background.appendChild(lawn);
  // Lawn grid
  const gridColor = backgroundColor;
  const grid = createSVG('g');
  for (let k = 0; k != fieldSize+1; k++) {
    let downLine = createSVG('line');
    downLine.setAttribute('x1', k*halfWidth);
    downLine.setAttribute('x2', (k+fieldSize)*halfWidth);
    downLine.setAttribute('y1', (fieldSize-k)*halfHeight+topMargin);
    downLine.setAttribute('y2', (2*fieldSize-k)*halfHeight+topMargin);
    downLine.setAttribute('style', "stroke-width:1;stroke:"+gridColor);
    grid.appendChild(downLine);
    let upLine = createSVG('line');
    upLine.setAttribute('x1', k*halfWidth);
    upLine.setAttribute('x2', (k+fieldSize)*halfWidth);
    upLine.setAttribute('y1', (fieldSize+k)*halfHeight+topMargin);
    upLine.setAttribute('y2', k*halfHeight+topMargin);
    upLine.setAttribute('style', "stroke-width:1;stroke:"+gridColor);
    grid.appendChild(upLine);
  }
  background.appendChild(grid);
  field.insertBefore(background, field.firstChild);
  groundLayer = createSVG('g');
  field.appendChild(groundLayer);
  // Redraw apparent golds
  goldShown.forEach(g => drawGoldImage(g.at, g.image));
  agentLayer = createSVG('g');
  field.appendChild(agentLayer);
  // Resize agent icons and score labels
  for (let t = 0; t != 2; t++) {
    const samurai = document.getElementById("samuraiFigure" + t);
    samurai.height = 3*cellHeight;
    samurai.style.position = "relative";
    samurai.style.top = cellHeight + "px";
    const score = document.getElementById("scoreLabel" + t);
    score.style.fontSize = fontSize;
    score.style.fontFamily = 'roman';
    score.style.fontWeight = 'bold';
    score.style.textShadow = "1px 1px black"
    score.style.color = scoreColor;
    scores[t] = score;
  }
  document.getElementById("topBar").style.top = "0px";
  document.getElementById("bottomBar").style.top =
    fieldHeight - 3.3*cellHeight + "px";
  field.appendChild(diamondLayer);
}

function redrawField(config) {
  stopAutoPlay();
  fieldSize = config.size;
  maxSteps = config.steps;
  setSizes();
  // Prepare cells
  cells = [];
  for (let x = 0; x != fieldSize; x++) {
    cells[x] = [];
    for (let y = 0; y != fieldSize; y++) {
      cells[x][y] = new Cell(x, y);
    }
  }
  // Configure buttons
  topBarButtons.forEach(id => {
    const button = document.getElementById(id);
    window[id+"Button"] = button;
  })
  rewindButton.onclick = rewind;
  stepBackwardButton.onclick = stepBackward;
  playStopButton.onclick = startStopPlay;
  stepForwardButton.onclick = _ => stepForward(false);
  fastForwardButton.onclick = fastForward;
  goldImageButton.onmousedown = showHiddenGold;
  goldImageButton.onmouseout = hideHiddenGold;
  goldImageButton.onmouseup = hideHiddenGold;
  manualButton.onclick = toggleManualPlay;
  reinitializeButton.onclick = reinitialize;

  editButton.onclick = toggleEditMode;
  loadButton.onclick = loadConfiguration;
  saveButton.onclick = saveConfiguration;
  removeButton.onclick = removeConfiguration;
  clockButton.onclick = setStep;
  clockButton.onwheel = setStep;

  hideWhileEdit = [
    rewindButton, stepBackwardButton, playStopButton,
    stepForwardButton, fastForwardButton, speedometerButton,
    reinitializeButton, goldImageButton,
    manualButton, stepsPerMin
  ];
  showWhileEdit = [
    loadButton, saveButton, removeButton, importButton, exportButton
  ];
  showWhileEdit.forEach(b => b.style.display = 'none');

  // Configure labels
  infoLabels.forEach(
    name => {
      const label = document.getElementById(name);
      window[name] = label;
      label.style.fontFamily = "roman";
      label.style.fontWeight = "bold";
      label.style.textShadow = "1px 1px black"
    });
  remainingLabel.style.color = scoreColor;
  currentStepLabel.style.color = clockColor;
  stepsPerMin.style.color = clockColor;

  speedometer.onwheel = speedWheel;
  stepsPerMin.onwheel = speedWheel;
  speedometer.onclick = speedControl;
  stepsPerMin.onclick = speedControl;
  // The field background and the ground layer are painted on resize
  resizeField();
}

function showHiddenGold() {
  stepRecords[currentStep].hiddenGolds.forEach(
    hidden => drawGoldImage(hidden.at, hidden.image));
}

function hideHiddenGold() {
  stepRecords[currentStep].hiddenGolds.forEach(
    hidden => {
      if (hidden.image.parentNode == groundLayer) {
	groundLayer.removeChild(hidden.image);
      }
    });
}

let randomSeed = 123456789;

class Random {
  constructor() {
    this.x = randomSeed;
    this.y = 362436069;
    this.z = 521288629;
    this.w = 88675123;
  }
  gen() {
    let t = this.x ^ (this.x << 11);
    this.x = this.y; this.y = this.z; this.z = this.w;
    let v = this.w = (this.w ^ (this.w >>> 19)) ^ (t ^ (t >>> 8)); 
    return Math.abs(v)%1000000/1000000;
  }
};

let random;

function reinitialize() {
  // Change the random number generator seed
  randomSeed = Math.floor(100000000*random.gen());
  initialize();
}

function rewind() {
  if (currentStep != 0) {
    currentStep = 0;
    stepRecords[0].redraw(true);
  }
}

function fastForward() {
  if (currentStep != stepRecords.length - 1) {
    currentStep = stepRecords.length - 1;
    stepRecords[currentStep].redraw(true);
  }
}

function setSizes() {
  fieldWidth = window.innerWidth;
  cellWidth = fieldWidth/fieldSize;
  cellHeight = cellWidth/2;
  halfWidth = cellWidth/2;
  halfHeight = cellHeight/2;
  topMargin = cellHeight;
  fieldHeight = fieldWidth/2 + topMargin;
}

function initialize() {
  // Initialize random numbeer generator
  random = new Random();
  // Prepare the field
  field = document.getElementById("battle field");
  background = undefined;
  groundLayer = undefined;
  // Initialize a game
  config = randomConfig();
  redrawField(config);
  stepRecords = [new GameState(null, null, config)];
  currentStep = 0;
  stepRecords[0].redraw(true);
  window.onresize = () => {
    setSizes();
    resizeField(null);
    stepRecords[currentStep].redraw(true);
  }    
  window.onkeydown = keyDown;
}

function substepPosition(a, init) {
  if (init || a.planned < 0) return a.at;
  let from;
  let to;
  if (a.planned < 8) {
    if (a.action == a.planned) {
      to = a.at;
      from = to.neighbors[(a.planned+4)%8];
    } else {
      from = a.at;
      to = from.neighbors[a.planned];
    }
  } else {
    from = a.at;
    to = from.neighbors[a.direction];
  }
  let ratio = 0;
  if (a.planned < 8) {
    if (a.action == a.planned) {
      ratio = Math.min(substep/midStep, 1);
    } else if (substep < midStep/2) {
      ratio = Math.min(substep/(midStep/2), 1)/3;
    } else {
      ratio = Math.min(Math.max(0, midStep-substep)/(midStep/2), 1)/3;
    }
  }
  return {
    x: (1-ratio)*from.x + ratio*to.x,
    y: (1-ratio)*from.y + ratio*to.y
  }
}

function substepForward() {
  stepRecords[currentStep].redraw(false);
  substep += 1;
  if (substep == numSubsteps) {
    substep = 0;
    const finished =
	  stepRecords[currentStep].goldRemaining == 0 ||
	  stepRecords[currentStep].stepNumber == maxSteps;
    if (finished) new Audio(gongSoundFile).play();
    if (finished || stepRecords[currentStep].stepNumber >= playUntil) {
      stopAutoPlay();
    } else {
      new Audio(tickSoundFile).play();
      if (stepRecords.length == currentStep + 1) {
	stepRecords[currentStep+1] = new GameState(stepRecords[currentStep]);
      }
      currentStep += 1;
    }
  }
}

let playTimer = undefined;

function stepBackward() {
  if (currentStep == 0) return;
  playUntil = 0;
  currentStep -= 1;
  stepRecords[currentStep].redraw(true);
}

function stepForward(rep, commandPlay) {
  if (playTimer == undefined) {
    if (commandPlay != undefined ||
	stepRecords.length <= currentStep+1) {
      stepRecords = stepRecords.slice(0, currentStep+1);
      stepRecords[currentStep+1] =
	new GameState(stepRecords[currentStep], commandPlay);
    }
    currentStep += 1;
    substep = 0;
    stepInterval = 60*1000/playTempo;
    numSubsteps = Math.max(2, Math.floor(frameRate*stepInterval/1000));
    midStep = Math.floor((numSubsteps+1)/2);
    playUntil = rep ? maxSteps : stepRecords[currentStep].stepNumber;
    playTimer = setInterval(substepForward, stepInterval/numSubsteps);
  }
}

function disableTargets() {
  targetsShown.forEach(target => {
    const diamond = target.diamond;
    diamond.removeEventListener('mouseenter', target.enter);
    diamond.removeEventListener('mouseleave', target.leave);
    diamond.removeEventListener('click', target.click);
    diamond.style.stroke = 'none';
    if (target.arrow != null) field.removeChild(target.arrow);
  });
  targetsShown = [];
}

function actionCommand(ev, plan) {
  const target =
	stepRecords[currentStep].agents[manualAgent].at.neighbors[plan];
  if (ev.shiftKey) {
    plan +=
      stepRecords[currentStep].knownGolds.some(g => g.at == target) ? 8 :
      stepRecords[currentStep].holes.includes(target) ? 16 : 0;
  }
  if (plan < 8 && stepRecords[currentStep].holes.includes(target)) {
    new Audio(beepSoundFile).play();
  } else {
    disableTargets();
    stepForward(false, plan);
  }
}

function keyDown(ev) {
  let plan;
  if (manualAgent >= 0) {
    switch (ev.code) {
    case "KeyJ": case "KeyS": case "ArrowDown":
      plan = 0; break;
    case "KeyH": case "KeyW": case "ArrowLeft":
      plan = 2; break;
    case "KeyK": case "KeyN": case "ArrowUp":
      plan = 4; break;
    case "KeyL": case "KeyE": case "ArrowRight":
      plan = 6; break;
    case "Space": case "Period":
      plan = -1; break;
    }
    if (plan !== undefined) {
      if (plan >= 0) {
	const target = stepRecords[currentStep].agents[manualAgent].at.neighbors[plan];
	if (target == null ||
	    stepRecords[currentStep].agents.some(a => a.at == target)) {
	  return;
	}
	if (ev.shiftKey) {
	  plan += stepRecords[currentStep].holes.includes(target) ? 16 : 8;
	}
      }
      actionCommand(ev, plan);
    }
  }
}

function startStopPlay() {
  if (playTimer != undefined) {
    playUntil = 0;
  } else if (stepRecords[currentStep].goldRemaining != 0 &&
	     stepRecords[currentStep].stepNumber != maxSteps) {
    if (stepRecords[currentStep].stepNumber == 0) bgm.currentTime = 0;
    bgm.play();
    playUntil = maxSteps;
    playStopButton.src = "../icons/stop.png";
    stepForward(true);
  }
}

function stopAutoPlay() {
  bgm.pause();
  if (playTimer != undefined) {
    clearInterval(playTimer);
    playStopButton.src = '../icons/play.png';
    playTimer = undefined;
  }
}

///////////////////////////
// Configuration Editor
///////////////////////////

let editMode = false;
let agentMoveStartHandlers = [];
let diamondListeners;

function toggleEditMode() {
  if (!editMode) {
    editMode = true;
    toggleManualPlay(null, true);
    currentStep = 0;
    stepRecords = stepRecords.slice(0, 1);
    hideWhileEdit.forEach(b => b.style.display = "none");
    showWhileEdit.forEach(b => b.style.display = "inline");
    diamondListeners = [];
    for (let x = 0; x != fieldSize; x++) {
      diamondListeners.push([]);
      for (let y = 0; y != fieldSize; y++) {
	const cell = cells[x][y];
	const diamond = cell.diamond;
	const downListener = new DiamondDownListener(cell);
	const enterListener = new DiamondEnterListener(diamond);
	const leaveListener = new DiamondLeaveListener(diamond);
	diamond.addEventListener('mouseenter', enterListener);
	diamond.addEventListener('mouseleave', leaveListener);
	diamond.addEventListener('mousedown', downListener);
	diamondListeners[x].push({
	  enter: enterListener, leave: leaveListener, down: downListener});
      }
    }
    editButton.setAttribute('src', "../icons/pencil-writing.png");
    backgroundDirt.setAttribute('style', "fill:"+editingBackgroundColor);
    stepRecords[currentStep].redraw(true);
  } else {
    for (let x = 0; x != fieldSize; x++) {
      for (let y = 0; y != fieldSize; y++) {
	const listeners = diamondListeners[x][y];
	cells[x][y].diamond.removeEventListener(
	  'mousedown', listeners.down);
	cells[x][y].diamond.removeEventListener(
	  'mouseenter', listeners.enter);
	cells[x][y].diamond.removeEventListener(
	  'mouseleave', listeners.leave);
      }
    }
    editButton.setAttribute('src', "../icons/pencil.png");
    hideWhileEdit.forEach(b => b.style.display = "inline");
    showWhileEdit.forEach(b => b.style.display = "none");
    editMode = false;
    backgroundDirt.setAttribute('style', "fill:"+backgroundColor);
    stepRecords[currentStep].redraw(true);
  }
}

class DiamondEnterListener {
  constructor(image) {
    this.image = image;
  }
  handleEvent(ev) {
    this.image.style.stroke = 'rgb(200,200,200)';
  }
};

class DiamondLeaveListener {
  constructor(image) {
    this.image = image;
  }
  handleEvent(ev) {
    this.image.style.stroke = 'none';
  }
};

class DiamondDownListener {
  constructor(cell) {
    this.cell = cell;
  }
  handleEvent(ev) {
    const rec = stepRecords[currentStep];
    let agent = null;
    rec.agents.forEach(a => { if (a.at == this.cell) agent = a; });
    if (agent != null) {
      const moveHandler =
	    new AgentMove(agent, ev.pageX, ev.pageY);
      if (ev.shiftKey) {
	// Rotate the agent if a shift key is pressed
	const role = agent.attributes.seq;
	let delta = role < 2 ? 2 : 1;
	if (ev.ctrlKey) delta = -delta;
	const dir = (agent.direction + delta + 8) % 8;
	agent.direction = dir;
	const team = role % 2;
	agent.attributes.image.setAttribute(
	  'href',
	  role < 2 ? samuraiStanding[dir+8*team] :
	    dogSitting[dir+8*team]);
      }
      field.addEventListener('mousemove', moveHandler);
      field.addEventListener(
	'mouseup', new EndAgentMove(agent, moveHandler));
    } else {
      if (rec.holes.includes(this.cell)) {
	rec.holes.splice(rec.holes.indexOf(this.cell), 1);
	groundLayer.removeChild(this.cell.holeImage);
      } else {
	let g = -1;
	for (let k = 0; k != rec.hiddenGolds.length; k++) {
	  if (rec.hiddenGolds[k].at == this.cell) {
	    g = k; break;
	  }
	}
	if (g >= 0) {
	  const grec = rec.hiddenGolds[g];
	  let delta = ev.shiftKey ? 2 : -2;
	  if (ev.ctrlKey) delta *= 10;
	  delta = Math.max(-grec.amount, delta);
	  grec.amount += delta;
	  rec.goldRemaining += delta;
	  remainingLabel.innerHTML = rec.goldRemaining;
	  groundLayer.removeChild(grec.image);
	  if (grec.amount == 0) {
	    rec.hiddenGolds.splice(g, 1);
	  } else {
	    grec.image = makeGoldImage(this.cell, grec.amount);
	    drawGoldImage(this.cell, grec.image);
	  }
	} else if (ev.shiftKey) {
	  const image = makeGoldImage(this.cell, 2);
	  rec.hiddenGolds.push({
	    at: this.cell, amount: 2, image: image
	  });
	  rec.goldRemaining += 2;
	  remainingLabel.innerHTML = rec.goldRemaining;
	  drawGoldImage(this.cell, image);
	} else {
	  rec.holes.push(this.cell);
	  groundLayer.appendChild(this.cell.holeImage);
	}
      }
    }
  }
}

class AgentMove {
  constructor(agent, startX, startY) {
    this.agent = agent;
    this.nowAt = agent.at;
    this.startX = this.prevX = startX;
    this.startY = this.prevY = startY;
  }
  handleEvent(ev) {
    const agent = this.agent;
    // Move the agent image
    const deltaX = ev.pageX - this.prevX;
    const deltaY = ev.pageY - this.prevY;
    const img = agent.attributes.image;
    img.setAttribute('x', Number(img.getAttribute('x')) + deltaX);
    img.setAttribute('y', Number(img.getAttribute('y')) + deltaY);
    this.prevX = ev.pageX;
    this.prevY = ev.pageY;
    // Move the target cell
    const origat = this.agent.at;
    const cellXplusY =
	  origat.x + origat.y + 2*(ev.pageY-this.startY)/cellHeight;
    const cellXminusY =
	  origat.x - origat.y + 2*(ev.pageX-this.startX)/cellWidth;
    const cellX = Math.round((cellXplusY + cellXminusY)/2);
    const cellY = Math.round((cellXplusY - cellXminusY)/2);
    if ((agent.x != cellX || agent.y != cellY) &&
	0 <= cellX && cellX < fieldSize &&
	0 <= cellY && cellY < fieldSize) {
      const newCell = cells[cellX][cellY];
      const rec = stepRecords[currentStep];
      if (!rec.holes.includes(newCell) &&
	  rec.agents.every(a => a == agent || a.at != newCell) &&
	  rec.hiddenGolds.every(g => g.at != newCell)) {
	this.nowAt = newCell;
      }
    }
  }
}

class EndAgentMove {
  constructor(agent, moveHandler) {
    this.agent = agent;
    this.moveHandler = moveHandler;
  }
  handleEvent(ev) {
    field.removeEventListener('mouseup', this);
    field.removeEventListener('mousemove', this.moveHandler);
    const agent = this.moveHandler.agent;
    agent.at = this.moveHandler.nowAt;
    repositionAgent(agent, true);
  }
}

function setStep(ev) {
  let delta;
  if (ev.type == "click") {
    delta = (ev.shiftKey ? 1 : -1);
  } else {
    delta = ev.deltaY > 0 ? -1 : 1;
  }
  if (ev.ctrlKey) delta *= 10;
  if (editMode) {
    maxSteps = Math.max(10, maxSteps+delta);
    currentStepLabel.innerHTML = currentStep + "/" + maxSteps;
  } else {
    const newStep = currentStep + delta;
    if (0 <= newStep && newStep < stepRecords.length) {
      currentStep = newStep;
      stepRecords[currentStep].redraw(true);
    }
  }
}

const LocalStorageKey = "SamurAI Dig Here Configurations";
let previousConfigurationName = null;

function menuChoice(message, items, store, makeHandler) {
  const menuDiv = document.createElement('div');
  menuDiv.innerHTML = message + "<br>";
  menuDiv.style.display = "block";
  menuDiv.style.position = "absolute";
  menuDiv.style.fontSize = cellWidth/5+"px";
  menuDiv.className = "menuPopup";
  const itemsTable = document.createElement('table');
  itemsTable.className = "menuTable";
  items.forEach(i => {
    const row = document.createElement('tr');
    const item = document.createElement('td');
    item.className = "menuItem";
    item.innerHTML = i;
    item.addEventListener('click', makeHandler(i, store, menuDiv));
    row.appendChild(item);
    itemsTable.appendChild(row);
  });
  const cancelRow = document.createElement('tr');
  const cancel = document.createElement('td');
  cancel.className = "menuItem cancelItem";
  cancel.innerHTML += "cancel";
  cancel.onclick = (ev) =>
    document.getElementById("topBar").removeChild(menuDiv);
  cancelRow.appendChild(cancel);
  itemsTable.appendChild(cancelRow);
  menuDiv.appendChild(itemsTable);
  document.getElementById("topBar").appendChild(menuDiv);
}

class ConfigLoader {
  constructor(item, store, menu) {
    this.store = store; this.item = item; this.menu = menu;
  }
  handleEvent(ev) {
    const config = this.store[this.item];
    redrawField(config);
    hideWhileEdit.forEach(b => b.style.display = "none");
    showWhileEdit.forEach(b => b.style.display = "inline");
    stepRecords[currentStep] = new GameState(null, null, config);
    stepRecords[currentStep].redraw(true);
    document.getElementById("topBar").removeChild(this.menu);
  }
}

function loadConfiguration(ev) {
  if (localStorage == undefined) {
    alert("Local storage not available on this browser");
    return;
  }
  const configInJSON = localStorage.getItem(LocalStorageKey);
  if (configInJSON == undefined || configInJSON == "{}") {
    alert("No configurations are stored locally");
    return;
  }
  const store = JSON.parse(configInJSON);
  menuChoice("Which config to load?", Object.keys(store),
	     store, (i, s, menu) => new ConfigLoader(i, s, menu));
}

class ConfigRemover {
  constructor(item, store, menu) {
    this.store = store; this.item = item; this.menu = menu;
  }
  handleEvent(ev) {
    this.store[this.item] = undefined;
    localStorage.setItem(LocalStorageKey, JSON.stringify(this.store));
    document.getElementById("topBar").removeChild(this.menu);
  }
}

function removeConfiguration(ev) {
  if (localStorage == undefined) {
    alert("Local storage not available on this browser");
    return;
  }
  let configInJSON = localStorage.getItem(LocalStorageKey);
  if (configInJSON == undefined || configInJSON == "{}") {
    alert("No configurations are stored locally");
    return;
  }
  const store = JSON.parse(configInJSON);
  menuChoice("Name of config to remove?", Object.keys(store),
	     store, (i, s, menu) => new ConfigRemover(i, s, menu));
}

function saveConfiguration(ev) {
  if (localStorage == undefined) {
    alert("Local storage not available on this browser");
    return;
  }
  let configInJSON = localStorage.getItem(LocalStorageKey);
  const stored =
	configInJSON == undefined ? {} :
	JSON.parse(configInJSON);
  const rec = stepRecords[currentStep];
  const agents = [];
  rec.agents.forEach(a => agents.push({x: a.at.x, y: a.at.y}));
  const holes = [];
  rec.holes.forEach(h => holes.push({x: h.x, y: h.y}));
  const golds = [];
  rec.hiddenGolds.forEach(g => {
    golds.push({x: g.at.x, y: g.at.y, amount: g.amount})});
  var configurationName = prompt(
    "Save under configuration name?",
    (previousConfigurationName || ""));
  if (configurationName == null) return;
  const config = {
    name: configurationName,
    filetype: "SamurAI Dig Here Field",
    size: fieldSize,
    steps: maxSteps,
    agents: agents,
    holes: holes,
    golds: golds
  };
  previousConfiguraionName = configurationName;
  stored[configurationName] = config;
  localStorage.setItem(LocalStorageKey, JSON.stringify(stored));
}
