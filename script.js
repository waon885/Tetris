const canvas = document.getElementById('tetrisCanvas');
const ctx = canvas.getContext('2d');
const COLS = 10; // 横10列
const ROWS = 20; // 縦20行
const BLOCK_SIZE = 30; // 各ブロックのサイズ

let board = []; // ゲームボードの状態を保持する2D配列
let dropInterval;
let dropSpeed = 1000; // 初期落下速度 (ミリ秒)
let score = 0;
let level = 1;
let currentMino;
let currentMinoX;
let currentMinoY;
let isPaused = false; // ゲームの一時停止状態を管理するフラグ

// ... (既存の関数: initBoard, drawBoard, drawBlock, getColor, TETROMINOS, TETROMINO_KEYS, generateRandomMino, drawMino, MinoCollision, fixMinoToBoard, gameOver, increaseDropSpeed, updateScore, checkLineClears, rotateMino, rotateMatrix はそのまま) ...

function initBoard() {
    for (let row = 0; row < ROWS; row++) {
        board[row] = [];
        for (let col = 0; col < COLS; col++) {
            board[row][col] = 0; // 0は空の状態
        }
    }
}

function drawBoard() {
    for (let row = 0; row < ROWS; row++) {
        for (let col = 0; col < COLS; col++) {
            drawBlock(col, row, board[row][col]);
        }
    }
}

function drawBlock(x, y, colorId) {
    ctx.fillStyle = getColor(colorId); // 色は後で定義
    ctx.fillRect(x * BLOCK_SIZE, y * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
    ctx.strokeStyle = '#333';
    ctx.strokeRect(x * BLOCK_SIZE, y * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
}

function getColor(colorId) {
    // 各ミノの色を定義。ワールドルール通りにする
    switch (colorId) {
        case 1: return 'cyan'; // I
        case 2: return 'blue';  // J
        case 3: return 'orange'; // L
        case 4: return 'yellow'; // O
        case 5: return 'green'; // S
        case 6: return 'purple'; // T
        case 7: return 'red'; // Z
        default: return '#000'; // 空
    }
}

// ゲーム開始時に初期化と描画を行う
initBoard();
drawBoard();

// ミノの形状定義 (ワールドルール通り)
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

function generateRandomMino() {
    const randKey = TETROMINO_KEYS[Math.floor(Math.random() * TETROMINO_KEYS.length)];
    currentMino = {
        shape: TETROMINOS[randKey],
        colorId: TETROMINOS[randKey][0][0]
    };
    currentMinoX = Math.floor(COLS / 2) - Math.floor(currentMino.shape[0].length / 2);
    currentMinoY = 0;
}

function drawMino() {
    if (!currentMino) return;
    for (let row = 0; row < currentMino.shape.length; row++) {
        for (let col = 0; col < currentMino.shape[row].length; col++) {
            if (currentMino.shape[row][col] !== 0) {
                drawBlock(currentMinoX + col, currentMinoY + row, currentMino.colorId);
            }
        }
    }
}

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
    // 一時停止中の場合は何もしない
    if (isPaused) return;

    if (!MinoCollision(currentMinoX, currentMinoY + 1)) {
        currentMinoY++;
    } else {
        fixMinoToBoard();
        checkLineClears();
        generateRandomMino();
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
                board[currentMinoY + row][currentMinoX + col] = currentMino.colorId;
            }
        }
    }
}

function startGameLoop() {
    // 既存のインターバルをクリアしてから新しいインターバルを設定
    clearInterval(dropInterval);
    dropInterval = setInterval(dropMino, dropSpeed);
}

function gameOver() {
    clearInterval(dropInterval);
    alert('ゲームオーバー！');
    // ゲーム終了時の状態にリセット
    endGame();
}

function increaseDropSpeed() {
    // スピードアップのロジック (現状コメントアウト)
}

// ゲーム開始ボタンのイベントリスナー
document.getElementById('startButton').addEventListener('click', () => {
    initBoard();
    generateRandomMino();
    startGameLoop();
    draw();
    score = 0; // スコアをリセット
    level = 1; // レベルをリセット
    document.getElementById('score').innerText = score;
    document.getElementById('level').innerText = level;
    isPaused = false; // ポーズ状態を解除
});

// メイン描画関数
function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawBoard();
    drawMino();
}

