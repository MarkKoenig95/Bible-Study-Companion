/* eslint-env detox/detox, jest */
import {setPicker, waitForMS} from './helpers/general';
// * Note to tester, I programmed this on March 31st, 2021. As of this writing I am not sure how to set
// * the time for the ios simulator other than changing the time of the computer. So for the time being
// * this test will be based on that date.
// TODO: Add jest.useFakeTimers('modern') or something to make this work without dumb workarouds to deal with stupid Apple

const prefix = 'settingsPage.';
var waitTime = 1000;
let OS;

beforeAll(async () => {
  OS = device.getPlatform();

  await device.launchApp({permissions: {notifications: 'YES'}});

  //Once this element shows up we know that the database has been set up
  await waitFor(element(by.text('Daily Text')))
    .toBeVisible()
    .withTimeout(40000);
});

describe('Weekly reading settings', () => {
  beforeEach(async () => {
    await device.launchApp({
      newInstance: true,
      permissions: {notifications: 'YES'},
    });
    //Once this element shows up we know that the database has been set up
    await waitFor(element(by.text('Daily Text')))
      .toBeVisible()
      .withTimeout(40000);

    await element(by.id('tabs.settingsPage')).tap();
  });

  it('turns show daily portions on and off', async () => {
    await element(by.id(prefix + 'weeklyReading.showWeeklySwitch')).tap();

    // TODO: Get rid of these bits of code
    // Not working as intended for now. Putting in this temporary workaround for the moment
    await device.launchApp({newInstance: true});
    await waitForMS(3 * waitTime);
    await waitFor(element(by.text('Daily Text')))
      .toBeVisible()
      .withTimeout(40000);
    // ------------------------------------------------------------------------------------

    await expect(element(by.id('homePage.Numbers 15:1-14'))).toBeVisible();

    // Go back to the settings page, flip the switch back and expect the reading not to be there
    await element(by.id('tabs.settingsPage')).tap();
    await element(by.id(prefix + 'weeklyReading.showWeeklySwitch')).tap();

    // TODO: Get rid of these bits of code
    // Not working as intended for now. Putting in this temporary workaround for the moment
    await device.launchApp({newInstance: true});
    await waitForMS(3 * waitTime);
    await waitFor(element(by.text('Daily Text')))
      .toBeVisible()
      .withTimeout(40000);
    // ------------------------------------------------------------------------------------

    await expect(element(by.id('homePage.Numbers 15:1-14'))).not.toBeVisible();
  });

  it('changes weekly reading reset day', async () => {
    await setPicker(prefix + 'weeklyReading.weekdayPicker', 'Wednesday', OS);

    await element(by.id('tabs.homePage')).tap();

    await expect(
      element(by.id('homePage.multiPortionStartingWith.Numbers 17:1-10')),
    ).toBeVisible();
  });
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

    await element(by.id('tabs.settingsPage')).tap();
  });

  it('opens notifications page', async () => {
    await element(by.id(prefix + 'notifications')).tap();
    await waitFor(element(by.id('notificationsPage')))
      .toBeVisible()
      .withTimeout(5 * waitTime);
    await expect(element(by.id('notificationsPage'))).toBeVisible();
  });

  it('opens reminders page', async () => {
    await element(by.id(prefix + 'reminders')).tap();
    await waitFor(element(by.id('remindersPage')))
      .toBeVisible()
      .withTimeout(5 * waitTime);
    await expect(element(by.id('remindersPage'))).toBeVisible();
  });
});
