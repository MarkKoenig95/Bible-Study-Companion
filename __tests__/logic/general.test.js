import {
  createPlaceholdersFromArray,
  formatDate,
} from '../../data/Database/generalTransactions';
import {
  getWeekdays,
  getWeeksBetween,
  versionIsLessThan,
  VERSE_POSITION,
} from '../../logic/general';

beforeAll(() => {
  jest.useFakeTimers('modern');

  jest.setSystemTime(new Date('04 Feb 2021 00:12:00 GMT').getTime());
});

afterAll(() => {
  jest.useRealTimers();
});

test('given 2 dates, getWeeksBetween() returns the number of weeks between them', () => {
  let date1 = new Date(2020, 1, 1);
  let date2 = new Date(2020, 12, 31);
  expect(getWeeksBetween(date1, date2)).toBe(52);
});

test('given a weekday (4, Thursday) getWeekdays().beforeToday() returns the number of weekdays which have elapsed since then', () => {
  expect(getWeekdays().beforeToday(0)).toBe(4);
  expect(getWeekdays().beforeToday(1)).toBe(3);
  expect(getWeekdays().beforeToday(2)).toBe(2);
  expect(getWeekdays().beforeToday(3)).toBe(1);
  expect(getWeekdays().beforeToday(4)).toBe(0);
  expect(getWeekdays().beforeToday(5)).toBe(6);
  expect(getWeekdays().beforeToday(6)).toBe(5);
});

test('given a weekday (4, Thursday) getWeekdays().afterToday() returns the number of weekdays until then', () => {
  expect(getWeekdays().afterToday(0)).toBe(3);
  expect(getWeekdays().afterToday(1)).toBe(4);
  expect(getWeekdays().afterToday(2)).toBe(5);
  expect(getWeekdays().afterToday(3)).toBe(6);
  expect(getWeekdays().afterToday(4)).toBe(0);
  expect(getWeekdays().afterToday(5)).toBe(1);
  expect(getWeekdays().afterToday(6)).toBe(2);
});

test('formatDate', () => {
  let date = formatDate(new Date());
  expect(date).toBe('2/4/21');
});

test('createPlaceholdersFromArray', () => {
  let newDate = formatDate(new Date());

  let portion1 = [
    'Malachi',
    39,
    4,
    4,
    'Malachi',
    39,
    4,
    6,
    newDate,
    'Malachi 4:4-6',
    VERSE_POSITION.END,
  ];

  let portion2 = [
    'Revelation',
    66,
    1,
    1,
    'Revelation',
    66,
    22,
    21,
    newDate,
    'Revelation 1-22',
    VERSE_POSITION.START_AND_END,
  ];

  let portion3 = [
    'Isaiah',
    23,
    1,
    1,
    'Isaiah',
    23,
    1,
    6,
    newDate,
    'Isaiah 1:1-6',
    VERSE_POSITION.START,
  ];

  let readingPortions = [
    portion1,
    portion2,
    portion3,
    portion1,
    portion2,
    portion3,
  ];

  let result = createPlaceholdersFromArray(readingPortions);

  expect(result).toStrictEqual({
    placeholders:
      '( ?,?,?,?,?,?,?,?,?,?,? ),( ?,?,?,?,?,?,?,?,?,?,? ),( ?,?,?,?,?,?,?,?,?,?,? ),( ?,?,?,?,?,?,?,?,?,?,? ),( ?,?,?,?,?,?,?,?,?,?,? ),( ?,?,?,?,?,?,?,?,?,?,? )',
    values: [
      'Malachi',
      39,
      4,
      4,
      'Malachi',
      39,
      4,
      6,
      '2/4/21',
      'Malachi 4:4-6',
      2,
      'Revelation',
      66,
      1,
      1,
      'Revelation',
      66,
      22,
      21,
      '2/4/21',
      'Revelation 1-22',
      3,
      'Isaiah',
      23,
      1,
      1,
      'Isaiah',
      23,
      1,
      6,
      '2/4/21',
      'Isaiah 1:1-6',
      0,
      'Malachi',
      39,
      4,
      4,
      'Malachi',
      39,
      4,
      6,
      '2/4/21',
      'Malachi 4:4-6',
      2,
      'Revelation',
      66,
      1,
      1,
      'Revelation',
      66,
      22,
      21,
      '2/4/21',
      'Revelation 1-22',
      3,
      'Isaiah',
      23,
      1,
      1,
      'Isaiah',
      23,
      1,
      6,
      '2/4/21',
      'Isaiah 1:1-6',
      0,
    ],
  });
});

describe('versionIsLessThan checker', () => {
  test('version 1.0.0 < version 1.0.1', () => {
    let result = versionIsLessThan('1.0.0', '1.0.1');
    expect(result).toBe(true);
  });

  test('version 1.0.0 < version 1.1.0', () => {
    let result = versionIsLessThan('1.0.0', '1.1.0');
    expect(result).toBe(true);
  });

  test('version 1.0.0 < version 2.0.0', () => {
    let result = versionIsLessThan('1.0.0', '2.0.0');
    expect(result).toBe(true);
  });

  test('version 1.0.0 < version 1.0.0', () => {
    let result = versionIsLessThan('1.0.0', '1.0.0');
    expect(result).toBe(false);
  });

  test('version 1.0.1 < version 1.0.0', () => {
    let result = versionIsLessThan('1.0.1', '1.0.0');
    expect(result).toBe(false);
  });

  test('version 1.1.0 < version 1.0.0', () => {
    let result = versionIsLessThan('1.1.0', '1.0.0');
    expect(result).toBe(false);
  });

  test('version 2.0.0 < version 1.0.0', () => {
    let result = versionIsLessThan('2.0.0', '1.0.0');
    expect(result).toBe(false);
  });

  test('version 1.0.0.0 < version 1.0.0', () => {
    let result = versionIsLessThan('1.0.0.0', '1.0.0');
    expect(result).toBe(false);
  });

  test('version 1.0.0 < version 1.0.0.0', () => {
    let result = versionIsLessThan('1.0.0', '1.0.0.0');
    expect(result).toBe(false);
  });
});
