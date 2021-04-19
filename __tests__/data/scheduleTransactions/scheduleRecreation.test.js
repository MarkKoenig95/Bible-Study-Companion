import SQLite from 'react-native-sqlite-storage';
import {runSQL, upgradeDB} from '../../../data/Database/generalTransactions';
import {
  addSchedule,
  findFinishedPortionSpans,
  matchFinishedPortions,
  recreateSchedule,
  updateMultipleReadStatus,
} from '../../../data/Database/scheduleTransactions';
import upgradeJSON from '../../../data/Database/upgrades/user-info-db-upgrade.json';
import {SCHEDULE_TYPES} from '../../../logic/general';

const origTableName = 'tblSchedule1';
const newTableName = 'tblSchedule2';
const scheduleName = 'test';

let bibleDB;
let userDB;

async function getSchedules() {
  let {rows} = await runSQL(userDB, 'SELECT * FROM tblSchedules;');
  return rows;
}

const checkScheduleDayStartVerse = (
  bookNumber,
  chapter,
  verse,
  newScheduleDay,
) => {
  if (newScheduleDay.StartBookNumber < bookNumber) return true;

  if (newScheduleDay.StartBookNumber === bookNumber) {
    if (newScheduleDay.StartChapter < chapter) return true;

    if (
      newScheduleDay.StartChapter === chapter &&
      newScheduleDay.StartVerse <= verse
    ) {
      return true;
    }
  }

  return false;
};

const checkScheduleDayEndVerse = (
  bookNumber,
  chapter,
  verse,
  newScheduleDay,
) => {
  if (newScheduleDay.EndBookNumber > bookNumber) return true;

  if (newScheduleDay.EndBookNumber === bookNumber) {
    if (newScheduleDay.EndChapter > chapter) return true;
    if (
      newScheduleDay.EndChapter === chapter &&
      newScheduleDay.EndVerse >= verse
    ) {
      return true;
    }
  }

  return false;
};

const checkScheduleDayVerse = (bookNumber, chapter, verse, newScheduleDay) => {
  let startCheck = checkScheduleDayStartVerse(
    bookNumber,
    chapter,
    verse,
    newScheduleDay,
  );

  let endCheck = checkScheduleDayEndVerse(
    bookNumber,
    chapter,
    verse,
    newScheduleDay,
  );

  return startCheck && endCheck;
};

beforeAll(async () => {
  bibleDB = SQLite.openDatabase('BibleStudyCompanion.db');

  userDB = SQLite.openDatabase('scheduleRecreation_UserInfo.db');
});

beforeEach(async () => {
  userDB.deleteDB();
  userDB = SQLite.openDatabase('scheduleRecreation_UserInfo.db');

  await upgradeDB(userDB, upgradeJSON);
});

afterAll(() => {
  userDB.deleteDB();
});

