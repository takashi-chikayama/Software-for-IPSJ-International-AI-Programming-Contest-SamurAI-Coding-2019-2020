function createSVG(tag) {
  return document.createElementNS("http://www.w3.org/2000/svg", tag);
}

function removeChildren(parent) {
  while (parent.firstChild) parent.removeChild(parent.firstChild);
}

var titleArea, svgArea, logoArea, movieArea, movieScreen, movieControl;
var rewindButton, playPauseButton, stopButton;

var matchPopup = null;

const goldLogos = ["hitachi.png", "e-Seikatsu.png", "teamlab.png"];

function shuffleArray(array) {
  for (var i = 0; i != array.length; i++) {
    const r = Math.floor(Math.random() * (array.length-i));
    const tmp = array[i];
    array[i] = array[r];
    array[r] = tmp;
  }
}

class LOGO {
  constructor(filename) {
    const image = document.createElement('img');
    image.src = "logos/" + filename;
    image.style.background = "white";
    image.style.verticalAlign = "middle";
    image.style.display = "inline";
    image.style.margin = "10px";
    this.image = image;
  }
}

const logos = [];
var highestLogo;
var highestLogoRatio = 0;

function redrawLogos() {
  removeChildren(logoArea);
  const logoAreaHeight = logoArea.clientHeight;
  const singleLogoArea =
	logoAreaHeight * highestLogo.image.naturalWidth *
	logoAreaHeight / highestLogo.image.height;
  logos.forEach(logo => {
    const mag = Math.sqrt(singleLogoArea/logo.naturalArea);
    logo.image.width = mag * logo.naturalWidth;
    logoArea.appendChild(logo.image);
  });
}

function redrawTitle() {
  titleArea.style.lineHeight = titleArea.style.height;
  titleArea.style.fontSize = 0.7*titleArea.clientHeight + "px";
}

const teamPos = [
  [0, 0],			// 0
  [1, 7],			// 1
  [1, 0],			// 2
  [0, 7],			// 3
  [0, 4],			// 4
  [1, 3],			// 5
  [1, 4],			// 6
  [0, 3],			// 7
  [0, 2],			// 8
  [1, 5],			// 9
  [1, 2],			// 10
  [0, 5],			// 11
  [0, 6],			// 12
  [1, 1],			// 13
  [1, 6],			// 14
  [0, 1]			// 15
];

const matchKind = [
  "First Round", "Quarter Final", "Semifinal", "Final", "Third Place Play-Off"
];

