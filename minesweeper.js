"use strict";

// TODO: add touch support

var game, tilesCovered, minesTag, faceTag, timeTag, isMarksEnabled, pressedTile;
var endGame = false;
var isTilePressed = false;

var timer = {
	t: 0,
	clock: null,
	resume: function() {
		if(this.clock != null) {
			return;
		}
		
		var self = this;
		
		this.clock = setInterval(function() {
			self.t++;
			var timeText = digitFormat(Math.min(self.t, 999), 3);
			var digitTags = timeTag.children;
			
			for(var i = 0; i < digitTags.length; i++) {
				digitTags[i].style.backgroundPosition = -26 * parseInt(timeText.charAt(i)) + "px -64px";
			}
		}, 1000);
	},
	start: function() {
		this.clear();
		this.resume();
	},
	stop: function() {
		clearInterval(this.clock);
		this.clock = null;
	},
	clear: function() {
		this.t = 0;
		
		var digitTags = timeTag.children;
		
		for(var i = 0; i < digitTags.length; i++) {
			digitTags[i].style.backgroundPosition = "0px -64px";
		}
	}
};

var config = {
	custom: false,
	difficulty: "9,9,10",
	marks: false,
	zoom: "1"
};

var options = JSON.parse(localStorage.getItem("options"));

for(var option in options) {
	config[option] = options[option];
}

localStorage.setItem("options", JSON.stringify(config));

// event listeners
window.addEventListener("load", function() {
	var ids = ["width-entry", "height-entry", "mines-entry"];
	var difficulty = document.getElementById("difficulty");
	var customDialog = document.getElementById("custom-dialog");
	var marks = document.getElementById("marks");
	var zoom = document.getElementById("zoom");
	var CTRL_KEY = 17;
	
	difficulty.value = (config.custom)?"custom":config.difficulty;
	
	marks.checked = config.marks;
	zoom.value = config.zoom;
	document.getElementById("gamewrapper").style.zoom = config.zoom;
	isMarksEnabled = config.marks;
	
	game = document.getElementById("game");
	faceTag = document.getElementById("face-display").firstElementChild;
	minesTag = document.getElementById("mines-display");
	timeTag = document.getElementById("time-display");
	
	zoom.addEventListener("change", function() {
		document.getElementById("gamewrapper").style.zoom = this.value;
		config.zoom = this.value;
		localStorage.setItem("options", JSON.stringify(config));
	});
	
	difficulty.addEventListener("change", function() {
		if(this.value == "custom") {
			config.difficulty.split(",").forEach(function(value, index) {
				document.getElementById(ids[index]).value = value;
			});
			showDialog("custom-dialog");
		} else {
			config.custom = false;
			config.difficulty = this.value;
			localStorage.setItem("options", JSON.stringify(config));
			load();
		}
	});
	
	faceTag.addEventListener("mousedown", function() {
		this.style.backgroundPosition = "-48px -110px";
	});
	
	faceTag.addEventListener("click", function() {
		timer.stop();
		
		if(config.custom) {
			config.difficulty.split(",").forEach(function(value, index) {
				document.getElementById(ids[index]).value = value;
			});
			showDialog("custom-dialog");
		} else {
			load();
		}
	});
	
	marks.addEventListener("change", function() {
		isMarksEnabled = this.checked;
		config.marks = this.checked;
		localStorage.setItem("options", JSON.stringify(config));
	});
	
	document.addEventListener("keydown", function(e) {
		if(e.keyCode == CTRL_KEY) {
			game.setAttribute("data-cheat", true);
		}
	});
	
	document.addEventListener("keyup", function(e) {
		if(e.keyCode == CTRL_KEY) {
			game.removeAttribute("data-cheat");
		}
	});
	
	customDialog.addEventListener("hidedialog", function() {
		difficulty.value = config.custom ? "custom" : config.difficulty;
		load();
	});
	
	customDialog.querySelector("form").addEventListener("submit", function(e) {
		e.preventDefault();
		var height = parseInt(document.getElementById("height-entry").value);
		var width = parseInt(document.getElementById("width-entry").value);
		var mines = parseInt(document.getElementById("mines-entry").value);
		
		if(isNaN(height)) {
			height = 9;
		}
		if(isNaN(width)) {
			width = 9;
		}
		if(isNaN(mines)) {
			mines = 10;
		}
		
		height = Math.max(9, Math.min(height, 24));
		width = Math.max(9, Math.min(width, 30));
		mines = Math.max(10, Math.min(mines, (height - 1) * (width - 1)));
		
		config.custom = true;
		config.difficulty = width + "," + height + "," + mines;
		localStorage.setItem("options",JSON.stringify(config));
		hideDialog("custom-dialog");
		load();
	});
	
	load();
});

document.addEventListener("mouseup", function(e) {
	if(e.which == 1) {
		if(!endGame) {
			faceTag.style.backgroundPosition = "0px -110px";
		}
		
		if(isTilePressed) {
			isTilePressed = false;
			pressedTile.elem.style.backgroundPosition = pressedTile.isMarked ? "-160px -32px" : "0px -32px";
		}
	}
});