describe('schedule verse checkers', () => {
  test('EndBook > verse && StartBook < verse', () => {
    let bookNumber = 10;
    let chapter = 10;
    let verse = 10;
    let mockNewScheduleDay = {
      StartBookNumber: 8,
      StartChapter: 10,
      StartVerse: 10,
      EndBookNumber: 12,
      EndChapter: 10,
      EndVerse: 10,
    };

    let verseCheck = checkScheduleDayVerse(
      bookNumber,
      chapter,
      verse,
      mockNewScheduleDay,
    );

    expect(verseCheck).toBe(true);
  });

  test('EndBook === verse, EndChapter > verse && StartBook < verse', () => {
    let bookNumber = 10;
    let chapter = 10;
    let verse = 10;
    let mockNewScheduleDay = {
      StartBookNumber: 8,
      StartChapter: 10,
      StartVerse: 10,
      EndBookNumber: 10,
      EndChapter: 12,
      EndVerse: 10,
    };

    let verseCheck = checkScheduleDayVerse(
      bookNumber,
      chapter,
      verse,
      mockNewScheduleDay,
    );

    expect(verseCheck).toBe(true);
  });

  test('EndBook === verse, EndChapter === verse, EndVerse > verse && StartBook < verse', () => {
    let bookNumber = 10;
    let chapter = 10;
    let verse = 10;
    let mockNewScheduleDay = {
      StartBookNumber: 8,
      StartChapter: 10,
      StartVerse: 10,
      EndBookNumber: 10,
      EndChapter: 10,
      EndVerse: 12,
    };

    let verseCheck = checkScheduleDayVerse(
      bookNumber,
      chapter,
      verse,
      mockNewScheduleDay,
    );

    expect(verseCheck).toBe(true);
  });

  test('EndBook === verse, EndChapter === verse, EndVerse === verse && StartBook < verse', () => {
    let bookNumber = 10;
    let chapter = 10;
    let verse = 10;
    let mockNewScheduleDay = {
      StartBookNumber: 8,
      StartChapter: 10,
      StartVerse: 10,
      EndBookNumber: 10,
      EndChapter: 10,
      EndVerse: 10,
    };

    let verseCheck = checkScheduleDayVerse(
      bookNumber,
      chapter,
      verse,
      mockNewScheduleDay,
    );

    expect(verseCheck).toBe(true);
  });

  test('EndBook < verse && StartBook < verse', () => {
    let bookNumber = 10;
    let chapter = 10;
    let verse = 10;
    let mockNewScheduleDay = {
      StartBookNumber: 8,
      StartChapter: 10,
      StartVerse: 10,
      EndBookNumber: 8,
      EndChapter: 10,
      EndVerse: 10,
    };

    let verseCheck = checkScheduleDayVerse(
      bookNumber,
      chapter,
      verse,
      mockNewScheduleDay,
    );

    expect(verseCheck).toBe(false);
  });

  test('EndBook === verse, EndChapter < verse && StartBook < verse', () => {
    let bookNumber = 10;
    let chapter = 10;
    let verse = 10;
    let mockNewScheduleDay = {
      StartBookNumber: 8,
      StartChapter: 10,
      StartVerse: 10,
      EndBookNumber: 10,
      EndChapter: 8,
      EndVerse: 10,
    };

    let verseCheck = checkScheduleDayVerse(
      bookNumber,
      chapter,
      verse,
      mockNewScheduleDay,
    );

    expect(verseCheck).toBe(false);
  });

  test('EndBook === verse, EndChapter === verse, EndVerse < verse && StartBook < verse', () => {
    let bookNumber = 10;
    let chapter = 10;
    let verse = 10;
    let mockNewScheduleDay = {
      StartBookNumber: 8,
      StartChapter: 10,
      StartVerse: 10,
      EndBookNumber: 10,
      EndChapter: 10,
      EndVerse: 8,
    };

    let verseCheck = checkScheduleDayVerse(
      bookNumber,
      chapter,
      verse,
      mockNewScheduleDay,
    );

    expect(verseCheck).toBe(false);
  });

  test('StartBook === verse, StartChapter < verse && EndBook > verse', () => {
    let bookNumber = 10;
    let chapter = 10;
    let verse = 10;
    let mockNewScheduleDay = {
      StartBookNumber: 10,
      StartChapter: 8,
      StartVerse: 10,
      EndBookNumber: 12,
      EndChapter: 10,
      EndVerse: 10,
    };

    let verseCheck = checkScheduleDayVerse(
      bookNumber,
      chapter,
      verse,
      mockNewScheduleDay,
    );

    expect(verseCheck).toBe(true);
  });

  test('StartBook === verse, StartChapter === verse, StartVerse < verse && EndBook > verse', () => {
    let bookNumber = 10;
    let chapter = 10;
    let verse = 10;
    let mockNewScheduleDay = {
      StartBookNumber: 10,
      StartChapter: 10,
      StartVerse: 8,
      EndBookNumber: 12,
      EndChapter: 10,
      EndVerse: 10,
    };

    let verseCheck = checkScheduleDayVerse(
      bookNumber,
      chapter,
      verse,
      mockNewScheduleDay,
    );

    expect(verseCheck).toBe(true);
  });

  test('StartBook === verse, StartChapter === verse, StartVerse === verse && EndBook > verse', () => {
    let bookNumber = 10;
    let chapter = 10;
    let verse = 10;
    let mockNewScheduleDay = {
      StartBookNumber: 10,
      StartChapter: 10,
      StartVerse: 10,
      EndBookNumber: 12,
      EndChapter: 10,
      EndVerse: 10,
    };

    let verseCheck = checkScheduleDayVerse(
      bookNumber,
      chapter,
      verse,
      mockNewScheduleDay,
    );

    expect(verseCheck).toBe(true);
  });

  test('StartBook > verse && EndBook > verse', () => {
    let bookNumber = 10;
    let chapter = 10;
    let verse = 10;
    let mockNewScheduleDay = {
      StartBookNumber: 12,
      StartChapter: 10,
      StartVerse: 10,
      EndBookNumber: 13,
      EndChapter: 10,
      EndVerse: 10,
    };

    let verseCheck = checkScheduleDayVerse(
      bookNumber,
      chapter,
      verse,
      mockNewScheduleDay,
    );

    expect(verseCheck).toBe(false);
  });

  test('StartBook === verse, StartChapter > verse && EndBook > verse', () => {
    let bookNumber = 10;
    let chapter = 10;
    let verse = 10;
    let mockNewScheduleDay = {
      StartBookNumber: 10,
      StartChapter: 12,
      StartVerse: 10,
      EndBookNumber: 12,
      EndChapter: 10,
      EndVerse: 10,
    };

    let verseCheck = checkScheduleDayVerse(
      bookNumber,
      chapter,
      verse,
      mockNewScheduleDay,
    );

    expect(verseCheck).toBe(false);
  });

  test('StartBook === verse, StartChapter === verse, EndVerse > verse && EndBook > verse', () => {
    let bookNumber = 10;
    let chapter = 10;
    let verse = 10;
    let mockNewScheduleDay = {
      StartBookNumber: 10,
      StartChapter: 10,
      StartVerse: 12,
      EndBookNumber: 12,
      EndChapter: 10,
      EndVerse: 10,
    };

    let verseCheck = checkScheduleDayVerse(
      bookNumber,
      chapter,
      verse,
      mockNewScheduleDay,
    );

    expect(verseCheck).toBe(false);
  });

  test('Schedule day exactly contains verse', () => {
    let bookNumber = 10;
    let chapter = 10;
    let verse = 10;
    let mockNewScheduleDay = {
      StartBookNumber: 10,
      StartChapter: 10,
      StartVerse: 10,
      EndBookNumber: 10,
      EndChapter: 10,
      EndVerse: 10,
    };

    let verseCheck = checkScheduleDayVerse(
      bookNumber,
      chapter,
      verse,
      mockNewScheduleDay,
    );

    expect(verseCheck).toBe(true);
  });
});

