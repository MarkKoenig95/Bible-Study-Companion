/* eslint-env detox/detox, jest */
import {getProps} from 'detox-getprops';
import {
  scrollUntilVisible,
  setDateTimePicker,
  waitForMS,
} from './helpers/general';

const prefix = 'schedulesPage.';
var waitTime = 1000;
var OS;

beforeAll(async () => {
  OS = device.getPlatform();

  await device.launchApp({permissions: {notifications: 'YES'}});
});

beforeEach(async () => {
  await device.launchApp({newInstance: true});
  await waitFor(element(by.text('Daily Text')))
    .toBeVisible()
    .withTimeout(waitTime * 8);
  await element(by.id('tabs.schedulesPage')).tap();
});

it('should show schedule types popup', async () => {
  await waitForMS(3 * waitTime);
  await element(by.id('schedulesPage.header.addButton')).tap();
  await expect(element(by.id('schedulesPage.scheduleTypePopup'))).toBeVisible();
});

describe('create schedule popup', () => {
  beforeEach(async () => {
    await waitForMS(3 * waitTime);
    await element(by.id('schedulesPage.header.addButton')).tap();
  });

  let pref = prefix + 'createSchedulePopup.';

  it('should show create schedule popup for bible reading schedules', async () => {
    await element(by.id(prefix + 'scheduleTypePopup.sequentialButton')).tap();
    await expect(element(by.id(prefix + 'createSchedulePopup'))).toBeVisible();
    await expect(element(by.id(pref + 'scheduleDurationInput'))).toBeVisible();
  });

  it('should show create schedule popup for custom schedules', async () => {
    await element(by.id(prefix + 'scheduleTypePopup.scrollView')).scrollTo(
      'bottom',
    );
    await element(by.id(prefix + 'scheduleTypePopup.customButton')).tap();
    await expect(element(by.id(prefix + 'createSchedulePopup'))).toBeVisible();
    await expect(
      element(by.id(pref + 'portionDescriptionDropdown.input')),
    ).toBeVisible();
  });
});

