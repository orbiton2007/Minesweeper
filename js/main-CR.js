'use strict';
const START = '🙂';
const LOOSE = '😒';
const WIN = '😏';
const MINE = '☠️';
const FLAG = '🚩';
const OPEN = '⬜';

var gGame = { isOn: false, shownCount: 0, markedCount: 0, secsPassed: 0 };
var gLevels = {
    Beginner: { level: 4, Mins: 2 },
    Medium: { level: 8, Mins: 12 },
    Expert: { level: 12, Mins: 30 }
};
var gSizeMat = gLevels.Beginner.level;
var gBoard = [];
var gTimeInterval;



function initGame() {
    // CR: All this buttons can sit in the html, there's no need to render them dinamically from the js.
    clearInterval(gTimeInterval);
    var strHTMLB = '<button class="beginner" onclick="levelChoice(this)">Beginner</button>';
    var strHTMLM = '<button class="medium" onclick="levelChoice(this)">Medium</button>';
    var strHTMLE = '<button class="expert" onclick="levelChoice(this)">Expert</button>';
    document.querySelector('.Beginner').innerHTML = strHTMLB;
    document.querySelector('.Medium').innerHTML = strHTMLM;
    document.querySelector('.Expert').innerHTML = strHTMLE;
    document.querySelector('.restart').innerText = START;
    document.querySelector('.msg').innerText = '';
    gGame = { isOn: true, shownCount: 0, markedCount: 0, secsPassed: 0 };
    document.querySelector('.time').innerText = `Time: ${gGame.secsPassed}`;
    gBoard = buildBoard(gSizeMat);
    renderBoard(gBoard);

    for (var i = 0; i < gBoard.length; i++) {
        for (var j = 0; j < gBoard[0].length; j++) {
            gBoard[i][j].isShown = false;
            if (gBoard[i][j].isMine === true) {
                renderCell({ i: i, j: j }, '');
                gBoard[i][j].value = '';
            } else {
                document.querySelector(`.cell-${i}-${j}`).classList.remove('open');
                renderCell({ i: i, j: j }, '');
                gBoard[i][j].value = '';
            }
        }
    }
}

function levelChoice(elBtn) {
    var level = elBtn.innerText;
    gSizeMat = gLevels[level].level
    initGame();
}

function restart(elBtn) {
    initGame();
}

function buildBoard(size) {
    // CR: there was supposed to be a constant number of mines for each size of the game levels.
    var board = [];
    for (var i = 0; i < size; i++) {
        board[i] = [];
        for (var j = 0; j < size; j++) {
            board[i][j] = { value: '', minesAroundCount: 0, isShown: false, isMine: false, isMarked: false };
        }
        var numMinesInLine = getRandomIntInclusive(0, size / 2);
        for (var j = 0; j < numMinesInLine; j++) {
            var col = getRandomIntInclusive(0, size-1)
            board[i][col] = { value: '', minesAroundCount: 0, isShown: false, isMine: true, isMarked: false };
        }
    }
    return board;
}

function setMinesNegsCount(board, location) {
    // CR: should be named getMinesNegsCount as you dont set anything in it
    var count = 0;
    for (var i = location.i - 1; i <= location.i + 1; i++) {
        for (var j = location.j - 1; j <= location.j + 1; j++) {
            if (i === location.i && j === location.j) continue;
            if (i < 0 || i > board.length - 1) continue;
            if (j < 0 || j > board[0].length - 1) continue;
            var cell = board[i][j];
            if (cell.isMine === true) count++;
        }
    }
    return count;
}

function renderBoard(board) {
    var strHTML = '<table><tbody>';
    for (var i = 0; i < board.length; i++) {
        strHTML += '<tr>';
        for (var j = 0; j < board[0].length; j++) {
            var cell = `<td class="cell cell-${i}-${j}" onclick="cellClicked(this, ${i}, ${j})" onmouseup="cellMarked(event, ${i}, ${j})">${board[i][j].value}</td>`;
            strHTML += cell;
        }
        strHTML += '</tr>';
    }
    strHTML += '</tbody></table>';
    document.querySelector('.board').innerHTML = strHTML;
}

