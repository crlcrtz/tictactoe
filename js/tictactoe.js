// Keeps track of whose turn it is
let activePlayer = 'X';

// Stores the moves made (e.g., "0X", "4O")
let selectedSquares = [];

/* =========================
   CORE GAMEPLAY
   ========================= */
function placeXOrO(squareNumber) {
  // Prevent selecting an already-selected square
  if (!selectedSquares.some(el => el.includes(squareNumber))) {
    const selected = document.getElementById(squareNumber);

    // Place the image for the active player
    selected.style.backgroundImage = `url("images/${activePlayer}.png")`;

    // Track move
    selectedSquares.push(squareNumber + activePlayer);

    // Play placement audio
    audio('./media/place.mp3');

    // Check if someone won or tied; stop if game ended
    if (checkWinConditions()) return true;

    // Toggle player
    activePlayer = (activePlayer === 'X') ? 'O' : 'X';

    // If it's the computer's turn, run it after a short delay
    if (activePlayer === 'O') {
      disableClick();
      setTimeout(() => { computersTurn(); }, 300);
    }

    return true; // Needed for computersTurn loop
  }
  return false;
}

/* =========================
   UNBEATABLE COMPUTER (MINIMAX)
   ========================= */
function computersTurn() {
  const board = getBoardState();
  const bestMove = findBestMove(board); // returns index (0-8)
  placeXOrO(String(bestMove));
  enableClick();
}

// Convert selectedSquares (["0X","4O",...]) into a 9-slot board: ['X', null, ...]
function getBoardState() {
  const board = Array(9).fill(null);
  for (const move of selectedSquares) {
    const index = parseInt(move.match(/\d+/)[0], 10);
    const player = move.slice(-1);
    board[index] = player;
  }
  return board;
}

const LINES = [
  [0,1,2], [3,4,5], [6,7,8], // rows
  [0,3,6], [1,4,7], [2,5,8], // cols
  [0,4,8], [2,4,6]           // diagonals
];

function evaluateBoard(board) {
  for (const [a,b,c] of LINES) {
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return board[a] === 'O' ? 10 : -10; // O (computer) maximizes, X (human) minimizes
    }
  }
  return 0;
}

function isMovesLeft(board) {
  return board.some(cell => cell === null);
}

// Minimax with depth to favor faster wins / slower losses
function minimax(board, depth, isMax) {
  const score = evaluateBoard(board);
  if (score === 10)  return score - depth;   // prefer quicker wins
  if (score === -10) return score + depth;   // prefer slower losses
  if (!isMovesLeft(board)) return 0;         // tie

  if (isMax) { // computer's turn (O)
    let best = -Infinity;
    for (let i = 0; i < 9; i++) {
      if (board[i] === null) {
        board[i] = 'O';
        best = Math.max(best, minimax(board, depth + 1, false));
        board[i] = null;
      }
    }
    return best;
  } else { // human's turn (X)
    let best = Infinity;
    for (let i = 0; i < 9; i++) {
      if (board[i] === null) {
        board[i] = 'X';
        best = Math.min(best, minimax(board, depth + 1, true));
        board[i] = null;
      }
    }
    return best;
  }
}

function findBestMove(board) {
  let bestVal = -Infinity;
  let bestMove = -1;

  for (let i = 0; i < 9; i++) {
    if (board[i] === null) {
      board[i] = 'O';
      const moveVal = minimax(board, 0, false);
      board[i] = null;

      if (moveVal > bestVal) {
        bestVal = moveVal;
        bestMove = i;
      }
    }
  }
  return bestMove;
}

/* =========================
   WIN / TIE CHECKING
   ========================= */
function checkWinConditions() {
  // Helper to check if 3 values exist in selectedSquares
  function arrayIncludes(a, b, c) {
    const x = selectedSquares.includes(a);
    const y = selectedSquares.includes(b);
    const z = selectedSquares.includes(c);
    return x && y && z;
  }

  // X win conditions
  if (arrayIncludes('0X', '1X', '2X')) { return win('X', 50, 100, 558, 100); }
  else if (arrayIncludes('3X', '4X', '5X')) { return win('X', 50, 304, 558, 304); }
  else if (arrayIncludes('6X', '7X', '8X')) { return win('X', 50, 508, 558, 508); }
  else if (arrayIncludes('0X', '3X', '6X')) { return win('X', 100, 50, 100, 558); }
  else if (arrayIncludes('1X', '4X', '7X')) { return win('X', 304, 50, 304, 558); }
  else if (arrayIncludes('2X', '5X', '8X')) { return win('X', 508, 50, 508, 558); }
  else if (arrayIncludes('6X', '4X', '2X')) { return win('X', 100, 508, 510, 90); }
  else if (arrayIncludes('0X', '4X', '8X')) { return win('X', 100, 100, 520, 520); }

  // O win conditions
  else if (arrayIncludes('0O', '1O', '2O')) { return win('O', 50, 100, 558, 100); }
  else if (arrayIncludes('3O', '4O', '5O')) { return win('O', 50, 304, 558, 304); }
  else if (arrayIncludes('6O', '7O', '8O')) { return win('O', 50, 508, 558, 508); }
  else if (arrayIncludes('0O', '3O', '6O')) { return win('O', 100, 50, 100, 558); }
  else if (arrayIncludes('1O', '4O', '7O')) { return win('O', 304, 50, 304, 558); }
  else if (arrayIncludes('2O', '5O', '8O')) { return win('O', 508, 50, 508, 558); }
  else if (arrayIncludes('6O', '4O', '2O')) { return win('O', 100, 508, 510, 90); }
  else if (arrayIncludes('0O', '4O', '8O')) { return win('O', 100, 100, 520, 520); }

  // Tie
  else if (selectedSquares.length >= 9) {
    audio('./media/tie.mp3');
    setTimeout(resetGame, 500);
    return true;
  }

  return false;
}

// Handle a win
function win(player, x1, y1, x2, y2) {
  disableClick();
  audio('./media/winGame.mp3');
  drawWinLine(x1, y1, x2, y2);
  setTimeout(resetGame, 1000);
  return true;
}

/* =========================
   UTILITIES
   ========================= */

// Plays an audio file
function audio(url) {
  const sound = new Audio(url);
  sound.play();
}

// Prevent clicks (used for computer turn & when game is over)
function disableClick() {
  document.body.style.pointerEvents = 'none';
}

// Re-enable clicks
function enableClick() {
  document.body.style.pointerEvents = 'auto';
}

// Draw the win line on the canvas
function drawWinLine(x1, y1, x2, y2) {
  const canvas = document.getElementById('win-lines');
  const c = canvas.getContext('2d');

  c.clearRect(0, 0, canvas.width, canvas.height);
  c.strokeStyle = 'rgba(70, 255, 33, 0.8)';
  c.lineWidth = 10;
  c.beginPath();
  c.moveTo(x1, y1);
  c.lineTo(x2, y2);
  c.stroke();
}

// Reset the game board
function resetGame() {
  const squares = document.getElementsByTagName('td');
  for (let i = 0; i < squares.length; i++) {
    squares[i].style.backgroundImage = '';
  }
  const canvas = document.getElementById('win-lines');
  canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
  selectedSquares = [];
  activePlayer = 'X';
  enableClick();
}
