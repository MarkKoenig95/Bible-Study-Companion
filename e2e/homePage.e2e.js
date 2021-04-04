import {scrollUntilVisible, waitForMS} from './helpers/general';
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
const prefix = 'homePage.';

beforeAll(async () => {
  if (device.getPlatform() !== 'ios') {
    waitTime *= 5;
  }
});

beforeEach(async () => {
  await device.launchApp({permissions: {notifications: 'YES'}});

  await waitFor(element(by.text('Daily Text')))
    .toBeVisible()
    .withTimeout(8 * waitTime);
});

describe('Check sections', () => {
  it('Today', async () => {
    await expect(element(by.text('Today'))).toBeVisible();
  });

  it('This Week', async () => {
    await scrollUntilVisible(by.text('This Week'), by.id(prefix + 'list'));
    await expect(element(by.text('This Week'))).toBeVisible();
  });

  it('This Month', async () => {
    await scrollUntilVisible(by.text('This Month'), by.id(prefix + 'list'));
    await expect(element(by.text('This Month'))).toBeVisible();
  });

  it('Other', async () => {
    await scrollUntilVisible(by.text('Other'), by.id(prefix + 'list'));
    await expect(element(by.text('Other'))).toBeVisible();
  });

  it('Completes all items in This Month section', async () => {
    await scrollUntilVisible(
      by.id(prefix + 'Monthly Reminder'),
      by.id(prefix + 'list'),
    );
    await element(by.id(prefix + 'Monthly Reminder.checkBox')).tap();
    await completeReadingWithCheckbox(prefix, 'Monthly Reminder', waitTime);
    await expect(element(by.text('This Month'))).not.toBeVisible();
  });
});

it('shows the reading reminders popup', async () => {
  await openReadingReminders(prefix);
});

it('opens the reading info popup', async () => {
  await openReadingInfoPopup(prefix, 'Job 1-34');
});

it('marks a reading portion complete with the button in the reading info popup', async () => {
  await completeReadingFromInfoPopup(prefix, 'Job 1-34', waitTime);
});

it('marks a reading portion complete with longPress', async () => {
  await completeReadingWithLongPress(prefix, 'Genesis 1-29', waitTime);
});

it('marks a reading portions complete with the checkBox', async () => {
  await completeReadingWithCheckbox(prefix, 'Genesis 1-37', waitTime);
});

it('opens buttons popup', async () => {
  await openReadingButtonsPopup(prefix, 'Numbers 15:1-14');
});

it('marks a reading item complete in buttons popup with longPress', async () => {
  await completeReadingInButtonPopup(
    prefix,
    'Numbers 15:1-14',
    'Numbers 15:15-28',
    'longPress',
  );
});

it('marks a reading item complete in buttons popup with checkBox', async () => {
  await completeReadingInButtonPopup(
    prefix,
    'Numbers 15:1-14',
    'Numbers 16:2-15',
    'checkBox',
  );
});

it('marks a reading portion complete with the button in the reading info popup opened from buttons popup', async () => {
  await completeReadingInButtonPopupFromInfoPopup(
    prefix,
    'Numbers 15:1-14',
    'Numbers 16:16-29',
  );
});

it('opens reading info popup from button in buttons popup', async () => {
  await openReadingButtonsPopup(prefix, 'Numbers 15:1-14');
  await openReadingInfoPopup(prefix, 'Numbers 15:1-14');
});

it('marks a whole reading portion, made up of many sections, complete', async () => {
  completeReadingWithCheckbox(
    prefix,
    'multiPortionStartingWith.Numbers 15:1-14',
    waitTime,
  );
});

it('Completes a reminder from the confirmation popup', async () => {
  await scrollUntilVisible(
    by.id(prefix + 'Weekend Meeting Study'),
    by.id(prefix + 'list'),
  );
  await element(by.id(prefix + 'Weekend Meeting Study.checkBox')).tap();
  await element(by.id(prefix + 'Weekend Meeting Study')).tap();
  await element(by.id(prefix + 'messagePopup.confirmButton')).tap();

  await waitFor(element(by.id(prefix + 'Weekend Meeting Study')))
    .not.toBeVisible()
    .withTimeout(waitTime * 2);

  await expect(
    element(by.id(prefix + 'Weekend Meeting Study')),
  ).not.toBeVisible();
});

it('Completes a reminder with longPress', async () => {
  await scrollUntilVisible(
    by.id(prefix + 'Midweek Meeting Study'),
    by.id(prefix + 'list'),
  );

  await element(by.id(prefix + 'Midweek Meeting Study.checkBox')).tap();
  await element(by.id(prefix + 'Midweek Meeting Study')).longPress();

  await expect(
    element(by.id(prefix + 'Midweek Meeting Study')),
  ).not.toBeVisible();
});
