/* eslint-env detox/detox, jest */
import {getProps} from 'detox-getprops';
import {
  goBack,
  pressAlertAction,
  scrollUntilVisible,
  setDateTimePicker,
  waitForMS,
} from './helpers/general';
import {
  shouldOpenReadingReminders,
  shouldOpenReadingInfoPopup,
  shouldCompleteReadingFromInfoPopup,
  shouldCompleteReadingWithLongPress,
  shouldCompleteReadingWithCheckbox,
  shouldOpenReadingButtonsPopup,
  shouldCompleteReadingInButtonPopup,
  shouldCompleteReadingInButtonPopupFromInfoPopup,
} from './helpers/scheduleList';

var waitTime = 1000;
var OS;
const prefix = 'schedulePage.';

beforeAll(async () => {
  OS = device.getPlatform();

  if (OS !== 'ios') {
    waitTime *= 5;
  }

  await device.launchApp({permissions: {notifications: 'YES'}});
});

beforeEach(async () => {
  await device.launchApp({newInstance: true});
  await waitForMS(3 * waitTime);
  await element(by.id('tabs.schedulesPage')).tap();
});

describe('should automatically focus on the first unfinished element in the list', () => {
  beforeEach(async () => {
    await element(by.id('schedulesPage.' + 'Base Cust')).tap();

    await waitFor(element(by.id('schedulePage')))
      .toBeVisible()
      .withTimeout(2 * waitTime);
  });

  it('without completed elements hidden', async () => {
    await waitFor(element(by.id(prefix + 'Page 500')))
      .toBeVisible()
      .withTimeout(8 * waitTime);
    await expect(element(by.id(prefix + 'Page 500'))).toBeVisible();
  });

  it('with completed elements hidden', async () => {
    await element(by.id(prefix + 'header.settingsButton')).tap();

    await waitFor(element(by.id(prefix + 'settingsPopup')))
      .toBeVisible()
      .withTimeout(2 * waitTime);

    await element(by.id(prefix + 'settingsPopup.hideCompletedCheckBox')).tap();

    await goBack();

    await element(by.id('schedulesPage.' + 'Base Cust')).tap();

    await waitFor(element(by.id(prefix + 'Page 500')))
      .toBeVisible()
      .withTimeout(8 * waitTime);

    await expect(element(by.id(prefix + 'Page 500'))).toBeVisible();
  });
});

describe('basic schedule page functions', () => {
  const thisScheduleName = 'Base Seq';
  beforeEach(async () => {
    await element(by.id('schedulesPage.' + thisScheduleName)).tap();
    await waitFor(element(by.id('schedulePage')))
      .toBeVisible()
      .withTimeout(2 * waitTime);
  });

  it("should navigate to a schedule's page", async () => {
    await expect(element(by.id('schedulePage'))).toBeVisible();
  });

  it('should show the reading reminders popup', async () => {
    await shouldOpenReadingReminders(prefix);
  });

  it('should show the settings popup', async () => {
    await element(by.id(prefix + 'header.settingsButton')).tap();

    await waitFor(element(by.id(prefix + 'settingsPopup')))
      .toBeVisible()
      .withTimeout(2 * waitTime);

    await expect(element(by.id(prefix + 'settingsPopup'))).toBeVisible();
  });

  it('should set a new date for the schedule', async () => {
    const date = new Date(2021, 2, 1, 10, 0, 0, 0);
    const dateText = OS === 'ios' ? '3/1/21' : '03/01/21';

    await element(by.id(prefix + 'header.settingsButton')).tap();

    await waitFor(element(by.id(prefix + 'settingsPopup')))
      .toBeVisible()
      .withTimeout(2 * waitTime);

    await setDateTimePicker(
      prefix + 'settingsPopup.datePicker',
      date,
      'date',
      OS,
    );

    await element(by.id(prefix + 'messagePopup.confirmButton')).tap();

    await waitFor(element(by.id(prefix + 'loadingPopup')))
      .not.toBeVisible()
      .withTimeout(60 * waitTime);

    await pressAlertAction('OK');

    await element(by.id('schedulesPage.' + thisScheduleName)).tap();

    await waitFor(element(by.id('schedulePage')))
      .toBeVisible()
      .withTimeout(2 * waitTime);

    await expect(
      element(by.id(prefix + 'Genesis 1-29.completionDate')),
    ).toHaveText(dateText);
  });

  it('should set schedule to not track reading dates', async () => {
    await element(by.id(prefix + 'header.settingsButton')).tap();

    await waitFor(element(by.id(prefix + 'settingsPopup')))
      .toBeVisible()
      .withTimeout(2 * waitTime);

    await element(by.id(prefix + 'settingsPopup.shouldTrackCheckBox')).tap();

    await element(by.id(prefix + 'settingsPopup.closeButton')).tap();

    //When there is no date I make the text 6 spaces to retain spacing
    await expect(
      element(by.id(prefix + 'Genesis 1-29.completionDate')),
    ).toHaveText('      ');
  });

  it('should scroll to the end of a schedule list and checks if the last item is there', async () => {
    await element(by.id(prefix + 'buttonList')).scrollTo('bottom');

    await expect(element(by.id(prefix + 'Revelation 18-22'))).toBeVisible();
  });

  it('should delete a schedule', async () => {
    await element(by.id(prefix + 'header.deleteButton')).tap();

    await element(by.id(prefix + 'messagePopup.confirmButton')).tap();

    await waitFor(element(by.id('schedulesPage')))
      .toBeVisible()
      .withTimeout(2 * waitTime);

    await waitFor(element(by.id(prefix + thisScheduleName)))
      .not.toBeVisible()
      .withTimeout(2 * waitTime);

    await expect(element(by.id(prefix + thisScheduleName))).not.toBeVisible();
  });
});

