import {getProps} from 'detox-getprops';
import {waitForMS} from './helpers/general';
import {
  openReadingReminders,
  openReadingInfoPopup,
  completeReadingFromInfoPopup,
  completeReadingWithLongPress,
  completeReadingWithCheckbox,
  openReadingButtonsPopup,
  completeReadingInButtonPopup,
  completeReadingInButtonPopupFromInfoPopup,
} from './helpers/scheduleList';

var waitTime = 1000;
const prefix = 'schedulePage.';

beforeAll(async () => {
  if (device.getPlatform() !== 'ios') {
    waitTime *= 5;
  }

  await device.launchApp({permissions: {notifications: 'YES'}});

  //Once this element shows up we know that the database has been set up
  await waitFor(element(by.text('Daily Text')))
    .toBeVisible()
    .withTimeout(8 * waitTime);

  await element(by.id('tabs.schedulesPage')).tap();

  await waitFor(element(by.id('schedulesPage')))
    .toBeVisible()
    .withTimeout(2 * waitTime);

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

  it("navigates to a schedule's page", async () => {
    await expect(element(by.id('schedulePage'))).toBeVisible();
  });

  it('shows the reading reminders popup', async () => {
    await openReadingReminders(prefix);
  });

  it('scrolls to the end of a schedule list and checks if the last item is there', async () => {
    await element(by.id(prefix + 'buttonList')).scrollTo('bottom');

    await expect(element(by.id(prefix + 'Revelation 18-22'))).toBeVisible();
  });
});

describe('bible schedule page', () => {
  beforeEach(async () => {
    await element(by.id('schedulesPage.Base Chrono')).tap();
  });

  it('opens the reading info popup', async () => {
    await openReadingInfoPopup(prefix, 'Job 1-34');
  });

  it('marks a reading portion complete with the button in the reading info popup', async () => {
    await completeReadingFromInfoPopup(prefix, 'Job 1-34', waitTime);
  });

  it('checks the hide completed button functionality', async () => {
    await expect(element(by.id(prefix + 'Job 1-34'))).not.toBeVisible();
  });

  it('marks a reading portion complete with longPress', async () => {
    await completeReadingWithLongPress(
      prefix,
      'Leviticus 10:1-Numbers 5:1',
      waitTime,
    );
  });

  it('marks a reading portions complete with the checkBox', async () => {
    await completeReadingWithCheckbox(
      prefix,
      'Exodus 23-Leviticus 9',
      waitTime,
    );
  });

  it('opens buttons popup', async () => {
    await openReadingButtonsPopup(prefix, 'Exodus 1-22');
  });

  it('marks a reading item complete in buttons popup with longPress', async () => {
    await completeReadingInButtonPopup(
      prefix,
      'Exodus 1-22',
      'Job 35-42',
      'longPress',
    );
  });

  it('marks a reading item complete in buttons popup with checkBox', async () => {
    await completeReadingInButtonPopup(
      prefix,
      'Exodus 1-22',
      '1 Chronicles 6:1-3',
      'checkBox',
    );
  });

  it('opens reading info popup from button in buttons popup', async () => {
    await openReadingButtonsPopup(prefix, 'Exodus 1-22');
    await openReadingInfoPopup(prefix, 'Exodus 1-22');
  });

  it('marks a reading portion complete with the button in the reading info popup opened from buttons popup', async () => {
    await openReadingButtonsPopup(prefix, 'Exodus 1-22');

    await openReadingInfoPopup(prefix, 'Exodus 1-22');

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
    completeReadingWithCheckbox(
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
