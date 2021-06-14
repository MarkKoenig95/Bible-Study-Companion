import React from 'react';

import ScheduleDayButton from '../buttons/ScheduleDayButton';

import {BibleReadingItem} from '../../data/Database/types';
import {OnUpdateReadStatus, OpenReadingInfoPopup} from './types';

interface ScheduleButtonProps {
  closeReadingPopup: () => void;
  completedHidden: boolean;
  firstUnfinishedID: number;
  item: BibleReadingItem;
  onUpdateReadStatus: OnUpdateReadStatus;
  openReadingPopup: OpenReadingInfoPopup;
  tableName: string;
  testID: string;
  title: string;
  update: number;
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
  } = props;

  const isAfterFirstUnfinished = item.readingDayID > firstUnfinishedID;

  const onLongPress = () => {
    onUpdateReadStatus(
      item.isFinished,
      item.readingDayID,
      tableName,
      isAfterFirstUnfinished,
    );
  };

  let onPress = onLongPress;

  if (item.startBookNumber) {
    onPress = () => {
      openReadingPopup(
        item.startBookNumber,
        item.startChapter,
        item.startVerse,
        item.endBookNumber,
        item.endChapter,
        item.endVerse,
        item.readingPortion,
        item.isFinished,
        item.readingDayID,
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
      testID={testID + '.' + item.readingPortion}
      readingPortion={item.readingPortion}
      completionDate={item.completionDate}
      completedHidden={completedHidden}
      doesTrack={item.doesTrack}
      isFinished={item.isFinished ? true : false}
      title={title}
      update={update}
      onLongPress={onLongPress}
      onPress={onPress}
    />
  );
}
