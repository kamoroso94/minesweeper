import Timer from './Timer.js';
import Grid from './Grid.js';
import { createDialog, showDialog, hideDialog } from './dialog.js';

// TODO: add touch support
// TODO: review/simplify game logic

let game, tilesCovered, minesTag, faceTag, timeTag, isMarksEnabled, pressedTile, timer;
let endGame = false;
let isTilePressed = false;
const LMB = 1;  // left mouse button
const RMB = 3;  // right mouse button

const config = {
  custom: false,
  difficulty: '9,9,10',
  marks: false,
  zoom: '1'
};

const options = JSON.parse(localStorage.getItem('options'));
Object.assign(config, options);
localStorage.setItem('options', JSON.stringify(config));

// event listeners
window.addEventListener('load', () => {
  const ids = ['width-entry', 'height-entry', 'mines-entry'];
  const difficulty = document.getElementById('difficulty');
  const customDialog = document.getElementById('custom-dialog');
  const marks = document.getElementById('marks');
  const zoom = document.getElementById('zoom');
  const CTRL_KEY = 17;

  difficulty.value = config.custom ? 'custom' : config.difficulty;

  marks.checked = config.marks;
  zoom.value = config.zoom;
  document.getElementById('gamewrapper').style.zoom = config.zoom;
  isMarksEnabled = config.marks;

  game = document.getElementById('game');
  faceTag = document.getElementById('face-display').firstElementChild;
  minesTag = document.getElementById('mines-display');
  timeTag = document.getElementById('time-display');

  timer = new Timer((time) => {
    const seconds = Math.floor(time / 1000);
    const timeText = digitFormat(Math.min(seconds, 999), 3);
    const digitTags = Array.from(timeTag.children);

    digitTags.forEach((tag, index) => {
      const digitIndex = parseInt(timeText.charAt(index));
      tag.style.backgroundPosition = `${-26 * digitIndex}px -64px`;
    });
  }, 1000);

  zoom.addEventListener('change', () => {
    document.getElementById('gamewrapper').style.zoom = zoom.value;
    config.zoom = zoom.value;
    localStorage.setItem('options', JSON.stringify(config));
  });

  difficulty.addEventListener('change', () => {
    if(difficulty.value == 'custom') {
      config.difficulty.split(',').forEach((value, index) => {
        document.getElementById(ids[index]).value = value;
      });
      showDialog('custom-dialog');
    } else {
      config.custom = false;
      config.difficulty = difficulty.value;
      localStorage.setItem('options', JSON.stringify(config));
      load();
    }
  });

  faceTag.addEventListener('mousedown', () => {
    faceTag.style.backgroundPosition = '-48px -110px';
  });

  faceTag.addEventListener('click', () => {
    timer.pause();

    if(config.custom) {
      config.difficulty.split(',').forEach((value, index) => {
        document.getElementById(ids[index]).value = value;
      });
      showDialog('custom-dialog');
    } else {
      load();
    }
  });

  marks.addEventListener('change', () => {
    isMarksEnabled = marks.checked;
    config.marks = marks.checked;
    localStorage.setItem('options', JSON.stringify(config));
  });

  document.addEventListener('keydown', (event) => {
    if(event.keyCode != CTRL_KEY) return;
    game.dataset.cheat = true;
  });

  document.addEventListener('keyup', (event) => {
    if(event.keyCode != CTRL_KEY) return;
    delete game.dataset.cheat;
  });

  customDialog.addEventListener('hidedialog', () => {
    difficulty.value = config.custom ? 'custom' : config.difficulty;
    load();
  });

  customDialog.querySelector('form').addEventListener('submit', (event) => {
    event.preventDefault();
    let height = parseInt(document.getElementById('height-entry').value);
    let width = parseInt(document.getElementById('width-entry').value);
    let mines = parseInt(document.getElementById('mines-entry').value);

    height = isNaN(height) ? 9 : clamp(height, 9, 24);
    width = isNaN(width) ? 9 : clamp(width, 9, 30);
    mines = isNaN(mines) ? 10 : clamp(mines, 10, (height - 1) * (width - 1));

    config.custom = true;
    config.difficulty = [width, height, mines].join(',');
    localStorage.setItem('options', JSON.stringify(config));
    hideDialog('custom-dialog');
    load();
  });

  load();
});

