export const SET_FIRST_RENDER = 'SET_FIRST_RENDER';

export function setFirstRender(bool) {
  return {type: SET_FIRST_RENDER, value: bool};
}
