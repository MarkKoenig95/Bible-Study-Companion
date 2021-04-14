import React, {
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
} from 'react';

import {View} from 'react-native';

import Popup from './Popup';
import {Body, SubHeading} from '../text/Text';
import Link from '../text/Link';
import IconButton from '../buttons/IconButton';

import {
  translate,
  linkFormulator,
  dateFormulator,
} from '../../logic/localization/localization';

import {errorCB} from '../../data/Database/generalTransactions';
import {findMaxChapter} from '../../logic/scheduleCreation';
import {store} from '../../data/Store/store.js';

const blankInfo = {
  id: 0,
  name: '',
  whereWritten: '',
  whenWritten: '',
  timeCovered: '',
};

const items = [blankInfo];

const prefix = 'readingInfoPopup.';

async function loadData(bibleDB, tableName = 'tblBibleBooks') {
  await bibleDB
    .executeSql(`SELECT * FROM ${tableName};`, [])
    .then(([results]) => {
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
    });
}

async function queryMaxInfo(bibleDB, bookNumber) {
  //Set maxChapter
  let maxChapter = findMaxChapter(bookNumber);

  let maxVerse;

  //Use maxChapter to find maxVerse
  await bibleDB
    .executeSql(
      'SELECT MaxVerse FROM qryMaxVerses WHERE BibleBook=? AND Chapter=?;',
      [bookNumber, maxChapter],
    )
    .then(([res]) => {
      maxVerse = res.rows.item(0).MaxVerse;
    })
    .catch(errorCB);

  return {maxChapter: maxChapter, maxVerse: maxVerse};
}

function formatDate(start, startApproxDesc, end, endApproxDesc, bibleBookID) {
  let date;

  if (!start && !end) {
    return '';
  }

  if (
    startApproxDesc &&
    (startApproxDesc !== 'about' &&
      startApproxDesc !== 'after' &&
      startApproxDesc !== 'before')
  ) {
    let startYear = dateFormulator(start);
    let endYear = dateFormulator(end, endApproxDesc);
    date = translate('date.specialCases.' + bibleBookID, {
      startYear: startYear,
      endYear: endYear,
    });

    return date;
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

function adjustNumber(num, decimalPlaces = 3) {
  let temp = '00' + num;
  let decPlaces = 0 - decimalPlaces;

  temp = temp.slice(decPlaces, temp.length);

  return temp;
}

function makeJWORGLink(chapter, verse, bookNumber) {
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

  const result = href + hash;

  return result;
}

function makeWOLLink(
  bookNumber,
  startChapter,
  startVerse,
  endChapter,
  endVerse,
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

  const result = href + hash;

  return result;
}

function makeJWLibLink(
  bookNumber,
  startChapter,
  startVerse,
  endChapter,
  endVerse,
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

function InfoSegment(props) {
  const {info, segment, testID} = props;

  const hasInfo = info[segment] ? true : false;

  return (
    <View>
      {hasInfo && <SubHeading>{translate(prefix + segment)}:</SubHeading>}
      {hasInfo && <Body testID={testID}>{info[segment]}</Body>}
    </View>
  );
}

function ReadingInfoSection(props) {
  const {
    bookNumber,
    startChapter,
    startVerse,
    endChapter,
    endVerse,
    readingPortion,
    testID,
  } = props;

  const href = makeJWLibLink(
    bookNumber,
    startChapter,
    startVerse,
    endChapter,
    endVerse,
  );

  const info = items[bookNumber];

  return (
    <View testID={testID} style={{alignSelf: 'flex-start', margin: 15}}>
      <SubHeading>{translate(prefix + 'readingPortion')}:</SubHeading>
      <Link testID={testID + '.link'} href={href} text={readingPortion} />

      <InfoSegment
        testID={testID + '.whereWritten'}
        segment="whereWritten"
        info={info}
      />

      <InfoSegment
        testID={testID + '.whenWritten'}
        segment="whenWritten"
        info={info}
      />

      <InfoSegment
        testID={testID + '.timeCovered'}
        segment="timeCovered"
        info={info}
      />
    </View>
  );
}

async function createReadingSections(
  bibleDB,
  startBookNumber,
  startChapter,
  startVerse,
  endBookNumber,
  endChapter,
  endVerse,
) {
  const bibleBookSpan = endBookNumber - startBookNumber + 1;
  const readingSections = [];

  let tempStartChapter;
  let tempStartVerse;
  let tempEndChapter;
  let tempEndVerse;

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

export default function ReadingInfoPopup(props) {
  const {onConfirm, popupProps, testID} = props;

  const globalState = useContext(store);
  const {bibleDB} = globalState.state;

  const [readingSections, setReadingSections] = useState([]);
  const mountedRef = useRef(true);

  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (bibleDB) {
      createReadingSections(
        bibleDB,
        props.startBookNumber,
        props.startChapter,
        props.startVerse,
        props.endBookNumber,
        props.endChapter,
        props.endVerse,
      ).then(res => {
        if (mountedRef.current) {
          setReadingSections(res);
        }
      });
    }
  }, [bibleDB, props]);

  useEffect(() => {
    if (bibleDB) {
      loadData(bibleDB);
    }
  }, [bibleDB]);

  return (
    <Popup
      {...popupProps}
      testID={testID}
      title={translate(prefix + 'readingInfo')}>
      {readingSections.map(section => {
        return (
          <ReadingInfoSection
            testID={testID + '.' + section.key}
            key={section.key}
            bookNumber={section.bookNumber}
            startChapter={section.startChapter}
            startVerse={section.startVerse}
            endChapter={section.endChapter}
            endVerse={section.endVerse}
            readingPortion={section.readingPortion}
          />
        );
      })}
      <IconButton
        testID={testID + '.confirmButton'}
        name="check"
        onPress={onConfirm}
      />
    </Popup>
  );
}

export function useReadingInfoPopup() {
  const [readingPopup, setReadingPopup] = useState({
    isDisplayed: false,
    bookNumber: 0,
    chapter: 0,
    verse: 0,
    readingPortion: '',
  });

  const closeReadingPopup = useCallback(() => {
    setReadingPopup(prevValue => {
      return {...prevValue, isDisplayed: false};
    });
  }, []);

  const openReadingPopup = useCallback(
    (
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
    ) => {
      setReadingPopup({
        isDisplayed: true,
        startBookNumber: startBookNumber,
        startChapter: startChapter,
        startVerse: startVerse,
        endBookNumber: endBookNumber,
        endChapter: endChapter,
        endVerse: endVerse,
        readingPortion: readingPortion,
        isFinished: isFinished,
        readingDayID: readingDayID,
        cb: cb,
        tableName: tableName,
      });
    },
    [],
  );

  return {
    openReadingPopup,
    closeReadingPopup,
    readingPopup,
  };
}
