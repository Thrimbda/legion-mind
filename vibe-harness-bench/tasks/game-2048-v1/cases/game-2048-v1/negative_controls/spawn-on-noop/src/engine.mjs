import * as base from '../../../oracle/src/engine.mjs';

function clone(board) {
  return board.map((row) => row.slice());
}

function sameBoard(a, b) {
  return JSON.stringify(a) === JSON.stringify(b);
}

export const createGame = base.createGame;
export const undo = base.undo;
export const exportReplay = base.exportReplay;
export const importReplay = base.importReplay;
export const saveState = base.saveState;
export const loadState = base.loadState;

export function move(state, dir) {
  const next = base.move(state, dir);
  if (!sameBoard(next.board, state.board)) {
    return next;
  }
  const board = clone(state.board);
  for (let r = 0; r < 4; r += 1) {
    for (let c = 0; c < 4; c += 1) {
      if (board[r][c] === 0) {
        board[r][c] = 2;
        return { ...state, board, rng: (state.rng + 1) >>> 0 };
      }
    }
  }
  return { ...state, rng: (state.rng + 1) >>> 0 };
}
