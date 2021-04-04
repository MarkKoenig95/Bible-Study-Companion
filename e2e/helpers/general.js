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
