import {useState, useCallback} from 'react';

import {
  translate,
  linkFormulator,
  dateFormulator,
} from '../../../../logic/localization/localization';

import {errorCB, runSQL} from '../../../../data/Database/generalTransactions';
import {findMaxChapter} from '../../../../logic/scheduleCreation';
import {Database} from '../../../../data/Database/types';
import {InfoSection, ReadingPopupState} from '../types';

export async function loadData(bibleDB: Database, tableName = 'tblBibleBooks') {
  let results = await runSQL(bibleDB, `SELECT * FROM ${tableName};`);
  let items = [];

  if (!results) {
    return [];
  }

  for (let i = 0; i < results.rows.length; ++i) {
    let item = results.rows.item(i);

    let bibleBooksPrefix = 'bibleBooks.' + item.BibleBookID;
    items.push({
      id: item.BibleBookID,
      name: translate(bibleBooksPrefix + '.name'),
      whereWritten: translate(bibleBooksPrefix + '.whereWritten'),
      whenWritten: formatDate(
        item.WhenWritten,
        item.WhenWrittenApproxDesc,
        item.WhenWrittenEnd,
        item.WhenWrittenApproxDesc,
        item.BibleBookID,
      ),
      timeCovered: formatDate(
        item.TimeCoveredStart,
        item.TimeCoveredStartApproxDesc,
        item.TimeCoveredEnd,
        item.TimeCoveredEndApproxDesc,
        item.BibleBookID,
      ),
    });
  }

  return items;
}

export async function queryMaxInfo(bibleDB: Database, bookNumber: number) {
  let maxChapter = await findMaxChapter(bookNumber, bibleDB);

  let maxVerse = 1000;

  //Use maxChapter to find maxVerse
  await runSQL(
    bibleDB,
    'SELECT MaxVerse FROM qryMaxVerses WHERE BibleBook=? AND Chapter=?;',
    [bookNumber, maxChapter],
  )
    .then((res) => {
      if (res) {
        maxVerse = res.rows.item(0).MaxVerse;
      }
    })
    .catch(errorCB);

  return {maxChapter: maxChapter, maxVerse: maxVerse};
}

export function formatDate(
  start: Boolean,
  startApproxDesc: String,
  end: Boolean,
  endApproxDesc: String,
  bibleBookID: number,
) {
  let date;

  if (!start && !end) {
    return '';
  }

  if (
    startApproxDesc &&
    startApproxDesc !== 'about' &&
    startApproxDesc !== 'after' &&
    startApproxDesc !== 'before'
  ) {
    let startYear = dateFormulator(start);
    let endYear = dateFormulator(end, endApproxDesc);
    date = translate('date.specialCases.' + bibleBookID, {
      startYear: startYear,
      endYear: endYear,
    });
  }

  if (end && end !== start) {
    let startDate = dateFormulator(start, startApproxDesc);
    let endDate = dateFormulator(end, endApproxDesc);
    date = translate('date.dateSpan', {startDate: startDate, endDate: endDate});
  } else {
    date = dateFormulator(start, startApproxDesc);
  }

  return date;
}

export function adjustNumber(num: number, decimalPlaces = 3) {
  let temp = '00' + num;
  let decPlaces = 0 - decimalPlaces;

  temp = temp.slice(decPlaces, temp.length);

  return temp;
}

export function makeJWORGLink(
  chapter: number,
  verse: number,
  bookNumber: number,
) {
  const adjChapter = adjustNumber(chapter);
  const adjVerse = adjustNumber(verse);
  const bookName = translate('bibleBooks.' + bookNumber + '.name');
  const adjBookName = bookName.toLowerCase();
  const hash = `/#v${bookNumber}${adjChapter}${adjVerse}`;

  const href = linkFormulator(
    'www',
    'library',
    'bible',
    'study-bible',
    'books',
    adjBookName,
    chapter,
  );

  const link = href + hash;

  return link;
}

export function makeWOLLink(
  bookNumber: number,
  startChapter: number,
  startVerse: number,
  endChapter: number,
  endVerse: number,
) {
  const hash = `#study=discover&v=${bookNumber}:${startChapter}:${startVerse}-${bookNumber}:${endChapter}:${endVerse}`;

  const href = linkFormulator(
    'wol',
    'wol',
    'b',
    'r1',
    'lp-e',
    'nwtsty',
    bookNumber,
    startChapter,
  );

  const link = href + hash;

  return link;
}

