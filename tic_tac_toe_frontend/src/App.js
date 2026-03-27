import React from 'react';
import './App.css';

// PUBLIC_INTERFACE
function App() {
  /** Step 01.01: layout + theme tokens. Game logic will be added in later steps. */
  const squares = Array.from({ length: 9 }, () => '');

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
              <span className="badge">
                Turn: <strong>X</strong>
              </span>

              <span className="badge badge-accent" aria-label="Score (placeholder)">
                Score • X: 0 • O: 0
              </span>
            </div>

            <div className="board" aria-label="Game board">
              <div className="board-grid" role="grid" aria-label="3 by 3 board">
                {squares.map((value, idx) => (
                  <button
                    key={idx}
                    type="button"
                    className="square"
                    aria-label={`Square ${idx + 1}`}
                  >
                    {value}
                  </button>
                ))}
              </div>
            </div>

            <p className="helper">First to get 3 in a row wins.</p>

            <div className="controls" aria-label="Game controls">
              <button type="button" className="btn btn-primary">
                New game
              </button>
              <button type="button" className="btn">
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
