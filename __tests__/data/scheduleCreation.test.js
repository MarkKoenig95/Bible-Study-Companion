import {
  findMaxChapter,
  findMaxVerse,
  findNearestVerse,
  findVerseIndex,
  setScheduleParameters,
  runQueries,
  setTrackers,
  setAdjustedMessage,
  checkOrderedVerseBuffer,
  checkAnyVerseBuffer,
  checkStartAndEndPositions,
  checkReadingPortion,
  VERSE_POSITION,
  checkResultPosition,
  checkEnd,
  createReadingPortion,
  createReadingPortions,
  insertReadingPortions,
  createScheduleTable,
  generateBibleSchedule,
  generateCustomSchedule,
} from '../../data/Database/scheduleTransactions';

import SQLite from 'react-native-sqlite-storage';
import {SCHEDULE_TYPES} from '../../components/popups/ScheduleTypeSelectionPopup';
import {formatDate} from '../../data/Database/generalTransactions';

let bibleDB;
let userDB;
let tblVerseIndex;
let qryChronologicalIndex;
let qryThematicIndex;

const tableName = 'tblTest';
const date = new Date(2021, 1, 1);

const thematicScheduleParametersResult = {
  buffer: {
    '1': 28,
    '2': 33,
    '3': 12,
    '4': 11,
    '5': 28,
    '6': 23,
    '7': 13,
  },
  duration: 372,
  keys: [1, 2, 3, 4, 5, 6, 7],
  leastIndex: {
    '1': 0,
    '2': 5852,
    '3': 12870,
    '4': 15331,
    '5': 17655,
    '6': 23549,
    '7': 28311,
  },
  maxIndex: {
    '1': 5851,
    '2': 12869,
    '3': 15330,
    '4': 17654,
    '5': 23548,
    '6': 28310,
    '7': 31077,
  },
  versesPerDay: {
    '1': 111,
    '2': 133,
    '3': 46,
    '4': 44,
    '5': 111,
    '6': 90,
    '7': 52,
  },
};

const otherScheduleParametersResult = {
  buffer: {
    '1': 21,
  },
  duration: 372,
  keys: ['1'],
  leastIndex: {
    '1': 0,
  },
  maxIndex: {
    '1': 31077,
  },
  versesPerDay: {
    '1': 83.54301075268818,
  },
};

function getUserDB() {
  if (userDB) {
    userDB.deleteDB();
  }
  userDB = SQLite.openDatabase('UserInfo.db');
}

async function setScheduleTable(scheduleType) {
  getUserDB();

  await createScheduleTable(userDB, tableName, scheduleType);
}

beforeAll(async () => {
  bibleDB = SQLite.openDatabase('BibleStudyCompanion.db');

  getUserDB();

  await runQueries(bibleDB).then(res => {
    tblVerseIndex = res.tblVerseIndex;
    qryChronologicalIndex = res.qryChronologicalIndex;
    qryThematicIndex = res.qryThematicIndex;
  });
});

afterAll(() => {
  userDB.deleteDB();
});

describe('find max', () => {
  // findMaxVerse
  test('given a bible book and a chapter find the number of the last verse', () => {
    expect(findMaxVerse(1, 1)).toBe(31);
  });

  // findMaxChapter
  test('given a bible book find the number of the last chapter', () => {
    expect(findMaxChapter(1)).toBe(50);
  });
});

// findNearestVerse
describe('given a bible book, a chapter, and a verse check if the combination exists, if not, find the closest matching verse', () => {
  it('checks larger chapter', () => {
    let [bookId, chapter, verse] = findNearestVerse(1, 200, 1);
    expect(bookId).toBe(2);
    expect(chapter).toBe(1);
    expect(verse).toBe(1);
  });

  it('checks larger verse', () => {
    let [bookId, chapter, verse] = findNearestVerse(39, 1, 200);
    expect(bookId).toBe(39);
    expect(chapter).toBe(2);
    expect(verse).toBe(1);
  });

  it('checks larger chapter and a larger verse', () => {
    let [bookId, chapter, verse] = findNearestVerse(66, 200, 200);
    expect(bookId).toBe(1);
    expect(chapter).toBe(1);
    expect(verse).toBe(1);
  });
});

