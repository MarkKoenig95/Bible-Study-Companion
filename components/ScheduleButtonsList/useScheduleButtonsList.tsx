import {Dispatch, SetStateAction, useCallback} from 'react';
import useScheduleListPopups from './useScheduleListPopups';
import {
  updateMultipleReadStatus,
  updateReadStatus,
} from '../../data/Database/scheduleTransactions';
import {log} from '../../data/Database/generalTransactions';
import {
  onAfterFirstUnfinishedClick,
  setMultipleScheduleButtons,
  setOneScheduleButton,
} from './logic';

import {
  BibleReadingItem,
  Database,
  ReadingItem,
} from '../../data/Database/types';

export default function useScheduleButtonsList(
  userDB: Database,
  afterUpdate: () => void,
  completedHidden: boolean,
  updatePages: number,
  tableName: string,
  scheduleName: string,
  testID: string,
) {
  log('loaded schedule button list');

  const {
    ScheduleListPopups,
    buttonsPopup,
    closeReadingPopup,
    markButtonInPopupComplete,
    openButtonsPopup,
    openReadingPopup,
    openRemindersPopup,
    readingPopup,
  } = useScheduleListPopups(testID);

  const onUpdateReadStatus = useCallback(
    (status, ID, tableName, isAfterFirstUnfinished) => {
      ID = ID || readingPopup.ID;

      const updateOne = () => {
        updateReadStatus(userDB, tableName, ID, !status, afterUpdate);
      };

      const updateMultiple = () => {
        updateMultipleReadStatus(userDB, tableName, ID).then(afterUpdate);
      };

      if (isAfterFirstUnfinished && !status) {
        onAfterFirstUnfinishedClick(updateMultiple, updateOne);
        return;
      }

      updateOne();
    },
    [readingPopup.ID, afterUpdate, userDB],
  );

  const updateButtonReadings = useCallback(
    (tableName, startID, lastID, isFinished) => {
      updateMultipleReadStatus(
        userDB,
        tableName,
        lastID,
        startID,
        !isFinished,
      ).then(afterUpdate);
    },
    [afterUpdate, userDB],
  );

  const setScheduleButtons = useCallback(
    (
      items: ReadingItem[] | BibleReadingItem[],
      index: number,
      firstUnfinishedID: number | undefined = Infinity,
      readingPortionWidth: number = 0,
      setReadingPortionWidth: Dispatch<SetStateAction<number>>,
    ) => {
      let commonArguments = {
        closeReadingPopup,
        completedHidden,
        firstUnfinishedID,
        onUpdateReadStatus,
        openReadingPopup,
        tableName,
        testID,
        scheduleName,
        updatePages,
      };

      if (items.length === 1) {
        return setOneScheduleButton({
          ...commonArguments,
          item: items[0],
          readingPortionWidth,
          setReadingPortionWidth,
        });
      }

      const bibleItems = items as BibleReadingItem[];

      return setMultipleScheduleButtons({
        ...commonArguments,
        buttonsPopup,
        index,
        items: bibleItems,
        markButtonInPopupComplete,
        openButtonsPopup,
        updateButtonReadings,
        readingPortionWidth,
        setReadingPortionWidth,
      });
    },
    [
      closeReadingPopup,
      completedHidden,
      onUpdateReadStatus,
      openReadingPopup,
      tableName,
      testID,
      scheduleName,
      updatePages,
      buttonsPopup,
      markButtonInPopupComplete,
      openButtonsPopup,
      updateButtonReadings,
    ],
  );

  return {
    ScheduleListPopups,
    setScheduleButtons,
    openRemindersPopup,
  };
}
