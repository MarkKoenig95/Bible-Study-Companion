/* eslint-env detox/detox, jest */
/**
 * @typedef DetoxElement
 * @type {object} - A detox element given by a selector given by selector by.id('uniqueID') or by.text('Text') , etc.
 */

/**
 * Given a number of miliseconds returns a promise waiting for that amount of time
 * @param {number} milliseconds
 */
export async function waitForMS(milliseconds) {
  let wait = new Promise((res, rej) => {
    setTimeout(res, milliseconds);
  });
  await wait;
}

export async function goBack() {
  let OS = await device.getPlatform();
  const methods = {
    ios: async () => {
      await element(by.id('header-back')).atIndex(0).tap();
    },
    android: async () => {
      device.pressBack();
    },
  };

  await methods[OS]();
}

export async function pressAlertAction(action) {
  let OS = await device.getPlatform();
  if (OS !== 'ios') {
    action = action.toUpperCase();
  }
  await element(by.text(action)).tap();
}

/**
 * Given an element to wait for being visible and an element to scroll, will scroll until the element to wait for is visible
 * @param {DetoxElement} elementToWaitFor - element given by selector by.id('uniqueID') or by.text('Text') , etc.
 * @param {DetoxElement} elementToScroll - element given by selector by.id('uniqueID') or by.text('Text') , etc.
 */
export async function scrollUntilVisible(
  elementToWaitFor,
  elementToScroll,
  OS = 'ios',
  scrollAmount = 60,
  scrollDirection = 'down',
) {
  await waitFor(element(elementToWaitFor))
    .toBeVisible()
    .whileElement(elementToScroll)
    .scroll(scrollAmount, scrollDirection);

  if (OS !== 'ios') {
    try {
      await element(elementToScroll).scroll(scrollAmount, scrollDirection);
    } catch {}
  }
}

async function setPickerAndroid(pickerID, value) {
  await element(by.id(pickerID)).tap();
  await element(by.text(value)).tap();
}

async function setPickerIOS(pickerID, value) {
  await element(by.id(pickerID + '.showButton')).tap();
  await element(by.id(pickerID)).setColumnToValue(0, value);
}

export async function setPicker(pickerID, value, OS) {
  const setters = {
    ios: setPickerIOS,
    android: setPickerAndroid,
  };

  await setters[OS](pickerID, value);
}

export async function waitUntilLoaded(waitTime) {
  await waitFor(element(by.id('tabs.homePage')))
    .toBeVisible()
    .withTimeout(8 * waitTime);
  await waitFor(element(by.text('Daily Text')))
    .toBeVisible()
    .withTimeout(8 * waitTime);
}

async function setTimePickerAndroid(parentID, time) {
  let hourText = '' + time.getHours();
  let minuteText = '' + time.getMinutes();

  const keyboardIconButton = element(
    by.type('androidx.appcompat.widget.AppCompatImageButton'),
  );

  await keyboardIconButton.tap();

  const minuteTextinput = element(
    by.type('androidx.appcompat.widget.AppCompatEditText'),
  ).atIndex(1);

  await minuteTextinput.replaceText(minuteText);

  const hourTextinput = element(
    by.type('androidx.appcompat.widget.AppCompatEditText'),
  ).atIndex(0);

  await hourTextinput.replaceText(hourText);

  await element(by.text('OK')).tap();
}

async function setDatePickerAndroid(parentID, date) {
  //Currently detox doesn't have nice functionality to set the date picker for android. So this will have to suffice
  //Got this from the detox tests for the date time picker itself
  await element(by.id(parentID + '.showButton')).tap();
  await element(
    by
      .type('android.widget.ScrollView')
      .withAncestor(by.type('android.widget.DatePicker')),
  ).tapAtPoint({x: 75, y: 100});
  await element(by.text('OK')).tap();
}

async function setDateTimePickerAndroid(parentID, time, mode) {
  const setters = {
    date: setDatePickerAndroid,
    time: setTimePickerAndroid,
  };

  await setters[mode](parentID, time);
}

async function setDateTimePickerIOS(parentID, time, mode) {
  /*
  The ISO date string given by javascript is based at UTC +00:00 denoted by a Z at the end of the string
  It also adds a decimal value to the time to indicate miliseconds
  The ISO date string expected by the NSDateFormatter used by detox does not expect miliseconds and
  expects an explicit definition of the UTC timezone. therefore we need to shave some characters off
  the end of the javascript given string and add the UTC +00:00 string in order for it to be accepted
  */
  let ISOString = time.toISOString();
  ISOString = ISOString.slice(0, -5);
  ISOString = ISOString + '+00:00';

  await element(by.id(parentID + '.showButton')).tap();
  await element(by.id(parentID + '.picker')).setDatePickerDate(
    ISOString,
    'ISO8601',
  );
  //Sometimes a popup shows up after changing the time. in this case the done button will not show and will cause the test to fail
  try {
    await element(by.id(parentID + '.picker.doneButton')).tap();
  } catch (e) {
    console.error(e);
  }
}

export async function setDateTimePicker(parentID, time, mode, OS) {
  const setters = {
    ios: setDateTimePickerIOS,
    android: setDateTimePickerAndroid,
  };

  await setters[OS](parentID, time, mode);
}
