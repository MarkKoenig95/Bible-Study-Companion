import React, {Dispatch, SetStateAction} from 'react';
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
  readingPortionWidth: number;
  setReadingPortionWidth: Dispatch<SetStateAction<number>>;
}

interface SetOneButtonArgs extends SetScheduleButtonsArgs {
  item: ReadingItem | BibleReadingItem;
}

interface CreateButtonListArgs extends SetScheduleButtonsArgs {
  items: BibleReadingItem[];
  markButtonInPopupComplete: (ID: number) => void;
}

interface SetMultipleButtonsArgs extends SetScheduleButtonsArgs {
  buttonsPopup: ButtonsPopupState;
  index: number;
  items: BibleReadingItem[];
  markButtonInPopupComplete: (ID: number) => void;
  openButtonsPopup: (
    buttons: Element[],
    tableName: string,
    areButtonsFinished: boolean[],
    IDs: number[],
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
    portionPrefix = prevBookNum === 0 ? '' : '\r\n';
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
    readingPortionWidth,
    setReadingPortionWidth,
  } = args;
  let thisTableName;
  let title;

  if (item.type !== 'Reminder') {
    thisTableName = tableName || item.tableName;
    title = scheduleName || item.title;
    return (
      <ScheduleButton
        testID={testID + '.' + item.readingPortion}
        item={item}
        firstUnfinishedID={firstUnfinishedID}
        tableName={thisTableName}
        title={title}
        completedHidden={completedHidden}
        update={updatePages}
        onUpdateReadStatus={onUpdateReadStatus}
        openReadingPopup={openReadingPopup}
        closeReadingPopup={closeReadingPopup}
        readingPortionWidth={readingPortionWidth}
        setReadingPortionWidth={setReadingPortionWidth}
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
      readingPortionWidth={readingPortionWidth}
      setReadingPortionWidth={setReadingPortionWidth}
    />
  );
}

export function createButtonList(args: CreateButtonListArgs) {
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
    readingPortionWidth,
    setReadingPortionWidth,
  } = args;

  const firstItem = items[0];
  const thisTableName = tableName || firstItem.tableName;
  const title = scheduleName || firstItem.title;

  let isFinished = firstItem.isFinished;
  let readingPortions = '';
  let hiddenPortions = '';
  let completionDate = firstItem.completionDate;

  let buttons: Element[] = [];
  let IDs: number[] = [];
  let areButtonsFinished: boolean[] = [];
  let prevUnhiddenBookNumber = 0;
  let prevBookNum = 0;
  let doesTrack = false;

  for (let i = 0; i < items.length; i++) {
    let item = items[i];
    let tempIsFinished = item.isFinished;
    doesTrack = item.doesTrack;

    readingPortions += condenseReadingPortion(item, prevBookNum);

    prevBookNum =
      item.startBookNumber === item.endBookNumber ? item.endBookNumber : 0;

    // When we go through with chronological like schedules we can determine if 2 sections have the same
    // book and then set the second one to a ; symbol. otherwise we set it to a new line plus the book name
    if (!tempIsFinished) {
      hiddenPortions += condenseReadingPortion(item, prevUnhiddenBookNumber);
      prevUnhiddenBookNumber = prevBookNum;
    }

    IDs.push(item.ID);

    isFinished = tempIsFinished && isFinished;

    areButtonsFinished.push(tempIsFinished);

    const onUpdate = (
      ...args: [
        status: boolean,
        ID: number,
        tableName: string,
        isAfterFirstUnfinished: boolean,
      ]
    ) => {
      onUpdateReadStatus(...args);
      markButtonInPopupComplete(item.ID);
    };

    buttons.push({
      testID: testID + '.' + item.readingPortion,
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
      readingPortionWidth,
      setReadingPortionWidth,
    });
  }

  if (firstItem.tableName === WEEKLY_READING_TABLE_NAME) {
    let lastItem = items[items.length - 1];
    let {startBookName} = firstItem;
    let {startBookNumber} = firstItem;
    let {startChapter} = firstItem;
    let {startVerse} = firstItem;
    let isStart = checkStartVerse(startBookNumber, startChapter, startVerse);

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
    IDs,
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
    readingPortionWidth,
    setReadingPortionWidth,
  } = args;

  const {
    areButtonsFinished,
    buttons,
    completionDate,
    doesTrack,
    isFinished,
    IDs,
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
    readingPortionWidth,
    setReadingPortionWidth,
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
        let firstID = IDs[0];
        let lastID = IDs[IDs.length - 1];
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
        openButtonsPopup(buttons, thisTableName, areButtonsFinished, IDs);
      }}
      readingPortionWidth={readingPortionWidth}
      setReadingPortionWidth={setReadingPortionWidth}
    />
  );
}