describe('bible schedule page', () => {
  beforeAll(async () => {
    await element(by.id('tabs.schedulesPage')).tap();

    await element(by.id('schedulesPage.Base Chrono')).tap();

    await waitFor(element(by.id('schedulePage')))
      .toBeVisible()
      .withTimeout(2 * waitTime);

    await element(by.id(prefix + 'header.settingsButton')).tap();

    await waitFor(element(by.id(prefix + 'settingsPopup')))
      .toBeVisible()
      .withTimeout(2 * waitTime);

    await element(by.id(prefix + 'settingsPopup.hideCompletedCheckBox')).tap();
  });
  beforeEach(async () => {
    await element(by.id('schedulesPage.Base Chrono')).tap();
    await waitFor(element(by.id(prefix + 'Job 1-34')))
      .toBeVisible()
      .withTimeout(waitTime * 10);
  });

  it('marks a reading portion complete with longPress', async () => {
    await shouldCompleteReadingWithLongPress(
      prefix,
      'Leviticus 10-Numbers 4',
      waitTime,
      'Cancel',
    );
  });

  it('checks the hide completed button functionality', async () => {
    await expect(
      element(by.id(prefix + 'Leviticus 10-Numbers 4')),
    ).not.toBeVisible();
  });

  it('marks a reading portions complete with the checkBox', async () => {
    await shouldCompleteReadingWithCheckbox(
      prefix,
      'Exodus 23-Leviticus 9',
      waitTime,
      'Cancel',
    );
  });

  it('opens buttons popup', async () => {
    await shouldOpenReadingButtonsPopup(prefix, 'Job 35-42');
  });

  it('marks a reading item complete in buttons popup with longPress', async () => {
    await shouldCompleteReadingInButtonPopup(
      prefix,
      'Job 35-42',
      'Exodus 1-22',
      'longPress',
      'Cancel',
    );
  });

  it('marks a reading item complete in buttons popup with checkBox', async () => {
    await shouldCompleteReadingInButtonPopup(
      prefix,
      'Job 35-42',
      '1 Chronicles 6:1-3',
      'checkBox',
      'Cancel',
    );
  });

  it('opens reading info popup from button in buttons popup', async () => {
    await shouldOpenReadingButtonsPopup(prefix, 'Numbers 5-28');
    await shouldOpenReadingInfoPopup(prefix, 'Numbers 5-28');
  });

  it('marks a reading portion complete with the button in the reading info popup opened from buttons popup', async () => {
    await shouldOpenReadingButtonsPopup(prefix, 'Numbers 5-28');

    await shouldOpenReadingInfoPopup(prefix, 'Numbers 5-28');

    await waitFor(element(by.id(prefix + 'readingInfoPopup.confirmButton')))
      .toBeVisible()
      .whileElement(by.id(prefix + 'readingInfoPopup.scrollView'))
      .scroll(50, 'down');

    await element(by.id(prefix + 'readingInfoPopup.confirmButton')).tap();

    await pressAlertAction('Cancel');

    await waitFor(
      element(by.id(prefix + 'multiPortionStartingWith.Numbers 5-28')),
    )
      .not.toBeVisible()
      .withTimeout(waitTime * 5);

    await expect(
      element(by.id(prefix + 'multiPortionStartingWith.Numbers 5-28')),
    ).not.toBeVisible();
  });

  it('marks a whole reading portion, made up of many sections, complete', async () => {
    scrollUntilVisible(
      by.id(prefix + 'multiPortionStartingWith.Ruth 2-4'),
      by.id(prefix + 'buttonList'),
      OS,
    );

    shouldCompleteReadingWithCheckbox(
      prefix,
      'multiPortionStartingWith.Ruth 2-4',
      waitTime,
    );
  });

  it('opens the reading info popup', async () => {
    await shouldOpenReadingInfoPopup(prefix, 'Job 1-34');
  });

  it('marks a reading portion complete with the button in the reading info popup', async () => {
    await shouldCompleteReadingFromInfoPopup(prefix, 'Job 1-34', waitTime, OS);
  });
});

