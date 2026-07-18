// GameOverScreen.jsx
// Shown when lives reach zero: final score, high score, name entry +
// leaderboard submission, top-10 board, and a replay button.
import { useEffect, useState } from 'react';
import { useGameStore } from '../store/gameStore.js';
import { fetchTopScores, submitScore } from '../lib/highScores.js';

export default function GameOverScreen() {
  const score = useGameStore((s) => s.score);
  const highScore = useGameStore((s) => s.highScore);
  const playerName = useGameStore((s) => s.playerName);
  const setPlayerName = useGameStore((s) => s.setPlayerName);
  const leaderboard = useGameStore((s) => s.leaderboard);
  const setLeaderboard = useGameStore((s) => s.setLeaderboard);
  const startGame = useGameStore((s) => s.startGame);
  const backToMenu = useGameStore((s) => s.backToMenu);

  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const isNewBest = score > 0 && score >= highScore;

  // Refresh leaderboard when the screen mounts.
  useEffect(() => {
    fetchTopScores().then(setLeaderboard);
  }, [setLeaderboard]);

  async function handleSubmit() {
    if (submitting || submitted) return;
    if (score <= 0) {
      setSubmitted(true);
      return;
    }
    setSubmitting(true);
    setError('');
    const row = await submitScore(playerName, score);
    setSubmitting(false);
    if (row) {
      setSubmitted(true);
      const rows = await fetchTopScores();
      setLeaderboard(rows);
    } else {
      setError('Could not submit score. Please try again.');
    }
  }

  function handlePlayAgain() {
    startGame();
  }

  return (
    <div className="overlay gameover-screen">
      <div className="gameover-content">
        <h1 className="gameover-title">The Ascent Ends</h1>
        {isNewBest && <p className="new-best">New personal best!</p>}

        <div className="score-block">
          <div className="score-row">
            <span className="score-label">Final Score</span>
            <span className="score-value">{score.toLocaleString()}</span>
          </div>
          <div className="score-row">
            <span className="score-label">Best</span>
            <span className="score-value">{highScore.toLocaleString()}</span>
          </div>
        </div>

        {!submitted ? (
          <div className="submit-row">
            <input
              className="name-input"
              type="text"
              maxLength={16}
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              placeholder="Your name"
            />
            <button className="primary-btn submit-btn" onClick={handleSubmit} disabled={submitting}>
              {submitting ? 'Submitting…' : 'Submit Score'}
            </button>
          </div>
        ) : (
          <p className="submitted-msg">Score recorded in the ledger of ascendants.</p>
        )}
        {error && <p className="error-msg">{error}</p>}

        <div className="leaderboard">
          <h2 className="lb-title">Top Ascendants</h2>
          {leaderboard.length === 0 ? (
            <p className="lb-empty">No scores yet.</p>
          ) : (
            <ol className="lb-list">
              {leaderboard.map((row, i) => (
                <li key={i} className="lb-row">
                  <span className="lb-rank">{i + 1}</span>
                  <span className="lb-name">{row.player_name}</span>
                  <span className="lb-score">{row.score.toLocaleString()}</span>
                </li>
              ))}
            </ol>
          )}
        </div>

        <div className="gameover-actions">
          <button className="primary-btn" onClick={handlePlayAgain}>Play Again</button>
          <button className="secondary-btn" onClick={backToMenu}>Main Menu</button>
        </div>
      </div>
    </div>
  );
}
