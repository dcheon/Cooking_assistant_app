import { useReducer } from 'react';

export const STATUS = {
  IDLE:      'idle',
  SPEAKING:  'speaking',
  LISTENING: 'listening',
  PAUSED:    'paused',
  FINISHED:  'finished',
};

const initialState = {
  status:   STATUS.IDLE,
  stepIdx:  0,
  speakKey: 0,  // increments each time a new TTS read should start
};

function cookingReducer(state, action) {
  switch (action.type) {
    case 'START':
      return { status: STATUS.SPEAKING, stepIdx: 0, speakKey: state.speakKey + 1 };

    case 'NEXT':
      if (state.stepIdx < action.totalSteps - 1) {
        return { status: STATUS.SPEAKING, stepIdx: state.stepIdx + 1, speakKey: state.speakKey + 1 };
      }
      return { ...state, status: STATUS.FINISHED };

    case 'BACK':
      if (state.stepIdx > 0) {
        return { status: STATUS.SPEAKING, stepIdx: state.stepIdx - 1, speakKey: state.speakKey + 1 };
      }
      return state;

    case 'REPEAT':
      return { ...state, status: STATUS.SPEAKING, speakKey: state.speakKey + 1 };

    case 'PAUSE':
      return { ...state, status: STATUS.PAUSED };

    case 'RESUME':
      return { ...state, status: STATUS.SPEAKING, speakKey: state.speakKey + 1 };

    case 'FINISH':
      return { ...state, status: STATUS.FINISHED };

    case 'TTS_DONE':
      return state.status === STATUS.SPEAKING
        ? { ...state, status: STATUS.LISTENING }
        : state;

    default:
      return state;
  }
}

export function useCookingReducer() {
  return useReducer(cookingReducer, initialState);
}
