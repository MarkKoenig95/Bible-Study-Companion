/* eslint-env detox/detox, jest */
import {waitForMS} from './general';

export async function shouldOpenReadingReminders(parentID) {
  await element(by.id(parentID + 'readingRemindersButton')).tap();

  await expect(
    element(by.id(parentID + 'readingRemindersPopup')),
  ).toBeVisible();
}

export async function shouldOpenReadingInfoPopup(parentID, portion) {
  await element(by.id(parentID + portion)).tap();

  await expect(element(by.id(parentID + 'readingInfoPopup'))).toBeVisible();
}

export async function shouldCompleteReadingFromInfoPopup(
  parentID,
  portion,
  waitTime,
) {
  await shouldOpenReadingInfoPopup(parentID, portion);

  await waitFor(element(by.id(parentID + 'readingInfoPopup.confirmButton')))
    .toBeVisible()
    .whileElement(by.id(parentID + 'readingInfoPopup.scrollView'))
    .scroll(50, 'down');

  await element(by.id(parentID + 'readingInfoPopup.confirmButton')).tap();

  await expect(element(by.id(parentID + 'readingInfoPopup'))).not.toBeVisible();

  await waitFor(element(by.id(parentID + portion)))
    .not.toBeVisible()
    .withTimeout(waitTime);

  await expect(element(by.id(parentID + portion))).not.toBeVisible();
}

export async function shouldCompleteReadingWithLongPress(
  parentID,
  portion,
  waitTime,
) {
  await element(by.id(parentID + portion)).longPress();

  await waitFor(element(by.id(parentID + portion)))
    .not.toBeVisible()
    .withTimeout(2 * waitTime);

  await expect(element(by.id(parentID + portion))).not.toBeVisible();
}

export async function shouldCompleteReadingWithCheckbox(
  parentID,
  portion,
  waitTime,
) {
  await element(by.id(parentID + portion + '.checkBox')).tap();

  await waitFor(element(by.id(parentID + portion)))
    .not.toBeVisible()
    .withTimeout(2 * waitTime);

  await expect(element(by.id(parentID + portion))).not.toBeVisible();
}

export async function shouldOpenReadingButtonsPopup(parentID, startPortion) {
  await element(
    by.id(parentID + 'multiPortionStartingWith.' + startPortion),
  ).tap();

  await expect(element(by.id(parentID + 'buttonsPopup'))).toBeVisible();
}

/**
 * Marks a reading portion inside a button popup complete using the given method
 * @param {string} parentID
 * @param {string} startPortion
 * @param {string} portionToComp
 * @param {string} [completionMethod=(longPress|checkBox)] - The method to use to mark the reading portion complete
 */
export async function shouldCompleteReadingInButtonPopup(
  parentID,
  startPortion,
  portionToComp,
  completionMethod = 'checkBox',
) {
  const completionFunctions = {
    longPress: async () => {
      element(by.id(parentID + portionToComp)).longPress();
    },
    checkBox: async () => {
      element(by.id(parentID + portionToComp + '.checkBox')).tap();
    },
  };
  await shouldOpenReadingButtonsPopup(parentID, startPortion);

  await completionFunctions[completionMethod]();

  // TODO: Make it so that checked off items in buttons popup disappear immediately (at least for weekly readings). Then get rid of these bits of code once bug is fixed
  // ! --------------------------------------------------------------------
  await waitForMS(2000);
  await element(by.id(parentID + 'buttonsPopup.closeButton')).tap();
  await waitFor(element(by.id(parentID + 'buttonsPopup')))
    .not.toBeVisible()
    .withTimeout(2000);
  await shouldOpenReadingButtonsPopup(parentID, startPortion);
  // ! --------------------------------------------------------------------

  await expect(element(by.id(parentID + portionToComp))).not.toBeVisible();
}

export async function shouldCompleteReadingInButtonPopupFromInfoPopup(
  parentID,
  multiPortionStart,
  portionToComplete,
) {
  await shouldOpenReadingButtonsPopup(parentID, multiPortionStart);

  await shouldOpenReadingInfoPopup(parentID, portionToComplete);

  await waitFor(element(by.id(parentID + 'readingInfoPopup.confirmButton')))
    .toBeVisible()
    .whileElement(by.id(parentID + 'readingInfoPopup.scrollView'))
    .scroll(50, 'down');

  await element(by.id(parentID + 'readingInfoPopup.confirmButton')).tap();

  await shouldOpenReadingButtonsPopup(parentID, multiPortionStart);

  await expect(element(by.id(parentID + portionToComplete))).not.toBeVisible();
}