function cellClicked(elCell, i, j) {
    if (!gGame.isOn) return;
    if (gBoard[i][j].isMarked === true) return;

    gBoard[i][j].isShown = true;
    gGame.shownCount++;

    if (gGame.shownCount === 1) {
        if (gBoard[i][j].isMine === true) gBoard[i][j].isMine = false;
        gGame.isOn = true;
        gTimeInterval = setInterval(function () {
            gGame.secsPassed++;
            document.querySelector('.time').innerText = `Time: ${gGame.secsPassed}`;
        }, 1000);
    }

    if (gBoard[i][j].isMine === true) {
        // CR: you're cell object has both an isMine property as well as a .value = MINE property, it's not necessary
        renderCell({ i: i, j: j }, MINE);
        gBoard[i][j].value = MINE;
        var count = checkCountMinesShow(gBoard);
        if (count > 3) {
            gameOver(gBoard);
            return;
        }
    }

    var countMinesNegs = setMinesNegsCount(gBoard, { i: i, j: j });

    if (gBoard[i][j].isMine === false && countMinesNegs === 0) {
        // CR: no need to check if the cell is not a mine, you already checked for it before.
        expandShown(gBoard, { i: i, j: j })
    } else if (gBoard[i][j].isMine === false && countMinesNegs > 0) {
        // CR: same as above, you just checked if it's a 0, so you can just use an else statement.
        elCell.classList.add('open');
        renderCell({ i: i, j: j }, countMinesNegs);
        gBoard[i][j].value = countMinesNegs;
        gBoard[i][j].minesAroundCount = countMinesNegs;
    }

    if (checkVictory(gBoard)) victory();
}

function expandShown(board, location) {
    for (var i = location.i - 1; i <= location.i + 1; i++) {
        for (var j = location.j - 1; j <= location.j + 1; j++) {
            if (i < 0 || i > board.length - 1) continue;
            if (j < 0 || j > board[0].length - 1) continue;
            if (board[i][j].isMarked === true) continue;
            document.querySelector(`.cell-${i}-${j}`).classList.add('open');
            board[i][j].value = OPEN;

            var countNegs = setMinesNegsCount(board, { i: i, j: j });
            if (countNegs > 0) {
                board[i][j].value = countNegs;
                renderCell({ i: i, j: j }, countNegs);
            }
        }
    }

}

function cellMarked(ev, i, j) {
    if (!gGame.isOn) return;

    // CR: again your model has both an isMarked as well as a .value = FLAG, it's duplicated data.
    if (ev.button === 2) {
        if (gBoard[i][j].isMarked === false && gBoard[i][j].value === '') {
            gGame.markedCount++;
            gBoard[i][j].isMarked = true;
            gBoard[i][j].value = FLAG;
            renderCell({ i: i, j: j }, FLAG);
        } else if (gBoard[i][j].isMarked === true) {
            gGame.markedCount--;
            gBoard[i][j].isMarked = false;
            gBoard[i][j].value = '';
            renderCell({ i: i, j: j }, '');
        }
    }
    if (checkVictory(gBoard)) victory();
}

function checkCountMinesShow(board) {
    var count = 0;
    for (var i = 0; i < board.length; i++) {
        for (var j = 0; j < board[0].length; j++) {
            if (board[i][j].isMine === true && board[i][j].isShown === true) count++;
        }
    }
    return count;
}

function gameOver(board) {
    clearInterval(gTimeInterval);
    gGame.isOn = false;
    document.querySelector('.msg').innerText = 'GAME OVER!'
    document.querySelector('.restart').innerText = LOOSE;

    for (var i = 0; i < board.length; i++) {
        for (var j = 0; j < board[0].length; j++) {
            board[i][j].isShown = true;
            if (board[i][j].isMine === true) {
                board[i][j].value = MINE;
                renderCell({ i: i, j: j }, MINE);
            } else {
                document.querySelector(`.cell-${i}-${j}`).classList.add('open');

            }
        }
    }
}

function    checkVictory(board) {
    for (var i = 0; i < board.length; i++) {
        for (var j = 0; j < board[0].length; j++) {
            if (board[i][j].isMine === false && board[i][j].value === FLAG) return false;
            if (board[i][j].value === '') return false;
        }
    }
    return true;
}

function victory() {
    clearInterval(gTimeInterval);
    gGame.isOn = false;
    document.querySelector('.msg').innerText = 'Well done, you won!'
    document.querySelector('.restart').innerText = WIN;
}

function renderCell(location, value) {
    document.querySelector(`.cell-${location.i}-${location.j}`).innerHTML = value;
}

function getRandomIntInclusive(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}