// functions
function load() {
	// set up game state
	var arr = config.difficulty.split(",");
	var params = {
		cols: parseInt(arr[0]),
		rows: parseInt(arr[1]),
		flags: parseInt(arr[2]),
		mines: parseInt(arr[2])
	};
	var grid = new Grid(params.cols, params.rows);
	
	loadHeader(params);
	loadBoard(params, grid);
	loadGrid(params, grid);
}

function loadHeader(params) {
	// set up game header
	endGame = false;
	timer.stop();
	timer.clear();
	
	faceTag.style.backgroundPosition = "0px -110px";
	
	game.width = 32 * params.cols;
	game.height = 32 * params.rows;
	tilesCovered = params.rows * params.cols;
	
	var mineText = digitFormat(params.flags, 3);
	var digitTags = minesTag.children;
	
	for(var i = 0; i < digitTags.length; i++) {
		digitTags[i].style.backgroundPosition = -26 * parseInt(mineText.charAt(i)) + "px -64px";
	}
}

function loadBoard(params, grid) {
	// set up game board
	var isFirstMove = true;
	
	while(game.firstChild){
		game.removeChild(game.firstChild);
	}
	
	for(var row = 0; row < params.rows; row++) {
		var tr = document.createElement("tr");
		
		for(var col = 0; col < params.cols; col++) {
			var td = document.createElement("td");
			
			td.id = col + "," + row;
			
			td.addEventListener("contextmenu", function(e) {
				e.preventDefault();
			});
			
			td.addEventListener("mousedown", function(e) {
				var LMB = 1;	// left mouse button
				var RMB = 3;	// right mouse button
				var tilePos = parsePoint(this.id);
				var tile = grid.get(tilePos.x, tilePos.y);
				
				if(endGame) {
					return;
				}
				
				switch(e.which) {
					case LMB:
						faceTag.style.backgroundPosition = "-96px -110px";
						
						if(!tile.isFlagged && tile.isCovered) {
							isTilePressed = true;
							pressedTile = tile;
							tile.elem.style.backgroundPosition = tile.isMarked ? "-192px -32px" : "0px 0px";
						}
						
						break;
					
					case RMB:
						if(tile.isCovered) {
							if(typeof navigator.vibrate == "function") {
								navigator.vibrate(100);
							}
							
							if(isMarksEnabled) {
								if(tile.isFlagged) {
									tile.isFlagged = false;
									params.flags++;
									tile.isMarked = true;
									tile.elem.style.backgroundPosition = "-160px -32px";
								} else if(tile.isMarked) {
									tile.isMarked = false;
									tile.elem.style.backgroundPosition = "0px -32px";
								} else {
									tile.isFlagged = true;
									params.flags--;
									tile.elem.style.backgroundPosition = "-32px -32px";
								}
							} else {
								tile.isFlagged = !tile.isFlagged;
								tile.elem.style.backgroundPosition = tile.isFlagged ? "-32px -32px" : "0px -32px";
								params.flags += tile.isFlagged ? -1 : 1;
							}
							
							var mineText = digitFormat(params.flags, 3);
							var digitTags = minesTag.children;
							var domain = "0123456789-";
							
							for(var i = 0; i < digitTags.length; i++) {
								digitTags[i].style.backgroundPosition = -26 * domain.indexOf(mineText.charAt(i)) + "px -64px";
							}
						}
						
						break;
				}
			});
			
			td.addEventListener("click", function(e) {
				if(endGame) {
					return;
				}
				
				var tilePos = parsePoint(this.id);
				var tile = grid.get(tilePos.x, tilePos.y);
				
				if(tile.isFlagged || !tile.isCovered) {
					if(isFirstMove) {
						isFirstMove = false;
						timer.start();
					}
					
					return;
				}
				
				if(tile.isMine && !isFirstMove) {
					tile.isCovered = false;
					tile.elem.style.backgroundPosition = "-64px -32px";
					
					for(var i = 0; i < grid.width; i++) {
						for(var j = 0; j < grid.height; j++) {
							var tempTile = grid.get(i, j);
							
							if(tempTile.isMine && tempTile.elem.id != tile.elem.id && !tempTile.isFlagged) {
								tempTile.isCovered = false;
								tempTile.elem.style.backgroundPosition = "-128px -32px";
							}
							
							if(tempTile.isFlagged && !tempTile.isMine) {
								tempTile.isCovered = false;
								tempTile.elem.style.backgroundPosition = "-96px -32px";
							}
						}
					}
					
					timer.stop();
					faceTag.style.backgroundPosition = "-144px -110px";
					endGame = true;
				} else {
					if(tile.isMine && isFirstMove) {
						isFirstMove = false;
						timer.start();
						
						var emptyTile = findEmptyTile(grid);
						var emptyTilePos = parsePoint(emptyTile.elem.id);
						
						emptyTile.isMine = true;
						emptyTile.elem.setAttribute("data-mine", true);
						
						for(var h = -1; h <= 1; h++) {
							for(var k = -1; k <= 1; k++) {
								if(grid.hasPoint(emptyTilePos.x + h, emptyTilePos.y + k) && !(h == 0 && k == 0)) {
									grid.get(emptyTilePos.x + h, emptyTilePos.y + k).proximity++;
								}
							}
						}
						
						tile.isMine = false;
						tile.elem.removeAttribute("data-mine");
						
						for(var h = -1; h <= 1; h++) {
							for(var k = -1; k <= 1; k++) {
								if(grid.hasPoint(tilePos.x + h, tilePos.y + k) && !(h == 0 && k == 0)) {
									grid.get(tilePos.x + h, tilePos.y + k).proximity--;
								}
							}
						}
					} else {
						if(isFirstMove) {
							isFirstMove = false;
							timer.start();
						}
					}
					
					floodTiles(tile, grid);
					
					if(tilesCovered == params.mines) {
						timer.stop();
						faceTag.style.backgroundPosition = "-192px -110px";
						endGame = true;
					}
				}
			});
			
			tr.appendChild(td);
		}
		
		game.appendChild(tr);
	}
}