describe('mark earlier portions complete', async () => {
  beforeEach(async () => {
    await device.launchApp({
      delete: true,
      newInstance: true,
      permissions: {notifications: 'YES'},
    });

    await waitForMS(3 * waitTime);

    await element(by.id('tabs.schedulesPage')).tap();

    await element(by.id('schedulesPage.Base Seq')).tap();

    await waitFor(element(by.id('schedulePage')))
      .toBeVisible()
      .withTimeout(2 * waitTime);

    await element(by.id(prefix + 'header.settingsButton')).tap();

    await waitFor(element(by.id(prefix + 'settingsPopup')))
      .toBeVisible()
      .withTimeout(2 * waitTime);

    await element(by.id(prefix + 'settingsPopup.hideCompletedCheckBox')).tap();

    await element(by.id(prefix + 'settingsPopup.closeButton')).tap();

    await element(by.id(prefix + 'buttonList')).scrollTo('bottom');
  });

  it('should mark all earlier reading portions than a selected portion complete using the checkbox', async () => {
    await element(by.id(prefix + 'Hebrews 10-Revelation 17.checkBox')).tap();

    await pressAlertAction('OK');

    await expect(
      element(by.id(prefix + 'Ephesians 5-Hebrews 9')),
    ).not.toBeVisible();

    await expect(
      element(by.id(prefix + 'Hebrews 10-Revelation 17')),
    ).not.toBeVisible();

    await expect(element(by.id(prefix + 'Revelation 18-22'))).toBeVisible();
  });

  it('should mark all earlier reading portions than a selected portion complete using the reading info popup', async () => {
    await element(by.id(prefix + 'Ephesians 5-Hebrews 9')).tap();

    await scrollUntilVisible(
      by.id(prefix + 'readingInfoPopup.confirmButton'),
      by.id(prefix + 'readingInfoPopup.scrollView'),
      OS,
      150,
    );

    await element(by.id(prefix + 'readingInfoPopup.confirmButton')).tap();

    await pressAlertAction('OK');

    await expect(
      element(by.id(prefix + 'Ephesians 5-Hebrews 9')),
    ).not.toBeVisible();

    await expect(
      element(by.id(prefix + 'Hebrews 10-Revelation 17')),
    ).toBeVisible();

    await expect(element(by.id(prefix + 'Revelation 18-22'))).toBeVisible();
  });

  it('should not mark all reading portions earlier than a selected portion complete', async () => {
    await element(by.id(prefix + 'Hebrews 10-Revelation 17.checkBox')).tap();

    await pressAlertAction('Cancel');

    await element(by.id(prefix + 'buttonList')).scrollTo('bottom');

    await expect(
      element(by.id(prefix + 'Ephesians 5-Hebrews 9')),
    ).toBeVisible();

    await expect(
      element(by.id(prefix + 'Hebrews 10-Revelation 17')),
    ).not.toBeVisible();

    await expect(element(by.id(prefix + 'Revelation 18-22'))).toBeVisible();
  });
});