// findVerseIndex
describe('given a bookId, chapter, and verse returns the index in the table corresponding to the verse', () => {
  test('an expected min verse for the type Sequential', async () => {
    let index;
    await findVerseIndex(
      bibleDB,
      1,
      1,
      1,
      SCHEDULE_TYPES.SEQUENTIAL,
      true,
    ).then(res => {
      index = res;
    });
    expect(index).toBe(0);
  });

  test('an expected middle verse for the type Sequential', async () => {
    let index;
    await findVerseIndex(
      bibleDB,
      19,
      72,
      19,
      SCHEDULE_TYPES.SEQUENTIAL,
      true,
    ).then(res => {
      index = res;
    });
    expect(index).toBe(15019);
  });

  test('an expected max verse for the type Sequential', async () => {
    let index;
    await findVerseIndex(
      bibleDB,
      66,
      22,
      21,
      SCHEDULE_TYPES.SEQUENTIAL,
      true,
    ).then(res => {
      index = res;
    });
    expect(index).toBe(31077);
  });

  test('a chapter beyond the expected range for the type Sequential', async () => {
    let index;
    await findVerseIndex(
      bibleDB,
      1,
      200,
      1,
      SCHEDULE_TYPES.SEQUENTIAL,
      true,
    ).then(res => {
      index = res;
    });
    expect(index).toBe(1533);
  });

  test('a verse beyond the expected range for the type Sequential', async () => {
    let index;
    await findVerseIndex(
      bibleDB,
      1,
      1,
      200,
      SCHEDULE_TYPES.SEQUENTIAL,
      true,
    ).then(res => {
      index = res;
    });
    expect(index).toBe(31);
  });

  test('a chapter and verse beyond the expected range for the type Sequential', async () => {
    let index;
    await findVerseIndex(
      bibleDB,
      30,
      200,
      200,
      SCHEDULE_TYPES.SEQUENTIAL,
      true,
    ).then(res => {
      index = res;
    });
    expect(index).toBe(22511);
  });

  test('an expected min verse for the type Chronological', async () => {
    let index;
    await findVerseIndex(
      bibleDB,
      1,
      1,
      1,
      SCHEDULE_TYPES.CHRONOLOGICAL,
      true,
    ).then(res => {
      index = res;
    });
    expect(index).toBe(0);
  });

  test('an expected middle verse for the type Chronological', async () => {
    let index;
    await findVerseIndex(
      bibleDB,
      14,
      24,
      16,
      SCHEDULE_TYPES.CHRONOLOGICAL,
      true,
    ).then(res => {
      index = res;
    });
    expect(index).toBe(15001);
  });

  test('an expected max verse for the type Chronological', async () => {
    let index;
    await findVerseIndex(
      bibleDB,
      66,
      22,
      21,
      SCHEDULE_TYPES.CHRONOLOGICAL,
      true,
    ).then(res => {
      index = res;
    });
    expect(index).toBe(31077);
  });

  test('a chapter beyond the expected range for the type Chronological', async () => {
    let index;
    await findVerseIndex(
      bibleDB,
      44,
      200,
      1,
      SCHEDULE_TYPES.CHRONOLOGICAL,
      true,
    ).then(res => {
      index = res;
    });
    expect(index).toBe(28584);
  });

  test('a verse beyond the expected range for the type Chronological', async () => {
    let index;
    await findVerseIndex(
      bibleDB,
      21,
      1,
      200,
      SCHEDULE_TYPES.CHRONOLOGICAL,
      true,
    ).then(res => {
      index = res;
    });
    expect(index).toBe(13679);
  });

  test('a chapter and verse beyond the expected range for the type Chronological', async () => {
    let index;
    await findVerseIndex(
      bibleDB,
      55,
      200,
      200,
      SCHEDULE_TYPES.CHRONOLOGICAL,
      true,
    ).then(res => {
      index = res;
    });
    expect(index).toBe(30222);
  });

  test('an expected min verse for the type Thematic', async () => {
    let index;
    await findVerseIndex(bibleDB, 1, 1, 1, SCHEDULE_TYPES.THEMATIC, true).then(
      res => {
        index = res;
      },
    );
    expect(index).toBe(0);
  });

  test('an expected middle verse for the type Thematic', async () => {
    let index;
    await findVerseIndex(
      bibleDB,
      19,
      119,
      176,
      SCHEDULE_TYPES.THEMATIC,
      true,
    ).then(res => {
      index = res;
    });
    expect(index).toBe(15004);
  });

  test('an expected max verse for the type Thematic', async () => {
    let index;
    await findVerseIndex(
      bibleDB,
      65,
      1,
      25,
      SCHEDULE_TYPES.THEMATIC,
      true,
    ).then(res => {
      index = res;
    });
    expect(index).toBe(31077);
  });

  test('a chapter beyond the expected range for the type Thematic', async () => {
    let index;
    await findVerseIndex(
      bibleDB,
      4,
      200,
      1,
      SCHEDULE_TYPES.THEMATIC,
      true,
    ).then(res => {
      index = res;
    });
    expect(index).toBe(4893);
  });

  test('a verse beyond the expected range for the type Thematic', async () => {
    let index;
    await findVerseIndex(
      bibleDB,
      31,
      1,
      200,
      SCHEDULE_TYPES.THEMATIC,
      true,
    ).then(res => {
      index = res;
    });
    expect(index).toBe(22532);
  });

  test('a chapter and verse beyond the expected range for the type Thematic', async () => {
    let index;
    await findVerseIndex(
      bibleDB,
      35,
      200,
      200,
      SCHEDULE_TYPES.THEMATIC,
      true,
    ).then(res => {
      index = res;
    });
    expect(index).toBe(22788);
  });
});

// setScheduleParameters
describe('given a duration, query object, and a schedule type returns parameters to be used for creating the bible reading schedule', () => {
  /*
  Tests:
  Whole number and decimal number versions of a
  Small Number
  Large Number
  For a thematic schedule and a non thematic schedule
  */

  test('A small whole number duration for a Thematic Schedule', () => {
    let comparisonResult = {...thematicScheduleParametersResult};

    let result = setScheduleParameters(
      1,
      qryThematicIndex,
      SCHEDULE_TYPES.THEMATIC,
    );

    expect(result).toStrictEqual(comparisonResult);
  });

  test('A small decimal duration for a Thematic Schedule', () => {
    let comparisonResult = {...thematicScheduleParametersResult};

    comparisonResult.buffer = {
      '1': 555821,
      '2': 666567,
      '3': 233745,
      '4': 220733,
      '5': 559810,
      '6': 452293,
      '7': 262809,
    };

    comparisonResult.duration = 0.018600000000000002;

    comparisonResult.versesPerDay = {
      '1': 2223283,
      '2': 2666268,
      '3': 934979,
      '4': 882930,
      '5': 2239240,
      '6': 1809172,
      '7': 1051234,
    };

    let result = setScheduleParameters(
      0.00005,
      qryThematicIndex,
      SCHEDULE_TYPES.THEMATIC,
    );

    expect(result).toStrictEqual(comparisonResult);
  });

  test('A large whole number duration for a Thematic Schedule', () => {
    let comparisonResult = {...thematicScheduleParametersResult};
    comparisonResult.buffer = {
      '1': 1,
      '2': 1,
      '3': 0,
      '4': 0,
      '5': 1,
      '6': 1,
      '7': 1,
    };

    comparisonResult.duration = 9300;

    comparisonResult.versesPerDay = {
      '1': 4,
      '2': 5,
      '3': 1,
      '4': 1,
      '5': 4,
      '6': 3,
      '7': 2,
    };

    let result = setScheduleParameters(
      25,
      qryThematicIndex,
      SCHEDULE_TYPES.THEMATIC,
    );

    expect(result).toStrictEqual(comparisonResult);
  });

  test('A large decimal duration for a Thematic Schedule', () => {
    let comparisonResult = {...thematicScheduleParametersResult};
    comparisonResult.buffer = {
      '1': 1,
      '2': 1,
      '3': 0,
      '4': 0,
      '5': 1,
      '6': 1,
      '7': 1,
    };

    comparisonResult.duration = 9139.255125923399;

    comparisonResult.versesPerDay = {
      '1': 4,
      '2': 5,
      '3': 1,
      '4': 1,
      '5': 4,
      '6': 3,
      '7': 2,
    };

    let result = setScheduleParameters(
      24.56789012345,
      qryThematicIndex,
      SCHEDULE_TYPES.THEMATIC,
    );

    expect(result).toStrictEqual(comparisonResult);
  });

  test('A small whole number duration for a Non-Thematic Schedule', () => {
    let comparisonResult = {...otherScheduleParametersResult};

    let result = setScheduleParameters(
      1,
      qryChronologicalIndex,
      SCHEDULE_TYPES.CHRONOLOGICAL,
    );

    expect(result).toStrictEqual(comparisonResult);
  });

  test('A small decimal duration for a Non-Thematic Schedule', () => {
    let comparisonResult = {...otherScheduleParametersResult};

    comparisonResult.buffer = {
      '1': 417715,
    };

    comparisonResult.duration = 0.018600000000000002;

    comparisonResult.versesPerDay = {
      '1': 1670860.2150537632,
    };

    let result = setScheduleParameters(
      0.00005,
      tblVerseIndex,
      SCHEDULE_TYPES.SEQUENTIAL,
    );

    expect(result).toStrictEqual(comparisonResult);
  });

  test('A large whole number duration for a Non-Thematic Schedule', () => {
    let comparisonResult = {...otherScheduleParametersResult};

    comparisonResult.buffer = {'1': 1};

    comparisonResult.duration = 9300;

    comparisonResult.versesPerDay = {'1': 3.341720430107527};

    let result = setScheduleParameters(
      25,
      qryChronologicalIndex,
      SCHEDULE_TYPES.CHRONOLOGICAL,
    );

    expect(result).toStrictEqual(comparisonResult);
  });

  test('A large decimal duration for a Non-Thematic Schedule', () => {
    let comparisonResult = {...otherScheduleParametersResult};

    comparisonResult.buffer = {
      '1': 1,
    };

    comparisonResult.duration = 9139.255125923399;

    comparisonResult.versesPerDay = {
      '1': 3.400495945435158,
    };

    let result = setScheduleParameters(
      24.56789012345,
      tblVerseIndex,
      SCHEDULE_TYPES.SEQUENTIAL,
    );

    expect(result).toStrictEqual(comparisonResult);
  });
});

