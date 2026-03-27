import React from 'react';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App';

/**
 * Helper to get board squares in a stable order (0..8).
 * Each square is a <button role="gridcell"> with aria-label "Row i, Column j[: X|O]".
 */
function getSquares() {
  return screen.getAllByRole('gridcell');
}

function clickSquare(user, index) {
  return user.click(getSquares()[index]);
}

function expectTurn(player) {
  // Turn indicator includes: "Turn: <strong>X|O</strong>"
  expect(screen.getByText(/turn:/i)).toBeInTheDocument();
  expect(screen.getByText(new RegExp(`\\b${player}\\b`, 'i'))).toBeInTheDocument();
}

function expectWinner(player) {
  // Winner indicator includes: "Winner: <strong>X|O</strong>"
  expect(screen.getByText(/winner:/i)).toBeInTheDocument();
  expect(screen.getByText(new RegExp(`\\b${player}\\b`, 'i'))).toBeInTheDocument();
}

function expectDrawBadge() {
  // In the badge, draw is rendered as "Result: Draw"
  expect(screen.getByText(/result:/i)).toBeInTheDocument();
  expect(screen.getByText(/draw/i)).toBeInTheDocument();
}

function getScoreboard() {
  return screen.getByLabelText(/scoreboard/i);
}

function expectScores({ x, o, draws }) {
  const scoreboard = getScoreboard();
  expect(within(scoreboard).getByLabelText(`X wins: ${x}`)).toBeInTheDocument();
  expect(within(scoreboard).getByLabelText(`O wins: ${o}`)).toBeInTheDocument();
  expect(within(scoreboard).getByLabelText(`Draws: ${draws}`)).toBeInTheDocument();
}

describe('Tic-tac-toe game behaviors (step 01.05)', () => {
  test('initial state: empty board, X to start, scores at 0', () => {
    render(<App />);

    expect(screen.getByRole('heading', { name: /tic-tac-toe/i })).toBeInTheDocument();

    const squares = getSquares();
    expect(squares).toHaveLength(9);
    squares.forEach((sq) => {
      expect(sq).toHaveTextContent('');
      // At start, squares should be enabled (not disabled)
      expect(sq).toBeEnabled();
      // No winning highlight initially
      expect(sq.className).not.toMatch(/\bsquare-win\b/);
    });

    expectTurn('X');
    expectScores({ x: 0, o: 0, draws: 0 });

    // Status helper line present
    expect(screen.getByLabelText(/game status helper/i)).toHaveTextContent(/first to get 3 in a row wins/i);
  });

  test('move alternation: X then O; occupied squares cannot be overwritten', async () => {
    render(<App />);
    const user = userEvent.setup();

    await clickSquare(user, 0);
    expect(getSquares()[0]).toHaveTextContent('X');
    expectTurn('O');

    await clickSquare(user, 0); // attempt overwrite
    expect(getSquares()[0]).toHaveTextContent('X'); // unchanged
    expectTurn('O'); // still O's turn because click ignored

    await clickSquare(user, 1);
    expect(getSquares()[1]).toHaveTextContent('O');
    expectTurn('X');
  });

  test('win detection: announces winner, highlights winning line, disables further play, and increments score once', async () => {
    render(<App />);
    const user = userEvent.setup();

    // X wins across top row: X at 0,1,2; O plays 3 and 4
    await clickSquare(user, 0); // X
    await clickSquare(user, 3); // O
    await clickSquare(user, 1); // X
    await clickSquare(user, 4); // O
    await clickSquare(user, 2); // X -> win

    expectWinner('X');
    expectScores({ x: 1, o: 0, draws: 0 });

    const squares = getSquares();

    // Winning squares should have square-win class
    [0, 1, 2].forEach((idx) => {
      expect(squares[idx].className).toMatch(/\bsquare-win\b/);
    });

    // Non-winning squares should not have square-win class
    [3, 4, 5, 6, 7, 8].forEach((idx) => {
      expect(squares[idx].className).not.toMatch(/\bsquare-win\b/);
    });

    // Game over disables all squares (component disables when game over OR filled; win -> game over)
    squares.forEach((sq) => {
      expect(sq).toBeDisabled();
    });

    // Further clicks should not change the board or the score
    await user.click(squares[5]);
    expect(squares[5]).toHaveTextContent('');
    expectScores({ x: 1, o: 0, draws: 0 });
  });

  test('draw detection: announces draw, disables further play, and increments draws score once', async () => {
    render(<App />);
    const user = userEvent.setup();

    /**
     * Fill the board to a known draw (no three-in-a-row):
     * Board indexes:
     * 0 1 2
     * 3 4 5
     * 6 7 8
     *
     * Sequence (X starts):
     * X:0 O:1 X:2 O:4 X:3 O:5 X:7 O:6 X:8
     *
     * Final:
     * X O X
     * X O O
     * O X X
     */
    const moves = [0, 1, 2, 4, 3, 5, 7, 6, 8];
    for (const idx of moves) {
      await clickSquare(user, idx);
    }

    expectDrawBadge();
    expectScores({ x: 0, o: 0, draws: 1 });

    // Draw => game over => all squares disabled
    getSquares().forEach((sq) => {
      expect(sq).toBeDisabled();
      // No winning highlight on draw
      expect(sq.className).not.toMatch(/\bsquare-win\b/);
    });

    // Further clicks should not change score
    await user.click(getSquares()[0]);
    expectScores({ x: 0, o: 0, draws: 1 });
  });

  test('New game resets board and turn but keeps accumulated scores; Reset scores clears scores but leaves board unchanged', async () => {
    render(<App />);
    const user = userEvent.setup();

    // Create an X win quickly
    await clickSquare(user, 0); // X
    await clickSquare(user, 3); // O
    await clickSquare(user, 1); // X
    await clickSquare(user, 4); // O
    await clickSquare(user, 2); // X -> win
    expectWinner('X');
    expectScores({ x: 1, o: 0, draws: 0 });

    // New game should clear board and set turn back to X, but keep scores
    await user.click(screen.getByRole('button', { name: /new game/i }));
    getSquares().forEach((sq) => {
      expect(sq).toBeEnabled();
      expect(sq).toHaveTextContent('');
      expect(sq.className).not.toMatch(/\bsquare-win\b/);
    });
    expectTurn('X');
    expectScores({ x: 1, o: 0, draws: 0 });

    // Make a couple moves so board is not empty
    await clickSquare(user, 0); // X
    await clickSquare(user, 1); // O
    expect(getSquares()[0]).toHaveTextContent('X');
    expect(getSquares()[1]).toHaveTextContent('O');

    // Reset scores should set all scores to 0 but not modify board
    await user.click(screen.getByRole('button', { name: /reset scores/i }));
    expectScores({ x: 0, o: 0, draws: 0 });
    expect(getSquares()[0]).toHaveTextContent('X');
    expect(getSquares()[1]).toHaveTextContent('O');
  });
});