describe('match finished portions between SIMILAR, BASIC schedules starting at the BEGINNING, WITHOUT GAPS in finished portions', () => {
  let origScheduleFinished;

  beforeEach(async () => {
    let createOrigSchedule = new Promise((res, rej) => {
      addSchedule(
        userDB,
        bibleDB,
        SCHEDULE_TYPES.SEQUENTIAL,
        'Portion Matching Basic (Old)',
        1,
        [1, 1, 1, 1, 1, 1, 1],
        1,
        1,
        1,
        1,
        null,
        null,
        null,
        null,
        res,
        () => {},
      );
    });
    let createNewSchedule = new Promise((res, rej) => {
      addSchedule(
        userDB,
        bibleDB,
        SCHEDULE_TYPES.SEQUENTIAL,
        'Portion Matching Basic',
        1,
        [1, 1, 1, 1, 1, 1, 1],
        1,
        1,
        1,
        1,
        null,
        null,
        null,
        null,
        res,
        () => {},
      );
    });
    await createOrigSchedule;
    await createNewSchedule;

    await updateMultipleReadStatus(userDB, origTableName, 50, 1);

    origScheduleFinished = await runSQL(
      userDB,
      `SELECT * FROM ${origTableName} WHERE IsFinished=1`,
    );
  });

  it('checks find finished portion spans', async () => {
    let result = findFinishedPortionSpans(
      origScheduleFinished,
      0,
      origScheduleFinished.rows.length - 1,
    );

    let expected = [{startIndex: 0, endIndex: 49}];

    expect(result).toStrictEqual(expected);
  });

  it('matches finished portions between two schedules when SOME are finished', async () => {
    await matchFinishedPortions(userDB, origTableName, newTableName);

    let newScheduleFinished = await runSQL(
      userDB,
      `SELECT * FROM ${newTableName} WHERE IsFinished=1;`,
    );

    let scheduleLength = newScheduleFinished.rows.length;

    expect(scheduleLength).toBe(origScheduleFinished.rows.length);
    expect(newScheduleFinished.rows.item(0)).toStrictEqual(
      origScheduleFinished.rows.item(0),
    );
    expect(newScheduleFinished.rows.item(scheduleLength)).toStrictEqual(
      origScheduleFinished.rows.item(scheduleLength),
    );
  });

  it('matches finished portions between two schedules when ALL are finished', async () => {
    await updateMultipleReadStatus(userDB, origTableName, 366, 1);
    origScheduleFinished = await runSQL(
      userDB,
      `SELECT * FROM ${origTableName} WHERE IsFinished=1`,
    );

    await matchFinishedPortions(userDB, origTableName, newTableName);

    let newScheduleFinished = await runSQL(
      userDB,
      `SELECT * FROM ${newTableName} WHERE IsFinished=1;`,
    );

    let scheduleLength = newScheduleFinished.rows.length;

    expect(scheduleLength).toBe(origScheduleFinished.rows.length);
    expect(newScheduleFinished.rows.item(0)).toStrictEqual(
      origScheduleFinished.rows.item(0),
    );
    expect(newScheduleFinished.rows.item(scheduleLength)).toStrictEqual(
      origScheduleFinished.rows.item(scheduleLength),
    );
  });

  it('matches finished portions between two schedules when NONE are finished', async () => {
    await updateMultipleReadStatus(userDB, origTableName, 366, 1, false);
    origScheduleFinished = await runSQL(
      userDB,
      `SELECT * FROM ${origTableName} WHERE IsFinished=1`,
    );

    await matchFinishedPortions(userDB, origTableName, newTableName);

    let newScheduleFinished = await runSQL(
      userDB,
      `SELECT * FROM ${newTableName} WHERE IsFinished=1;`,
    );

    let scheduleLength = newScheduleFinished.rows.length;

    expect(scheduleLength).toBe(0);
  });
});

