import React from 'react';

import {View} from 'react-native';

import Popup from './Popup';
import {Body, SubHeading, Heading} from '../text/Text';
import Link from '../text/Link';
import IconButton from '../buttons/IconButton';

function adjustNumber(num) {
  let temp = '00' + num;

  temp = temp.slice(-3, temp.length);

  return temp;
}

export default function ReadingInfoPopup(props) {
  const {
    bookNumber,
    bookName,
    chapter,
    verse,
    readingPortion,
    onConfirm,
    popupProps,
  } = props;
  const adjChapter = adjustNumber(chapter);
  const adjVerse = adjustNumber(verse);

  const href = `https://www.jw.org/en/library/bible/study-bible/books/${bookName.toLowerCase()}/${chapter}/#v${bookNumber}${adjChapter}${adjVerse}`;

  return (
    <Popup {...popupProps} title="Reading Info">
      <View style={{marginBottom: 20}}>
        <SubHeading>Reading Portion:</SubHeading>
        <Link href={href} text={readingPortion} />
      </View>
      <IconButton name="check" onPress={onConfirm} />
    </Popup>
  );
}
