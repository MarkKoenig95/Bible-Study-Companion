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

/**
 * Given an element to wait for being visible and an element to scroll, will scroll until the element to wait for is visible
 * @param {DetoxElement} elementToWaitFor - element given by selector by.id('uniqueID') or by.text('Text') , etc.
 * @param {DetoxElement} elementToScroll - element given by selector by.id('uniqueID') or by.text('Text') , etc.
 */
export async function scrollUntilVisible(
  elementToWaitFor,
  elementToScroll,
  scrollAmount = 50,
  scrollDirection = 'down',
) {
  await waitFor(element(elementToWaitFor))
    .toBeVisible()
    .whileElement(elementToScroll)
    .scroll(scrollAmount, scrollDirection);
}

export async function setDateTimePicker(parentID, time) {
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
  await element(by.id(parentID + '.picker.doneButton')).tap();
}