describe('match finished portions between DIFFERENT, COMPLEX schedules starting in the MIDDLE, WITH GAPS in finished portions', () => {
  let origScheduleFinished;

  beforeEach(async () => {
    let createOrigSchedule = new Promise((res, rej) => {
      addSchedule(
        userDB,
        bibleDB,
        SCHEDULE_TYPES.CHRONOLOGICAL,
        'Portion Matching (Old)',
        1,
        [1, 1, 1, 1, 1, 1, 1],
        2,
        40,
        3,
        8,
        null,
        null,
        null,
        null,
        res,
        () => {},
      );
    });

    let createNewSchedule = new Promise((res, rej) => {
      addSchedule(
        userDB,
        bibleDB,
        SCHEDULE_TYPES.CHRONOLOGICAL,
        'Portion Matching',
        1,
        [1, 1, 1, 1, 1, 1, 1],
        11,
        19,
        119,
        83,
        null,
        null,
        null,
        null,
        res,
        () => {},
      );
    });

    await createOrigSchedule;
    await createNewSchedule;

    await updateMultipleReadStatus(userDB, origTableName, 50, 1);
    await updateMultipleReadStatus(userDB, origTableName, 75, 75);
    await updateMultipleReadStatus(userDB, origTableName, 149, 100);
    await updateMultipleReadStatus(userDB, origTableName, 434, 187);

    origScheduleFinished = await runSQL(
      userDB,
      `SELECT * FROM ${origTableName} WHERE IsFinished=1`,
    );
  });

  it('finds finished portion spans', async () => {
    let schedule = await runSQL(
      userDB,
      `SELECT * FROM ${origTableName} WHERE IsFinished=1`,
    );

    let result = findFinishedPortionSpans(
      schedule,
      0,
      schedule.rows.length - 1,
    );

    let expected = [
      {startIndex: 0, endIndex: 49},
      {startIndex: 50, endIndex: 50},
      {startIndex: 51, endIndex: 100},
      {startIndex: 101, endIndex: 348},
    ];

    expect(result).toStrictEqual(expected);
  });

  it('matches finished portions between two schedules', async () => {
    await matchFinishedPortions(userDB, origTableName, newTableName);
    let newScheduleFinished = await runSQL(
      userDB,
      `SELECT * FROM ${newTableName} WHERE IsFinished=1`,
    );

    let newScheduleLength = newScheduleFinished.rows.length;
    let origScheduleLength = origScheduleFinished.rows.length;

    let idDifference =
      newScheduleFinished.rows.item(newScheduleLength - 1).ReadingDayID -
      newScheduleFinished.rows.item(0).ReadingDayID;
    //Expect that the finished portions are not continuous
    expect(idDifference).toBeGreaterThan(newScheduleLength);

    // Check values of the sets of finished values, expect that the first verse in the original
    // reading portion is included in the new schedule day's portion

    // First verse set
    let newFirstFinishedSetStart = newScheduleFinished.rows.item(0);
    let origFirstFinishedSetStart = origScheduleFinished.rows.item(0);

    let checkFirstFinishedSetStartVerse = checkScheduleDayVerse(
      origFirstFinishedSetStart.StartBookNumber,
      origFirstFinishedSetStart.StartChapter,
      origFirstFinishedSetStart.StartVerse,
      newFirstFinishedSetStart,
    );

    expect(checkFirstFinishedSetStartVerse).toBe(true);

    let newFirstFinishedSetEnd = newScheduleFinished.rows.item(120);
    let origFirstFinishedSetEnd = origScheduleFinished.rows.item(49);

    let checkFirstFinishedSetEndVerse = checkScheduleDayVerse(
      origFirstFinishedSetEnd.EndBookNumber,
      origFirstFinishedSetEnd.EndChapter,
      origFirstFinishedSetEnd.EndVerse,
      newFirstFinishedSetEnd,
    );

    expect(checkFirstFinishedSetEndVerse).toBe(true);

    // Second verse set is just one item
    let newSecondFinishedSetStart = newScheduleFinished.rows.item(121);
    let origSecondFinishedSetStart = origScheduleFinished.rows.item(50);

    let checkSecondFinishedSetStartVerse = checkScheduleDayVerse(
      origSecondFinishedSetStart.StartBookNumber,
      origSecondFinishedSetStart.StartChapter,
      origSecondFinishedSetStart.StartVerse,
      newSecondFinishedSetStart,
    );

    expect(checkSecondFinishedSetStartVerse).toBe(true);

    // Third verse set
    let newThirdFinishedSetStart = newScheduleFinished.rows.item(122);
    let origThirdFinishedSetStart = origScheduleFinished.rows.item(51);

    let checkThirdFinishedSetStartVerse = checkScheduleDayVerse(
      origThirdFinishedSetStart.StartBookNumber,
      origThirdFinishedSetStart.StartChapter,
      origThirdFinishedSetStart.StartVerse,
      newThirdFinishedSetStart,
    );

    expect(checkThirdFinishedSetStartVerse).toBe(true);

    let newThirdFinishedSetEnd = newScheduleFinished.rows.item(272);
    let origThirdFinishedSetEnd = origScheduleFinished.rows.item(100);

    let checkThirdFinishedSetEndVerse = checkScheduleDayVerse(
      origThirdFinishedSetEnd.EndBookNumber,
      origThirdFinishedSetEnd.EndChapter,
      origThirdFinishedSetEnd.EndVerse,
      newThirdFinishedSetEnd,
    );

    expect(checkThirdFinishedSetEndVerse).toBe(true);

    // Last verse set
    let newLastFinishedSetStart = newScheduleFinished.rows.item(273);
    let origLastFinishedSetStart = origScheduleFinished.rows.item(101);

    let checkLastFinishedSetStartVerse = checkScheduleDayVerse(
      origLastFinishedSetStart.StartBookNumber,
      origLastFinishedSetStart.StartChapter,
      origLastFinishedSetStart.StartVerse,
      newLastFinishedSetStart,
    );

    expect(checkLastFinishedSetStartVerse).toBe(true);

    let newLastFinishedSetEnd = newScheduleFinished.rows.item(
      newScheduleLength - 1,
    );
    let origLastFinishedSetEnd = origScheduleFinished.rows.item(
      origScheduleLength - 1,
    );

    let checkLastFinishedSetEndVerse = checkScheduleDayVerse(
      origLastFinishedSetEnd.EndBookNumber,
      origLastFinishedSetEnd.EndChapter,
      origLastFinishedSetEnd.EndVerse,
      newLastFinishedSetEnd,
    );

    expect(checkLastFinishedSetEndVerse).toBe(true);
  });
});