function redrawTournament() {
  removeChildren(svg);
  const bb = svgArea.getBoundingClientRect();
  const h = bb.height;
  const w = bb.width;
  const hu = h/16;
  const wu = w/12;
  [rewindButton, playPauseButton, stopButton].forEach(button => {
    button.height = 0.5*hu;
    button.style.paddingLeft = 0.1*wu + "px";
    button.style.paddingRight = 0.1*wu + "px";
  });
  leftTeamName.style.fontSize = 0.5*hu + "px";
  rightTeamName.style.fontSize = 0.5*hu + "px";
  const tournamentStroke = wu/15;
  const fontSize = 0.2*wu;
  function drawMatchLine(g) {
    const match = matches[g];
    const line0 = createSVG("polyline");
    const line1 = createSVG("polyline");
    const endx = (match.at[0] + 3) * wu;
    const startx0 = 
	  match.level == 0 ?
	  (match.at[0] < 3 ? endx - 0.7*wu : endx + 0.7*wu) :
	  match.at[0] <= 3 ? (match.at[0] + 2) * wu :
	  (match.at[0] + 4) * wu;
    const startx1 =
	  match.level < 3 ? startx0 : startx0 + 2*wu;
    const endy = (match.at[1] + 1.5) * hu;
    const starty0 =
	  match.level == 0 ? endy - hu :
	  match.level == 1 ? endy - 2*hu :
	  match.level == 2 ? endy - 4*hu :
	  match.level == 3 ? endy :
	  endy - 2*hu;
    const starty1 =
	  match.level == 0 ? endy + hu :
	  match.level == 1 ? endy + 2*hu :
	  match.level == 2 ? endy + 4*hu :
	  match.level == 3 ? endy :
	  endy - 2*hu;
    line0.setAttribute(
      "points",
      startx0+","+starty0 +
	(match.level <= 3 ? " " + endx+","+starty0 : "") +
	" " + endx+","+endy
    );
    line0.setAttribute("stroke-width", tournamentStroke);
    line0.setAttribute("stroke", ["red", "white"][match.winner]);
    line0.setAttribute("fill", "none");
    svg.appendChild(line0);
    line1.setAttribute(
      "points",
      startx1+","+starty1 +
	(match.level <= 3 ? " " + endx+","+starty1 : "") +
	" " + endx+","+endy
    );
    line1.setAttribute("stroke-width", tournamentStroke);
    line1.setAttribute("stroke", ["white", "red"][match.winner]);
    line1.setAttribute("fill", "none");
    svg.appendChild(line1);
  }
  for (var g = 0; g != 16; g++) drawMatchLine(g);
  function drawMatchCircle(g) {
    const match = matches[g];
    const circ = createSVG("circle");
    const cx = (match.at[0] + 3) * wu;
    const cy = (match.at[1] + 1.5) * hu;
    circ.setAttribute("cx", cx);
    circ.setAttribute("cy", cy);
    circ.setAttribute("r", 0.3*hu);
    circ.setAttribute("stroke", "black");
    circ.setAttribute("fill", "pink");
    svg.appendChild(circ);
    circ.onclick = ev => {
      if (matchPopup != null) matchPopup.remove();
      matchPopup = document.createElement("div");
      matchPopup.style.stroke = "black";
      matchPopup.style.strokeWidth = 2;
      matchPopup.style.fontSize = fontSize;
      matchPopup.style.textAlign = "center";
      matchPopup.style.background = "white";
      matchPopup.style.padding = "5px";
      matchPopup.innerHTML = "<i>" + matchKind[match.level] + "</i>";
      for (var g = 0; g != 2; g++) {
	matchPopup.appendChild(document.createElement("br"));
	const button = document.createElement("span");
	button.style.padding = "0px 10px 0px 10px";
	button.innerHTML = "Game " + (g+1);
	button.style.background = "lightblue";
	button.onmouseenter = () => button.style.background = "pink";
	button.onmouseleave = () => button.style.background = "lightblue";
	button.match = match;
	button.which = g;
	button.onclick = ev => {
	  const b = ev.target;
	  const match = b.match;
	  const g = b.which;
	  const fileName =
		"movies/" + (match.vs[g]+1) + "-" + (match.vs[1-g]+1) + ".mp4";
	  leftTeamName.innerHTML =
	    match.vs[g] + 1 + ": " + teamNames[match.vs[g]];
	  rightTeamName.innerHTML =
	    match.vs[1-g] + 1 + ": " + teamNames[match.vs[1-g]];
	  movieScreen.onloadedmetadata = () => {
	    const aspectRatio = movieScreen.videoWidth/movieScreen.videoHeight;
	    if (aspectRatio * bb.height < bb.width) {
	      movieScreen.width = aspectRatio*bb.height;
	    } else {
	      movieScreen.width = bb.width;
	    }
	  };
	  movieScreen.src = fileName;
	  movieScreen.load();
	  var playing = true;
	  function playPauseMovie() {
	    if (playing) {
	      playPauseButton.src = "icons/play.png";
	      movieScreen.pause();
	      playing = false;
	    } else {
	      playPauseButton.src = "icons/pause.png";
	      movieScreen.play();
	      playing = true;
	    }
	  }
	  playPauseButton.onclick = playPauseMovie;
	  playPauseMovie();
	  stopButton.onclick = () => {
	    movieScreen.pause();
	    movieArea.style.display = "none";
	  }
	  rewindButton.onclick = () => {
	    playing = true;
	    playPauseMovie();
	    movieScreen.currentTime = 0;
	  }
	  movieScreen.onloadeddata = () => {
	    movieArea.style.display = "block";
	  }
	}
	matchPopup.appendChild(button);
      }
      matchPopup.style.position = "absolute";
      matchPopup.style.left = bb.left + cx - 10 + "px";
      matchPopup.style.top = bb.top + cy - 10 + "px";
      matchPopup.onmouseleave = () => matchPopup.remove();
      svgArea.appendChild(matchPopup);
    };
  }
  for (var g = 0; g != 16; g++) drawMatchCircle(g);
  function drawTeamName(t) {
    const upper = (t < 4 || (8 <= t && t < 12));
    const xpos = teamPos[t][0] == 0 ? 0.3*wu : 9.7*wu;
    const ypos = (2*teamPos[t][1]+1.2) * hu;
    const rect = createSVG("rect");
    rect.setAttribute("x", xpos);
    rect.setAttribute("y", ypos);
    rect.setAttribute("width", 2*wu);
    rect.setAttribute("height", 0.6*hu);
    rect.setAttribute("fill", "white");
    rect.setAttribute("stroke-width", 2);
    rect.setAttribute("stroke", "red");
    svg.appendChild(rect);
    const name = createSVG("text");
    name.setAttribute("x", xpos+wu);
    name.setAttribute("y", ypos+0.3*hu);
    name.setAttribute("fill", "black");
    name.setAttribute("text-anchor", "middle");
    name.setAttribute("dominant-baseline", "middle");
    name.setAttribute("font-size", fontSize);
    name.innerHTML = (t+1)+": "+teamNames[t];
    svg.appendChild(name);
  }
  for (var t = 0; t != 16; t++) {
    drawTeamName(t);
  }
}

function redrawAll() {
  if (matchPopup != null) matchPopup.remove();
  const windowHeight = window.innerHeight;
  titleArea.style.height = 0.04*windowHeight + "px";
  svgArea.style.height = 0.83*windowHeight + "px";
  logoArea.style.height = 0.05*windowHeight + "px";
  redrawTitle();
  redrawTournament();
  redrawLogos();
}

function preload(whenLoaded) {
  const logoFiles = goldLogos.slice(0);
  shuffleArray(logoFiles);
  function preloadLogos(k) {
    if (k == logoFiles.length) {
      whenLoaded();
    } else {
      const logo = new LOGO(logoFiles[k]);
      logos.push(logo);
      logo.image.onload = ev => {
	const img = ev.target;
	const w = img.naturalWidth;
	const h = img.naturalHeight;
	logo.naturalWidth = w;
	logo.naturalHeight = h;
	logo.naturalArea = w*h;
	logo.aspectRatio = w/h;
	if (logo.aspectRatio > highestLogoRatio) {
	  highestLogoRatio = logo.aspectRatio;
	  highestLogo = logo;
	}
	preloadLogos(k+1);
      };
    };
  }
  preloadLogos(0);
}

function start() {
  titleArea = document.getElementById("title area");
  svgArea = document.getElementById("svg area");
  movieArea = document.getElementById("movie div");
  movieScreen = document.getElementById("movie screen");
  rewindButton = document.getElementById("rewind button");
  playPauseButton = document.getElementById("play/pause");
  stopButton = document.getElementById("stop button");
  leftTeamName = document.getElementById("left team");
  rightTeamName = document.getElementById("right team");
  svg = document.getElementById("svg");
  logoArea = document.getElementById("logo area");
  window.onresize = redrawAll;
  preload(redrawAll);
}