document.addEventListener('mouseup', (event) => {
  if(event.which != LMB) return;

  if(!endGame) {
    faceTag.style.backgroundPosition = '0px -110px';
  }

  if(isTilePressed) {
    isTilePressed = false;
    pressedTile.elem.style.backgroundPosition = pressedTile.isMarked ? '-160px -32px' : '0px -32px';
  }
});

// functions
function load() {
  // set up game state
  const [cols, rows, mines] = config.difficulty.split(',').map(x => parseInt(x));
  const params = { cols, rows, flags: mines, mines };
  const grid = new Grid(params.cols, params.rows);

  loadHeader(params);
  loadBoard(params, grid);
  loadGrid(params, grid);
}

function loadHeader(params) {
  // set up game header
  endGame = false;
  timer.reset();

  const timeDigitTags = Array.from(timeTag.children);
  for(const tag of timeDigitTags) {
    tag.style.backgroundPosition = '0px -64px';
  }

  faceTag.style.backgroundPosition = '0px -110px';

  tilesCovered = params.rows * params.cols;

  const mineText = digitFormat(params.flags, 3);
  const mineDigitTags = Array.from(minesTag.children);

  mineDigitTags.forEach((tag, index) => {
    const digitIndex = parseInt(mineText.charAt(index));
    tag.style.backgroundPosition = -26 * digitIndex + 'px -64px';
  });
}