describe('create schedules', () => {
  let pref = prefix + 'createSchedulePopup.';
  beforeEach(async () => {
    await element(by.id('schedulesPage.header.addButton')).tap();
    // Need to keep waiting until the Bible info DB loads completely
    await waitForMS(2 * waitTime);
  });

  it('should create a custom schedule', async () => {
    // Open the create schedule popup for a custom schedule
    await element(by.id(prefix + 'scheduleTypePopup.scrollView')).scrollTo(
      'bottom',
    );
    await element(by.id(prefix + 'scheduleTypePopup.customButton')).tap();
    await waitFor(element(by.id(prefix + 'createSchedulePopup')))
      .toBeVisible()
      .withTimeout(10 * waitTime);

    // Input vaules for the schedule creation
    await element(by.id(pref + 'scheduleNameInput')).typeText('Cust');
    await element(by.id(pref + 'portionDescriptionDropdown.input')).typeText(
      'Arti',
    );
    await element(by.text('Article')).tap();
    await element(by.id(pref + 'portionsPerDayInput')).typeText('1');
    await scrollUntilVisible(
      by.id(pref + 'numberOfPortionsInput'),
      by.id(pref + 'scrollView'),
      OS,
    );
    await element(by.id(pref + 'numberOfPortionsInput')).tap();
    await element(by.id(pref + 'numberOfPortionsInput')).typeText('10');

    // Scroll to bottom of screen and press add button to create schedule
    await scrollUntilVisible(
      by.id(pref + 'addButton'),
      by.id(pref + 'scrollView'),
    );
    await element(by.id(pref + 'addButton')).tap();

    // Check that new schedule was created
    await waitForMS(2 * waitTime);

    await expect(element(by.id(prefix + 'Cust'))).toBeVisible();
  });

  it('should create a custom schedule with a specified date', async () => {
    // Open the create schedule popup for a custom schedule
    await element(by.id(prefix + 'scheduleTypePopup.scrollView')).scrollTo(
      'bottom',
    );
    await element(by.id(prefix + 'scheduleTypePopup.customButton')).tap();
    await waitFor(element(by.id(prefix + 'createSchedulePopup')))
      .toBeVisible()
      .withTimeout(10 * waitTime);

    // Input vaules for the schedule creation
    await element(by.id(pref + 'scheduleNameInput')).typeText('Spec');
    await element(by.id(pref + 'portionDescriptionDropdown.input')).typeText(
      'Section',
    );
    await element(by.id(pref + 'portionsPerDayInput')).typeText('1');
    await scrollUntilVisible(
      by.id(pref + 'numberOfPortionsInput'),
      by.id(pref + 'scrollView'),
      OS,
    );
    await element(by.id(pref + 'numberOfPortionsInput')).typeText('10');

    // Set specified date to start the schedule from
    await scrollUntilVisible(
      by.id(pref + 'toggleAdvancedButton'),
      by.id(pref + 'scrollView'),
      OS,
    );
    await element(by.id(pref + 'toggleAdvancedButton')).tap();
    await scrollUntilVisible(
      by.id(pref + 'datePicker'),
      by.id(pref + 'scrollView'),
      OS,
    );
    await element(by.id(pref + 'scrollView')).scroll(100, 'down');
    let date = new Date(2021, 2, 1);
    await setDateTimePicker(pref + 'datePicker', date, 'date', OS);

    // Scroll to bottom of screen and press add button to create schedule
    await scrollUntilVisible(
      by.id(pref + 'addButton'),
      by.id(pref + 'scrollView'),
      OS,
    );
    await element(by.id(pref + 'addButton')).tap();

    // Check that new schedule was created
    await waitForMS(2 * waitTime);

    await expect(element(by.id(prefix + 'Spec'))).toBeVisible();
  });

  it('should create a custom schedule which doesnt track dates', async () => {
    // Open the create schedule popup for a custom schedule
    await element(by.id(prefix + 'scheduleTypePopup.scrollView')).scrollTo(
      'bottom',
    );
    await element(by.id(prefix + 'scheduleTypePopup.customButton')).tap();
    await waitFor(element(by.id(prefix + 'createSchedulePopup')))
      .toBeVisible()
      .withTimeout(10 * waitTime);

    // Input vaules for the schedule creation
    await element(by.id(pref + 'scheduleNameInput')).typeText('Doesnt Track');
    await element(by.id(pref + 'portionDescriptionDropdown.input')).typeText(
      'Section',
    );
    await element(by.id(pref + 'portionsPerDayInput')).typeText('1');
    await scrollUntilVisible(
      by.id(pref + 'numberOfPortionsInput'),
      by.id(pref + 'scrollView'),
      OS,
    );
    await element(by.id(pref + 'numberOfPortionsInput')).typeText('10');

    // Unckeck the track reading dates checkbox
    await scrollUntilVisible(
      by.id(pref + 'toggleAdvancedButton'),
      by.id(pref + 'scrollView'),
      OS,
    );
    await element(by.id(pref + 'toggleAdvancedButton')).tap();

    await scrollUntilVisible(
      by.id(pref + 'doesTrackCheckbox'),
      by.id(pref + 'scrollView'),
      OS,
    );
    await element(by.id(pref + 'doesTrackCheckbox')).tap();

    // Scroll to bottom of screen and press add button to create schedule

    await scrollUntilVisible(
      by.id(pref + 'addButton'),
      by.id(pref + 'scrollView'),
      OS,
    );
    await element(by.id(pref + 'addButton')).tap();

    // Check that new schedule was created
    await waitForMS(2 * waitTime);

    await expect(element(by.id(prefix + 'Doesnt Track'))).toBeVisible();
  });

  it('should create a sequential bible schedule', async () => {
    // Open the create schedule popup for a sequential schedule
    await element(by.id(prefix + 'scheduleTypePopup.sequentialButton')).tap();
    await waitFor(element(by.id(prefix + 'createSchedulePopup')))
      .toBeVisible()
      .withTimeout(10 * waitTime);

    // Input vaules for the schedule creation
    await element(by.id(pref + 'scheduleNameInput')).typeText('Seq');
    await element(by.id(pref + 'scheduleDurationInput')).replaceText('0.1');
    await scrollUntilVisible(
      by.id(pref + 'scheduleVerseInput.bibleBookPicker.input'),
      by.id(pref + 'scrollView'),
      OS,
    );

    await scrollUntilVisible(
      by.id(pref + 'scheduleVerseInput.bibleBookPicker.input'),
      by.id(pref + 'scrollView'),
      OS,
    );
    await element(
      by.id(pref + 'scheduleVerseInput.bibleBookPicker.input'),
    ).typeText('Gen');
    await waitFor(element(by.text('Genesis')))
      .toBeVisible()
      .withTimeout(2 * waitTime);
    await element(by.text('Genesis')).tap();

    // Scroll to bottom of screen and press add button to create schedule
    await scrollUntilVisible(
      by.id(pref + 'addButton'),
      by.id(pref + 'scrollView'),
    );
    await element(by.id(pref + 'addButton')).tap();

    // Check that new schedule was created
    await waitFor(element(by.id(prefix + 'loadingPopup')))
      .not.toBeVisible()
      .withTimeout(60 * waitTime);

    await expect(element(by.id(prefix + 'Seq'))).toBeVisible();
  });

  it('should create a chronological bible schedule', async () => {
    // Open the create schedule popup for a chronological schedule
    await element(
      by.id(prefix + 'scheduleTypePopup.chronologicalButton'),
    ).tap();
    await waitFor(element(by.id(prefix + 'createSchedulePopup')))
      .toBeVisible()
      .withTimeout(10 * waitTime);

    // Input vaules for the schedule creation
    await element(by.id(pref + 'scheduleNameInput')).typeText('Chrono');
    await element(by.id(pref + 'scheduleDurationInput')).replaceText('0.1');

    await scrollUntilVisible(
      by.id(pref + 'scheduleVerseInput.bibleBookPicker.input'),
      by.id(pref + 'scrollView'),
      OS,
    );
    await element(
      by.id(pref + 'scheduleVerseInput.bibleBookPicker.input'),
    ).typeText('Jo');
    await scrollUntilVisible(by.text('Job'), by.id(pref + 'scrollView'), OS);
    await element(by.text('Job')).tap();

    // Scroll to bottom of screen and press add button to create schedule
    await scrollUntilVisible(
      by.id(pref + 'addButton'),
      by.id(pref + 'scrollView'),
      'ios',
    );
    await element(by.id(pref + 'addButton')).tap();

    // Check that new schedule was created
    await waitFor(element(by.id(prefix + 'loadingPopup')))
      .not.toBeVisible()
      .withTimeout(60 * waitTime);

    await scrollUntilVisible(
      by.id(prefix + 'Chrono'),
      by.id(prefix + 'list'),
      OS,
    );

    await expect(element(by.id(prefix + 'Chrono'))).toBeVisible();
  });

  it('should create a thematic bible schedule', async () => {
    // Open the create schedule popup for a thematic schedule
    await element(by.id(prefix + 'scheduleTypePopup.thematicButton')).tap();
    await waitFor(element(by.id(prefix + 'createSchedulePopup')))
      .toBeVisible()
      .withTimeout(10 * waitTime);

    // Input vaules for the schedule creation
    await element(by.id(pref + 'scheduleNameInput')).typeText('Thema');
    await element(by.id(pref + 'scheduleDurationInput')).replaceText('0.1');
    await scrollUntilVisible(
      by.id(pref + 'scheduleVerseInput.bibleBookPicker.input'),
      by.id(pref + 'scrollView'),
      OS,
    );
    await element(
      by.id(pref + 'scheduleVerseInput.bibleBookPicker.input'),
    ).typeText('Jo');
    await scrollUntilVisible(by.text('Job'), by.id(pref + 'scrollView'), OS);
    await element(by.text('Job')).tap();

    // Scroll to bottom of screen and press add button to create schedule
    await scrollUntilVisible(
      by.id(pref + 'addButton'),
      by.id(pref + 'scrollView'),
      'ios',
    );
    await element(by.id(pref + 'addButton')).tap();

    // Check that new schedule was created
    await waitFor(element(by.id(prefix + 'loadingPopup')))
      .not.toBeVisible()
      .withTimeout(60 * waitTime);

    await scrollUntilVisible(
      by.id(prefix + 'Thema'),
      by.id(prefix + 'list'),
      OS,
    );

    await expect(element(by.id(prefix + 'Thema'))).toBeVisible();
  });
});

