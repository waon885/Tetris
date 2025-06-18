const canvas = document.getElementById('tetrisCanvas');
const ctx = canvas.getContext('2d');
const nextMinoCanvas = document.getElementById('nextMinoCanvas'); // 追加
const nextMinoCtx = nextMinoCanvas.getContext('2d'); // 追加
const COLS = 10;
const ROWS = 20;
const BLOCK_SIZE = 30;

// ----- 表示要素の取得 -----
const scoreElement = document.getElementById('score');
const levelElement = document.getElementById('level');
const linesElement = document.getElementById('lines'); // 追加
const statusElement = document.getElementById('status'); // 追加
const gameOverMessage = document.getElementById('game-over-message'); // 追加

let board = [];
let dropInterval;
let dropSpeed = 1000;
let score = 0;
let level = 1;
let lines = 0; // 追加
let currentMino;
let nextMino; // 追加
let currentMinoX;
let currentMinoY;
let isPaused = false;
let isGameOver = true; // 追加

function initBoard() {
    for (let row = 0; row < ROWS; row++) {
        board[row] = [];
        for (let col = 0; col < COLS; col++) {
            board[row][col] = 0;
        }
    }
}

function drawBoard() {
    for (let row = 0; row < ROWS; row++) {
        for (let col = 0; col < COLS; col++) {
            drawBlock(ctx, col, row, board[row][col]); 
        }
    }
}

