import React, {Dispatch, SetStateAction} from 'react';

import ScheduleDayButton from '../buttons/ScheduleDayButton';

import {BibleReadingItem, ReadingItem} from '../../data/Database/types';
import {OnUpdateReadStatus, OpenReadingInfoPopup} from './types';

export interface ScheduleButtonProps {
  closeReadingPopup: () => void;
  completedHidden: boolean;
  firstUnfinishedID: number;
  item: BibleReadingItem | ReadingItem;
  onUpdateReadStatus: OnUpdateReadStatus;
  openReadingPopup: OpenReadingInfoPopup;
  tableName: string;
  testID: string;
  title: string;
  update: number;
  readingPortionWidth: number;
  setReadingPortionWidth: Dispatch<SetStateAction<number>>;
}

export default function ScheduleButton(props: ScheduleButtonProps) {
  const {
    closeReadingPopup,
    completedHidden,
    firstUnfinishedID,
    item,
    onUpdateReadStatus,
    openReadingPopup,
    tableName,
    testID,
    title,
    update,
    readingPortionWidth,
    setReadingPortionWidth,
  } = props;

  let isDelayed = false;

  const isAfterFirstUnfinished = item.ID > firstUnfinishedID;

  const onLongPress = () => {
    onUpdateReadStatus(
      item.isFinished,
      item.ID,
      tableName,
      isAfterFirstUnfinished,
    );
  };

  let onPress = onLongPress;

  const bibleItem = item as BibleReadingItem;
  if (bibleItem.startBookNumber) {
    isDelayed = true;
    onPress = () => {
      openReadingPopup(
        bibleItem.startBookNumber,
        bibleItem.startChapter,
        bibleItem.startVerse,
        bibleItem.endBookNumber,
        bibleItem.endChapter,
        bibleItem.endVerse,
        bibleItem.readingPortion,
        bibleItem.isFinished,
        bibleItem.ID,
        () => {
          onLongPress();
          closeReadingPopup();
        },
        tableName,
      );
    };
  }

  return (
    <ScheduleDayButton
      testID={testID}
      readingPortion={item.readingPortion}
      completionDate={item.completionDate}
      completedHidden={completedHidden}
      doesTrack={item.doesTrack}
      isDelayed={isDelayed}
      isFinished={item.isFinished ? true : false}
      title={title}
      update={update}
      onLongPress={onLongPress}
      onPress={onPress}
      readingPortionWidth={readingPortionWidth}
      setReadingPortionWidth={setReadingPortionWidth}
    />
  );
}
