export const UPDATE_VALUE = 'UPDATE_VALUE';

export function setFirstRender(bool) {
  return updateValue('isFirstRender', bool);
}

function updateValue(key, value) {
  return {type: UPDATE_VALUE, key: key, value: value};
}
