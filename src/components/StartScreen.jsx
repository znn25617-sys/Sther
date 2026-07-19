// StartScreen.jsx
// The main menu: title, subtitle, start button, leaderboard preview,
// and a credits line. Animated entrance with a glowing title.
import { useEffect, useState } from 'react';
import { useGameStore } from '../store/gameStore.js';
import { fetchTopScores } from '../lib/highScores.js';

export default function StartScreen() {
  const startGame = useGameStore((s) => s.startGame);
  const playerName = useGameStore((s) => s.playerName);
  const setPlayerName = useGameStore((s) => s.setPlayerName);
  const leaderboard = useGameStore((s) => s.leaderboard);
  const setLeaderboard = useGameStore((s) => s.setLeaderboard);
  const [loadingBoard, setLoadingBoard] = useState(true);

  useEffect(() => {
    let active = true;
    fetchTopScores().then((rows) => {
      if (!active) return;
      setLeaderboard(rows);
      setLoadingBoard(false);
    });
    return () => { active = false; };
  }, [setLeaderboard]);

  return (
    <div className="overlay start-screen">
      <div className="start-content">
        <h1 className="game-title">
          <span className="title-glow">Aetheria&rsquo;s</span>
          <span className="title-accent">Ascent</span>
        </h1>
        <p className="game-subtitle">A magical journey through the floating twilight realm.</p>

        <div className="name-row">
          <label htmlFor="player-name" className="name-label">Your name</label>
          <input
            id="player-name"
            className="name-input"
            type="text"
            maxLength={16}
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            placeholder="Aether"
          />
        </div>

        <button className="primary-btn start-btn ripple-btn" onClick={startGame}>
          Begin Ascent
        </button>

        <div className="leaderboard">
          <h2 className="lb-title">Top Ascendants</h2>
          {loadingBoard ? (
            <p className="lb-empty">Loading leaderboard…</p>
          ) : leaderboard.length === 0 ? (
            <p className="lb-empty">No scores yet — be the first to ascend!</p>
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

        <p className="controls-hint">
          Desktop: Arrow keys / WASD to move, Space to jump.
          Mobile: use the on-screen controls.
        </p>
      </div>
    </div>
  );
}