describe('check created schedules', () => {
  it('checks that the basic custom schedule was created correctly', async () => {
    await scrollUntilVisible(
      by.id(prefix + 'Cust'),
      by.id(prefix + 'list'),
      OS,
    );
    await element(by.id(prefix + 'Cust')).tap();
    await waitFor(element(by.id('schedulePage')))
      .toBeVisible()
      .withTimeout(waitTime * 8);
    await expect(element(by.id('schedulePage.Article 1'))).toBeVisible();
  });

  it('checks that the custom schedule with a specific date was created correctly', async () => {
    let dateText = OS === 'ios' ? '3/1/21' : '03/01/21';
    await scrollUntilVisible(
      by.id(prefix + 'Spec'),
      by.id(prefix + 'list'),
      OS,
    );
    await element(by.id(prefix + 'Spec')).tap();
    await waitFor(element(by.id('schedulePage')))
      .toBeVisible()
      .withTimeout(waitTime * 8);
    await expect(element(by.id('schedulePage.Section 1'))).toBeVisible();
    await expect(
      element(by.id('schedulePage.Section 1.completionDate')),
    ).toHaveText(dateText);
  });

  it('checks that custom schedule which doesnt track dates was created correctly', async () => {
    await scrollUntilVisible(
      by.id(prefix + 'Doesnt Track'),
      by.id(prefix + 'list'),
      OS,
    );
    await element(by.id(prefix + 'Doesnt Track')).tap();
    await waitFor(element(by.id('schedulePage')))
      .toBeVisible()
      .withTimeout(waitTime * 8);
    await expect(element(by.id('schedulePage.Section 1'))).toBeVisible();
    await expect(
      element(by.id('schedulePage.Section 1.completionDate')),
    ).toHaveText('      ');
  });

  it('checks that sequential schedule was created correctly', async () => {
    await scrollUntilVisible(by.id(prefix + 'Seq'), by.id(prefix + 'list'), OS);
    await element(by.id(prefix + 'Seq')).tap();
    await waitFor(element(by.id('schedulePage')))
      .toBeVisible()
      .withTimeout(waitTime * 8);
    await expect(element(by.id('schedulePage.Genesis 1-29'))).toBeVisible();
  });

  it('checks that chronological schedule was created correctly', async () => {
    await scrollUntilVisible(
      by.id(prefix + 'Chrono'),
      by.id(prefix + 'list'),
      OS,
    );
    await element(by.id(prefix + 'Chrono')).tap();
    await waitFor(element(by.id('schedulePage')))
      .toBeVisible()
      .withTimeout(waitTime * 8);

    await waitFor(element(by.id('schedulePage.Job 1-34')))
      .toBeVisible()
      .withTimeout(waitTime * 8);
    await expect(element(by.id('schedulePage.Job 1-34'))).toBeVisible();
  });

  it('checks that thematic was created correctly', async () => {
    await scrollUntilVisible(
      by.id(prefix + 'Thema'),
      by.id(prefix + 'list'),
      OS,
    );
    await element(by.id(prefix + 'Thema')).tap();
    await waitFor(element(by.id('schedulePage')))
      .toBeVisible()
      .withTimeout(waitTime * 8);

    await waitFor(element(by.id('schedulePage.Psalms 1-34')))
      .toBeVisible()
      .withTimeout(waitTime * 8);
    await expect(element(by.id('schedulePage.Psalms 1-34'))).toBeVisible();
  });
});