document.addEventListener('keydown', handleKeyPress);

function handleKeyPress(e) {
    // ゲームが一時停止中の場合、キー入力は受け付けない (スペースキーのハードドロップは許可)
    if (isPaused && e.key !== ' ') return;
    // ゲームオーバー時にはキー入力は受け付けない
    if (!currentMino) return;

    switch (e.key) {
        case 'a':
            if (!MinoCollision(currentMinoX - 1, currentMinoY)) {
                currentMinoX--;
            }
            break;
        case 'd':
            if (!MinoCollision(currentMinoX + 1, currentMinoY)) {
                currentMinoX++;
            }
            break;
        case 's':
            if (!MinoCollision(currentMinoX, currentMinoY + 1)) {
                currentMinoY++;
            }
            break;
        case ' ': // スペースキーでハードドロップ
            hardDrop();
            break;
        case 'w': // 90度回転
            rotateMino(90);
            break;
        case 'x': // -90度回転
            rotateMino(-90);
            break;
    }
    draw();
}

function hardDrop() {
    while (!MinoCollision(currentMinoX, currentMinoY + 1)) {
        currentMinoY++;
    }
    fixMinoToBoard();
    checkLineClears();
    generateRandomMino();
    if (MinoCollision(currentMinoX, currentMinoY)) {
        gameOver();
    }
    draw();
}

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
        updateScore(linesCleared);
        // increaseDropSpeed();
    }
}

function updateScore(lines) {
    const lineScore = [0, 100, 300, 500, 800];
    score += lineScore[lines];
    document.getElementById('score').innerText = score;
    // レベルアップのロジック
    // if (score >= level * 1000) {
    //     level++;
    //     document.getElementById('level').innerText = level;
    //     increaseDropSpeed();
    // }
}

function rotateMino(direction) {
    const originalShape = currentMino.shape;
    let rotatedShape;

    if (direction === 90) {
        rotatedShape = rotateMatrix(originalShape, 90);
    } else if (direction === -90) {
        rotatedShape = rotateMatrix(originalShape, -90);
    } else {
        return;
    }

    if (!MinoCollision(currentMinoX, currentMinoY, rotatedShape)) {
        currentMino.shape = rotatedShape;
    } else {
        // 回転できない場合の処理
    }
}

function rotateMatrix(matrix, direction) {
    const N = matrix.length;
    const M = matrix[0].length;
    let newMatrix = Array.from({ length: M }, () => Array(N).fill(0));

    if (direction === 90) {
        for (let i = 0; i < N; i++) {
            for (let j = 0; j < M; j++) {
                newMatrix[j][N - 1 - i] = matrix[i][j];
            }
        }
    } else if (direction === -90) {
        for (let i = 0; i < N; i++) {
            for (let j = 0; j < M; j++) {
                newMatrix[M - 1 - j][i] = matrix[i][j];
            }
        }
    }
    return newMatrix;
}


// --- 新しく追加する関数とイベントリスナー ---

// ゲーム終了ボタンのイベントリスナー
document.getElementById('endGameButton').addEventListener('click', () => {
    endGame();
});

// ゲームを終了させる関数
function endGame() {
    clearInterval(dropInterval); // ゲームループを停止
    alert('ゲームを終了しました！');
    initBoard(); // ボードをリセット
    drawBoard(); // リセットされたボードを描画
    currentMino = null; // 現在のミノをクリア
    score = 0; // スコアをリセット
    level = 1; // レベルをリセット
    document.getElementById('score').innerText = score;
    document.getElementById('level').innerText = level;
    isPaused = false; // ポーズ状態を解除
}

// 一時停止/再開ボタンのイベントリスナー
document.getElementById('pauseButton').addEventListener('click', () => {
    togglePause();
});

// ゲームの一時停止/再開を切り替える関数
function togglePause() {
    if (isPaused) {
        // ポーズ解除
        startGameLoop(); // ゲームループを再開
        isPaused = false;
        document.getElementById('pauseButton').innerText = '一時停止 / 再開';
    } else {
        // ポーズ
        clearInterval(dropInterval); // ゲームループを停止
        isPaused = true;
        document.getElementById('pauseButton').innerText = '再開';
    }
}

// キー入力ハンドラーで一時停止中は移動・回転を無効にする修正
// (handleKeyPress関数内に既にisPausedのチェックを追加済み)