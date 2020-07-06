export const UPDATE_VALUE = 'UPDATE_VALUE';

export function setFirstRender(bool) {
  return updateValue('isFirstRender', bool);
}

export function setUpdatePages(prevValue) {
  return updateValue('updatePages', prevValue + 1);
}

function updateValue(key, value) {
  return {type: UPDATE_VALUE, key: key, value: value};
}