describe('warning popups', () => {
  beforeEach(async () => {
    await element(by.id('schedulesPage.header.addButton')).tap();
  });

  let pref = prefix + 'createSchedulePopup.';

  it('should show please fill all inputs warning popup', async () => {
    await element(by.id(prefix + 'scheduleTypePopup.sequentialButton')).tap();
    await scrollUntilVisible(
      by.id(pref + 'addButton'),
      by.id(pref + 'scrollView'),
    );
    await element(by.id(pref + 'addButton')).tap();
    await expect(element(by.id(prefix + 'messagePopup'))).toBeVisible();
  });

  it('should show name taken warning popup', async () => {
    // Open the create schedule popup for a custom schedule
    await element(by.id(prefix + 'scheduleTypePopup.scrollView')).scrollTo(
      'bottom',
    );
    await element(by.id(prefix + 'scheduleTypePopup.customButton')).tap();
    await waitFor(element(by.id(prefix + 'createSchedulePopup')))
      .toBeVisible()
      .withTimeout(10 * waitTime);

    // Input vaules for the schedule creation
    await element(by.id(pref + 'scheduleNameInput')).typeText('Cust');
    await element(by.id(pref + 'portionDescriptionDropdown.input')).typeText(
      'Arti',
    );
    await element(by.text('Article')).tap();
    await element(by.id(pref + 'portionsPerDayInput')).typeText('1');
    await waitFor(element(by.id(pref + 'numberOfPortionsInput')))
      .toBeVisible()
      .whileElement(by.id(pref + 'scrollView'))
      .scroll(70, 'down');
    await element(by.id(pref + 'numberOfPortionsInput')).typeText('10');

    // Scroll to bottom of screen and press add button to create schedule
    await scrollUntilVisible(
      by.id(pref + 'addButton'),
      by.id(pref + 'scrollView'),
      OS,
    );
    await element(by.id(pref + 'addButton')).tap();

    await expect(element(by.id(prefix + 'messagePopup'))).toBeVisible();
  });
});
