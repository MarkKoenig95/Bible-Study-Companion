/* eslint-env detox/detox, jest */
beforeAll(async () => {
  await device.launchApp({permissions: {notifications: 'YES'}});
  await waitFor(element(by.text('Daily Text')))
    .toBeVisible()
    .withTimeout(40000);
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
    await element(by.id('tabs.settingsPage')).tap();
    await expect(element(by.id('settingsPage'))).toBeVisible();
  });
});
