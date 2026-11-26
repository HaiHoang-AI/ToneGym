import type { Rng } from '../theory';
import { HINTS_PER_LEVEL, LIVES_PER_LEVEL, pointsFor, STAGES_PER_LEVEL } from './levels';
import type { GameContext, GameDef, Question } from './types';

export type SessionPhase = 'question' | 'answered' | 'passed' | 'failed';

/** State of one level being played. Pure data so it can be unit-tested. */
export interface SessionState {
  level: number;
  stage: number;
  lives: number;
  hints: number;
  score: number;
  streak: number;
  correct: number;
  answered: number;
  phase: SessionPhase;
  question: Question;
  picked: string | null;
  lastCorrect: boolean | null;
}

export function startSession(game: GameDef, level: number, rng: Rng, ctx: GameContext): SessionState {
  if (!game.makeQuestion) throw new Error(`Game ${game.id} is not playable yet`);
  return {
    level,
    stage: 0,
    lives: LIVES_PER_LEVEL,
    hints: HINTS_PER_LEVEL,
    score: 0,
    streak: 0,
    correct: 0,
    answered: 0,
    phase: 'question',
    question: game.makeQuestion(level, rng, ctx),
    picked: null,
    lastCorrect: null,
  };
}

/** Records an answer (or a timeout with `picked = null`). */
export function answer(state: SessionState, picked: string | null): SessionState {
  if (state.phase !== 'question') return state;
  const ok = picked !== null && picked === state.question.correctId;
  const streak = ok ? state.streak + 1 : 0;
  return {
    ...state,
    picked,
    lastCorrect: ok,
    phase: 'answered',
    answered: state.answered + 1,
    correct: state.correct + (ok ? 1 : 0),
    streak,
    score: state.score + (ok ? pointsFor(state.level, streak) : 0),
    lives: ok ? state.lives : state.lives - 1,
    stage: ok ? state.stage + 1 : state.stage,
  };
}

/** Moves on after feedback: next question, or the end of the level. */
export function next(state: SessionState, game: GameDef, rng: Rng, ctx: GameContext): SessionState {
  if (state.phase !== 'answered') return state;
  if (state.stage >= STAGES_PER_LEVEL) return { ...state, phase: 'passed' };
  if (state.lives <= 0) return { ...state, phase: 'failed' };
  return {
    ...state,
    phase: 'question',
    picked: null,
    lastCorrect: null,
    question: game.makeQuestion!(state.level, rng, ctx),
  };
}

export function useHint(state: SessionState): SessionState {
  if (state.hints <= 0 || state.phase !== 'question' || !state.question.hint) return state;
  return { ...state, hints: state.hints - 1 };
}
