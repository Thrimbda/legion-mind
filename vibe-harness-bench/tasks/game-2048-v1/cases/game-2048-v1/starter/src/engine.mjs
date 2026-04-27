// TODO: implement 2048 reducer, deterministic spawn, replay, undo, persistence.
export function createGame(seed=1){ return {board:[[0,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0]], score:0, rng:seed, history:[], replay:[]}; }
export function move(state, dir){ return state; }
export function undo(state){ return state; }
export function exportReplay(state){ return JSON.stringify(state); }
export function importReplay(text){ return JSON.parse(text); }
export function saveState(state){ return JSON.stringify(state); }
export function loadState(text){ return JSON.parse(text); }