describe('Test an odd edge case for matching finished portions', () => {
  let origScheduleFinished;

  beforeEach(async () => {
    let createOrigSchedule = new Promise((res, rej) => {
      addSchedule(
        userDB,
        bibleDB,
        SCHEDULE_TYPES.CHRONOLOGICAL,
        'Portion Matching (Old)',
        1,
        [1, 1, 1, 1, 1, 1, 1],
        1,
        1,
        1,
        1,
        null,
        null,
        null,
        null,
        res,
        () => {},
      );
    });

    let createNewSchedule = new Promise((res, rej) => {
      addSchedule(
        userDB,
        bibleDB,
        SCHEDULE_TYPES.CHRONOLOGICAL,
        'Portion Matching',
        1,
        [1, 1, 1, 1, 1, 1, 1],
        1,
        1,
        1,
        1,
        null,
        null,
        null,
        null,
        res,
        () => {},
      );
    });

    await createOrigSchedule;
    await createNewSchedule;

    await runSQL(
      userDB,
      `UPDATE ${origTableName} SET EndBookNumber=?, EndChapter=?, EndVerse=?, IsFinished=? WHERE ReadingDayID=?`,
      [13, 1, 1, 1, 2],
    );

    origScheduleFinished = await runSQL(
      userDB,
      `SELECT * FROM ${origTableName} WHERE IsFinished=1`,
    );
  });

  it("checks an odd edge case from a previous bug in schedule creation where a schedule day's end day can be far beyond the start day even though that is not actually the case", async () => {
    console.log('old', origScheduleFinished.rows.item(0));
    await matchFinishedPortions(userDB, origTableName, newTableName);
    let newScheduleFinished = await runSQL(
      userDB,
      `SELECT * FROM ${newTableName} WHERE IsFinished=1`,
    );

    // Check that instead of going off the rails and marking half of the schedule as finished, it worked as intended
    expect(newScheduleFinished.rows.length).toBe(2);
  });
});

