import {getWeekdays, getWeeksBetween} from '../logic/logic';

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
