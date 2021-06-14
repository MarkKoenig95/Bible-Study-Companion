import {Alert} from 'react-native';

import {checkReadingPortion} from '../../logic/scheduleCreation';
import {VERSE_POSITION} from '../../logic/general';
import {translate} from '../../logic/localization/localization';

import {BibleReadingScheduleItem} from '../../data/Database/types';

export function onAfterFirstUnfinishedClick(
  onOkPress: () => void,
  onCancelPress = () => {},
) {
  Alert.alert(
    translate('prompts.markCompleted'),
    translate('prompts.markPreviousRead'),
    [
      {
        text: translate('actions.cancel'),
        onPress: onCancelPress,
        style: 'cancel',
      },
      {text: translate('actions.ok'), onPress: onOkPress},
    ],
  );
}

export function condenseReadingPortion(
  item: BibleReadingScheduleItem,
  prevBookNum: number,
) {
  let startBook = item.StartBookName;
  let startChapter = item.StartChapter;
  let startVerse = item.StartVerse;
  let endBook = item.EndBookName;
  let endChapter = item.EndChapter;
  let endVerse = item.EndVerse;
  let portionPrefix;

  if (
    item.StartBookNumber === prevBookNum &&
    item.EndBookNumber === prevBookNum
  ) {
    portionPrefix = '; ';
    startBook = '';
    endBook = '';
  } else {
    portionPrefix = '\r\n';
    startBook = item.StartBookName;
    endBook = item.EndBookName;
  }

  let isStart = false;
  let isEnd = false;
  if (item.VersePosition !== VERSE_POSITION.MIDDLE) {
    if (
      item.VersePosition === VERSE_POSITION.START ||
      item.VersePosition === VERSE_POSITION.START_AND_END
    ) {
      isStart = true;
    }
    if (
      item.VersePosition === VERSE_POSITION.END ||
      item.VersePosition === VERSE_POSITION.START_AND_END
    ) {
      isEnd = true;
    }
  }

  let {description} = checkReadingPortion(
    startBook,
    startChapter,
    startVerse,
    isStart,
    endBook,
    endChapter,
    endVerse,
    isEnd,
  );

  return portionPrefix + description;
}
