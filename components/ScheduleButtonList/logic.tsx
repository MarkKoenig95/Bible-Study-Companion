import React from 'react';
import {Alert} from 'react-native';

import ScheduleButton from './ScheduleButton';
import ScheduleDayButton from '../buttons/ScheduleDayButton';
import {
  checkReadingPortion,
  checkStartVerse,
} from '../../logic/scheduleCreation';
import {
  arraysMatch,
  VERSE_POSITION,
  WEEKLY_READING_TABLE_NAME,
} from '../../logic/general';
import {translate} from '../../logic/localization/localization';

import {BibleReadingItem, ReadingItem} from '../../data/Database/types';
import {
  ButtonsPopupState,
  OnUpdateReadStatus,
  OpenReadingInfoPopup,
} from './types';

interface setScheduleButtonsArguments {
  closeReadingPopup: () => void;
  completedHidden: boolean;
  firstUnfinishedID: number;
  onUpdateReadStatus: OnUpdateReadStatus;
  openReadingPopup: OpenReadingInfoPopup;
  tableName: string;
  testID: string;
  updatePages: number;
}

interface setOneButtonArgs extends setScheduleButtonsArguments {
  item: ReadingItem | BibleReadingItem;
  scheduleName: string;
}

interface setMultipleButtonsArgs extends setScheduleButtonsArguments {
  buttonsPopup: ButtonsPopupState;
  index: number;
  items: BibleReadingItem[];
  openButtonsPopup: (
    index: number,
    buttons: Element[],
    areButtonsFinished: boolean[],
    readingDayIDs: number[],
  ) => void;
  updateButtonReadings: (
    firstID: number,
    lastID: number,
    isFinished: boolean,
  ) => void;
}

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
  item: BibleReadingItem,
  prevBookNum: number,
) {
  let startBook = item.startBookName;
  let startChapter = item.startChapter;
  let startVerse = item.startVerse;
  let endBook = item.endBookName;
  let endChapter = item.endChapter;
  let endVerse = item.endVerse;
  let portionPrefix;

  if (
    item.startBookNumber === prevBookNum &&
    item.endBookNumber === prevBookNum
  ) {
    portionPrefix = '; ';
    startBook = '';
    endBook = '';
  } else {
    portionPrefix = '\r\n';
    startBook = item.startBookName;
    endBook = item.endBookName;
  }

  let isStart = false;
  let isEnd = false;
  if (item.versePosition !== VERSE_POSITION.MIDDLE) {
    if (
      item.versePosition === VERSE_POSITION.START ||
      item.versePosition === VERSE_POSITION.START_AND_END
    ) {
      isStart = true;
    }
    if (
      item.versePosition === VERSE_POSITION.END ||
      item.versePosition === VERSE_POSITION.START_AND_END
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

export function setOneScheduleButton(args: setOneButtonArgs) {
  const {
    closeReadingPopup,
    completedHidden,
    firstUnfinishedID,
    item,
    onUpdateReadStatus,
    openReadingPopup,
    scheduleName,
    tableName,
    testID,
    updatePages,
  } = args;
  let thisTableName;
  let title;
  let bibleItem = item as BibleReadingItem;

  if (bibleItem.startBookNumber) {
    thisTableName = tableName || item.tableName;
    title = scheduleName || item.title;
    return (
      <ScheduleButton
        testID={testID}
        item={bibleItem}
        firstUnfinishedID={firstUnfinishedID}
        tableName={thisTableName}
        title={title}
        completedHidden={completedHidden}
        update={updatePages}
        onUpdateReadStatus={onUpdateReadStatus}
        openReadingPopup={openReadingPopup}
        closeReadingPopup={closeReadingPopup}
      />
    );
  }

  return (
    <ScheduleDayButton
      testID={testID + '.' + item.readingPortion}
      isFinished={item.isFinished}
      completionDate={item.completionDate}
      completedHidden={item.completedHidden}
      doesTrack={item.doesTrack}
      onLongPress={item.onLongPress}
      onPress={item.onPress}
      readingPortion={item.readingPortion}
      title={item.title}
      update={item.updateValue}
    />
  );
}

export function setMultipleScheduleButtons(args: setMultipleButtonsArgs) {
  const {
    buttonsPopup,
    closeReadingPopup,
    completedHidden,
    firstUnfinishedID,
    index,
    items,
    onUpdateReadStatus,
    openButtonsPopup,
    openReadingPopup,
    tableName,
    testID,
    updateButtonReadings,

    updatePages,
  } = args;
  let buttons: Element[] = [];
  let firstPortion;
  let readingPortions;
  let hiddenPortions;
  let completionDate = new Date();
  let isFinished = false;
  let prevBookNum = 0;
  let startBook = '';
  let startChapter;
  let startVerse;
  let isStart;
  let endBook;
  let endChapter;
  let endVerse;
  let doesTrack = false;
  let thisTableName = '';
  let title = '';
  let scheduleName;
  let readingDayIDs: number[] = [];
  let areButtonsFinished: boolean[] = [];
  // When we go through with chronological like schedules we can determine if 2 sections have the same
  // book and then set the second one to a ; symbol. otherwise we set it to a new line plus the book name
  for (let i = 0; i < items.length; i++) {
    let item = items[i];
    doesTrack = item.doesTrack;
    let tempIsFinished = item.isFinished ? true : false;
    if (i !== 0) {
      hiddenPortions += !tempIsFinished
        ? condenseReadingPortion(item, prevBookNum)
        : '';
      readingPortions += condenseReadingPortion(item, prevBookNum);
    } else {
      thisTableName = tableName || item.tableName;
      isFinished = tempIsFinished;
      title = scheduleName || item.title;
      readingPortions = item.readingPortion;
      firstPortion = item.readingPortion;
      hiddenPortions = !tempIsFinished ? item.readingPortion : '';
      completionDate = item.doesTrack ? completionDate : item.completionDate;
    }
    prevBookNum =
      item.startBookNumber === item.endBookNumber ? item.endBookNumber : 0;

    if (item.tableName === WEEKLY_READING_TABLE_NAME) {
      if (i === 0) {
        startBook = item.startBookName;
        startChapter = item.startChapter;
        startVerse = item.startVerse;
        isStart = checkStartVerse(startBook, startChapter, startVerse);
        firstPortion = item.readingPortion;
      }
      if (i === items.length - 1) {
        endBook = item.endBookName;
        endChapter = item.endChapter;
        endVerse = item.endVerse;
        completionDate = item.completionDate;

        let {description} = checkReadingPortion(
          startBook,
          startChapter,
          startVerse,
          !!isStart,
          endBook,
          endChapter,
          endVerse,
          true,
        );
        readingPortions = description;
        hiddenPortions = description;
      }
    }
    readingDayIDs.push(item.readingDayID);

    isFinished = tempIsFinished && isFinished;

    areButtonsFinished.push(tempIsFinished);

    buttons.push(
      <ScheduleButton
        testID={testID}
        key={JSON.stringify(item)}
        firstUnfinishedID={firstUnfinishedID}
        item={item}
        tableName={thisTableName}
        title={title}
        completedHidden={completedHidden}
        update={updatePages}
        onUpdateReadStatus={onUpdateReadStatus}
        openReadingPopup={openReadingPopup}
        closeReadingPopup={closeReadingPopup}
      />,
    );
  }

  if (
    buttonsPopup.id === index &&
    buttonsPopup.isDisplayed &&
    !arraysMatch(areButtonsFinished, buttonsPopup.areButtonsFinished) &&
    arraysMatch(readingDayIDs, buttonsPopup.readingDayIDs)
  ) {
    openButtonsPopup(index, buttons, areButtonsFinished, readingDayIDs);
  }

  readingPortions = isFinished ? readingPortions : hiddenPortions;

  return (
    <ScheduleDayButton
      testID={testID + '.multiPortionStartingWith.' + firstPortion}
      readingPortion={readingPortions}
      completionDate={new Date(completionDate)}
      completedHidden={completedHidden}
      doesTrack={doesTrack}
      isFinished={isFinished}
      title={title}
      update={updatePages}
      onLongPress={() => {
        let firstID = readingDayIDs[0];
        let lastID = readingDayIDs[readingDayIDs.length - 1];
        let isAfterFirstUnfinished = firstID > firstUnfinishedID;

        if (isAfterFirstUnfinished && !isFinished) {
          onAfterFirstUnfinishedClick(
            () => {
              updateButtonReadings(1, lastID, isFinished);
            },
            () => {
              updateButtonReadings(firstID, lastID, isFinished);
            },
          );
          return;
        }

        updateButtonReadings(firstID, lastID, isFinished);
      }}
      onPress={() => {
        openButtonsPopup(index, buttons, areButtonsFinished, readingDayIDs);
      }}
    />
  );
}
