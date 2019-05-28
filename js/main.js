'use strict';
const START = '🙂';
const LOOSE = '😒';
const WIN = '😏';
const MINE = '☠️';
const FLAG = '🚩';
const HINT = '💡';

var gGame;
var gLevels = {
    Beginner: { level: 4, Minutes: 2, Mines: 4 },
    Medium: { level: 8, Minutes: 12, Mines: 15 },
    Expert: { level: 12, Minutes: 30, Mines: 30 }
};
var gSizeMat = gLevels.Beginner.level;
var gBoard = [];
var gTimeInterval;
var gCountMines = gLevels.Beginner.Mines;
var gHintOn;
var gLevel;



function initGame() {
    clearInterval(gTimeInterval);
    document.querySelector('.restart').innerText = START;
    document.querySelector('.msg').innerText = '';
    gGame = { isOn: true, shownCount: 0, markedCount: 0, secsPassed: 0, lives: 3, hints: 3 };
    document.querySelector('.lives').innerText = `${gGame.lives} Lives left`;
    document.querySelector('.hints1').innerText = HINT;
    document.querySelector('.hints2').innerText = HINT;
    document.querySelector('.hints3').innerText = HINT;
    gHintOn = false;
    document.querySelector('.time').innerText = `Time: ${gGame.secsPassed}`;
    gBoard = buildBoard(gSizeMat);
    renderBoard(gBoard);
    setGameAgain();
}


function setGameAgain() {
    for (var i = 0; i < gBoard.length; i++) {
        for (var j = 0; j < gBoard[0].length; j++) {
            gBoard[i][j].isShown = false;
            document.querySelector(`.cell-${i}-${j}`).classList.remove('open');
            renderCell({ i: i, j: j }, '');
        }
    }
}


function levelChoice(elBtn) {
    var levelName = elBtn.innerText;
    gLevel = gLevels[levelName];
    gSizeMat = gLevels[levelName].level;
    gCountMines = gLevels[levelName].Mines;
    initGame();
}


function restart(elBtn) {
    initGame();
}

function setHint(elbtn) {
    if (!gGame.isOn) return
    elbtn.innerText = '';
    gHintOn = true;
}


function buildBoard(size) {
    var board = [];
    for (var i = 0; i < size; i++) {
        board[i] = [];
        for (var j = 0; j < size; j++) {
            board[i][j] = { minesAroundCount: 0, isShown: false, isMine: false, isMarked: false };
        }
    }
    return board;
}


function setMines(board, { i: i, j: j }) {
    var countMines = gCountMines;
    while (countMines > 0) {
        var idxI = getRandomIntInclusive(0, board.length - 1);
        var idxj = getRandomIntInclusive(0, board.length - 1);
        if (idxI === i && idxj === j) continue;
        if (idxI === i - 1 && idxj === j) continue;
        if (idxI === i + 1 && idxj === j) continue;
        if (idxI === i && idxj === j - 1) continue;
        if (idxI === i && idxj === j + 1) continue;
        if (idxI === i - 1 && idxj === j - 1) continue;
        if (idxI === i - 1 && idxj === j + 1) continue;
        if (idxI === i + 1 && idxj === j - 1) continue;
        if (idxI === i + 1 && idxj === j + 1) continue;
        if (board[idxI][idxj].isMine === true) continue;
        board[idxI][idxj].isMine = true;
        countMines--;
    }
}


function getMinesNegsCountAround(board, location) {
    var count = 0;
    for (var i = location.i - 1; i <= location.i + 1; i++) {
        for (var j = location.j - 1; j <= location.j + 1; j++) {
            if (i === location.i && j === location.j) continue;
            if (i < 0 || i > board.length - 1) continue;
            if (j < 0 || j > board[0].length - 1) continue;
            var cell = board[i][j];
            if (cell.isMine) count++;
        }
    }
    return count;
}


function renderBoard(board) {
    var strHTML = '<table><tbody>';
    for (var i = 0; i < board.length; i++) {
        strHTML += '<tr>';
        for (var j = 0; j < board[0].length; j++) {
            var cell = `<td class="cell cell-${i}-${j}" onclick="cellClicked(this, ${i}, ${j})" onContextMenu="cellMarked(event, ${i}, ${j})">${board[i][j].value}</td>`;
            strHTML += cell;
        }
        strHTML += '</tr>';
    }
    strHTML += '</tbody></table>';
    document.querySelector('.board').innerHTML = strHTML;
}


