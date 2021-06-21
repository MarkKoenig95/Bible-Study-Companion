import React from 'react';
import {Alert} from 'react-native';

import ScheduleButton from './ScheduleButton';
import ScheduleDayButton from '../buttons/ScheduleDayButton';
import {
  checkReadingPortion,
  checkStartVerse,
} from '../../logic/scheduleCreation';
import {VERSE_POSITION, WEEKLY_READING_TABLE_NAME} from '../../logic/general';
import {translate} from '../../logic/localization/localization';

import {BibleReadingItem, ReadingItem} from '../../data/Database/types';
import {
  ButtonsPopupState,
  OnUpdateReadStatus,
  OpenReadingInfoPopup,
} from './types';

interface SetScheduleButtonsArgs {
  closeReadingPopup: () => void;
  completedHidden: boolean;
  firstUnfinishedID: number;
  onUpdateReadStatus: OnUpdateReadStatus;
  openReadingPopup: OpenReadingInfoPopup;
  scheduleName: string;
  tableName: string;
  testID: string;
  updatePages: number;
}

interface SetOneButtonArgs extends SetScheduleButtonsArgs {
  item: ReadingItem | BibleReadingItem;
}

interface CreateButtonListArgs extends SetScheduleButtonsArgs {
  items: BibleReadingItem[];
  markButtonInPopupComplete: (
    readingDayID: number,
    completedHidden: boolean,
  ) => void;
}

interface SetMultipleButtonsArgs extends SetScheduleButtonsArgs {
  buttonsPopup: ButtonsPopupState;
  index: number;
  items: BibleReadingItem[];
  markButtonInPopupComplete: (
    readingDayID: number,
    completedHidden: boolean,
  ) => void;
  openButtonsPopup: (
    buttons: Element[],
    tableName: string,
    areButtonsFinished: boolean[],
    readingDayIDs: number[],
  ) => void;
  updateButtonReadings: (
    tableName: string,
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

export function setOneScheduleButton(args: SetOneButtonArgs) {
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

function createButtonList(args: CreateButtonListArgs) {
  const {
    closeReadingPopup,
    completedHidden,
    firstUnfinishedID,
    items,
    markButtonInPopupComplete,
    onUpdateReadStatus,
    openReadingPopup,
    scheduleName,
    tableName,
    testID,
    updatePages,
  } = args;

  const firstItem = items[0];
  const thisTableName = tableName || firstItem.tableName;
  const title = scheduleName || firstItem.title;

  let isFinished = firstItem.isFinished;
  let readingPortions = firstItem.readingPortion;
  let hiddenPortions = !firstItem.isFinished ? firstItem.readingPortion : '';
  let completionDate = firstItem.completionDate;

  let buttons: Element[] = [];
  let readingDayIDs: number[] = [];
  let areButtonsFinished: boolean[] = [];
  let prevBookNum = 0;
  let doesTrack = false;

  for (let i = 0; i < items.length; i++) {
    let item = items[i];
    let tempIsFinished = item.isFinished;
    doesTrack = item.doesTrack;

    if (i !== 0) {
      // When we go through with chronological like schedules we can determine if 2 sections have the same
      // book and then set the second one to a ; symbol. otherwise we set it to a new line plus the book name
      hiddenPortions += !tempIsFinished
        ? condenseReadingPortion(item, prevBookNum)
        : '';
      readingPortions += condenseReadingPortion(item, prevBookNum);
    }
    prevBookNum =
      item.startBookNumber === item.endBookNumber ? item.endBookNumber : 0;

    readingDayIDs.push(item.readingDayID);

    isFinished = tempIsFinished && isFinished;

    areButtonsFinished.push(tempIsFinished);

    const onUpdate = (
      ...args: [
        status: boolean,
        readingDayID: number,
        tableName: string,
        isAfterFirstUnfinished: boolean,
      ]
    ) => {
      onUpdateReadStatus(...args);
      markButtonInPopupComplete(item.readingDayID, completedHidden);
    };

    buttons.push({
      testID: testID + item.readingPortion,
      key: JSON.stringify(item),
      firstUnfinishedID: firstUnfinishedID,
      item: item,
      tableName: thisTableName,
      title: title,
      completedHidden: completedHidden,
      update: updatePages,
      onUpdateReadStatus: onUpdate,
      openReadingPopup: openReadingPopup,
      closeReadingPopup: closeReadingPopup,
    });
  }

  if (firstItem.tableName === WEEKLY_READING_TABLE_NAME) {
    let lastItem = items[items.length - 1];
    let {startBookName} = firstItem;
    let {startChapter} = firstItem;
    let {startVerse} = firstItem;
    let isStart = checkStartVerse(startBookName, startChapter, startVerse);

    let {description} = checkReadingPortion(
      startBookName,
      startChapter,
      startVerse,
      isStart,
      lastItem.endBookName,
      lastItem.endChapter,
      lastItem.endVerse,
      true,
    );

    readingPortions = description;
    hiddenPortions = description;
    completionDate = lastItem.completionDate;
  }

  readingPortions = isFinished ? readingPortions : hiddenPortions;

  return {
    areButtonsFinished,
    buttons,
    completionDate,
    doesTrack,
    isFinished,
    readingDayIDs,
    readingPortions,
    thisTableName,
    title,
  };
}

export function setMultipleScheduleButtons(args: SetMultipleButtonsArgs) {
  const {
    closeReadingPopup,
    completedHidden,
    firstUnfinishedID,
    items,
    markButtonInPopupComplete,
    onUpdateReadStatus,
    openButtonsPopup,
    openReadingPopup,
    scheduleName,
    tableName,
    testID,
    updateButtonReadings,
    updatePages,
  } = args;

  const {
    areButtonsFinished,
    buttons,
    completionDate,
    doesTrack,
    isFinished,
    readingDayIDs,
    readingPortions,
    thisTableName,
    title,
  } = createButtonList({
    closeReadingPopup,
    completedHidden,
    firstUnfinishedID,
    items,
    markButtonInPopupComplete,
    onUpdateReadStatus,
    openReadingPopup,
    scheduleName,
    tableName,
    testID,
    updatePages,
  });

  const firstPortion = items[0].readingPortion;

  return (
    <ScheduleDayButton
      testID={testID + '.multiPortionStartingWith.' + firstPortion}
      readingPortion={readingPortions}
      completionDate={completionDate}
      completedHidden={completedHidden}
      doesTrack={doesTrack}
      isDelayed
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
              updateButtonReadings(thisTableName, 1, lastID, isFinished);
            },
            () => {
              updateButtonReadings(thisTableName, firstID, lastID, isFinished);
            },
          );
          return;
        }

        updateButtonReadings(thisTableName, firstID, lastID, isFinished);
      }}
      onPress={() => {
        openButtonsPopup(
          buttons,
          thisTableName,
          areButtonsFinished,
          readingDayIDs,
        );
      }}
    />
  );
}
