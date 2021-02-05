beforeAll(async () => {
  await device.launchApp();
});
describe('Schedule', () => {
  it('should show schedules page', async () => {
    await expect(element(by.id('schedulesPage'))).toBeVisible();
  });

  it('should show create schedule popup after tap', async () => {
    await element(
      by.id('schedulesPage.scheduleTypePopup.sequentialButton'),
    ).tap();
    await expect(
      element(by.id('schedulesPage.createSchedulePopup')),
    ).toBeVisible();
  });

  // it('should have home page', async () => {
  //   await expect(element(by.id('homePage'))).toBeVisible();
  // });

  // it('should show reading reminders popup after tap', async () => {
  //   await element(by.id('homePage.readingRemindersButton')).tap();
  //   await expect(element(by.id('readingRemindersPopup'))).toBeVisible();
  // });
});
