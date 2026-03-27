import React, { useMemo, useState } from 'react';
import './App.css';

/**
 * Domain constants for the tic-tac-toe game.
 * We represent an empty square as '' to keep rendering simple.
 */
const EMPTY = '';
const PLAYER_X = 'X';
const PLAYER_O = 'O';

/**
 * All possible winning lines (0-based indexes into the 9-cell board).
 * Invariant: Each line contains exactly 3 distinct indexes in [0..8].
 */
const WINNING_LINES = [
  [0, 1, 2], // rows
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6], // cols
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8], // diags
  [2, 4, 6],
];

/**
 * TicTacToeFlow (core logic helpers)
 * Contract:
 * - Inputs: board is an Array(9) of '', 'X', or 'O'
 * - Outputs: winner info (winner symbol + winning line) or null if none
 * - Errors: throws if board shape is invalid (defensive programming for debuggability)
 * - Side effects: none (pure)
 */
function assertValidBoard(board) {
  if (!Array.isArray(board) || board.length !== 9) {
    throw new Error(
      `Invalid board: expected an array of length 9, got ${Array.isArray(board) ? board.length : typeof board}`
    );
  }
}

// PUBLIC_INTERFACE
function computeWinner(board) {
  /**
   * Compute the winner (if any) and the exact winning line.
   *
   * Inputs:
   * - board: Array(9) of '', 'X', 'O'
   *
   * Outputs:
   * - { winner: 'X'|'O', line: number[] } if a win exists
   * - null otherwise
   *
   * Failure modes:
   * 1) board shape invalid -> throws Error with context
   */
  assertValidBoard(board);

  for (const line of WINNING_LINES) {
    const [a, b, c] = line;
    const v = board[a];
    if (v !== EMPTY && v === board[b] && v === board[c]) {
      return { winner: v, line };
    }
  }
  return null;
}

// PUBLIC_INTERFACE
function isDraw(board) {
  /**
   * Determine if a board is a draw.
   *
   * Contract:
   * - draw means: no winner AND no EMPTY squares remain
   */
  assertValidBoard(board);
  const winnerInfo = computeWinner(board);
  if (winnerInfo) return false;
  return board.every((cell) => cell !== EMPTY);
}

// PUBLIC_INTERFACE
function getNextPlayer(currentPlayer) {
  /** Returns the next player symbol given the current one. */
  return currentPlayer === PLAYER_X ? PLAYER_O : PLAYER_X;
}

// PUBLIC_INTERFACE
function App() {
  /**
   * Step 01.02: core game logic (board + turn + win/draw + winning-line computation).
   *
   * State contract:
   * - board: Array(9) of '', 'X', 'O'
   * - currentPlayer: 'X'|'O'
   *
   * Side effects:
   * - None outside React state updates.
   */
  const [board, setBoard] = useState(() => Array.from({ length: 9 }, () => EMPTY));
  const [currentPlayer, setCurrentPlayer] = useState(PLAYER_X);

  const winnerInfo = useMemo(() => computeWinner(board), [board]);
  const winningLineSet = useMemo(() => {
    if (!winnerInfo?.line) return new Set();
    return new Set(winnerInfo.line);
  }, [winnerInfo]);

  const draw = useMemo(() => isDraw(board), [board]);

  const statusText = useMemo(() => {
    if (winnerInfo?.winner) return `Winner: ${winnerInfo.winner}`;
    if (draw) return 'Draw game';
    return `Turn: ${currentPlayer}`;
  }, [currentPlayer, draw, winnerInfo]);

  // PUBLIC_INTERFACE
  function handleSquareClick(index) {
    /**
     * Handle a player move.
     *
     * Inputs:
     * - index: number in [0..8]
     *
     * Behavior:
     * - If game is over (winner/draw), ignore.
     * - If square already filled, ignore.
     * - Otherwise place current player's mark and toggle turn.
     */
    if (winnerInfo || draw) return;

    setBoard((prev) => {
      assertValidBoard(prev);
      if (prev[index] !== EMPTY) return prev;

      const next = prev.slice();
      next[index] = currentPlayer;
      return next;
    });

    setCurrentPlayer((prev) => getNextPlayer(prev));
  }

  return (
    <div className="App">
      <main className="app-shell">
        <section className="app-title" aria-label="Tic Tac Toe title">
          <h1>Tic-Tac-Toe</h1>
          <p>Two-player local game • Modern light theme</p>
        </section>

        <section className="card" aria-label="Game area">
          <div className="card-inner">
            <div className="status-row" aria-label="Turn and score indicators">
              <span className="badge" aria-live="polite">
                {winnerInfo?.winner ? (
                  <>
                    Winner: <strong>{winnerInfo.winner}</strong>
                  </>
                ) : draw ? (
                  <>
                    Result: <strong>Draw</strong>
                  </>
                ) : (
                  <>
                    Turn: <strong>{currentPlayer}</strong>
                  </>
                )}
              </span>

              <span className="badge badge-accent" aria-label="Score (placeholder)">
                Score • X: 0 • O: 0
              </span>
            </div>

            <div className="board" aria-label="Game board">
              <div className="board-grid" role="grid" aria-label="3 by 3 board">
                {board.map((value, idx) => {
                  const isWinSquare = winningLineSet.has(idx);
                  const playerClass =
                    value === PLAYER_X ? 'square-x' : value === PLAYER_O ? 'square-o' : '';
                  const winClass = isWinSquare ? 'square-win' : '';

                  return (
                    <button
                      key={idx}
                      type="button"
                      className={['square', playerClass, winClass].filter(Boolean).join(' ')}
                      aria-label={`Square ${idx + 1}${value ? `: ${value}` : ''}`}
                      onClick={() => handleSquareClick(idx)}
                      disabled={Boolean(winnerInfo) || draw || value !== EMPTY}
                    >
                      {value}
                    </button>
                  );
                })}
              </div>
            </div>

            <p className="helper" aria-label="Game status helper">
              {statusText}. First to get 3 in a row wins.
            </p>

            <div className="controls" aria-label="Game controls">
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => {
                  setBoard(Array.from({ length: 9 }, () => EMPTY));
                  setCurrentPlayer(PLAYER_X);
                }}
              >
                New game
              </button>
              <button type="button" className="btn" disabled>
                Reset score
              </button>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

export default App;