//setTrackers
describe('given a query object, a start index and preprocessed schedule parameters returns logic control flow elements for schedule creation', () => {
  test('A Non-Thematic schedule starting at index 0', async () => {
    let result = await setTrackers(
      bibleDB,
      tblVerseIndex,
      0,
      otherScheduleParametersResult.keys,
      otherScheduleParametersResult.leastIndex,
      otherScheduleParametersResult.maxIndex,
    );

    expect(result).toStrictEqual({
      endIndex: {
        '1': -1,
      },
      hasLooped: {
        '1': false,
      },
      isEnd: {
        '1': false,
      },
      keyIndex: 0,
      pointer: {
        '1': 0,
      },
      verseOverflow: {
        '1': 0,
      },
    });
  });

  test('A Thematic schedule starting at index 0', async () => {
    let result = await setTrackers(
      bibleDB,
      qryThematicIndex,
      0,
      thematicScheduleParametersResult.keys,
      thematicScheduleParametersResult.leastIndex,
      thematicScheduleParametersResult.maxIndex,
    );

    expect(result).toStrictEqual({
      endIndex: {
        '1': -1,
        '2': 5851,
        '3': 12869,
        '4': 15330,
        '5': 17654,
        '6': 23548,
        '7': 28310,
      },
      hasLooped: {
        '1': false,
        '2': false,
        '3': false,
        '4': false,
        '5': false,
        '6': false,
        '7': false,
      },
      isEnd: {
        '1': false,
        '2': false,
        '3': false,
        '4': false,
        '5': false,
        '6': false,
        '7': false,
      },
      keyIndex: 0,
      pointer: {
        '1': 0,
        '2': 5852,
        '3': 12870,
        '4': 15331,
        '5': 17655,
        '6': 23549,
        '7': 28311,
      },
      verseOverflow: {
        '1': 0,
        '2': 0,
        '3': 0,
        '4': 0,
        '5': 0,
        '6': 0,
        '7': 0,
      },
    });
  });
});

describe('given a bible, book, chapter, and verse (originally provided by the user), check if the verse was adjusted. return a message informing the user of the adjustment', () => {
  test('A bible verse which matches the given index', () => {
    const bibleBookPrefix = 'bibleBooks.';
    const bibleBookSuffix = '.name';

    let message = setAdjustedMessage(
      bibleBookPrefix,
      bibleBookSuffix,
      1,
      1,
      1,
      tblVerseIndex,
      0,
    );
    expect(message).toBe(undefined);
  });

  test('A bible verse which does not match the given index (thus adjusted)', () => {
    const bibleBookPrefix = 'bibleBooks.';
    const bibleBookSuffix = '.name';

    let message = setAdjustedMessage(
      bibleBookPrefix,
      bibleBookSuffix,
      1,
      51,
      100,
      tblVerseIndex,
      1533,
    );
    expect(message).toBe(
      'Adjusted start verse from "Genesis 51:100" to "Exodus 1:1" because initial request was out of bounds.',
    );
  });
});

//checkVerseBuffer
describe('given a database table query an index for an element in the query, and a number of verses given as a reasonable buffer checks if there is a verse that would be more fitting to end a reading portion on (the end of a chapter, or otherwise) within a space + or - the verse buffer. retruns an offset value if a better match is found, or the original value if none was found', () => {
  /*
  Tests:
  qryChronologicalIndex
  qryThematicIndex
  tblVerseIndex

  critical point = 0
  small buffer = 1
  mid range buffer = 20
  large buffer = 417715

  expected results
  return 0
  return a negetive number to set index to begining of current chapter
  return a positive number to set index to begining of next chapter
  */

  test('A sequential table with a small buffer "0" (should return 0 as the adjustment)', () => {
    let index = 20;
    let adjustment = checkOrderedVerseBuffer(tblVerseIndex, index, 0);
    let newIndex = index + adjustment;

    expect(newIndex).toBe(index);
  });

  test('A sequential table with a small buffer "1" (should return 0 as the adjustment)', () => {
    let index = 20;
    let adjustment = checkOrderedVerseBuffer(tblVerseIndex, index, 1);
    let newIndex = index + adjustment;

    expect(newIndex).toBe(index);
  });

  test('A sequential table with a moderate buffer (should return positive adjustment to the end of the current chapter)', () => {
    let index = 51;
    let adjustment = checkOrderedVerseBuffer(tblVerseIndex, index, 20);
    let newIndex = index + adjustment;

    expect(newIndex).toBe(55);
  });

  test('A sequential table with a large buffer (should return a negative adjustment to the end of the previous chapter)', () => {
    let index = 40;
    let adjustment = checkOrderedVerseBuffer(tblVerseIndex, index, 417715);
    let newIndex = index + adjustment;

    expect(newIndex).toBe(30);
  });

  test('A chronological table with a small buffer "0" (should return 0 as the adjustment)', () => {
    let index = 20;
    let adjustment = checkAnyVerseBuffer(
      tblVerseIndex,
      index,
      0,
      otherScheduleParametersResult.maxIndex[1],
      otherScheduleParametersResult.leastIndex[1],
    );
    let newIndex = index + adjustment;

    expect(newIndex).toBe(index);
  });

  test('A chronological table with a small buffer "1" (should return 0 as the adjustment)', () => {
    let index = 20;
    let adjustment = checkAnyVerseBuffer(
      tblVerseIndex,
      index,
      1,
      otherScheduleParametersResult.maxIndex[1],
      otherScheduleParametersResult.leastIndex[1],
    );
    let newIndex = index + adjustment;

    expect(newIndex).toBe(index);
  });

  test('A chronological table with a moderate buffer (should return positive adjustment to the end of the current chapter)', () => {
    let index = 51;
    let adjustment = checkAnyVerseBuffer(
      qryChronologicalIndex,
      index,
      20,
      otherScheduleParametersResult.maxIndex[1],
      otherScheduleParametersResult.leastIndex[1],
    );
    let newIndex = index + adjustment;

    expect(newIndex).toBe(55);
  });

  test('A chronological table with a large buffer (should return a negative adjustment)', () => {
    let index = 200;
    let adjustment = checkAnyVerseBuffer(
      qryChronologicalIndex,
      index,
      417715,
      otherScheduleParametersResult.maxIndex[1],
      otherScheduleParametersResult.leastIndex[1],
    );
    let newIndex = index + adjustment;

    expect(newIndex).toBe(209);
  });

  test('A thematic table with a small buffer "0" (should return 0 as the adjustment)', () => {
    let index = 20;
    let adjustment = checkAnyVerseBuffer(
      qryThematicIndex,
      index,
      0,
      thematicScheduleParametersResult.maxIndex[1],
      thematicScheduleParametersResult.leastIndex[1],
    );
    let newIndex = index + adjustment;

    expect(newIndex).toBe(index);
  });

  test('A thematic table with a small buffer "1" (should return 0 as the adjustment)', () => {
    let index = 20;
    let adjustment = checkAnyVerseBuffer(
      qryThematicIndex,
      index,
      1,
      thematicScheduleParametersResult.maxIndex[1],
      thematicScheduleParametersResult.leastIndex[1],
    );
    let newIndex = index + adjustment;

    expect(newIndex).toBe(index);
  });

  test('A thematic table with a moderate buffer (should return positive adjustment to the end of the current chapter)', () => {
    let index = 51;
    let adjustment = checkAnyVerseBuffer(
      qryThematicIndex,
      index,
      20,
      thematicScheduleParametersResult.maxIndex[1],
      thematicScheduleParametersResult.leastIndex[1],
    );
    let newIndex = index + adjustment;

    expect(newIndex).toBe(55);
  });

  test('A thematic table with a large buffer (should return a negative adjustment)', () => {
    let index = 20005;
    let adjustment = checkAnyVerseBuffer(
      qryThematicIndex,
      index,
      417715,
      thematicScheduleParametersResult.maxIndex[5],
      thematicScheduleParametersResult.leastIndex[5],
    );
    let newIndex = index + adjustment;

    expect(newIndex).toBe(20010);
  });
});

