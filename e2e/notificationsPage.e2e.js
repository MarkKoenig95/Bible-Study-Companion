/* eslint-env detox/detox, jest */
import {goBack, setDateTimePicker} from './helpers/general';
const prefix = 'notificationsPage.';
var waitTime = 1000;
var OS;

async function toggleSwitch(parentID, expectedValue) {
  await element(by.id(parentID + '.switch')).tap();
  await expect(element(by.id(parentID + '.switch'))).toHaveToggleValue(
    expectedValue,
  );
}

beforeAll(async () => {
  OS = device.getPlatform();
  if (OS !== 'ios') {
    waitTime *= 5;
  }
});

beforeEach(async () => {
  await device.uninstallApp();
  await device.installApp();
  await device.launchApp({permissions: {notifications: 'YES'}});

  await waitFor(element(by.text('Daily Text')))
    .toBeVisible()
    .withTimeout(waitTime * 8);

  await element(by.id('tabs.morePage')).tap();
  await element(by.id('morePage.notifications')).tap();
});

it('Creates a notification', async () => {
  const time = new Date(2021, 2, 31, 10, 0, 0, 0);
  const notifPopupID = prefix + 'createNotificationPopup.';
  await element(by.id(prefix + 'header.addButton')).tap();
  await element(by.id(notifPopupID + 'nameInput')).typeText('New');
  await element(by.id(notifPopupID + 'weekdayCheckbox.We')).tap();
  await setDateTimePicker(
    prefix + 'createNotificationPopup.timePicker',
    time,
    'time',
    OS,
  );
  await element(by.id(notifPopupID + 'addButton')).tap();

  // Make sure Wednesday notifications are turned off
  await waitFor(element(by.id('notificationPage.Wednesday')))
    .toBeVisible()
    .whileElement(by.id('notificationPage.list'))
    .scroll(50, 'down');
  await expect(
    element(by.id('notificationPage.Wednesday.switch')),
  ).toHaveToggleValue(false);
  // Make sure correct time was set
  await expect(
    element(by.id('notificationPage.Wednesday.timePicker.display')),
  ).toHaveText('10:00 AM');

  await goBack();

  await waitFor(element(by.id(prefix + 'New')))
    .toBeVisible()
    .whileElement(by.id(prefix + 'list'))
    .scroll(100, 'down');
  await expect(element(by.id(prefix + 'New'))).toBeVisible();
  await expect(
    element(by.id(prefix + 'New.dayMarker.We.indicator')),
  ).toHaveValue('Off');

  await element(by.id(prefix + 'New.chevronButton')).tap();
  await expect(element(by.id('notificationPage'))).toBeVisible();
});

it('Checks turning a notification on', async () => {
  await toggleSwitch(prefix + 'Daily Reading', true);

  await element(by.id(prefix + 'Daily Reading.chevronButton')).tap();
  await expect(
    element(by.id('notificationPage.Monday.switch')),
  ).toHaveToggleValue(true);
});

it('Checks turning a notification off', async () => {
  // It normally starts in the off posistion. Turn it on
  await toggleSwitch(prefix + 'Daily Reading', true);
  // Then turn it back off again
  await toggleSwitch(prefix + 'Daily Reading', false);
  // Check that the individual days have been affected too
  await element(by.id(prefix + 'Daily Reading.chevronButton')).tap();
  await expect(
    element(by.id('notificationPage.Monday.switch')),
  ).toHaveToggleValue(false);
});

describe('Notification page', () => {
  beforeEach(async () => {
    await element(by.id(prefix + 'Daily Reading.chevronButton')).tap();
  });
  let pref = 'notificationPage.';
  it('Toggles a notification day on', async () => {
    await toggleSwitch(pref + 'Monday', true);

    await goBack();

    await expect(
      element(by.id(prefix + 'Daily Reading.switch')),
    ).toHaveToggleValue(true);
  });

  it('Toggles a notification day off', async () => {
    await toggleSwitch(pref + 'Monday', true);
    await toggleSwitch(pref + 'Monday', false);

    await goBack();

    await expect(
      element(by.id(prefix + 'Daily Reading.switch')),
    ).toHaveToggleValue(true);
    await expect(
      element(by.id(prefix + 'Daily Reading.dayMarker.Mo.indicator')),
    ).toHaveValue('Off');
  });

  it('Changes the time for a notification day', async () => {
    const time = new Date(2021, 2, 31, 10, 0, 0, 0);
    await setDateTimePicker(pref + 'Monday.timePicker', time, 'time', OS);
    await expect(
      element(by.id('notificationPage.Monday.timePicker.display')),
    ).toHaveText('10:00 AM');
  });

  it('Deletes a notification', async () => {
    await element(by.id(pref + 'header.deleteButton')).tap();
    await element(by.id('notificationPage.messagePopup.confirmButton')).tap();
    await expect(element(by.id('notificationsPage'))).toBeVisible();
    await expect(element(by.id(prefix + 'Daily Reading'))).not.toBeVisible();
  });
});
