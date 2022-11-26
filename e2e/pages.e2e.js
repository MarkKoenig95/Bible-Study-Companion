/* eslint-env detox/detox, jest */
import {waitUntilLoaded} from './helpers/general';

var waitTime = 1000;
var OS;

beforeAll(async () => {
  OS = device.getPlatform();
  if (OS !== 'ios') {
    waitTime *= 5;
  }
  await device.launchApp({permissions: {notifications: 'YES'}});
  await waitUntilLoaded(waitTime);
});

describe('opening pages', () => {
  it('should show home page', async () => {
    await expect(element(by.id('homePage'))).toBeVisible();
  });

  it('should show schedules page', async () => {
    await element(by.id('tabs.schedulesPage')).tap();
    await expect(element(by.id('schedulesPage'))).toBeVisible();
  });

  it('should show settings page', async () => {
    await element(by.id('tabs.morePage')).tap();
    await expect(element(by.id('morePage'))).toBeVisible();
  });
});
