/* eslint-env detox/detox, jest */
const prefix = 'morePage.';
var waitTime = 1000;
let OS;

beforeAll(async () => {
  OS = device.getPlatform();

  if (OS !== 'ios') {
    waitTime *= 5;
  }

  await device.launchApp({permissions: {notifications: 'YES'}});

  //Once this element shows up we know that the database has been set up
  await waitFor(element(by.text('Daily Text')))
    .toBeVisible()
    .withTimeout(40000);
});

describe('General funcitonality', () => {
  beforeEach(async () => {
    await device.launchApp({
      newInstance: true,
      permissions: {notifications: 'YES'},
    });

    await waitFor(element(by.text('Daily Text')))
      .toBeVisible()
      .withTimeout(40000);

    await element(by.id('tabs.morePage')).tap();
  });

  it('should open notifications page', async () => {
    await element(by.id(prefix + 'notifications')).tap();
    await waitFor(element(by.id('notificationsPage')))
      .toBeVisible()
      .withTimeout(5 * waitTime);
    await expect(element(by.id('notificationsPage'))).toBeVisible();
  });

  it('should open reminders page', async () => {
    await element(by.id(prefix + 'reminders')).tap();
    await waitFor(element(by.id('remindersPage')))
      .toBeVisible()
      .withTimeout(5 * waitTime);
    await expect(element(by.id('remindersPage'))).toBeVisible();
  });

  it('should open settings page', async () => {
    await element(by.id(prefix + 'settings')).tap();
    await waitFor(element(by.id('settingsPage')))
      .toBeVisible()
      .withTimeout(5 * waitTime);
    await expect(element(by.id('settingsPage'))).toBeVisible();
  });
});
