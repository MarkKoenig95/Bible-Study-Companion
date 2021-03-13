import {getProps} from 'detox-getprops';

beforeAll(async () => {
  await device.launchApp();
  await waitFor(element(by.id(prefix + 'scheduleTypePopup')))
    .toBeVisible()
    .withTimeout(20000);
});
const prefix = 'schedulesPage.';

describe('create sequential schedule', () => {
  it('should show create schedule popup after tap', async () => {
    await element(by.id('tabs.homePage')).tap();
    //Once this element shows up we know that the database has been set up
    await waitFor(element(by.text('Daily Text')))
      .toBeVisible()
      .withTimeout(40000);
    await element(by.id('tabs.schedulesPage')).tap();
    await element(
      by.id(prefix + 'scheduleTypePopup.chronologicalButton'),
    ).tap();
    await expect(element(by.id(prefix + 'createSchedulePopup'))).toBeVisible();
  });

  it('creates a bible reading schedule', async () => {
    let pref = prefix + 'createSchedulePopup.';
    await element(by.id(pref + 'scheduleNameInput')).typeText('New Schedule');
    await element(by.id(pref + 'scheduleDurationInput')).clearText();
    await element(by.id(pref + 'scheduleDurationInput')).typeText('0.1');
    await element(by.id(pref + 'scrollView')).scroll(200, 'down');
    await element(
      by.id(pref + 'scheduleVerseInput.bibleBookPicker.input'),
    ).typeText('Jo');
    await element(by.text('Job')).tap();
    await element(by.id(pref + 'scrollView')).scroll(100, 'down');
    await element(by.id(pref + 'addButton')).tap();
    await expect(
      element(by.id(pref + 'createSchedulePopup')),
    ).not.toBeVisible();
  });

  it('checks if there is a New Schedule button', async () => {
    await waitFor(element(by.text('New Schedule')))
      .toBeVisible()
      .withTimeout(40000);
    await expect(element(by.text('New Schedule'))).toBeVisible();
  });

  it("navigates to the new schedule's page", async () => {
    await element(by.text('New Schedule')).tap();
    await waitFor(element(by.id('schedulePage')))
      .toBeVisible()
      .withTimeout(10000);
    await expect(element(by.id('schedulePage'))).toBeVisible();
  });

  it("opens the reading info popup for a schedule button on the schedule's page", async () => {
    await waitFor(element(by.text('Job 1-34')))
      .toBeVisible()
      .withTimeout(10000);
    await element(by.text('Job 1-34')).tap();
    await waitFor(element(by.id('schedulePage.readingInfoPopup')))
      .toBeVisible()
      .withTimeout(10000);
    await expect(element(by.id('schedulePage.readingInfoPopup'))).toBeVisible();
  });

  it('marks a reading portion complete with the button in the reading info popup', async () => {
    await element(by.id('schedulePage.readingInfoPopup.scrollView')).scroll(
      200,
      'down',
    );
    await element(by.id('schedulePage.readingInfoPopup.confirmButton')).tap();
    await waitFor(element(by.id('schedulePage.readingInfoPopup')))
      .not.toBeVisible()
      .withTimeout(10000);
    await expect(
      element(by.id('schedulePage.readingInfoPopup')),
    ).not.toBeVisible();
  });

  it('marks a reading portions complete with longPress and the checkBox', async () => {
    await element(by.text('Leviticus10:1-Numbers 5:1')).longPress();
    await element(by.id('schedulePage.Exodus 23-Leviticus 9.checkBox')).tap();
    await element(by.id('schedulePage.hideCompletedButton')).tap();
    await waitFor(element(by.text('Job 1-34')))
      .not.toBeVisible()
      .withTimeout(10000);
    await expect(element(by.text('Job 1-34'))).not.toBeVisible();
    await expect(
      element(by.text('Leviticus10:1-Numbers 5:1')),
    ).not.toBeVisible();
    await expect(element(by.text('Exodus 23-Leviticus 9'))).not.toBeVisible();
  });

  it('opens buttons popup', async () => {
    await element(by.id('schedulePage.Exodus 1-22')).tap();
    await waitFor(element(by.id('schedulePage.buttonsPopup')))
      .toBeVisible()
      .withTimeout(10000);
    await expect(element(by.id('schedulePage.buttonsPopup'))).toBeVisible();
  });

  it('marks a reading item complete in buttons popup', async () => {
    await element(by.text('Job 35-42')).longPress();
    await waitFor(element(by.text('Job 35-42')))
      .not.toBeVisible()
      .withTimeout(10000);
    await expect(element(by.text('Job 35-42'))).not.toBeVisible();
  });

  it('opens reading info popup from button in buttons popup', async () => {
    await element(by.text('Exodus 1-22')).tap();
    await waitFor(element(by.id('schedulePage.readingInfoPopup')))
      .toBeVisible()
      .withTimeout(10000);
    await expect(element(by.id('schedulePage.readingInfoPopup'))).toBeVisible();
  });

  it('marks a reading portion complete with the button in the reading info popup opened from buttons popup', async () => {
    await element(by.id('schedulePage.readingInfoPopup.scrollView')).scroll(
      200,
      'down',
    );
    await element(by.id('schedulePage.readingInfoPopup.confirmButton')).tap();
    await waitFor(element(by.id('schedulePage.readingInfoPopup')))
      .not.toBeVisible()
      .withTimeout(10000);
    await expect(
      element(by.id('schedulePage.readingInfoPopup')),
    ).not.toBeVisible();
    await expect(element(by.text('Exodus 1-22'))).not.toBeVisible();
  });

  it('marks a whole reading portion, made up of many sections, complete', async () => {
    await element(by.text('Numbers 5:2-29:1')).longPress();
    await waitFor(element(by.text('Numbers 5:2-29:1')))
      .not.toBeVisible()
      .withTimeout(10000);
    await expect(element(by.text('Numbers 5:2-29:1'))).not.toBeVisible();
  });

  it('scrolls to the end of the list and checks if the last item is there', async () => {
    await element(by.id('schedulePage.buttonList')).scroll(3000, 'down');
    await expect(element(by.text('Revelation 18-22'))).toBeVisible();
  });

  it('opens the reading reminders popup', async () => {
    await element(by.id('schedulePage.readingRemindersButton')).tap();

    await waitFor(element(by.id('schedulePage.readingRemindersButton')))
      .toBeVisible()
      .withTimeout(10000);
    await expect(
      element(by.id('schedulePage.readingRemindersButton')),
    ).toBeVisible();
  });
  // Open the reading reminders and expect them to show
  // Scroll to end of list and expect the last schedule day button to be visible

  // it('checks if the button for the new schedule is on the home page', async () => {
  //   await element(by.id('tabs.homePage')).tap();
  //   await waitFor(element(by.text('Genesis 1-3')))
  //     .toBeVisible()
  //     .withTimeout(10000);
  //   await expect(element(by.text('Genesis 1-3'))).toBeVisible();
  // });
});