export function makeJWLibLink(
  bookNumber: number,
  startChapter: number,
  startVerse: number,
  endChapter: number,
  endVerse: number,
) {
  const locale = translate('links.finderLocale');
  const hasStudyBible = translate('links.hasStudyBible');
  const pub = hasStudyBible ? 'nwtsty' : 'nwt';
  const adjBookNumber = adjustNumber(bookNumber, 2);
  const adjStartChapter = adjustNumber(startChapter);
  const adjEndChapter = adjustNumber(endChapter);
  const adjStartVerse = adjustNumber(startVerse);
  const adjEndVerse = adjustNumber(endVerse);
  const verseSpan = `${adjBookNumber}${adjStartChapter}${adjStartVerse}-${adjBookNumber}${adjEndChapter}${adjEndVerse}`;
  const href = `https://www.jw.org/finder?wtlocale=${locale}&prefer=Lang&bible=${verseSpan}&pub=${pub}&srcid=BibleStudyCompanion`;
  return href;
}

export async function createReadingSections(
  bibleDB: Database,
  startBookNumber: number,
  startChapter: number,
  startVerse: number,
  endBookNumber: number,
  endChapter: number,
  endVerse: number,
) {
  const bibleBookSpan = endBookNumber - startBookNumber + 1;
  const readingSections: InfoSection[] = [];

  let tempStartChapter: number;
  let tempStartVerse: number;
  let tempEndChapter: number;
  let tempEndVerse: number;

  for (let i = 0; i < bibleBookSpan; i++) {
    let bookNumber = startBookNumber + i;
    let readingPortion;

    if (startBookNumber === bookNumber) {
      tempStartChapter = startChapter;
      tempStartVerse = startVerse;
    } else {
      tempStartChapter = 1;
      tempStartVerse = 1;
    }

    if (endBookNumber === bookNumber) {
      tempEndChapter = endChapter;
      tempEndVerse = endVerse;
    } else {
      let {maxChapter, maxVerse} = await queryMaxInfo(bibleDB, bookNumber);
      tempEndChapter = maxChapter;
      tempEndVerse = maxVerse;
    }

    readingPortion =
      translate('bibleBooks.' + bookNumber + '.name') +
      ' ' +
      tempStartChapter +
      ':' +
      tempStartVerse +
      ' - ' +
      tempEndChapter +
      ':' +
      tempEndVerse;

    let section = {
      key: i.toString(),
      bookNumber: bookNumber,
      startChapter: tempStartChapter,
      startVerse: tempStartVerse,
      endChapter: tempEndChapter,
      endVerse: tempEndVerse,
      readingPortion: readingPortion,
    };
    readingSections.push(section);
  }

  return readingSections;
}

export function useReadingInfoPopup() {
  const baseReadingPopup: ReadingPopupState = {
    isDisplayed: false,
    isFinished: false,
    readingPortion: '',
    tableName: '',
    title: '',
    message: '',
    cb: () => {},
    readingDayID: 0,
    startBookNumber: 1,
    startChapter: 1,
    startVerse: 1,
    endBookNumber: 1,
    endChapter: 1,
    endVerse: 1,
  };

  const [readingPopup, setReadingPopup] = useState(baseReadingPopup);

  const closeReadingPopup = useCallback(() => {
    setReadingPopup((prevValue) => {
      return {...prevValue, isDisplayed: false};
    });
  }, []);

  const openReadingPopup = useCallback(
    (
      startBookNumber: number,
      startChapter: number,
      startVerse: number,
      endBookNumber: number,
      endChapter: number,
      endVerse: number,
      readingPortion: string,
      isFinished: boolean,
      readingDayID: number,
      cb: () => void,
      tableName: string,
    ) => {
      setReadingPopup((prevReadingPopup) => ({
        ...prevReadingPopup,
        isDisplayed: true,
        startBookNumber,
        startChapter,
        startVerse,
        endBookNumber,
        endChapter,
        endVerse,
        readingPortion,
        isFinished,
        readingDayID,
        cb,
        tableName,
      }));
    },
    [],
  );

  return {
    openReadingPopup,
    closeReadingPopup,
    readingPopup,
  };
}