// checkStartAndEndPositions
describe('given a database table query, a start index, and an end index for a reading portion returns whether the start verse is the start of a chapter or not, and if the end verse is the end of a chapter or not', () => {
  /*
    Tests:
    The function can have 4 different outputs:
    startPosition can be start or middle
    endPosition can be middle or end
    and the combinations therin
  */
  test('startPosition should be start, endPosition should be end', () => {
    let {startPosition, endPosition} = checkStartAndEndPositions(
      tblVerseIndex,
      0,
      30,
    );
    let isStart = startPosition === VERSE_POSITION.START;
    let isEnd = endPosition === VERSE_POSITION.END;
    expect(isStart && isEnd).toBe(true);
  });

  test('startPosition should be start, endPosition should be middle', () => {
    let {startPosition, endPosition} = checkStartAndEndPositions(
      tblVerseIndex,
      0,
      20,
    );
    let isStart = startPosition === VERSE_POSITION.START;
    let endIsMiddle = endPosition === VERSE_POSITION.MIDDLE;
    expect(isStart && endIsMiddle).toBe(true);
  });

  test('startPosition should be middle, endPosition should be end', () => {
    let {startPosition, endPosition} = checkStartAndEndPositions(
      tblVerseIndex,
      10,
      30,
    );
    let startIsMiddle = startPosition === VERSE_POSITION.MIDDLE;
    let isEnd = endPosition === VERSE_POSITION.END;
    expect(startIsMiddle && isEnd).toBe(true);
  });

  test('startPosition should be middle, endPosition should be middle', () => {
    let {startPosition, endPosition} = checkStartAndEndPositions(
      tblVerseIndex,
      10,
      20,
    );
    let startIsMiddle = startPosition === VERSE_POSITION.MIDDLE;
    let endIsMiddle = endPosition === VERSE_POSITION.MIDDLE;
    expect(startIsMiddle && endIsMiddle).toBe(true);
  });
});

// checkResultPosition
test('given indicators whether the verse (or span of verses) includes the start verse or the end verse return an enum indicator to describe the whole span of verses', () => {
  let start = checkResultPosition(true, false);
  let middle = checkResultPosition(false, false);
  let end = checkResultPosition(false, true);
  let startAndEnd = checkResultPosition(true, true);

  expect(start).toBe(VERSE_POSITION.START);
  expect(middle).toBe(VERSE_POSITION.MIDDLE);
  expect(end).toBe(VERSE_POSITION.END);
  expect(startAndEnd).toBe(VERSE_POSITION.START_AND_END);
});