function drawBlock(context, x, y, colorId) { 
    context.fillStyle = getColor(colorId);
    context.fillRect(x * BLOCK_SIZE, y * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
    context.strokeStyle = '#333';
    context.strokeRect(x * BLOCK_SIZE, y * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
}

function getColor(colorId) {
    switch (colorId) {
        case 1: return 'cyan';
        case 2: return 'blue';
        case 3: return 'orange';
        case 4: return 'yellow';
        case 5: return '#00ff00';
        case 6: return 'purple';
        case 7: return 'red';
        default: return '#111'; // 背景色より少し明るい色に変更
    }
}

initBoard();
drawBoard();

const TETROMINOS = {
    'I': [[0, 0, 0, 0], [1, 1, 1, 1], [0, 0, 0, 0], [0, 0, 0, 0]],
    'J': [[2, 0, 0], [2, 2, 2], [0, 0, 0]],
    'L': [[0, 0, 3], [3, 3, 3], [0, 0, 0]],
    'O': [[4, 4], [4, 4]],
    'S': [[0, 5, 5], [5, 5, 0], [0, 0, 0]],
    'T': [[0, 6, 0], [6, 6, 6], [0, 0, 0]],
    'Z': [[7, 7, 0], [0, 7, 7], [0, 0, 0]]
};

const TETROMINO_KEYS = Object.keys(TETROMINOS);

// ----- ミノの生成と描画 -----

function generateNewMino() { // generateRandomMinoをリネームし、ロジック変更
    currentMino = nextMino;
    nextMino = createRandomMino();
    currentMinoX = Math.floor(COLS / 2) - Math.floor(currentMino.shape[0].length / 2);
    currentMinoY = 0;
    drawNextMino();
}

function createRandomMino() {
    const randKey = TETROMINO_KEYS[Math.floor(Math.random() * TETROMINO_KEYS.length)];
    const shape = TETROMINOS[randKey];
    // shapeからcolorIdを正しく取得する
    const colorId = shape.flat().find(val => val !== 0);
    return { shape, colorId };
}

function drawMino() {
    if (!currentMino || isGameOver) return;
    for (let row = 0; row < currentMino.shape.length; row++) {
        for (let col = 0; col < currentMino.shape[row].length; col++) {
            if (currentMino.shape[row][col] !== 0) {
                drawBlock(ctx, currentMinoX + col, currentMinoY + row, currentMino.colorId); 
            }
        }
    }
}

function drawNextMino() { 
    nextMinoCtx.clearRect(0, 0, nextMinoCanvas.width, nextMinoCanvas.height);
    if (!nextMino) return;

    const shape = nextMino.shape;
    const colorId = nextMino.colorId;
    const size = shape.length;
    const startX = (nextMinoCanvas.width / BLOCK_SIZE - size) / 2;
    const startY = (nextMinoCanvas.height / BLOCK_SIZE - size) / 2;

    for (let row = 0; row < size; row++) {
        for (let col = 0; col < size; col++) {
            if (shape[row][col] !== 0) {
                drawBlock(nextMinoCtx, startX + col, startY + row, colorId);
            }
        }
    }
}

// ----- 衝突判定と落下 -----
function MinoCollision(newX, newY, newShape) {
    if (!newShape) newShape = currentMino.shape;
    for (let row = 0; row < newShape.length; row++) {
        for (let col = 0; col < newShape[row].length; col++) {
            if (newShape[row][col] !== 0) {
                const boardX = newX + col;
                const boardY = newY + row;
                if (boardX < 0 || boardX >= COLS || boardY >= ROWS ||
                    (boardY >= 0 && board[boardY][boardX] !== 0)) {
                    return true;
                }
            }
        }
    }
    return false;
}

function dropMino() {
    if (isPaused || isGameOver) return;

    if (!MinoCollision(currentMinoX, currentMinoY + 1)) {
        currentMinoY++;
    } else {
        fixMinoToBoard();
        checkLineClears();
        generateNewMino(); // 修正
        if (MinoCollision(currentMinoX, currentMinoY)) {
            gameOver();
        }
    }
    draw();
}

function fixMinoToBoard() {
    for (let row = 0; row < currentMino.shape.length; row++) {
        for (let col = 0; col < currentMino.shape[row].length; col++) {
            if (currentMino.shape[row][col] !== 0) {
                // ゲームオーバー時にミノが盤面外にはみ出るのを防ぐ
                if (currentMinoY + row >= 0) {
                   board[currentMinoY + row][currentMinoX + col] = currentMino.colorId;
                }
            }
        }
    }
}

// ----- ゲーム制御 -----

function startGame() { // スタートボタンの処理を関数にまとめる
    initBoard();
    score = 0;
    level = 1;
    lines = 0; // 追加
    updateInfo(); // 情報表示を更新
    isPaused = false;
    isGameOver = false; // 変更
    dropSpeed = 1000;
    gameOverMessage.classList.add('hidden'); // ゲームオーバーメッセージを隠す
    statusElement.innerText = 'Playing'; // 追加
    
    // 最初のミノとNEXTミノを生成
    nextMino = createRandomMino();
    generateNewMino();
    
    startGameLoop();
    draw();
}

function startGameLoop() {
    clearInterval(dropInterval);
    dropInterval = setInterval(dropMino, dropSpeed);
}

function gameOver() {
    isGameOver = true; // 変更
    clearInterval(dropInterval);
    gameOverMessage.classList.remove('hidden'); // ゲームオーバーメッセージを表示
    statusElement.innerText = 'Game Over'; // 追加
}

function endGame() {
    isGameOver = true; // 変更
    clearInterval(dropInterval);
    currentMino = null;
    initBoard();
    drawBoard();
    nextMinoCtx.clearRect(0, 0, nextMinoCanvas.width, nextMinoCanvas.height); // NEXTミノもクリア
    score = 0;
    level = 1;
    lines = 0; // 追加
    updateInfo(); // 情報表示を更新
    isPaused = false;
    dropSpeed = 1000;
    gameOverMessage.classList.add('hidden'); // メッセージを隠す
    statusElement.innerText = 'Ready'; // 追加
    document.getElementById('pauseButton').innerText = 'PAUSE'; // ボタンテキストをリセット
}

function togglePause() {
    if (isGameOver) return; // ゲームオーバー時は何もしない
    
    if (isPaused) {
        startGameLoop();
        isPaused = false;
        statusElement.innerText = 'Playing';
        document.getElementById('pauseButton').innerText = 'PAUSE';
    } else {
        clearInterval(dropInterval);
        isPaused = true;
        statusElement.innerText = 'Paused';
        document.getElementById('pauseButton').innerText = 'RESUME';
    }
}


// ----- キー入力 -----
document.addEventListener('keydown', handleKeyPress);

function handleKeyPress(e) {
    if (isPaused || isGameOver) return; // 

    switch (e.key) {
        case 'ArrowLeft':
        case 'a':
            if (!MinoCollision(currentMinoX - 1, currentMinoY)) {
                currentMinoX--;
            }
            break;
        case 'ArrowRight':
        case 'd':
            if (!MinoCollision(currentMinoX + 1, currentMinoY)) {
                currentMinoX++;
            }
            break;
        case 'ArrowDown':
        case 's':
            dropMino(); // 1マス落下させる
            break;
        case ' ': // スペースキーでハードドロップ
            hardDrop();
            break;
        case 'ArrowUp':
        case 'w':
            rotateMino(90);
            break;
        case 'z':
        case 'x':
            rotateMino(-90);
            break;
    }
    draw();
}

function hardDrop() {
    while (!MinoCollision(currentMinoX, currentMinoY + 1)) {
        currentMinoY++;
    }
    // ハードドロップ後に即座に次の処理へ移る
    fixMinoToBoard();
    checkLineClears();
    generateNewMino();
    if (MinoCollision(currentMinoX, currentMinoY)) {
        gameOver();
    }
    draw();
}

// ----- スコア・レベル計算 -----
function checkLineClears() {
    let linesCleared = 0;
    for (let row = ROWS - 1; row >= 0; row--) {
        if (board[row].every(cell => cell !== 0)) {
            linesCleared++;
            board.splice(row, 1);
            board.unshift(new Array(COLS).fill(0));
            row++;
        }
    }
    if (linesCleared > 0) {
        lines += linesCleared; // 消したライン数を加算
        updateScore(linesCleared);
    }
}

function updateScore(cleared) {
    const lineScore = [0, 100, 300, 500, 800];
    score += lineScore[cleared] * level; // レベルに応じてスコア倍率をかける
    // レベルアップのロジック (10ライン消す毎にレベルアップ)
    const newLevel = Math.floor(lines / 10) + 1;
    if (newLevel > level) {
        level = newLevel;
        increaseDropSpeed();
    }
    updateInfo(); // 情報をまとめて更新
}

function updateInfo() { 
    scoreElement.innerText = score;
    levelElement.innerText = level;
    linesElement.innerText = lines;
}


function increaseDropSpeed() {
    if (dropSpeed > 100) {
        dropSpeed = Math.max(100, 1000 - (level - 1) * 50); // レベルに応じて速度を設定
    }
}


// ----- 回転処理 -----
function rotateMino(direction) {
    const originalShape = currentMino.shape;
    let rotatedShape;

    if (direction === 90) {
        rotatedShape = rotateMatrix(originalShape);
    } else if (direction === -90) {
        // 270度回転は90度回転を3回行うのと同じ
        rotatedShape = rotateMatrix(rotateMatrix(rotateMatrix(originalShape)));
    } else {
        return;
    }
    
    // Wall Kick (壁キック) の簡易的な実装
    let kickX = 0;
    if (MinoCollision(currentMinoX, currentMinoY, rotatedShape)) {
        kickX = currentMinoX > COLS / 2 ? -1 : 1; // 壁際にいるか判定
    }

    if (!MinoCollision(currentMinoX + kickX, currentMinoY, rotatedShape)) {
        currentMino.shape = rotatedShape;
        currentMinoX += kickX;
    }
}

function rotateMatrix(matrix) {
    const N = matrix.length;
    const newMatrix = Array.from({ length: N }, () => Array(N).fill(0));
    for (let i = 0; i < N; i++) {
        for (let j = 0; j < N; j++) {
            newMatrix[j][N - 1 - i] = matrix[i][j];
        }
    }
    return newMatrix;
}

// ----- メイン描画関数 -----
function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawBoard();
    drawMino();
}

// ----- イベントリスナー -----
document.getElementById('startButton').addEventListener('click', startGame);
document.getElementById('endGameButton').addEventListener('click', endGame);
document.getElementById('pauseButton').addEventListener('click', togglePause);

// 初期状態の表示
endGame();
