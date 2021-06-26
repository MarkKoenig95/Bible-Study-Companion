/* eslint-env detox/detox, jest */
import {scrollUntilVisible, waitForMS} from './helpers/general';
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
var OS;
const prefix = 'homePage.';

beforeAll(async () => {
  OS = device.getPlatform();
  if (OS !== 'ios') {
    waitTime *= 5;
  }
});

beforeEach(async () => {
  await device.launchApp({
    newInstance: true,
    permissions: {notifications: 'YES'},
  });

  await waitFor(element(by.text('Daily Text')))
    .toBeVisible()
    .withTimeout(4 * waitTime);
});

describe('Check sections', () => {
  it('Today', async () => {
    await expect(element(by.text('Today'))).toBeVisible();
  });

  it('This Week', async () => {
    await scrollUntilVisible(by.text('This Week'), by.id(prefix + 'list'), OS);
    await expect(element(by.text('This Week'))).toBeVisible();
  });

  it('This Month', async () => {
    await scrollUntilVisible(by.text('This Month'), by.id(prefix + 'list'), OS);
    await expect(element(by.text('This Month'))).toBeVisible();
  });

  it('Other', async () => {
    await scrollUntilVisible(by.text('Other'), by.id(prefix + 'list'), OS);
    await expect(element(by.text('Other'))).toBeVisible();
  });

  it('Completes all items in This Month section', async () => {
    await scrollUntilVisible(
      by.id(prefix + 'Monthly Reminder'),
      by.id(prefix + 'list'),
      OS,
    );
    await element(by.id(prefix + 'Monthly Reminder.checkBox')).tap();
    await shouldCompleteReadingWithCheckbox(
      prefix,
      'Monthly Reminder',
      waitTime,
    );
    await expect(element(by.text('This Month'))).not.toBeVisible();
  });
});

it('shows the reading reminders popup', async () => {
  await shouldOpenReadingReminders(prefix);
});

it('opens the reading info popup', async () => {
  await shouldOpenReadingInfoPopup(prefix, 'Job 1-34');
});

it('marks a reading portion complete with the button in the reading info popup', async () => {
  await shouldCompleteReadingFromInfoPopup(prefix, 'Job 1-34', waitTime, OS);
});

it('marks a reading portion complete with longPress', async () => {
  await shouldCompleteReadingWithLongPress(prefix, 'Genesis 1-29', waitTime);
});

it('marks a reading portions complete with the checkBox', async () => {
  await shouldCompleteReadingWithCheckbox(prefix, 'Genesis 1-37', waitTime);
});

it('opens buttons popup', async () => {
  await element(by.id(prefix + 'list')).scroll(75, 'down');
  await shouldOpenReadingButtonsPopup(prefix, 'Numbers 15:1-14');
});

it('marks a reading item complete in buttons popup with longPress', async () => {
  await element(by.id(prefix + 'list')).scroll(75, 'down');
  await shouldCompleteReadingInButtonPopup(
    prefix,
    'Numbers 15:1-14',
    'Numbers 15:15-28',
    'longPress',
  );
});

it('marks a reading item complete in buttons popup with checkBox', async () => {
  await element(by.id(prefix + 'list')).scroll(75, 'down');
  await shouldCompleteReadingInButtonPopup(
    prefix,
    'Numbers 15:1-14',
    'Numbers 16:2-15',
    'checkBox',
  );
});

it('marks a reading portion complete with the button in the reading info popup opened from buttons popup', async () => {
  await element(by.id(prefix + 'list')).scroll(75, 'down');
  await shouldCompleteReadingInButtonPopupFromInfoPopup(
    prefix,
    'Numbers 15:1-14',
    'Numbers 16:16-29',
  );
});

it('opens reading info popup from button in buttons popup', async () => {
  await element(by.id(prefix + 'list')).scroll(75, 'down');
  await shouldOpenReadingButtonsPopup(prefix, 'Numbers 15:1-14');
  await shouldOpenReadingInfoPopup(prefix, 'Numbers 15:1-14');
});

it('marks a whole reading portion, made up of many sections, complete', async () => {
  shouldCompleteReadingWithCheckbox(
    prefix,
    'multiPortionStartingWith.Numbers 15:1-14',
    waitTime,
  );
});

it('Completes a reminder with longPress', async () => {
  await scrollUntilVisible(
    by.id(prefix + 'Midweek Meeting Study'),
    by.id(prefix + 'list'),
    OS,
    75,
  );

  await element(by.id(prefix + 'Midweek Meeting Study.checkBox')).tap();
  await waitForMS(2000);
  await element(by.id(prefix + 'Midweek Meeting Study')).longPress();

  await waitFor(element(by.id(prefix + 'Midweek Meeting Study')))
    .not.toBeVisible()
    .withTimeout(waitTime * 2);

  await expect(
    element(by.id(prefix + 'Midweek Meeting Study')),
  ).not.toBeVisible();
});

it('Completes a reminder from the confirmation popup', async () => {
  await scrollUntilVisible(
    by.id(prefix + 'Weekend Meeting Study'),
    by.id(prefix + 'list'),
    OS,
    75,
  );
  await element(by.id(prefix + 'Weekend Meeting Study.checkBox')).tap();
  await waitForMS(2000);
  await element(by.id(prefix + 'Weekend Meeting Study')).tap();

  await waitFor(element(by.id(prefix + 'messagePopup.confirmButton')))
    .toBeVisible()
    .withTimeout(waitTime * 2);
  await element(by.id(prefix + 'messagePopup.confirmButton')).tap();

  await waitFor(element(by.id(prefix + 'Weekend Meeting Study')))
    .not.toBeVisible()
    .withTimeout(waitTime * 2);

  await expect(
    element(by.id(prefix + 'Weekend Meeting Study')),
  ).not.toBeVisible();
});