// checkReadingPortion
describe('given information on the start verse and end verse returns the overall position of the verse and a string describing the reading of the verse span', () => {
  test('same book, chapter, and verse (only one verse)', () => {
    let {description, position} = checkReadingPortion(
      'Genesis',
      1,
      1,
      true,
      'Genesis',
      1,
      1,
      false,
    );
    expect(description).toBe('Genesis 1:1');
    expect(position).toBe(VERSE_POSITION.START);
  });

  test('same book, chapter, and different verses (Positions of the verses are start and end, so this includes the entire chapter)', () => {
    let {description, position} = checkReadingPortion(
      'Genesis',
      1,
      1,
      true,
      'Genesis',
      1,
      31,
      true,
    );
    expect(description).toBe('Genesis 1');
    expect(position).toBe(VERSE_POSITION.START_AND_END);
  });

  test('same book, chapter, and different verses (Position of start verse is in the middle we elaborate the verses to be read)', () => {
    let {description, position} = checkReadingPortion(
      'Genesis',
      1,
      10,
      false,
      'Genesis',
      1,
      31,
      true,
    );
    expect(description).toBe('Genesis 1:10-31');
    expect(position).toBe(VERSE_POSITION.END);
  });

  test('same book, chapter, and different verses (Position of both verses is in the middle we elaborate the verses to be read)', () => {
    let {description, position} = checkReadingPortion(
      'Genesis',
      1,
      10,
      false,
      'Genesis',
      1,
      21,
      false,
    );
    expect(description).toBe('Genesis 1:10-21');
    expect(position).toBe(VERSE_POSITION.MIDDLE);
  });

  test('same book, chapter, and different verses (Position of end verse is in the middle we elaborate the verses to be read)', () => {
    let {description, position} = checkReadingPortion(
      'Genesis',
      1,
      1,
      true,
      'Genesis',
      1,
      21,
      false,
    );
    expect(description).toBe('Genesis 1:1-21');
    expect(position).toBe(VERSE_POSITION.START);
  });

  test('same book and different chapters (Positions of the verses are start and end, then this includes the entire span of chapters)', () => {
    let {description, position} = checkReadingPortion(
      'Genesis',
      1,
      1,
      true,
      'Genesis',
      2,
      25,
      true,
    );
    expect(description).toBe('Genesis 1-2');
    expect(position).toBe(VERSE_POSITION.START_AND_END);
  });

  test('same book and different chapters (Position of the end verse is in the middle we elaborate the verses to be read)', () => {
    let {description, position} = checkReadingPortion(
      'Genesis',
      1,
      1,
      true,
      'Genesis',
      2,
      20,
      false,
    );
    expect(description).toBe('Genesis 1:1-2:20');
    expect(position).toBe(VERSE_POSITION.START);
  });

  test('same book and different chapters (Position of both verses is in the middle we elaborate the verses to be read)', () => {
    let {description, position} = checkReadingPortion(
      'Genesis',
      1,
      10,
      false,
      'Genesis',
      2,
      20,
      false,
    );
    expect(description).toBe('Genesis 1:10-2:20');
    expect(position).toBe(VERSE_POSITION.MIDDLE);
  });

  test('same book and different chapters (Position of the start verse is in the middle we elaborate the verses to be read)', () => {
    let {description, position} = checkReadingPortion(
      'Genesis',
      1,
      10,
      false,
      'Genesis',
      2,
      25,
      true,
    );
    expect(description).toBe('Genesis 1:10-2:25');
    expect(position).toBe(VERSE_POSITION.END);
  });

  test('different books (Positions of the verses are start and end, then this includes the entire span of chapters)', () => {
    let {description, position} = checkReadingPortion(
      'Genesis',
      50,
      1,
      true,
      'Exodus',
      1,
      25,
      true,
    );
    expect(description).toBe('Genesis 50-Exodus 1');
    expect(position).toBe(VERSE_POSITION.START_AND_END);
  });

  test('different books (Position of the end verse is in the middle, so we elaborate the verses to be read)', () => {
    let {description, position} = checkReadingPortion(
      'Genesis',
      50,
      1,
      true,
      'Exodus',
      2,
      20,
      false,
    );
    expect(description).toBe('Genesis 50:1-Exodus 2:20');
    expect(position).toBe(VERSE_POSITION.START);
  });

  test('different books (Position of both verses is in the middle, so we elaborate the verses to be read)', () => {
    let {description, position} = checkReadingPortion(
      'Genesis',
      50,
      10,
      false,
      'Exodus',
      2,
      20,
      false,
    );
    expect(description).toBe('Genesis 50:10-Exodus 2:20');
    expect(position).toBe(VERSE_POSITION.MIDDLE);
  });

  test('different books (Position of the start verse is in the middle, so we elaborate the verses to be read)', () => {
    let {description, position} = checkReadingPortion(
      'Genesis',
      50,
      10,
      false,
      'Exodus',
      2,
      20,
      true,
    );
    expect(description).toBe('Genesis 50:10-Exodus 2:20');
    expect(position).toBe(VERSE_POSITION.END);
  });
});

describe('test checkEnd for SEQUENTIAL schedule given tracking indicators for schedule creation determines whether adjustments need to be made, then returns the adjusted indicators', () => {
  test('index equals max index', () => {
    let endCheck = checkEnd(
      tblVerseIndex,
      otherScheduleParametersResult.maxIndex[1],
      otherScheduleParametersResult.maxIndex[1],
      otherScheduleParametersResult.leastIndex[1],
      otherScheduleParametersResult.leastIndex[1] - 1,
      0,
      false,
      80,
      false,
      SCHEDULE_TYPES.SEQUENTIAL,
    );
    expect(endCheck).toStrictEqual({
      dayEndIndex: otherScheduleParametersResult.maxIndex[1],
      isEnd: true,
      hasLooped: true,
      verseOverflow: 0,
    });
  });

  test('index greater than max index', () => {
    let endCheck = checkEnd(
      tblVerseIndex,
      otherScheduleParametersResult.maxIndex[1] + 100,
      otherScheduleParametersResult.maxIndex[1],
      otherScheduleParametersResult.leastIndex[1],
      otherScheduleParametersResult.leastIndex[1] - 1,
      0,
      false,
      80,
      false,
      SCHEDULE_TYPES.SEQUENTIAL,
    );
    expect(endCheck).toStrictEqual({
      dayEndIndex: otherScheduleParametersResult.maxIndex[1],
      isEnd: true,
      hasLooped: true,
      verseOverflow: 0,
    });
  });

  test('index past end index in middle of span of all verses has looped is true', () => {
    let endCheck = checkEnd(
      tblVerseIndex,
      15000,
      otherScheduleParametersResult.maxIndex[1],
      otherScheduleParametersResult.leastIndex[1],
      14000,
      0,
      true,
      80,
      false,
      SCHEDULE_TYPES.SEQUENTIAL,
    );
    expect(endCheck).toStrictEqual({
      dayEndIndex: 14000,
      isEnd: true,
      hasLooped: true,
      verseOverflow: 0,
    });
  });

  test('index less than end index and has looped (a typical value)', () => {
    let endCheck = checkEnd(
      tblVerseIndex,
      14000,
      otherScheduleParametersResult.maxIndex[1],
      otherScheduleParametersResult.leastIndex[1],
      15000,
      0,
      true,
      80,
      false,
      SCHEDULE_TYPES.SEQUENTIAL,
    );
    expect(endCheck).toStrictEqual({
      dayEndIndex: 13995,
      isEnd: false,
      hasLooped: true,
      verseOverflow: 5,
    });
  });

  test('index greater than end index and has not looped (a typical value)', () => {
    let endCheck = checkEnd(
      tblVerseIndex,
      15000,
      otherScheduleParametersResult.maxIndex[1],
      otherScheduleParametersResult.leastIndex[1],
      14000,
      0,
      false,
      80,
      false,
      SCHEDULE_TYPES.SEQUENTIAL,
    );
    expect(endCheck).toStrictEqual({
      dayEndIndex: 14976,
      isEnd: false,
      hasLooped: false,
      verseOverflow: 24,
    });
  });
});

