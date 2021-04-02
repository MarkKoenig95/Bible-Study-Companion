import {getProps} from 'detox-getprops';
import {waitForMS} from './helpers';

const prefix = 'schedulesPage.';
var waitTime = 1000;

beforeAll(async () => {
  if (device.getPlatform() !== 'ios') {
    waitTime *= 5;
  }

  await device.launchApp({permissions: {notifications: 'YES'}});

  await waitFor(element(by.text('Daily Text')))
    .toBeVisible()
    .withTimeout(waitTime * 8);
});

beforeEach(async () => {
  await device.reloadReactNative();
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
    await waitForMS(1 * waitTime);
  });

  it('creates a custom schedule', async () => {
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
      .scroll(50, 'down');
    await element(by.id(pref + 'numberOfPortionsInput')).typeText('10');

    // Scroll to bottom of screen and press add button to create schedule
    await waitFor(element(by.id(pref + 'addButton')))
      .toBeVisible()
      .whileElement(by.id(pref + 'scrollView'))
      .scroll(50, 'down');
    await element(by.id(pref + 'addButton')).tap();

    // Check that new schedule was created
    await waitFor(element(by.id(prefix + 'Cust')))
      .toBeVisible()
      .withTimeout(60 * waitTime);
    await expect(element(by.id(prefix + 'Cust'))).toBeVisible();
  });

  it('creates a sequential bible schedule', async () => {
    // Open the create schedule popup for a sequential schedule
    await element(by.id(prefix + 'scheduleTypePopup.sequentialButton')).tap();
    await waitFor(element(by.id(prefix + 'createSchedulePopup')))
      .toBeVisible()
      .withTimeout(10 * waitTime);

    // Input vaules for the schedule creation
    await element(by.id(pref + 'scheduleNameInput')).typeText('Seq');
    await element(by.id(pref + 'scheduleDurationInput')).replaceText('0.1');
    await waitFor(
      element(by.id(pref + 'scheduleVerseInput.bibleBookPicker.input')),
    )
      .toBeVisible()
      .whileElement(by.id(pref + 'scrollView'))
      .scroll(50, 'down');
    await element(
      by.id(pref + 'scheduleVerseInput.bibleBookPicker.input'),
    ).typeText('Gen');
    await waitFor(element(by.text('Genesis')))
      .toBeVisible()
      .withTimeout(2 * waitTime);
    await element(by.text('Genesis')).tap();

    // Scroll to bottom of screen and press add button to create schedule
    await waitFor(element(by.id(pref + 'addButton')))
      .toBeVisible()
      .whileElement(by.id(pref + 'scrollView'))
      .scroll(50, 'down');
    await element(by.id(pref + 'addButton')).tap();

    // Check that new schedule was created
    await waitFor(element(by.id(prefix + 'Seq')))
      .toBeVisible()
      .withTimeout(waitTime * 8);
    await expect(element(by.id(prefix + 'Seq'))).toBeVisible();
  });

  it('creates a chronological bible schedule', async () => {
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
    await waitFor(
      element(by.id(pref + 'scheduleVerseInput.bibleBookPicker.input')),
    )
      .toBeVisible()
      .whileElement(by.id(pref + 'scrollView'))
      .scroll(50, 'down');
    await element(
      by.id(pref + 'scheduleVerseInput.bibleBookPicker.input'),
    ).typeText('Jo');
    await waitFor(element(by.text('Job')))
      .toBeVisible()
      .withTimeout(2 * waitTime);
    await element(by.text('Job')).tap();

    // Scroll to bottom of screen and press add button to create schedule
    await waitFor(element(by.id(pref + 'addButton')))
      .toBeVisible()
      .whileElement(by.id(pref + 'scrollView'))
      .scroll(50, 'down');
    await element(by.id(pref + 'addButton')).tap();

    // Check that new schedule was created
    await waitFor(element(by.id(prefix + 'Chrono')))
      .toBeVisible()
      .withTimeout(waitTime * 8);
    await expect(element(by.id(prefix + 'Chrono'))).toBeVisible();
  });

  it('creates a thematic bible schedule', async () => {
    // Open the create schedule popup for a thematic schedule
    await element(by.id(prefix + 'scheduleTypePopup.thematicButton')).tap();
    await waitFor(element(by.id(prefix + 'createSchedulePopup')))
      .toBeVisible()
      .withTimeout(10 * waitTime);

    // Input vaules for the schedule creation
    await element(by.id(pref + 'scheduleNameInput')).typeText('Thema');
    await element(by.id(pref + 'scheduleDurationInput')).replaceText('0.1');
    await waitFor(
      element(by.id(pref + 'scheduleVerseInput.bibleBookPicker.input')),
    )
      .toBeVisible()
      .whileElement(by.id(pref + 'scrollView'))
      .scroll(50, 'down');
    await element(
      by.id(pref + 'scheduleVerseInput.bibleBookPicker.input'),
    ).typeText('Jo');
    await element(by.text('Job')).tap();

    // Scroll to bottom of screen and press add button to create schedule
    await waitFor(element(by.id(pref + 'addButton')))
      .toBeVisible()
      .whileElement(by.id(pref + 'scrollView'))
      .scroll(50, 'down');
    await element(by.id(pref + 'addButton')).tap();

    // Check that new schedule was created
    await waitFor(element(by.id(prefix + 'Thema')))
      .toBeVisible()
      .withTimeout(waitTime * 8);
    await expect(element(by.id(prefix + 'Thema'))).toBeVisible();
  });
});

