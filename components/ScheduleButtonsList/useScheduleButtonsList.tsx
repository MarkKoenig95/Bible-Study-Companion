import {useCallback} from 'react';
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

import {Database} from '../../data/Database/types';

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
    openButtonsPopup,
    openReadingPopup,
    openRemindersPopup,
    readingPopup,
  } = useScheduleListPopups(testID);

  const onUpdateReadStatus = useCallback(
    (status, readingDayID, tableName, isAfterFirstUnfinished) => {
      readingDayID = readingDayID || readingPopup.readingDayID;

      const updateOne = () => {
        updateReadStatus(userDB, tableName, readingDayID, !status, afterUpdate);
      };

      const updateMultiple = () => {
        updateMultipleReadStatus(userDB, tableName, readingDayID).then(
          afterUpdate,
        );
      };

      if (isAfterFirstUnfinished && !status) {
        onAfterFirstUnfinishedClick(updateMultiple, updateOne);
        return;
      }

      updateOne();
    },
    [readingPopup.readingDayID, afterUpdate, userDB],
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
    (items, index, firstUnfinishedID: number | undefined = Infinity) => {
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
        });
      }

      return setMultipleScheduleButtons({
        ...commonArguments,
        buttonsPopup,
        index,
        items,
        openButtonsPopup,
        updateButtonReadings,
      });
    },
    [
      buttonsPopup,
      closeReadingPopup,
      completedHidden,
      onUpdateReadStatus,
      openButtonsPopup,
      openReadingPopup,
      tableName,
      testID,
      updateButtonReadings,
      updatePages,
      scheduleName,
    ],
  );

  return {
    ScheduleListPopups,
    setScheduleButtons,
    openRemindersPopup,
  };
}
