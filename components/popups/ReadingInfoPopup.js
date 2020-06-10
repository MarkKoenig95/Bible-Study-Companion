import React from 'react';

import {View} from 'react-native';

import Popup from './Popup';
import {Body, SubHeading, Heading} from '../text/Text';
import Link from '../text/Link';
import IconButton from '../buttons/IconButton';

import {translate, linkFormulator} from '../../localization/localization';

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

  const href = makeWOLLink(chapter, verse, bookNumber);

  const prefix = 'readingInfoPopup.';

  return (
    <Popup {...popupProps} title={translate(prefix + 'readingInfo')}>
      <View style={{marginBottom: 20}}>
        <SubHeading>{translate(prefix + 'readingPortion')}:</SubHeading>
        <Link href={href} text={readingPortion} />
      </View>
      <IconButton name="check" onPress={onConfirm} />
    </Popup>
  );
}