describe('test checkEnd for CHRONOLOGICAL schedule given tracking indicators for schedule creation determines whether adjustments need to be made, then returns the adjusted indicators', () => {
  test('index equals max index', () => {
    let endCheck = checkEnd(
      tblVerseIndex,
      otherScheduleParametersResult.maxIndex[1],
      otherScheduleParametersResult.maxIndex[1],
      otherScheduleParametersResult.leastIndex[1],
      otherScheduleParametersResult.leastIndex[1] - 1,
      0,
      false,
      80,
      false,
      SCHEDULE_TYPES.CHRONOLOGICAL,
    );
    expect(endCheck).toStrictEqual({
      dayEndIndex: otherScheduleParametersResult.maxIndex[1],
      isEnd: true,
      hasLooped: true,
      verseOverflow: 0,
    });
  });

  test('index greater than max index', () => {
    let endCheck = checkEnd(
      tblVerseIndex,
      otherScheduleParametersResult.maxIndex[1] + 100,
      otherScheduleParametersResult.maxIndex[1],
      otherScheduleParametersResult.leastIndex[1],
      otherScheduleParametersResult.leastIndex[1] - 1,
      0,
      false,
      80,
      false,
      SCHEDULE_TYPES.CHRONOLOGICAL,
    );
    expect(endCheck).toStrictEqual({
      dayEndIndex: otherScheduleParametersResult.maxIndex[1],
      isEnd: true,
      hasLooped: true,
      verseOverflow: 0,
    });
  });

  test('index past end index in middle of span of all verses has looped is true', () => {
    let endCheck = checkEnd(
      tblVerseIndex,
      15000,
      otherScheduleParametersResult.maxIndex[1],
      otherScheduleParametersResult.leastIndex[1],
      14000,
      0,
      true,
      80,
      false,
      SCHEDULE_TYPES.CHRONOLOGICAL,
    );
    expect(endCheck).toStrictEqual({
      dayEndIndex: 14000,
      isEnd: true,
      hasLooped: true,
      verseOverflow: 0,
    });
  });

  test('index less than end index and has looped (a typical value)', () => {
    let endCheck = checkEnd(
      tblVerseIndex,
      14000,
      otherScheduleParametersResult.maxIndex[1],
      otherScheduleParametersResult.leastIndex[1],
      15000,
      0,
      true,
      80,
      false,
      SCHEDULE_TYPES.CHRONOLOGICAL,
    );
    expect(endCheck).toStrictEqual({
      dayEndIndex: 13996,
      isEnd: false,
      hasLooped: true,
      verseOverflow: 4,
    });
  });

  test('index greater than end index and has not looped (a typical value)', () => {
    let endCheck = checkEnd(
      tblVerseIndex,
      15000,
      otherScheduleParametersResult.maxIndex[1],
      otherScheduleParametersResult.leastIndex[1],
      14000,
      0,
      false,
      80,
      false,
      SCHEDULE_TYPES.CHRONOLOGICAL,
    );
    expect(endCheck).toStrictEqual({
      dayEndIndex: 15000,
      isEnd: false,
      hasLooped: false,
      verseOverflow: 0,
    });
  });
});

describe('test checkEnd for THEMATIC schedule given tracking indicators for schedule creation determines whether adjustments need to be made, then returns the adjusted indicators', () => {
  test('index equals max index  for day (theme) 1', () => {
    let endCheck = checkEnd(
      tblVerseIndex,
      thematicScheduleParametersResult.maxIndex[1],
      thematicScheduleParametersResult.maxIndex[1],
      thematicScheduleParametersResult.leastIndex[1],
      thematicScheduleParametersResult.leastIndex[1] - 1,
      0,
      false,
      80,
      false,
      SCHEDULE_TYPES.THEMATIC,
    );
    expect(endCheck).toStrictEqual({
      dayEndIndex: thematicScheduleParametersResult.maxIndex[1],
      isEnd: true,
      hasLooped: true,
      verseOverflow: 0,
    });
  });

  test('index greater than max index  for day (theme) 2', () => {
    let endCheck = checkEnd(
      tblVerseIndex,
      thematicScheduleParametersResult.maxIndex[2] + 100,
      thematicScheduleParametersResult.maxIndex[2],
      thematicScheduleParametersResult.leastIndex[2],
      thematicScheduleParametersResult.leastIndex[2] - 1,
      0,
      false,
      80,
      false,
      SCHEDULE_TYPES.THEMATIC,
    );
    expect(endCheck).toStrictEqual({
      dayEndIndex: thematicScheduleParametersResult.maxIndex[2],
      isEnd: true,
      hasLooped: true,
      verseOverflow: 0,
    });
  });

  test('index past end index in middle of span of all verses  for day (theme) 3 has looped is true', () => {
    let endCheck = checkEnd(
      tblVerseIndex,
      14000,
      thematicScheduleParametersResult.maxIndex[3],
      thematicScheduleParametersResult.leastIndex[3],
      13000,
      0,
      true,
      80,
      false,
      SCHEDULE_TYPES.THEMATIC,
    );
    expect(endCheck).toStrictEqual({
      dayEndIndex: 13000,
      isEnd: true,
      hasLooped: true,
      verseOverflow: 0,
    });
  });

  test('index less than end index for day (theme) 4 and has looped (a typical value)', () => {
    let endCheck = checkEnd(
      tblVerseIndex,
      16000,
      thematicScheduleParametersResult.maxIndex[4],
      thematicScheduleParametersResult.leastIndex[4],
      17000,
      0,
      true,
      80,
      false,
      SCHEDULE_TYPES.THEMATIC,
    );
    expect(endCheck).toStrictEqual({
      dayEndIndex: 16074,
      isEnd: false,
      hasLooped: true,
      verseOverflow: -74,
    });
  });

  test('index less than end index for day (theme) 5 and has looped (a typical value)', () => {
    let endCheck = checkEnd(
      tblVerseIndex,
      19000,
      thematicScheduleParametersResult.maxIndex[5],
      thematicScheduleParametersResult.leastIndex[5],
      20000,
      0,
      true,
      80,
      false,
      SCHEDULE_TYPES.THEMATIC,
    );
    expect(endCheck).toStrictEqual({
      dayEndIndex: 19002,
      isEnd: false,
      hasLooped: true,
      verseOverflow: -2,
    });
  });

  test('index greater than end index for day (theme) 6 and has not looped (a typical value)', () => {
    let endCheck = checkEnd(
      tblVerseIndex,
      26000,
      thematicScheduleParametersResult.maxIndex[6],
      thematicScheduleParametersResult.leastIndex[6],
      24000,
      0,
      false,
      80,
      false,
      SCHEDULE_TYPES.THEMATIC,
    );
    expect(endCheck).toStrictEqual({
      dayEndIndex: 25980,
      isEnd: false,
      hasLooped: false,
      verseOverflow: 20,
    });
  });

  test('index greater than end index for day (theme) 7 and has not looped (a typical value)', () => {
    let endCheck = checkEnd(
      tblVerseIndex,
      31000,
      thematicScheduleParametersResult.maxIndex[7],
      thematicScheduleParametersResult.leastIndex[7],
      29000,
      0,
      false,
      80,
      false,
      SCHEDULE_TYPES.THEMATIC,
    );
    expect(endCheck).toStrictEqual({
      dayEndIndex: 30994,
      isEnd: false,
      hasLooped: false,
      verseOverflow: 6,
    });
  });
});

