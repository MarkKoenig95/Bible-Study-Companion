beforeAll(async () => {
  await device.launchApp();
});

describe('opening pages', () => {
  it('should show home page', async () => {
    await waitFor(element(by.id('schedulesPage.scheduleTypePopup')))
      .toBeVisible()
      .withTimeout(2000);
    await element(by.id('tabs.homePage')).tap();
    //Once this element shows up we know that the database has been set up
    await waitFor(element(by.text('Daily Text')))
      .toBeVisible()
      .withTimeout(40000);
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
