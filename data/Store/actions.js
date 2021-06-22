export const UPDATE_VALUE = 'UPDATE_VALUE';
export const INCREMENT_VALUE = 'INCREMENT_VALUE';

function updateValue(key, value) {
  return {type: UPDATE_VALUE, key: key, value: value};
}

function incrementValue(key) {
  return {type: INCREMENT_VALUE, key: key};
}

export function setFirstRender(bool) {
  return updateValue('isFirstRender', bool);
}

export function incrementUpdatePages() {
  return incrementValue('updatePages');
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
  return updateValue('notification', notification);
}

export function setShowDaily(showDaily) {
  return updateValue('showDaily', showDaily);
}

export function setAppVersion(appVersion) {
  return updateValue('appVersion', appVersion);
}

export function setWeeklyReadingResetDay(weeklyReadingResetDay) {
  return updateValue('weeklyReadingResetDay', weeklyReadingResetDay);
}