describe('check created schedules', () => {
  it('checks that custom schedule was created correctly', async () => {
    await element(by.id(prefix + 'Cust')).tap();
    await waitFor(element(by.id('schedulePage')))
      .toBeVisible()
      .withTimeout(waitTime * 8);
    await expect(element(by.id('schedulePage.Article 1'))).toBeVisible();
  });

  it('checks that sequential schedule was created correctly', async () => {
    await element(by.id(prefix + 'Seq')).tap();
    await waitFor(element(by.id('schedulePage')))
      .toBeVisible()
      .withTimeout(waitTime * 8);
    await expect(element(by.id('schedulePage.Genesis 1-29'))).toBeVisible();
  });

  it('checks that chronological schedule was created correctly', async () => {
    await element(by.id(prefix + 'Chrono')).tap();
    await waitFor(element(by.id('schedulePage')))
      .toBeVisible()
      .withTimeout(waitTime * 8);
    await expect(element(by.id('schedulePage.Job 1-34'))).toBeVisible();
  });

  it('checks that thematic was created correctly', async () => {
    await element(by.id(prefix + 'Thema')).tap();
    await waitFor(element(by.id('schedulePage')))
      .toBeVisible()
      .withTimeout(waitTime * 8);
    await expect(element(by.id('schedulePage.Joshua 1-Ruth 3'))).toBeVisible();
  });
});

describe('warning popups', () => {
  beforeEach(async () => {
    await element(by.id('schedulesPage.header.addButton')).tap();
  });

  let pref = prefix + 'createSchedulePopup.';

  it('should show please fill all inputs warning popup', async () => {
    await element(by.id(prefix + 'scheduleTypePopup.sequentialButton')).tap();
    await waitFor(element(by.id(pref + 'addButton')))
      .toBeVisible()
      .whileElement(by.id(pref + 'scrollView'))
      .scroll(50, 'down');
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
      .scroll(50, 'down');
    await element(by.id(pref + 'numberOfPortionsInput')).typeText('10');

    // Scroll to bottom of screen and press add button to create schedule
    await waitFor(element(by.id(pref + 'addButton')))
      .toBeVisible()
      .whileElement(by.id(pref + 'scrollView'))
      .scroll(50, 'down');
    await element(by.id(pref + 'addButton')).tap();

    await expect(element(by.id(prefix + 'messagePopup'))).toBeVisible();
  });
});