describe('createReadingPortions', () => {
  let newDate = formatDate(date);

  let simpleResultArray = [
    'Genesis',
    1,
    1,
    1,
    'Genesis',
    1,
    2,
    25,
    newDate,
    'Genesis 1-2',
    VERSE_POSITION.START_AND_END,
  ];

  test('createReadingPortion', () => {
    let portion = createReadingPortion(
      tblVerseIndex,
      0,
      VERSE_POSITION.START,
      55,
      VERSE_POSITION.END,
      date,
    );

    expect(portion).toStrictEqual(simpleResultArray);
  });

  test('Sequential schedule with 1 reading portion', () => {
    let resultArray = createReadingPortions(
      tblVerseIndex,
      0,
      55,
      date,
      SCHEDULE_TYPES.SEQUENTIAL,
      otherScheduleParametersResult.leastIndex[1],
      otherScheduleParametersResult.maxIndex[1],
    );

    expect(resultArray).toStrictEqual([simpleResultArray]);
  });

  test('Chronological schedule with 1 reading portion', () => {
    let resultArray = createReadingPortions(
      qryChronologicalIndex,
      0,
      55,
      date,
      SCHEDULE_TYPES.CHRONOLOGICAL,
      otherScheduleParametersResult.leastIndex[1],
      otherScheduleParametersResult.maxIndex[1],
    );

    expect(resultArray).toStrictEqual([simpleResultArray]);
  });

  test('Thematic schedule with 1 reading portion', () => {
    let resultArray = createReadingPortions(
      qryThematicIndex,
      0,
      55,
      date,
      SCHEDULE_TYPES.THEMATIC,
      otherScheduleParametersResult.leastIndex[1],
      otherScheduleParametersResult.maxIndex[1],
    );

    expect(resultArray).toStrictEqual([simpleResultArray]);
  });

  /*
  test('Sequential schedule with >1 reading portion', () => {
    let portion1 = [
      'Revelation',
      66,
      22,
      15,
      'Revelation',
      66,
      22,
      21,
      newDate,
      'Revelation 22:15-21',
      VERSE_POSITION.END,
    ];

    let portion2 = [
      'Genesis',
      1,
      1,
      1,
      'Genesis',
      1,
      1,
      9,
      newDate,
      'Genesis 1:1-9',
      VERSE_POSITION.START,
    ];

    let resultArray = createReadingPortions(
      tblVerseIndex,
      31070,
      10,
      date,
      SCHEDULE_TYPES.SEQUENTIAL,
      otherScheduleParametersResult.leastIndex[1],
      otherScheduleParametersResult.maxIndex[1],
    );

    expect(resultArray).toStrictEqual([portion1, portion2]);
  });
  */

  test('Chronological schedule with >1 reading portion', () => {
    let portion3 = [
      'Psalms',
      19,
      147,
      14,
      'Psalms',
      19,
      147,
      20,
      newDate,
      'Psalms 147:14-20',
      VERSE_POSITION.END,
    ];

    let portion1 = [
      '1 Chronicles',
      13,
      9,
      1,
      '1 Chronicles',
      13,
      9,
      34,
      newDate,
      '1 Chronicles 9:1-34',
      VERSE_POSITION.START,
    ];

    let portion2 = [
      'Nehemiah',
      16,
      12,
      1,
      'Nehemiah',
      16,
      12,
      5,
      newDate,
      'Nehemiah 12:1-5',
      VERSE_POSITION.START,
    ];

    let resultArray = createReadingPortions(
      qryChronologicalIndex,
      22936,
      22981,
      date,
      SCHEDULE_TYPES.CHRONOLOGICAL,
      otherScheduleParametersResult.leastIndex[1],
      otherScheduleParametersResult.maxIndex[1],
    );

    expect(resultArray).toStrictEqual([portion1, portion2, portion3]);
  });

  test('Thematic schedule with >1 reading portion', () => {
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

    let resultArray = createReadingPortions(
      qryThematicIndex,
      23142,
      17660,
      date,
      SCHEDULE_TYPES.THEMATIC,
      thematicScheduleParametersResult.leastIndex[5],
      thematicScheduleParametersResult.maxIndex[5],
    );

    expect(resultArray).toStrictEqual([portion1, portion2, portion3]);
  });
});

test('insertReadingPortions', async () => {
  let newDate = formatDate(date);

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

  const valuesArray = [
    'StartBookName',
    'StartBookNumber',
    'StartChapter',
    'StartVerse',
    'EndBookName',
    'EndBookNumber',
    'EndChapter',
    'EndVerse',
    'CompletionDate',
    'ReadingPortion',
    'VersePosition',
  ];

  let readingPortions = [
    portion1,
    portion2,
    portion3,
    portion1,
    portion2,
    portion3,
  ];

  await setScheduleTable(SCHEDULE_TYPES.CHRONOLOGICAL);

  await insertReadingPortions(userDB, readingPortions, tableName, valuesArray);

  await userDB.executeSql('SELECT * FROM tblTest', []).then(([res]) => {
    expect(res.rows.length).toBe(6);
  });
});

