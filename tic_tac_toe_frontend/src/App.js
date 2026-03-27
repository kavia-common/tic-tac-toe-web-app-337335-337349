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
function createEmptyBoard() {
  /** Create a fresh empty board. */
  return Array.from({ length: 9 }, () => EMPTY);
}

// PUBLIC_INTERFACE
function createInitialScores() {
  /**
   * Create the initial score object.
   *
   * Contract:
   * - winsX: number of games won by X
   * - winsO: number of games won by O
   * - draws: number of drawn games
   */
  return { winsX: 0, winsO: 0, draws: 0 };
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
  const [board, setBoard] = useState(() => createEmptyBoard());
  const [currentPlayer, setCurrentPlayer] = useState(PLAYER_X);
  const [scores, setScores] = useState(() => createInitialScores());
  const [lastCountedOutcome, setLastCountedOutcome] = useState(null);

  const winnerInfo = useMemo(() => computeWinner(board), [board]);
  const winningLineSet = useMemo(() => {
    if (!winnerInfo?.line) return new Set();
    return new Set(winnerInfo.line);
  }, [winnerInfo]);

  const draw = useMemo(() => isDraw(board), [board]);
  const isGameOver = Boolean(winnerInfo) || draw;

  /**
   * Step 01.04: New game + score flow.
   *
   * Flow name: NewGameAndScoreFlow
   * Entrypoints:
   * - beginNewGame(): clears the board and resets turn to X (scores unchanged)
   * - resetScores(): clears the score counters (board unchanged)
   *
   * Score counting contract:
   * - We increment scores exactly once per finished game.
   * - We do it deterministically at the boundary where a terminal state is first observed
   *   (winnerInfo/draw) and guard against double-counting via lastCountedOutcome.
   *
   * Failure modes:
   * - None expected in normal UI usage; relies on computeWinner/isDraw invariants.
   */
  const outcomeKey = useMemo(() => {
    if (winnerInfo?.winner) return `W:${winnerInfo.winner}`;
    if (draw) return 'D';
    return null;
  }, [draw, winnerInfo]);

  const statusText = useMemo(() => {
    if (winnerInfo?.winner) return `Winner: ${winnerInfo.winner}`;
    if (draw) return 'Draw game';
    return `Turn: ${currentPlayer}`;
  }, [currentPlayer, draw, winnerInfo]);

  // PUBLIC_INTERFACE
  function beginNewGame() {
    /**
     * Reset the board/turn for a new round.
     *
     * Side effects:
     * - Updates React state: board, currentPlayer
     * - Does NOT modify scores
     */
    setBoard(createEmptyBoard());
    setCurrentPlayer(PLAYER_X);
    setLastCountedOutcome(null);
  }

  // PUBLIC_INTERFACE
  function resetScores() {
    /**
     * Reset the score counters.
     *
     * Side effects:
     * - Updates React state: scores
     */
    setScores(createInitialScores());
  }

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

  // Score update boundary: count a completed game exactly once.
  if (outcomeKey && outcomeKey !== lastCountedOutcome) {
    setLastCountedOutcome(outcomeKey);
    setScores((prev) => {
      if (outcomeKey === 'D') return { ...prev, draws: prev.draws + 1 };
      if (outcomeKey === `W:${PLAYER_X}`) return { ...prev, winsX: prev.winsX + 1 };
      if (outcomeKey === `W:${PLAYER_O}`) return { ...prev, winsO: prev.winsO + 1 };
      return prev;
    });
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

              <div className="score-badge" aria-label="Scoreboard">
                <span className="score-pill" aria-label={`X wins: ${scores.winsX}`}>
                  X: <strong>{scores.winsX}</strong>
                </span>
                <span className="score-pill score-pill-accent" aria-label={`O wins: ${scores.winsO}`}>
                  O: <strong>{scores.winsO}</strong>
                </span>
                <span className="score-pill score-pill-muted" aria-label={`Draws: ${scores.draws}`}>
                  Draws: <strong>{scores.draws}</strong>
                </span>
              </div>
            </div>

            <div className="board" aria-label="Game board">
              <div className="board-grid" role="grid" aria-label="3 by 3 board">
                {board.map((value, idx) => {
                  const isWinSquare = winningLineSet.has(idx);
                  const playerClass =
                    value === PLAYER_X ? 'square-x' : value === PLAYER_O ? 'square-o' : '';
                  const winClass = isWinSquare ? 'square-win' : '';
                  const rowIndex = Math.floor(idx / 3);
                  const colIndex = idx % 3;
                  const isDisabled = isGameOver || value !== EMPTY;
                  const squareLabel = `Row ${rowIndex + 1}, Column ${colIndex + 1}${
                    value ? `: ${value}` : ''
                  }`;

                  return (
                    <button
                      key={idx}
                      type="button"
                      className={['square', playerClass, winClass].filter(Boolean).join(' ')}
                      role="gridcell"
                      aria-label={squareLabel}
                      onClick={() => handleSquareClick(idx)}
                      disabled={isDisabled}
                    >
                      {value}
                    </button>
                  );
                })}
              </div>
            </div>

            <p className="helper" aria-label="Game status helper" aria-live="polite">
              {statusText}. First to get 3 in a row wins.
            </p>

            <div className="controls" aria-label="Game controls">
              <button
                type="button"
                className="btn btn-primary"
                onClick={beginNewGame}
              >
                New game
              </button>
              <button type="button" className="btn" onClick={resetScores} aria-label="Reset scores">
                Reset scores
              </button>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

export default App;
