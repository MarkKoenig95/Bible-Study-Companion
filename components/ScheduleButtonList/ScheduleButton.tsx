import React from 'react';

import ScheduleDayButton from '../buttons/ScheduleDayButton';

import {BibleReadingItem} from '../../data/Database/types';
import {OpenReadingInfoPopup} from './types';

interface ScheduleButtonProps {
  closeReadingPopup: () => void;
  completedHidden: boolean;
  firstUnfinishedID: number;
  item: BibleReadingItem;
  onUpdateReadStatus: (
    status: boolean,
    readingDayID: number,
    tableName: string,
    isAfterFirstUnfinished: boolean,
  ) => void;
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

  const isAfterFirstUnfinished = item.ReadingDayID > firstUnfinishedID;

  const onLongPress = () => {
    onUpdateReadStatus(
      !!item.IsFinished,
      item.ReadingDayID,
      tableName,
      isAfterFirstUnfinished,
    );
  };

  let onPress = onLongPress;

  if (item.StartBookNumber) {
    onPress = () => {
      openReadingPopup(
        item.StartBookNumber,
        item.StartChapter,
        item.StartVerse,
        item.EndBookNumber,
        item.EndChapter,
        item.EndVerse,
        item.ReadingPortion,
        !!item.IsFinished,
        item.ReadingDayID,
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
      testID={testID + '.' + item.ReadingPortion}
      readingPortion={item.ReadingPortion}
      completionDate={new Date(item.CompletionDate)}
      completedHidden={completedHidden}
      doesTrack={item.doesTrack}
      isFinished={item.IsFinished ? true : false}
      title={title}
      update={update}
      onLongPress={onLongPress}
      onPress={onPress}
    />
  );
}
