export const UPDATE_VALUE = 'UPDATE_VALUE';

export function setFirstRender(bool) {
  return updateValue('isFirstRender', bool);
}

export function setQryMaxVerses(query) {
  return updateValue('qryMaxVerses', query);
}

export function setTblVerseIndex(query) {
  return updateValue('tblVerseIndex', query);
}

function updateValue(key, value) {
  return {type: UPDATE_VALUE, key: key, value: value};
}
