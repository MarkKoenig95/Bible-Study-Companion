import {waitForMS} from './general';

export async function openReadingReminders(parentID) {
  await element(by.id(parentID + 'readingRemindersButton')).tap();

  await expect(
    element(by.id(parentID + 'readingRemindersPopup')),
  ).toBeVisible();
}

export async function openReadingInfoPopup(parentID, portion) {
  await element(by.id(parentID + portion)).tap();

  await expect(element(by.id(parentID + 'readingInfoPopup'))).toBeVisible();
}

export async function completeReadingFromInfoPopup(
  parentID,
  portion,
  waitTime,
) {
  await openReadingInfoPopup(parentID, portion);

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

export async function completeReadingWithLongPress(
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

export async function completeReadingWithCheckbox(parentID, portion, waitTime) {
  await element(by.id(parentID + portion + '.checkBox')).tap();

  await waitFor(element(by.id(parentID + portion)))
    .not.toBeVisible()
    .withTimeout(2 * waitTime);

  await expect(element(by.id(parentID + portion))).not.toBeVisible();
}

export async function openReadingButtonsPopup(parentID, startPortion) {
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
export async function completeReadingInButtonPopup(
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
  await openReadingButtonsPopup(parentID, startPortion);

  await completionFunctions[completionMethod]();

  // TODO: Make it so that checked off items in buttons popup disappear immediately (at least for weekly readings). Then get rid of these bits of code once bug is fixed
  // ! --------------------------------------------------------------------
  await waitForMS(2000);
  await element(by.id(parentID + 'buttonsPopup.closeButton')).tap();
  await waitFor(element(by.id(parentID + 'buttonsPopup')))
    .not.toBeVisible()
    .withTimeout(2000);
  await openReadingButtonsPopup(parentID, startPortion);
  // ! --------------------------------------------------------------------

  await expect(element(by.id(parentID + portionToComp))).not.toBeVisible();
}

export async function completeReadingInButtonPopupFromInfoPopup(
  parentID,
  multiPortionStart,
  portionToComplete,
) {
  await openReadingButtonsPopup(parentID, multiPortionStart);

  await openReadingInfoPopup(parentID, portionToComplete);

  await waitFor(element(by.id(parentID + 'readingInfoPopup.confirmButton')))
    .toBeVisible()
    .whileElement(by.id(parentID + 'readingInfoPopup.scrollView'))
    .scroll(50, 'down');

  await element(by.id(parentID + 'readingInfoPopup.confirmButton')).tap();

  await openReadingButtonsPopup(parentID, multiPortionStart);

  await expect(element(by.id(parentID + portionToComplete))).not.toBeVisible();
}
