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

const blankInfo = {
  id: 0,
  name: '',
  whereWritten: '',
  whenWritten: '',
  timeCovered: '',
};

const items = [blankInfo];

function loadData(db, tableName = 'tblBibleBooks') {
  openTable(db, tableName, function(txn, res) {
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

export default function ReadingInfoPopup(props) {
  const {
    bookNumber,
    chapter,
    verse,
    readingPortion,
    onConfirm,
    popupProps,
  } = props;

  const globalState = useContext(store);
  const {db} = globalState.state;

  useEffect(() => {
    loadData(db);
  }, [db]);

  const href = makeWOLLink(chapter, verse, bookNumber);

  const prefix = 'readingInfoPopup.';

  const info = items[bookNumber];

  return (
    <Popup {...popupProps} title={translate(prefix + 'readingInfo')}>
      <View style={{marginBottom: 20}}>
        <SubHeading>{translate(prefix + 'readingPortion')}:</SubHeading>
        <Link href={href} text={readingPortion} />

        <SubHeading>{translate(prefix + 'whereWritten')}:</SubHeading>
        <Body>{info.whereWritten}</Body>

        <SubHeading>{translate(prefix + 'whenWritten')}:</SubHeading>
        <Body>{info.whenWritten}</Body>

        <SubHeading>{translate(prefix + 'timeCovered')}:</SubHeading>
        <Body>{info.timeCovered}</Body>
      </View>
      <IconButton name="check" onPress={onConfirm} />
    </Popup>
  );
}
