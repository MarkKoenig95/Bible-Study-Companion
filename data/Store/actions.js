export const UPDATE_VALUE = 'UPDATE_VALUE';

export function setFirstRender(bool) {
  return updateValue('isFirstRender', bool);
}

export function setUpdatePages(prevValue) {
  return updateValue('updatePages', prevValue + 1);
}

export function setUserDB(userDB) {
  return updateValue('userDB', userDB);
}

export function setBibleDB(bibleDB) {
  return updateValue('bibleDB', bibleDB);
}

export function setNotification(notification) {
  console.log(notification);
  return updateValue('notification', notification);
}

function updateValue(key, value) {
  return {type: UPDATE_VALUE, key: key, value: value};
}
