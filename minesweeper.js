"use strict";
//TODO:
//fix timer setup
//fix variable names
//fix Map object
//keep everything in a low scope

var game,tilesCovered,minesTag,faceTag,timeTag,isMarksEnabled,pressedTile;
var endGame = false;
var isTilePressed = false;
var timer = {
	t: 0,
	resume: function() {
		if(this.clock!==null) {
			return;
		}
		this.clock = setInterval(function(self) {
			self.t++;
			var timeText = digitFormat(Math.min(self.t,999),3);
			var digitTags = timeTag.children;
			for(var i=0; i<digitTags.length; i++) {
				digitTags[i].style.backgroundPosition = -26*parseInt(timeText.charAt(i))+"px -64px";
			}
		},1000,this);
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
		for(var i=0; i<digitTags.length; i++) {
			digitTags[i].style.backgroundPosition = "0px -64px";
		}
	},
	clock: null
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
localStorage.setItem("options",JSON.stringify(config));

//event listeners
window.addEventListener("load",function() {
	var ids = ["width-entry","height-entry","mines-entry"];
	var difficulty = document.getElementById("difficulty");
	var customDialog = document.getElementById("custom-dialog");
	var marks = document.getElementById("marks");
	var zoom = document.getElementById("zoom");
	
	difficulty.value = (config.custom)?"custom":config.difficulty;
	
	marks.checked = config.marks;
	zoom.value = config.zoom;
	document.getElementById("gamewrapper").style.zoom = config.zoom;
	isMarksEnabled = config.marks;
	
	game = document.getElementById("game");
	faceTag = document.getElementById("face-display").firstElementChild;
	minesTag = document.getElementById("mines-display");
	timeTag = document.getElementById("time-display");
	
	zoom.addEventListener("change",function() {
		document.getElementById("gamewrapper").style.zoom = this.value;
		config.zoom = this.value;
		localStorage.setItem("options",JSON.stringify(config));
	});
	difficulty.addEventListener("change",function() {
		if(this.value=="custom") {
			config.difficulty.split(",").forEach(function(value,index) {
				document.getElementById(ids[index]).value = value;
			});
			showDialog("custom-dialog");
		} else {
			config.custom = false;
			config.difficulty = this.value;
			localStorage.setItem("options",JSON.stringify(config));
			load();
		}
	});
	faceTag.addEventListener("mousedown",function(){this.style.backgroundPosition = "-48px -110px";});
	faceTag.addEventListener("click",function() {
		timer.stop();
		if(config.custom) {
			config.difficulty.split(",").forEach(function(value,index) {
				document.getElementById(ids[index]).value = value;
			});
			showDialog("custom-dialog");
		} else {
			load();
		}
	});
	marks.addEventListener("change",function() {
		isMarksEnabled = this.checked;
		config.marks = this.checked;
		localStorage.setItem("options",JSON.stringify(config));
	});
	document.addEventListener("keydown",function(e) {
		if(e.keyCode==17) {
			game.setAttribute("data-cheat",true);
		}
	});
	document.addEventListener("keyup",function(e) {
		if(e.keyCode==17) {
			game.removeAttribute("data-cheat");
		}
	});
	customDialog.addEventListener("hidedialog",function(elem) {
		difficulty.value = (config.custom)?"custom":config.difficulty;
		load();
	});
	customDialog.querySelector("form").addEventListener("submit",function(e) {
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
		height = Math.max(9,Math.min(height,24));
		width = Math.max(9,Math.min(width,30));
		mines = Math.max(10,Math.min(mines,(height-1)*(width-1)));
		
		config.custom = true;
		config.difficulty = width+","+height+","+mines;
		localStorage.setItem("options",JSON.stringify(config));
		hideDialog("custom-dialog");
		load();
	});
	
	load();
});
document.addEventListener("mouseup",function(e) {
	if(e.which==1) {
		if(!endGame) {
			faceTag.style.backgroundPosition = "0px -110px";
		}
		if(isTilePressed) {
			isTilePressed = false;
			pressedTile.elem.style.backgroundPosition = (pressedTile.isMarked)?"-160px -32px":"0px -32px";
		}
	}
});

//functions
function load() {
	//set up mode
	var rows,cols,mines,diff,map,flags;
	var isFirstMove = true;
	endGame = false;
	timer.stop();
	timer.clear();
	faceTag.style.backgroundPosition = "0px -110px";
	diff = config.difficulty.split(",");
	diff.forEach(function(value,index,array) {
		array[index] = parseInt(value);
	});
	cols = diff[0];
	rows = diff[1];
	flags = diff[2];
	mines = diff[2];
	game.width = 32*cols;
	game.height = 32*rows;
	tilesCovered = diff[0]*diff[1];
	
	var mineText = digitFormat(flags,3);
	var digitTags = minesTag.children;
	for(var i=0; i<digitTags.length; i++) {
		digitTags[i].style.backgroundPosition = -26*parseInt(mineText.charAt(i))+"px -64px";
	}
	
	//set up playing field
	while(game.firstChild){
		game.removeChild(game.firstChild);
	}
	for(var row=0; row<rows; row++) {
		var tr = document.createElement("tr");
		for(var col=0; col<cols; col++) {
			var td = document.createElement("td");
			td.id = col+","+row;
			td.addEventListener("contextmenu",function(e){e.preventDefault();});
			td.addEventListener("mousedown",function(e) {
				if(endGame) {
					return;
				}
				
				var theId = this.id.split(",");
				theId.forEach(function(value,index,array) {
					array[index] = parseInt(value);
				});
				var tile = map.get(theId[0],theId[1]);
				switch(e.which) {
					case 1:	//LMB
					faceTag.style.backgroundPosition = "-96px -110px";
					if(!tile.isFlagged&&tile.isCovered) {
						isTilePressed = true;
						pressedTile = tile;
						tile.elem.style.backgroundPosition = (tile.isMarked)?"-192px -32px":"0px 0px";
					}
					break;
					
					case 3:	//RMB
					if(tile.isCovered) {
						if(typeof navigator.vibrate=="function") {
							navigator.vibrate(100);
						}
						if(isMarksEnabled) {
							if(tile.isFlagged) {
								tile.isFlagged = false;
								flags++;
								tile.isMarked = true;
								tile.elem.style.backgroundPosition = "-160px -32px";
							} else if(tile.isMarked) {
								tile.isMarked = false;
								tile.elem.style.backgroundPosition = "0px -32px";
							} else {
								tile.isFlagged = true;
								flags--;
								tile.elem.style.backgroundPosition = "-32px -32px";
							}
						} else {
							tile.isFlagged = !tile.isFlagged;
							tile.elem.style.backgroundPosition = (tile.isFlagged)?"-32px -32px":"0px -32px";
							flags+=(tile.isFlagged)?-1:1;
						}
						var mineText = digitFormat(flags,3);
						var digitTags = minesTag.children;
						var domain = "0123456789-";
						for(var i=0; i<digitTags.length; i++) {
							digitTags[i].style.backgroundPosition = -26*domain.indexOf(mineText.charAt(i))+"px -64px";
						}
					}
					break;
				}
			});
			td.addEventListener("click",function(e) {
				if(endGame) {
					return;
				}
				
				var theId = this.id.split(",");
				var x,y;
				theId.forEach(function(value,index,array) {
					array[index] = parseInt(value);
				});
				x = theId[0];
				y = theId[1];
				var tile = map.get(x,y);
				if(tile.isFlagged||!tile.isCovered) {
					if(isFirstMove) {
						isFirstMove = false;
						timer.start();
					}
					return;
				} else if(tile.isMine&&!isFirstMove) {
					tile.isCovered = false;
					tile.elem.style.backgroundPosition = "-64px -32px";
					for(var i=0; i<map.width; i++) {
						for(var j=0; j<map.height; j++) {
							var tempTile = map.get(i,j);
							if(tempTile.isMine&&tempTile.elem.id!=tile.elem.id&&!tempTile.isFlagged) {
								tempTile.isCovered = false;
								tempTile.elem.style.backgroundPosition = "-128px -32px";
							}
							if(tempTile.isFlagged&&!tempTile.isMine) {
								tempTile.isCovered = false;
								tempTile.elem.style.backgroundPosition = "-96px -32px";
							}
						}
					}
					timer.stop();
					faceTag.style.backgroundPosition = "-144px -110px";
					endGame = true;
				} else {
					if(tile.isMine&&isFirstMove) {
						isFirstMove = false;
						timer.start();
						
						var theTile = map.getNextEmptyTile();
						
						var theTileId = theTile.elem.id.split(",");
						theTileId.forEach(function(value,index,array) {
							array[index] = parseInt(value);
						});
						theTile.isMine = true;
						theTile.elem.setAttribute("data-mine",true);
						for(var h=-1; h<=1; h++) {
							for(var k=-1; k<=1; k++) {
								if(!(theTileId[0]+h<0||theTileId[0]+h>map.width-1||theTileId[1]+k<0||theTileId[1]+k>map.height-1||(h==0&&k==0))) {
									map.get(theTileId[0]+h,theTileId[1]+k).proximity++;
								}
							}
						}
						
						tile.isMine = false;
						tile.elem.removeAttribute("data-mine");
						for(var h=-1; h<=1; h++) {
							for(var k=-1; k<=1; k++) {
								if(!(x+h<0||x+h>map.width-1||y+k<0||y+k>map.height-1||(h==0&&k==0))) {
									map.get(x+h,x+k).proximity--;
								}
							}
						}
					} else {
						if(isFirstMove) {
							isFirstMove = false;
							timer.start();
						}
					}
					map.bfs(tile);
					
					if(tilesCovered==mines) {
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
	
	//set up map
	map = new Map(cols,rows);
	map.init();
	
	//set mines
	for(var i=0; i<mines; i++) {
		var mine = {x:0,y:0};
		do {
			mine.x = Math.floor(Math.random()*map.width);
			mine.y = Math.floor(Math.random()*map.height);
		} while(map.get(mine.x,mine.y).isMine);
		map.get(mine.x,mine.y).isMine = true;
		map.get(mine.x,mine.y).elem.setAttribute("data-mine",true);
	}
	
	//set proximities
	for(var x=0; x<map.width; x++) {
		for(var y=0; y<map.height; y++) {
			var tile = map.get(x,y);
			tile.proximity = 0;
			for(var h=-1; h<=1; h++) {
				for(var k=-1; k<=1; k++) {
					if(!(x+h<0||x+h>map.width-1||y+k<0||y+k>map.height-1||(h==0&&k==0))) {
						tile.proximity+=(map.get(x+h,y+k).isMine)?1:0;
					}
				}
			}
		}
	}
}

function digitFormat(n,d) {
	var temp = "";
	if(n<0) {
		for(var i=1; i<=d-2; i++) {
			temp+="0";
		}
		temp += Math.abs(n);
		return "-"+temp.slice(1-d);
	} else {
		for(var i=1; i<=d-1; i++) {
			temp+="0";
		}
		temp+=n;
		return temp.slice(-d);
	}
}

//Objects
function Map(w,h) {
	this.width = w;
	this.height = h;
	this.mapData = [];
	this.init = function() {
		this.mapData = [];
		for(var x=0; x<this.width; x++) {
			for(var y=0; y<this.height; y++) {
				this.set(new Tile(true,false,false,0,false,document.getElementById(x+","+y)),x,y);
				this.get(x,y).elem.style.backgroundPosition = "0px -32px";
			}
		}
	};
	this.bfs = function(firstTile) {
		var queue = new Queue();
		queue.enqueue(firstTile);
		
		while(!queue.isEmpty()) {
			var tile = queue.dequeue();
			
			if(tile.isCovered&&!tile.isFlagged) {
				tile.isCovered = false;
				tilesCovered--;
				tile.elem.style.backgroundPosition = -32*tile.proximity+"px 0px";
				
				if(tile.proximity==0) {
					var pair = tile.elem.id.split(",");
					var x = parseInt(pair[0]);
					var y = parseInt(pair[1]);
					
					for(var h=-1; h<=1; h++) {
						for(var k=-1; k<=1; k++) {
							if(!(h==0&&k==0)&&x+h>=0&&x+h<this.width&&y+k>=0&&y+k<this.height) {
								queue.enqueue(this.get(x+h,y+k));
							}
						}
					}
				}
			}
		}
	};
	this.getNextEmptyTile = function() {
		for(var y=0; y<this.height; y++) {
			for(var x=0; x<this.width; x++) {
				if(!this.get(x,y).isMine) {
					return this.get(x,y);
				}
			}
		}
		return null;
	};
	this.set = function(val,x,y) {
		this.mapData[x+y*this.width] = val;
	};
	this.get = function(x,y) {
		return this.mapData[x+y*this.width];
	};
}

function Tile(co,fl,ma,pr,mi,el) {
	this.isCovered = co;
	this.isFlagged = fl;
	this.isMarked = ma;
	this.proximity = pr;
	this.isMine = mi;
	this.elem = el;
}

function Queue() {
	this.array = [];
	this.enqueue = function(data) {
		this.array.push(data);
	};
	this.dequeue = function() {
		return this.array.shift();
	};
	this.isEmpty = function() {
		return this.array.length==0;
	};
}