function loadBoard(params, grid) {
  // set up game board
  let isFirstMove = true;

  game.width = 32 * params.cols;
  game.height = 32 * params.rows;

  while(game.firstChild) {
    game.removeChild(game.firstChild);
  }

  for(let row = 0; row < params.rows; row++) {
    const tr = document.createElement('tr');

    for(let col = 0; col < params.cols; col++) {
      const td = document.createElement('td');

      td.id = [col, row].join(',');

      td.addEventListener('contextmenu', (event) => event.preventDefault());
      td.addEventListener('mousedown', (event) => {
				if(endGame) return;

				const tilePos = parsePoint(td.id);
        const tile = grid.get(tilePos.x, tilePos.y);

        switch(event.which) {
          case LMB:
          faceTag.style.backgroundPosition = '-96px -110px';

          if(!tile.isFlagged && tile.isCovered) {
            isTilePressed = true;
            pressedTile = tile;
            tile.elem.style.backgroundPosition = tile.isMarked ? '-192px -32px' : '0px 0px';
          }

          break;

          case RMB:
          if(tile.isCovered) {
            if(typeof navigator.vibrate == 'function') {
              navigator.vibrate(100);
            }

            if(isMarksEnabled) {
              if(tile.isFlagged) {
                tile.isFlagged = false;
                params.flags++;
                tile.isMarked = true;
                tile.elem.style.backgroundPosition = '-160px -32px';
              } else if(tile.isMarked) {
                tile.isMarked = false;
                tile.elem.style.backgroundPosition = '0px -32px';
              } else {
                tile.isFlagged = true;
                params.flags--;
                tile.elem.style.backgroundPosition = '-32px -32px';
              }
            } else {
              tile.isFlagged = !tile.isFlagged;
              tile.elem.style.backgroundPosition = tile.isFlagged ? '-32px -32px' : '0px -32px';
              params.flags += tile.isFlagged ? -1 : 1;
            }

            const mineText = digitFormat(params.flags, 3);
            const mineDigitTags = Array.from(minesTag.children);
            const domain = '0123456789-';

            mineDigitTags.forEach((tag, index) => {
              const digitIndex = domain.indexOf(mineText.charAt(index));
              tag.style.backgroundPosition = `${-26 * digitIndex}px -64px`;
            });
          }

          break;
        }
      });

      td.addEventListener('click', () => {
        if(endGame) return;

        const tilePos = parsePoint(td.id);
        const tile = grid.get(tilePos.x, tilePos.y);

        if(tile.isFlagged || !tile.isCovered) {
          if(isFirstMove) {
            isFirstMove = false;
            timer.resume();
          }

          return;
        }

        if(tile.isMine && !isFirstMove) {
          tile.isCovered = false;
          tile.elem.style.backgroundPosition = '-64px -32px';

          for(let i = 0; i < grid.width; i++) {
            for(let j = 0; j < grid.height; j++) {
              const tempTile = grid.get(i, j);

              if(tempTile.isMine && tempTile.elem.id != tile.elem.id && !tempTile.isFlagged) {
                tempTile.isCovered = false;
                tempTile.elem.style.backgroundPosition = '-128px -32px';
              }

              if(tempTile.isFlagged && !tempTile.isMine) {
                tempTile.isCovered = false;
                tempTile.elem.style.backgroundPosition = '-96px -32px';
              }
            }
          }

          timer.pause();
          faceTag.style.backgroundPosition = '-144px -110px';
          endGame = true;
        } else {
          if(tile.isMine && isFirstMove) {
            isFirstMove = false;
            timer.resume();

            const emptyTile = findEmptyTile(grid);
            const emptyTilePos = parsePoint(emptyTile.elem.id);

            emptyTile.isMine = true;
            emptyTile.elem.dataset.mine = true;

            for(let h = -1; h <= 1; h++) {
              for(let k = -1; k <= 1; k++) {
                if(grid.has(emptyTilePos.x + h, emptyTilePos.y + k) && !(h == 0 && k == 0)) {
                  grid.get(emptyTilePos.x + h, emptyTilePos.y + k).proximity++;
                }
              }
            }

            tile.isMine = false;
            delete tile.elem.dataset.mine;

            for(let h = -1; h <= 1; h++) {
              for(let k = -1; k <= 1; k++) {
                if(grid.has(tilePos.x + h, tilePos.y + k) && !(h == 0 && k == 0)) {
                  grid.get(tilePos.x + h, tilePos.y + k).proximity--;
                }
              }
            }
          } else {
            if(isFirstMove) {
              isFirstMove = false;
              timer.resume();
            }
          }

          floodTiles(tile, grid);

          if(tilesCovered == params.mines) {
            timer.pause();
            faceTag.style.backgroundPosition = '-192px -110px';
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
  for(let x = 0; x < grid.width; x++) {
    for(let y = 0; y < grid.height; y++) {
      // fill with covered, unflagged, unmarked, neighborless, mineless tiles
			const id = [x, y].join(',');
      grid.set(x, y, createTile(document.getElementById(id)));
      grid.get(x, y).elem.style.backgroundPosition = '0px -32px';
    }
  }

  // set mines
  for(let i = 0; i < params.mines; i++) {
    const mine = {};
    do {
      mine.x = Math.floor(Math.random() * grid.width);
      mine.y = Math.floor(Math.random() * grid.height);
    } while(grid.get(mine.x, mine.y).isMine);

    grid.get(mine.x, mine.y).isMine = true;
    grid.get(mine.x, mine.y).elem.dataset.mine = true;
  }

  // set proximities
  for(let x = 0; x < grid.width; x++) {
    for(let y = 0; y < grid.height; y++) {
      const tile = grid.get(x, y);

      tile.proximity = 0;

      for(let h = -1; h <= 1; h++) {
        for(let k = -1; k <= 1; k++) {
          if(h == 0 && k == 0) continue;
          if(!grid.has(x + h, y + k)) continue;

          tile.proximity += grid.get(x + h, y + k).isMine ? 1 : 0;
        }
      }
    }
  }
}

function floodTiles(firstTile, grid) {
  const stack = [];
  stack.push(firstTile);

  while(stack.length != 0) {
    const tile = stack.pop();

    if(!tile.isCovered || tile.isFlagged) continue;

    tile.isCovered = false;
    tilesCovered--;
    tile.elem.style.backgroundPosition = `${-32 * tile.proximity}px 0px`;

    if(tile.proximity != 0) continue;

    const tilePos = parsePoint(tile.elem.id);
    for(let h = -1; h <= 1; h++) {
      for(let k = -1; k <= 1; k++) {
        if(h == 0 && k == 0) continue;
        if(!grid.has(tilePos.x + h, tilePos.y + k)) continue;

        stack.push(grid.get(tilePos.x + h, tilePos.y + k));
      }
    }
  }
}

function findEmptyTile(grid) {
  for(let y = 0; y < grid.height; y++) {
    for(let x = 0; x < grid.width; x++) {
      if(!grid.get(x, y).isMine) {
        return grid.get(x, y);
      }
    }
  }

  return null;
}

function digitFormat(n, digits) {
  const result = Math.abs(n).toString().padStart(digits, '0');
  return n < 0 ? '-' + result.slice(1 - digits) : result;
}

function parsePoint(point) {
  const [x, y] = point.split(',').map(x => parseInt(x));
  return {x, y};
}

function clamp(x, min, max) {
	return Math.max(min, Math.min(x, max));
}

function createTile(elem) {
  return {
    isCovered: true,
    isFlagged: false,
    isMarked: false,
    proximity: 0,
    isMine: false,
    elem
  };
}