function cellClicked(elCell, i, j) {
    if (!gGame.isOn) return;
    if (gBoard[i][j].isMarked) return;

    document.querySelector(`.cell-${i}-${j}`).classList.add('open');
    gBoard[i][j].isShown = true;
    gGame.shownCount++;

    if (gGame.shownCount === 1) {
        gTimeInterval = setInterval(function () {
            gGame.secsPassed++;
            document.querySelector('.time').innerText = `Time: ${gGame.secsPassed}`;
            checkTime();
        }, 1000);
        setMines(gBoard, { i: i, j: j });
    }

    if (gHintOn) {
        playWithHint({ i: i, j: j });
        gHintOn = false;
        return;
    }


    if (gBoard[i][j].isMine === true) {
        gGame.lives--;
        document.querySelector('.lives').innerText = `${gGame.lives} Lives left`;
        renderCell({ i: i, j: j }, MINE);
        var count = checkCountMinesShow(gBoard);
        if (count > 3) {
            document.querySelector('.lives').innerText = '';
            gameOver(gBoard);
            return;
        }
    }

    var countMinesNegs = getMinesNegsCountAround(gBoard, { i: i, j: j });

    if (gBoard[i][j].isMine === false && countMinesNegs === 0) {
        expandShown(gBoard, { i: i, j: j })
    } else if (gBoard[i][j].isMine === false && countMinesNegs > 0) {
        renderCell({ i: i, j: j }, countMinesNegs);
        gBoard[i][j].minesAroundCount = countMinesNegs;
    }

    if (checkVictory(gBoard)) victory();
}


function expandShown(board, location) {
    var elCell = document.querySelector(`.cell-${location.i}-${location.j}`);
    for (var i = location.i - 1; i <= location.i + 1; i++) {
        for (var j = location.j - 1; j <= location.j + 1; j++) {
            if (i < 0 || i > board.length - 1) continue;
            if (j < 0 || j > board[0].length - 1) continue;
            if (board[i][j].isMarked === true) continue;
            if (i === location.i && j === location.j) continue;

            if (board[i][j].isShown === false) cellClicked(elCell, i, j);
        }
    }
}


function cellMarked(ev, i, j) {
    ev.preventDefault();
    if (!gGame.isOn) return;
    if (ev.button === 2) {
        if (gBoard[i][j].isMarked === false && gBoard[i][j].isShown === false) {
            gGame.markedCount++;
            gBoard[i][j].isMarked = true;
            renderCell({ i: i, j: j }, FLAG);
        } else if (gBoard[i][j].isMarked === true) {
            gGame.markedCount--;
            gBoard[i][j].isMarked = false;
            renderCell({ i: i, j: j }, '');
        }
    }
    if (checkVictory(gBoard)) victory();
}


function playWithHint(location) {
    var negs = [];
    for (var i = location.i - 1; i <= location.i + 1; i++) {
        for (var j = location.j - 1; j <= location.j + 1; j++) {
            if (i < 0 || i > gBoard.length - 1) continue;
            if (j < 0 || j > gBoard[0].length - 1) continue;
            if (gBoard[i][j].isShown === true) continue;
            if (gBoard[i][j].isMarked) {
                gBoard[i][j].isMarked = false;
                renderCell({ i: i, j: j }, '');
            }
            if (gBoard[i][j].isMine) renderCell({ i: i, j: j }, MINE);
            if (gBoard[location.i][location.j].isMine) renderCell({ i: location.i, j: location.j }, MINE);
            gBoard[i][j].isShown = true;
            document.querySelector(`.cell-${i}-${j}`).classList.add('open');
            negs.push({ i: i, j: j });
        }
    }
    setTimeout(function () {
        negs.push(location);
        for (var i = 0; i < negs.length; i++) {
            gBoard[negs[i].i][negs[i].j].isShown = false;
            document.querySelector(`.cell-${negs[i].i}-${negs[i].j}`).classList.remove('open');
            if (gBoard[negs[i].i][negs[i].j].isMine === true) renderCell({ i: negs[i].i, j: negs[i].j }, '');
        }
    }, 1000);
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
                renderCell({ i: i, j: j }, MINE);
            } else {
                document.querySelector(`.cell-${i}-${j}`).classList.add('open');

            }
        }
    }
}


function checkVictory(board) {
    for (var i = 0; i < board.length; i++) {
        for (var j = 0; j < board[0].length; j++) {
            if (board[i][j].isMine === false && board[i][j].isMarked === true) return false;
            if (board[i][j].isShown === false && board[i][j].isMarked === false) return false;
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


function checkTime() {

    if (gGame.secsPassed > gLevel.Minutes * 60) {
        document.querySelector('.lives').innerText = '';
        gameOver(gBoard);
    }
}


function renderCell(location, value) {
    document.querySelector(`.cell-${location.i}-${location.j}`).innerHTML = value;
}


function getRandomIntInclusive(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}