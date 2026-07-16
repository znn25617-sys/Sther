// highScores.js
// Leaderboard persistence backed by Supabase (public, single-tenant).
import { supabase } from './supabaseClient.js';

const TABLE = 'high_scores';
const LIMIT = 10;

// Fetch the top scores, newest first on ties.
export async function fetchTopScores(limit = LIMIT) {
  const { data, error } = await supabase
    .from(TABLE)
    .select('player_name, score, created_at')
    .order('score', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Failed to fetch high scores:', error.message);
    return [];
  }
  return data || [];
}

// Submit a new score. Returns the persisted row or null on failure.
export async function submitScore(playerName, score) {
  const name = (playerName || 'Aether').trim().slice(0, 16) || 'Aether';
  const { data, error } = await supabase
    .from(TABLE)
    .insert({ player_name: name, score })
    .select('player_name, score, created_at')
    .maybeSingle();

  if (error) {
    console.error('Failed to submit score:', error.message);
    return null;
  }
  return data;
}
