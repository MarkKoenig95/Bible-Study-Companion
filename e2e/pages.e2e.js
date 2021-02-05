beforeAll(async () => {
  await device.launchApp();
});

describe('opening pages', () => {
  beforeEach(async () => {
    await device.reloadReactNative();
  });

  it('should show home page', async () => {
    await element(by.id('tabs.homePage')).tap();
    await expect(element(by.id('homePage'))).toBeVisible();
  });

  it('should show schedules page', async () => {
    await element(by.id('tabs.schedulesPage')).tap();
    await expect(element(by.id('schedulesPage'))).toBeVisible();
  });

  it('should show settings page', async () => {
    await element(by.id('tabs.settingsPage')).tap();
    await expect(element(by.id('settingsPage'))).toBeVisible();
  });
});