describe('create bible reading schedule', () => {
  /*
  Tests:
  Sequential
    0.1 Year verse that exists (Genesis 1:1)
    20 Year verse that doesn't exist (Malachi 100:100)

  Chronological
    0.1 Year verse that doesn't exist (Obadiah 100:100)
    20 Year verse that exists (Genesis 1:1)

  Thematic
    0.1 Year verse that exists (Genesis 1:1)
    20 Year verse that doesn't exist (Revelation 100:100)
  */
  test('Sequential schedule with a minimum duration and an existing verse', async () => {
    let scheduleType = SCHEDULE_TYPES.SEQUENTIAL;

    await setScheduleTable(scheduleType);

    await generateBibleSchedule(
      userDB,
      bibleDB,
      scheduleType,
      0.1,
      1,
      1,
      1,
      tableName,
      () => {},
      () => {},
    );

    await userDB.executeSql('SELECT * FROM tblTest', []).then(([res]) => {
      let today = new Date();
      expect(res.rows.length).toBe(38);

      expect(res.rows.item(0).ReadingPortion).toBe('Genesis 1-29');
      expect(res.rows.item(0).CompletionDate).toBe(formatDate(today));

      expect(res.rows.item(37).ReadingPortion).toBe('Revelation 18-22');
      today.setDate(today.getDate() + 37);
      expect(res.rows.item(37).CompletionDate).toBe(formatDate(today));
    });
  });

  test('Sequential schedule with a maximum duration and a non-existant verse', async () => {
    let scheduleType = SCHEDULE_TYPES.SEQUENTIAL;

    await setScheduleTable(scheduleType);

    await generateBibleSchedule(
      userDB,
      bibleDB,
      scheduleType,
      20,
      39,
      100,
      100,
      tableName,
      () => {},
      () => {},
    );

    await userDB.executeSql('SELECT * FROM tblTest', []).then(([res]) => {
      let today = new Date();
      expect(res.rows.length).toBe(4447);
      // console.log('length', res.rows.length);
      // console.log(res.rows.item(0));
      // console.log(res.rows.item(res.rows.length - 1));

      expect(res.rows.item(0).ReadingPortion).toBe('Matthew 1:1-5');
      expect(res.rows.item(0).CompletionDate).toBe(formatDate(today));

      expect(res.rows.item(4446).ReadingPortion).toBe('Malachi 3:17-4:6');
      today.setDate(today.getDate() + 4446);
      expect(res.rows.item(4446).CompletionDate).toBe(formatDate(today));
    });
  });

  test('Chronological schedule with a minimum duration and a non-existant verse', async () => {
    let scheduleType = SCHEDULE_TYPES.CHRONOLOGICAL;

    await setScheduleTable(scheduleType);

    await generateBibleSchedule(
      userDB,
      bibleDB,
      scheduleType,
      0.1,
      31,
      100,
      100,
      tableName,
      () => {},
      () => {},
    );

    await userDB.executeSql('SELECT * FROM tblTest', []).then(([res]) => {
      let today = new Date();
      expect(res.rows.length).toBe(323);

      expect(res.rows.item(0).ReadingPortion).toBe('2 Kings 14:29');
      expect(res.rows.item(0).CompletionDate).toBe(formatDate(today));

      expect(res.rows.item(322).ReadingPortion).toBe('Joel 1-Amos 9');
      today.setDate(today.getDate() + 36);
      expect(res.rows.item(322).CompletionDate).toBe(formatDate(today));
    });
  });

  test('Chronological schedule with a maximum duration and an existing verse', async () => {
    let scheduleType = SCHEDULE_TYPES.CHRONOLOGICAL;

    await setScheduleTable(scheduleType);

    await generateBibleSchedule(
      userDB,
      bibleDB,
      scheduleType,
      20,
      1,
      1,
      1,
      tableName,
      () => {},
      () => {},
    );

    await userDB.executeSql('SELECT * FROM tblTest', []).then(([res]) => {
      let today = new Date();
      expect(res.rows.length).toBe(5048);

      expect(res.rows.item(0).ReadingPortion).toBe('Genesis 1:1-5');
      expect(res.rows.item(0).CompletionDate).toBe(formatDate(today));

      expect(res.rows.item(5047).ReadingPortion).toBe('Revelation 22:20-21');
      today.setDate(today.getDate() + 4447);
      expect(res.rows.item(5047).CompletionDate).toBe(formatDate(today));
    });
  });

  test('Thematic schedule with a minimum duration and an existing verse', async () => {
    let scheduleType = SCHEDULE_TYPES.THEMATIC;

    await setScheduleTable(scheduleType);

    await generateBibleSchedule(
      userDB,
      bibleDB,
      scheduleType,
      0.1,
      1,
      1,
      1,
      tableName,
      () => {},
      () => {},
    );

    await userDB.executeSql('SELECT * FROM tblTest', []).then(([res]) => {
      let today = new Date();
      expect(res.rows.length).toBe(44);

      expect(res.rows.item(0).ReadingPortion).toBe('Genesis 1-37');
      expect(res.rows.item(0).CompletionDate).toBe(formatDate(today));

      expect(res.rows.item(43).ReadingPortion).toBe('1 John 2:2-Jude 1:25');
      today.setDate(today.getDate() + 41);
      expect(res.rows.item(43).CompletionDate).toBe(formatDate(today));
    });
  });

  test('Thematic schedule with a maximum duration and a non-existant verse', async () => {
    let scheduleType = SCHEDULE_TYPES.THEMATIC;

    await setScheduleTable(scheduleType);

    await generateBibleSchedule(
      userDB,
      bibleDB,
      scheduleType,
      20,
      66,
      100,
      100,
      tableName,
      () => {},
      () => {},
    );

    await userDB.executeSql('SELECT * FROM tblTest', []).then(([res]) => {
      let today = new Date();
      expect(res.rows.length).toBe(6436);

      expect(res.rows.item(0).ReadingPortion).toBe('Genesis 1:1-6');
      expect(res.rows.item(0).CompletionDate).toBe(formatDate(today));

      expect(res.rows.item(6435).ReadingPortion).toBe('Esther 10');
      today.setDate(today.getDate() + 6433);
      expect(res.rows.item(6435).CompletionDate).toBe(formatDate(today));
    });
  });
});

describe('create custom reading schedule', () => {
  /*
    Tests:
        startingPortion
          a giant number 1,000,000,000,000,000
          0

        maxPortion:
          a giant number 1,000,000,000,000,000
          a number less than starting portion 0

        portionsPerDay
          a giant number 1,000,000,000,000,000
          0
  */
  test('max portion smaller than starting portion', async () => {
    let scheduleType = SCHEDULE_TYPES.CUSTOM;

    await setScheduleTable(scheduleType);

    await generateCustomSchedule(
      userDB,
      tableName,
      1000000000000000,
      0,
      'Portion',
      1,
      () => {},
    );

    await userDB.executeSql('SELECT * FROM tblTest', []).then(([res]) => {
      expect(res.rows.length).toBe(0);
    });
  });

  test('very large portions per day', async () => {
    let scheduleType = SCHEDULE_TYPES.CUSTOM;

    await setScheduleTable(scheduleType);

    await generateCustomSchedule(
      userDB,
      tableName,
      1,
      1,
      'Portion',
      1000000000000000,
      () => {},
    );

    await userDB.executeSql('SELECT * FROM tblTest', []).then(([res]) => {
      let today = new Date();

      expect(res.rows.length).toBe(1);

      expect(res.rows.item(0).ReadingPortion).toBe('Portion 1');
      expect(res.rows.item(0).CompletionDate).toBe(formatDate(today));
    });
  });

  test('a large max portion and a small portions per day', async () => {
    let scheduleType = SCHEDULE_TYPES.CUSTOM;

    await setScheduleTable(scheduleType);

    let promise = new Promise((res, rej) => {
      generateCustomSchedule(userDB, tableName, 0, 1000, 'Portion', 0.1, () => {
        res();
      });
    });

    await promise;

    await userDB.executeSql('SELECT * FROM tblTest', []).then(([res]) => {
      let today = new Date();

      expect(res.rows.length).toBe(10001);

      expect(res.rows.item(0).ReadingPortion).toBe('Portion 0-0.1');
      expect(res.rows.item(0).CompletionDate).toBe(formatDate(today));

      expect(res.rows.item(10000).ReadingPortion).toBe('Portion 1000');
      today.setDate(today.getDate() + 10000);
      expect(res.rows.item(10000).CompletionDate).toBe(formatDate(today));
    });
  });
});
