import {setPicker} from './helpers/general';

/* eslint-env detox/detox, jest */
const prefix = 'remindersPage.';
const pref = prefix + 'reminder.Daily Text.';
var waitTime = 1000;
let OS;

beforeAll(async () => {
  OS = device.getPlatform();
});

beforeEach(async () => {
  await device.launchApp({delete: true, permissions: {notifications: 'YES'}});

  await waitFor(element(by.text('Daily Text')))
    .toBeVisible()
    .withTimeout(waitTime * 8);

  await element(by.id('tabs.settingsPage')).tap();
  await element(by.id('settingsPage.reminders')).tap();
});

it('Creates a basic reminder', async () => {
  await element(by.id(prefix + 'header.addButton')).tap();
  await element(by.id(prefix + 'createRemindersPopup.addButton')).tap();
  await waitFor(element(by.id(prefix + 'reminder.Reminder')))
    .toBeVisible()
    .whileElement(by.id(prefix + 'list'))
    .scroll(50, 'down');
  await expect(element(by.id(prefix + 'reminder.Reminder'))).toBeVisible();
});

it('Creates a custom reminder', async () => {
  await element(by.id(prefix + 'header.addButton')).tap();

  // Input the name
  await element(
    by.id(prefix + 'createRemindersPopup.nameSection.nameInput'),
  ).replaceText('Remmy');

  // Set the repeat frequency
  await setPicker(
    prefix + 'createRemindersPopup.frequencySection.picker',
    'Monthly',
    OS,
  );

  // Set the reset frequency
  await element(
    by.id(prefix + 'createRemindersPopup.recursSection.resetValueInput'),
  ).replaceText('10');

  // Create reminder and check that it was created
  await element(by.id(prefix + 'createRemindersPopup.addButton')).tap();

  await waitFor(element(by.id(prefix + 'reminder.Remmy')))
    .toBeVisible()
    .whileElement(by.id(prefix + 'list'))
    .scroll(50, 'down');
  await expect(element(by.id(prefix + 'reminder.Remmy'))).toBeVisible();
});

it('Marks a reminder complete', async () => {
  await element(by.id(pref + 'isCompleteSection.checkBox')).tap();

  await element(by.id('tabs.homePage')).tap();

  await expect(element(by.text('Today'))).toBeVisible();

  await expect(element(by.id('homePage.Daily Text'))).not.toBeVisible();
});

describe('Edit reminder', () => {
  beforeEach(async () => {
    await element(by.id(pref + 'adjustmentButtons.edit')).tap();
  });

  it('name', async () => {
    await element(by.id(pref + 'nameSection.input')).replaceText('New');

    await element(by.id(pref + 'actionButtons.done')).tap();

    await expect(element(by.id(prefix + 'reminder.New'))).toBeVisible();
  });

  it('repeat frequency', async () => {
    await setPicker(pref + 'frequencySection.picker', 'Weekly', OS);

    await element(by.id(pref + 'actionButtons.done')).tap();

    await expect(
      element(by.id(pref + 'reccurenceSection.display')),
    ).toBeVisible();
  });

  it('repeat value for weekly', async () => {
    await setPicker(pref + 'frequencySection.picker', 'Weekly', OS);

    await element(by.id(pref + 'actionButtons.done')).tap();

    await expect(element(by.text('Sunday'))).toBeVisible();
  });

  it('repeat value for monthly', async () => {
    await setPicker(pref + 'frequencySection.picker', 'Monthly', OS);

    await element(by.id(pref + 'actionButtons.done')).tap();

    await expect(
      element(by.id(pref + 'reccurenceSection.ordinalAfter')),
    ).toBeVisible();
  });

  it('cancels editing', async () => {
    await element(by.id(pref + 'nameSection.input')).replaceText('New');

    await element(by.id(pref + 'actionButtons.cancel')).tap();

    await expect(element(by.id(prefix + 'reminder.New'))).not.toBeVisible();

    await expect(element(by.id(prefix + 'reminder.Daily Text'))).toBeVisible();
  });
});

it('Deletes a reminder', async () => {
  await element(by.id(pref + 'adjustmentButtons.delete')).tap();
  await element(by.id(prefix + 'messagePopup.confirmButton')).tap();

  await expect(
    element(by.id(prefix + 'reminder.Daily Text')),
  ).not.toBeVisible();
});
