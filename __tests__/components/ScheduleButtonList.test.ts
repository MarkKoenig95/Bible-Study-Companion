import {createButtonList} from '../../components/ScheduleButtonsList/logic';
import {
  OnUpdateReadStatus,
  OpenReadingInfoPopup,
} from '../../components/ScheduleButtonsList/types';
import {BibleReadingItem} from '../../data/Database/types';
import {VersePosition} from '../../logic/general';

let onUpdateReadStatus: OnUpdateReadStatus = (
  status: boolean,
  readingDayID: number,
  tableName: string,
  isAfterFirstUnfinished: boolean,
) => {};

let openReadingPopup: OpenReadingInfoPopup = (
  startBookNumber: number,
  startChapter: number,
  startVerse: number,
  endBookNumber: number,
  endChapter: number,
  endVerse: number,
  readingPortion: string,
  isFinished: boolean,
  readingDayID: number,
  callback: () => void,
  tableName: string,
) => {};

let markButtonInPopupComplete = (readingDayID) => {};

let blankCreateListArgs = {
  closeReadingPopup: () => {},
  completedHidden: true,
  firstUnfinishedID: Infinity,
  onUpdateReadStatus: onUpdateReadStatus,
  openReadingPopup: openReadingPopup,
  scheduleName: 'string',
  tableName: 'string',
  testID: 'string',
  updatePages: 0,
  markButtonInPopupComplete: markButtonInPopupComplete,
};

let blankItemFields = {
  completedHidden: true,
  completionDate: new Date(),
  doesTrack: true,
  isFinished: false,
  onLongPress: () => {},
  onPress: () => {},
  tableName: '',
  title: '',
  updateValue: 0,
};

let item1: BibleReadingItem = {
  ...blankItemFields,
  readingDayID: 1,
  startBookNumber: 1,
  startBookName: 'Genesis',
  startChapter: 1,
  startVerse: 1,
  endBookNumber: 1,
  endBookName: 'Genesis',
  endChapter: 1,
  endVerse: 31,
  readingPortion: 'Genesis 1',
  versePosition: VersePosition.StartAndEnd,
};

let item2: BibleReadingItem = {
  ...blankItemFields,
  readingDayID: 2,
  startBookNumber: 1,
  startBookName: 'Genesis',
  startChapter: 3,
  startVerse: 1,
  endBookNumber: 1,
  endBookName: 'Genesis',
  endChapter: 3,
  endVerse: 24,
  readingPortion: 'Genesis 3',
  versePosition: VersePosition.StartAndEnd,
};

let item3: BibleReadingItem = {
  ...blankItemFields,
  readingDayID: 2,
  startBookNumber: 1,
  startBookName: 'Genesis',
  startChapter: 5,
  startVerse: 1,
  endBookNumber: 1,
  endBookName: 'Genesis',
  endChapter: 5,
  endVerse: 32,
  readingPortion: 'Genesis 5',
  versePosition: VersePosition.StartAndEnd,
};

let item4: BibleReadingItem = {
  ...blankItemFields,
  readingDayID: 3,
  startBookNumber: 13,
  startBookName: '1 Chronicles',
  startChapter: 1,
  startVerse: 1,
  endBookNumber: 13,
  endBookName: '1 Chronicles',
  endChapter: 1,
  endVerse: 3,
  readingPortion: '1 Chronicles 1:1-3',
  versePosition: VersePosition.Start,
};

describe('createButtonList text generation', () => {
  test('should append chapter of last reading to the end of the first reading text with a semi-colon', () => {
    let theseItems = [item1, item2];
    let {readingPortions} = createButtonList({
      ...blankCreateListArgs,
      items: theseItems,
    });
    let expectedText = 'Genesis 1;  3';
    expect(readingPortions).toBe(expectedText);
  });

  test('should only show second reading information since first reading is finished', () => {
    let newItem1 = {...item1, isFinished: true};
    let theseItems = [newItem1, item2];
    let {readingPortions} = createButtonList({
      ...blankCreateListArgs,
      items: theseItems,
    });
    let expectedText = 'Genesis 3';
    expect(readingPortions).toBe(expectedText);
  });

  test('should append chapter of last reading to the end of the second reading text with a semi-colon as well as the chapter of second reading to the end of the first reading text with a semi-colon', () => {
    let theseItems = [item1, item2, item3];
    let {readingPortions} = createButtonList({
      ...blankCreateListArgs,
      items: theseItems,
    });
    let expectedText = 'Genesis 1;  3;  5';
    expect(readingPortions).toBe(expectedText);
  });

  test('should only show first reading information since second and third readings are finished', () => {
    let newItem2 = {...item2, isFinished: true};
    let newItem3 = {...item3, isFinished: true};
    let theseItems = [item1, newItem2, newItem3];
    let {readingPortions} = createButtonList({
      ...blankCreateListArgs,
      items: theseItems,
    });
    let expectedText = 'Genesis 1';
    expect(readingPortions).toBe(expectedText);
  });

  test('should append chapter of last reading to the end of the first reading text with a semi-colon excluding second reading since its finished', () => {
    let newItem2 = {...item2, isFinished: true};
    let theseItems = [item1, newItem2, item3];
    let {readingPortions} = createButtonList({
      ...blankCreateListArgs,
      items: theseItems,
    });
    let expectedText = 'Genesis 1;  5';
    expect(readingPortions).toBe(expectedText);
  });

  test('should append second reading portion after first reading portion on a new line', () => {
    let theseItems = [item1, item4];
    let {readingPortions} = createButtonList({
      ...blankCreateListArgs,
      items: theseItems,
    });
    let expectedText = 'Genesis 1\r\n1 Chronicles 1:1-3';

    expect(readingPortions).toBe(expectedText);
  });

  test('should append third reading portion after first reading portion on a new line excluding second reading since it is finished', () => {
    let newItem2 = {...item2, isFinished: true};
    let newItem3 = {...item3, isFinished: true};
    let theseItems = [item1, newItem2, newItem3, item4];
    let {readingPortions} = createButtonList({
      ...blankCreateListArgs,
      items: theseItems,
    });
    let expectedText = 'Genesis 1\r\n1 Chronicles 1:1-3';

    expect(readingPortions).toBe(expectedText);
  });

  test('should only show third reading portion excluding first and second readings since they are finished', () => {
    let newItem1 = {...item1, isFinished: true};
    let newItem2 = {...item2, isFinished: true};
    let theseItems = [newItem1, newItem2, item4];
    let {readingPortions} = createButtonList({
      ...blankCreateListArgs,
      items: theseItems,
    });
    let expectedText = '1 Chronicles 1:1-3';

    expect(readingPortions).toBe(expectedText);
  });
});
