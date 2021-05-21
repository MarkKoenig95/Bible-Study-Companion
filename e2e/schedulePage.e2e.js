/* eslint-env detox/detox, jest */
import {getProps} from 'detox-getprops';
import {setDateTimePicker, waitForMS} from './helpers/general';
import {
  shouldOpenReadingReminders,
  shouldOpenReadingInfoPopup,
  shouldCompleteReadingFromInfoPopup,
  shouldCompleteReadingWithLongPress,
  shouldCompleteReadingWithCheckbox,
  shouldOpenReadingButtonsPopup,
  shouldCompleteReadingInButtonPopup,
  shouldCompleteReadingInButtonPopupFromInfoPopup,
} from './helpers/scheduleList';

var waitTime = 1000;
const prefix = 'schedulePage.';

beforeAll(async () => {
  if (device.getPlatform() !== 'ios') {
    waitTime *= 5;
  }

  await device.launchApp({permissions: {notifications: 'YES'}});
});

beforeEach(async () => {
  await device.reloadReactNative();
  await waitForMS(3 * waitTime);
  await element(by.id('tabs.schedulesPage')).tap();
});

describe('basic schedule page functions', () => {
  beforeEach(async () => {
    await element(by.id('schedulesPage.Base Seq')).tap();
    await waitFor(element(by.id('schedulePage')))
      .toBeVisible()
      .withTimeout(2 * waitTime);
  });

  it("should navigate to a schedule's page", async () => {
    await expect(element(by.id('schedulePage'))).toBeVisible();
  });

  it('should show the reading reminders popup', async () => {
    await shouldOpenReadingReminders(prefix);
  });

  it('should show the settings popup', async () => {
    await element(by.id(prefix + 'header.settingsButton')).tap();

    await waitFor(element(by.id(prefix + 'settingsPopup')))
      .toBeVisible()
      .withTimeout(2 * waitTime);

    await expect(element(by.id(prefix + 'settingsPopup'))).toBeVisible();
  });

  it('should set a new date for the schedule', async () => {
    const date = new Date(2021, 4, 1, 10, 0, 0, 0);

    await element(by.id(prefix + 'header.settingsButton')).tap();

    await waitFor(element(by.id(prefix + 'settingsPopup')))
      .toBeVisible()
      .withTimeout(2 * waitTime);

    await setDateTimePicker(prefix + 'settingsPopup.datePicker', date);

    await element(by.id(prefix + 'messagePopup.confirmButton')).tap();

    await waitFor(element(by.id('schedulesPage')))
      .toBeVisible()
      .withTimeout(10 * waitTime);

    await element(by.id('schedulesPage.Base Seq')).tap();

    await waitFor(element(by.id('schedulePage')))
      .toBeVisible()
      .withTimeout(2 * waitTime);

    await expect(
      element(by.id(prefix + 'Genesis 1-29.completionDate')),
    ).toHaveText('5/1/21');
  });

  it('should set schedule to not track reading dates', async () => {
    await element(by.id(prefix + 'header.settingsButton')).tap();

    await waitFor(element(by.id(prefix + 'settingsPopup')))
      .toBeVisible()
      .withTimeout(2 * waitTime);

    await element(by.id(prefix + 'settingsPopup.shouldTrackCheckBox')).tap();

    await element(by.id(prefix + 'settingsPopup.closeButton')).tap();

    //When there is no date I make the text 6 spaces to retain spacing
    await expect(
      element(by.id(prefix + 'Genesis 1-29.completionDate')),
    ).toHaveText('      ');
  });

  it('should scroll to the end of a schedule list and checks if the last item is there', async () => {
    await element(by.id(prefix + 'buttonList')).scrollTo('bottom');

    await expect(element(by.id(prefix + 'Revelation 18-22'))).toBeVisible();
  });
});

describe('bible schedule page', () => {
  beforeAll(async () => {
    await element(by.id('schedulesPage.Base Chrono')).tap();

    await waitFor(element(by.id('schedulePage')))
      .toBeVisible()
      .withTimeout(2 * waitTime);

    await element(by.id(prefix + 'header.settingsButton')).tap();

    await waitFor(element(by.id(prefix + 'settingsPopup')))
      .toBeVisible()
      .withTimeout(2 * waitTime);

    await element(by.id(prefix + 'settingsPopup.hideCompletedCheckBox')).tap();
  });
  beforeEach(async () => {
    await element(by.id('schedulesPage.Base Chrono')).tap();
  });

  it('opens the reading info popup', async () => {
    await shouldOpenReadingInfoPopup(prefix, 'Job 1-34');
  });

  it('marks a reading portion complete with the button in the reading info popup', async () => {
    await shouldCompleteReadingFromInfoPopup(prefix, 'Job 1-34', waitTime);
  });

  it('checks the hide completed button functionality', async () => {
    await expect(element(by.id(prefix + 'Job 1-34'))).not.toBeVisible();
  });

  it('marks a reading portion complete with longPress', async () => {
    await shouldCompleteReadingWithLongPress(
      prefix,
      'Leviticus 10:1-Numbers 5:1',
      waitTime,
    );
  });

  it('marks a reading portions complete with the checkBox', async () => {
    await shouldCompleteReadingWithCheckbox(
      prefix,
      'Exodus 23-Leviticus 9',
      waitTime,
    );
  });

  it('opens buttons popup', async () => {
    await shouldOpenReadingButtonsPopup(prefix, 'Exodus 1-22');
  });

  it('marks a reading item complete in buttons popup with longPress', async () => {
    await shouldCompleteReadingInButtonPopup(
      prefix,
      'Exodus 1-22',
      'Job 35-42',
      'longPress',
    );
  });

  it('marks a reading item complete in buttons popup with checkBox', async () => {
    await shouldCompleteReadingInButtonPopup(
      prefix,
      'Exodus 1-22',
      '1 Chronicles 6:1-3',
      'checkBox',
    );
  });

  it('opens reading info popup from button in buttons popup', async () => {
    await shouldOpenReadingButtonsPopup(prefix, 'Exodus 1-22');
    await shouldOpenReadingInfoPopup(prefix, 'Exodus 1-22');
  });

  it('marks a reading portion complete with the button in the reading info popup opened from buttons popup', async () => {
    await shouldOpenReadingButtonsPopup(prefix, 'Exodus 1-22');

    await shouldOpenReadingInfoPopup(prefix, 'Exodus 1-22');

    await waitFor(element(by.id(prefix + 'readingInfoPopup.confirmButton')))
      .toBeVisible()
      .whileElement(by.id(prefix + 'readingInfoPopup.scrollView'))
      .scroll(50, 'down');

    await element(by.id(prefix + 'readingInfoPopup.confirmButton')).tap();

    await expect(
      element(by.id(prefix + 'multiPortionStartingWith.Exodus 1-22')),
    ).not.toBeVisible();
  });

  it('marks a whole reading portion, made up of many sections, complete', async () => {
    shouldCompleteReadingWithCheckbox(
      prefix,
      'multiPortionStartingWith.Numbers 5:2-29:1',
      waitTime,
    );
  });

  it('deletes the schedule', async () => {
    await element(by.id(prefix + 'header.deleteButton')).tap();

    await element(by.id(prefix + 'messagePopup.confirmButton')).tap();

    await waitFor(element(by.id('schedulesPage')))
      .toBeVisible()
      .withTimeout(2 * waitTime);

    await waitFor(element(by.id(prefix + 'New Schedule')))
      .not.toBeVisible()
      .withTimeout(2 * waitTime);

    await expect(element(by.id(prefix + 'New Schedule'))).not.toBeVisible();
  });
});