function loadGrid(params, grid) {
	for(var x = 0; x < grid.width; x++) {
		for(var y = 0; y < grid.height; y++) {
			// fill with covered, unflagged, unmarked, neighborless, mineless tiles
			grid.set(x, y, new Tile(true, false, false, 0, false, document.getElementById(x + "," + y)));
			grid.get(x, y).elem.style.backgroundPosition = "0px -32px";
		}
	}
	
	// set mines
	for(var i = 0; i < params.mines; i++) {
		var mine = {x: 0, y: 0};
		
		do {
			mine.x = Math.floor(Math.random() * grid.width);
			mine.y = Math.floor(Math.random() * grid.height);
		} while(grid.get(mine.x, mine.y).isMine);
		
		grid.get(mine.x, mine.y).isMine = true;
		grid.get(mine.x, mine.y).elem.setAttribute("data-mine", true);
	}
	
	// set proximities
	for(var x = 0; x < grid.width; x++) {
		for(var y = 0; y < grid.height; y++) {
			var tile = grid.get(x, y);
			
			tile.proximity = 0;
			
			for(var h = -1; h <= 1; h++) {
				for(var k = -1; k <= 1; k++) {
					if(grid.hasPoint(x + h, y + k) && !(h == 0 && k == 0)) {
						tile.proximity += grid.get(x + h, y + k).isMine ? 1 : 0;
					}
				}
			}
		}
	}
}

function floodTiles(firstTile, grid) {
	var stack = [];
	stack.push(firstTile);
	
	while(stack.length != 0) {
		var tile = stack.pop();
		
		if(tile.isCovered && !tile.isFlagged) {
			tile.isCovered = false;
			tilesCovered--;
			tile.elem.style.backgroundPosition = -32 * tile.proximity + "px 0px";
			
			if(tile.proximity == 0) {
				var tilePos = parsePoint(tile.elem.id);
				
				for(var h = -1; h <= 1; h++) {
					for(var k = -1; k <= 1; k++) {
						if(grid.hasPoint(tilePos.x + h, tilePos.y + k) && !(h == 0 && k == 0)) {
							stack.push(grid.get(tilePos.x + h, tilePos.y + k));
						}
					}
				}
			}
		}
	}
}

function findEmptyTile(grid) {
	for(var y = 0; y < grid.height; y++) {
		for(var x = 0; x < grid.width; x++) {
			if(!grid.get(x, y).isMine) {
				return grid.get(x, y);
			}
		}
	}
	
	return null;
}

function digitFormat(n, d) {
	var temp = "";
	
	if(n < 0) {
		for(var i = 1; i <= d - 2; i++) {
			temp += "0";
		}
		
		temp += Math.abs(n);
		
		return "-" + temp.slice(1 - d);
	} else {
		for(var i = 1; i <= d - 1; i++) {
			temp += "0";
		}
		
		temp += n;
		
		return temp.slice(-d);
	}
}

function parsePoint(point) {
	var arr = point.split(",");
	
	return {
		x: parseInt(arr[0]),
		y: parseInt(arr[1])
	};
}

// Objects
function Grid(w, h) {
	this.width = w;
	this.height = h;
	this.gridData = new Array(w * h);
	
	this.set = function(x, y, val) {
		this.gridData[x + y * this.width] = val;
	};
	
	this.get = function(x, y) {
		return this.gridData[x + y * this.width];
	};
	
	this.hasPoint = function(x, y) {
		return x >= 0 && x < this.width && y >= 0 && y < this.height;
	};
}

function Tile(co, fl, ma, pr, mi, el) {
	this.isCovered = co;
	this.isFlagged = fl;
	this.isMarked = ma;
	this.proximity = pr;
	this.isMine = mi;
	this.elem = el;
}