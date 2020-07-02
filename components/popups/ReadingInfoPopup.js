import React, {useContext, useEffect} from 'react';

import {View} from 'react-native';

import Popup from './Popup';
import {Body, SubHeading} from '../text/Text';
import Link from '../text/Link';
import IconButton from '../buttons/IconButton';

import {
  translate,
  linkFormulator,
  dateFormulator,
} from '../../localization/localization';

import {openTable} from '../../data/Database/generalTransactions';
import {store} from '../../data/Store/store.js';
import {log} from 'react-native-reanimated';

const blankInfo = {
  id: 0,
  name: '',
  whereWritten: '',
  whenWritten: '',
  timeCovered: '',
};

const items = [blankInfo];

const prefix = 'readingInfoPopup.';

function loadData(bibleDB, tableName = 'tblBibleBooks') {
  openTable(bibleDB, tableName, function(txn, res) {
    txn.executeSql('SELECT * FROM ' + tableName, [], (txn, results) => {
      for (let i = 0; i < results.rows.length; ++i) {
        let item = results.rows.item(i);
        let prefix = 'bibleBooks.' + item.BibleBookID;
        items.push({
          id: item.BibleBookID,
          name: translate(prefix + '.name'),
          whereWritten: translate(prefix + '.whereWritten'),
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
  });
}

async function queryMaxInfo(bibleDB, bookNumber) {
  let maxChapter;
  let maxVerse;

  await bibleDB
    .transaction(txn => {
      txn
        .executeSql('SELECT MaxChapter FROM qryMaxChapters WHERE BibleBook=?', [
          bookNumber,
        ])
        .then((txn, res) => {
          maxChapter = res.rows.item(0).MaxChapter;
          txn
            .executeSql(
              'SELECT MaxChapter FROM qryMaxChapters WHERE BibleBook=? AND Chapter=?',
              [bookNumber, maxChapter],
            )
            .then((txn, res) => {
              maxVerse = res.rows.item(0).MaxVerse;
            });
        });
    })
    .catch(err => {
      console.log(err);
    });

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

function adjustNumber(num) {
  let temp = '00' + num;

  temp = temp.slice(-3, temp.length);

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

function makeWOLLink(chapter, verse, bookNumber) {
  const hash = `#study=discover&v=${bookNumber}:${chapter}:${verse}`;

  const href = linkFormulator(
    'wol',
    'wol',
    'b',
    'r1',
    'lp-e',
    'nwtsty',
    bookNumber,
    chapter,
  );

  const result = href + hash;

  return result;
}

function InfoSegment(props) {
  const {info, segment} = props;

  const hasInfo = info[segment] ? true : false;

  return (
    <View>
      {hasInfo && <SubHeading>{translate(prefix + segment)}:</SubHeading>}
      {hasInfo && <Body>{info[segment]}</Body>}
    </View>
  );
}

function ReadingInfoSection(props) {
  const {chapter, verse, bookNumber, readingPortion} = props;

  const href = makeWOLLink(chapter, verse, bookNumber);

  const info = items[bookNumber];

  return (
    <View style={{marginBottom: 20}}>
      <SubHeading>{translate(prefix + 'readingPortion')}:</SubHeading>
      <Link href={href} text={readingPortion} />

      <InfoSegment segment="whereWritten" info={info} />

      <InfoSegment segment="whenWritten" info={info} />

      <InfoSegment segment="timeCovered" info={info} />
    </View>
  );
}

export default function ReadingInfoPopup(props) {
  const {
    startBookNumber,
    startChapter,
    startVerse,
    endBookNumber,
    endChapter,
    endVerse,
    readingPortion,
    onConfirm,
    popupProps,
  } = props;

  const globalState = useContext(store);
  const {bibleDB} = globalState.state;

  const bibleBookSpan = endBookNumber - startBookNumber + 1;

  const readingSections = [];

  let tempStartChapter = startChapter;
  let tempStartVerse = startVerse;
  let tempEndChapter = endChapter;
  let tempEndVerse = endVerse;

  for (let i = 0; i < bibleBookSpan; i++) {
    let bookNumber = startBookNumber + i;
    let readingPortion;

    if (endBookNumber !== bookNumber) {
      let {maxChapter, maxVerse} = queryMaxInfo(bibleDB, bookNumber);
      tempEndChapter = maxChapter;
      tempEndVerse = maxVerse;
    } else {
      tempEndChapter = endChapter;
      tempEndVerse = endVerse;
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
      bookNumber: bookNumber,
      startChapter: tempEndChapter,
      startVerse: tempStartVerse,
      readingPortion: readingPortion,
    };
    readingSections.push(section);
  }

  useEffect(() => {
    loadData(bibleDB);
  }, [bibleDB]);

  return (
    <Popup {...popupProps} title={translate(prefix + 'readingInfo')}>
      {readingSections.map(section => {
        <ReadingInfoSection
          bookNumber={section.bookNumber}
          chapter={section.chapter}
          verse={section.verse}
          readingPortion={section.readingPortion}
        />;
      })}
      <IconButton name="check" onPress={onConfirm} />
    </Popup>
  );
}