describe('recreate schedule', () => {
  beforeEach(async () => {
    let createOrigSchedule = new Promise((res, rej) => {
      addSchedule(
        userDB,
        bibleDB,
        SCHEDULE_TYPES.SEQUENTIAL,
        scheduleName,
        1,
        [1, 1, 1, 1, 1, 1, 1],
        1,
        1,
        1,
        1,
        null,
        null,
        null,
        null,
        res,
        () => {},
      );
    });
    await createOrigSchedule;

    await updateMultipleReadStatus(userDB, origTableName, 10);
  });

  it('recreates schedule without new info', async () => {
    await recreateSchedule(userDB, bibleDB, scheduleName);

    let newScheduleFinished = await runSQL(
      userDB,
      `SELECT * FROM ${newTableName} WHERE IsFinished=1;`,
    );

    let schedulesInfo = await getSchedules();

    expect(schedulesInfo.item(0).ScheduleName).toBe(scheduleName + ' (Old)');
    expect(schedulesInfo.item(1).ScheduleName).toBe(scheduleName);
    expect(schedulesInfo.item(1).DoesTrack).toBe(1);
    expect(schedulesInfo.item(1).IsDay0Active).toBe(1);
    expect(schedulesInfo.item(1).IsDay1Active).toBe(1);
    expect(schedulesInfo.item(1).IsDay2Active).toBe(1);
    expect(schedulesInfo.item(1).IsDay3Active).toBe(1);
    expect(schedulesInfo.item(1).IsDay4Active).toBe(1);
    expect(schedulesInfo.item(1).IsDay5Active).toBe(1);
    expect(schedulesInfo.item(1).IsDay6Active).toBe(1);

    expect(newScheduleFinished.rows.length).toBe(10);
  });

  it('recreates schedule with new info', async () => {
    await recreateSchedule(userDB, bibleDB, scheduleName, {
      activeDays: [0, 0, 0, 0, 0, 0, 0],
      doesTrack: 0,
      duration: 2,
    });

    let newScheduleFinished = await runSQL(
      userDB,
      `SELECT * FROM ${newTableName} WHERE IsFinished=1;`,
    );

    let schedulesInfo = await getSchedules();

    expect(schedulesInfo.item(0).ScheduleName).toBe(scheduleName + ' (Old)');
    expect(schedulesInfo.item(1).ScheduleName).toBe(scheduleName);
    expect(schedulesInfo.item(1).DoesTrack).toBe(0);
    expect(schedulesInfo.item(1).IsDay0Active).toBe(0);
    expect(schedulesInfo.item(1).IsDay1Active).toBe(0);
    expect(schedulesInfo.item(1).IsDay2Active).toBe(0);
    expect(schedulesInfo.item(1).IsDay3Active).toBe(0);
    expect(schedulesInfo.item(1).IsDay4Active).toBe(0);
    expect(schedulesInfo.item(1).IsDay5Active).toBe(0);
    expect(schedulesInfo.item(1).IsDay6Active).toBe(0);

    expect(newScheduleFinished.rows.length).toBe(20);
  });
});
