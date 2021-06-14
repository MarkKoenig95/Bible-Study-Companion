import React, {useCallback} from 'react';

import ScheduleDayButton from '../buttons/ScheduleDayButton';
import ScheduleButton from './ScheduleButton';
import useScheduleListPopups from './useScheduleListPopups';
import {
  updateMultipleReadStatus,
  updateReadStatus,
} from '../../data/Database/scheduleTransactions';
import {
  checkReadingPortion,
  checkStartVerse,
} from '../../logic/scheduleCreation';
import {arraysMatch, WEEKLY_READING_TABLE_NAME} from '../../logic/general';
import {log} from '../../data/Database/generalTransactions';
import {condenseReadingPortion, onAfterFirstUnfinishedClick} from './logic';

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
    openButtonsPopup,
    readingPopup,
    openReadingPopup,
    closeReadingPopup,
    openRemindersPopup,
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
    [readingPopup, userDB, afterUpdate],
  );

  const updateButtonReadings = useCallback(
    (startID, lastID, isFinished) => {
      updateMultipleReadStatus(
        userDB,
        tableName,
        lastID,
        startID,
        !isFinished,
      ).then(afterUpdate);
    },
    [afterUpdate, tableName, userDB],
  );

  const setScheduleButtons = useCallback(
    (items, index, firstUnfinishedID = Infinity) => {
      let result;
      let thisTableName;
      let title;
      let readingDayIDs: number[] = [];
      let areButtonsFinished: boolean[] = [];
      if (items.length === 1) {
        let item = items[0];
        if (!item.onPress) {
          thisTableName = tableName || item.tableName;
          title = scheduleName || item.title;
          result = (
            <ScheduleButton
              testID={testID}
              item={item}
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
        } else {
          result = (
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
              update={item.update}
            />
          );
        }
      } else {
        let buttons: Element[] = [];
        let firstPortion;
        let readingPortions;
        let hiddenPortions;
        let completionDate;
        let isFinished = false;
        let prevBookNum = 0;
        let startBook;
        let startChapter;
        let startVerse;
        let isStart;
        let endBook;
        let endChapter;
        let endVerse;
        let doesTrack;
        // When we go through with chronological like schedules we can determine if 2 sections have the same
        // book and then set the second one to a ; symbol. otherwise we set it to a new line plus the book name
        for (let i = 0; i < items.length; i++) {
          let item = items[i];
          doesTrack = item.doesTrack;
          let tempIsFinished = item.IsFinished ? true : false;
          if (i !== 0) {
            hiddenPortions += !tempIsFinished
              ? condenseReadingPortion(item, prevBookNum)
              : '';
            readingPortions += condenseReadingPortion(item, prevBookNum);
          } else {
            thisTableName = tableName || item.tableName;
            isFinished = tempIsFinished;
            title = scheduleName || item.title;
            readingPortions = item.ReadingPortion;
            firstPortion = item.ReadingPortion;
            hiddenPortions = !tempIsFinished ? item.ReadingPortion : '';
            completionDate = item.doesTrack && item.CompletionDate;
          }
          prevBookNum =
            item.StartBookNumber === item.EndBookNumber
              ? item.EndBookNumber
              : 0;

          if (item.tableName === WEEKLY_READING_TABLE_NAME) {
            if (i === 0) {
              startBook = item.StartBookName;
              startChapter = item.StartChapter;
              startVerse = item.StartVerse;
              isStart = checkStartVerse(startBook, startChapter, startVerse);
              firstPortion = item.ReadingPortion;
            }
            if (i === items.length - 1) {
              endBook = item.EndBookName;
              endChapter = item.EndChapter;
              endVerse = item.EndVerse;
              completionDate = item.CompletionDate;

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
          readingDayIDs.push(item.ReadingDayID);

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

        result = (
          <ScheduleDayButton
            testID={testID + '.multiPortionStartingWith.' + firstPortion}
            readingPortion={readingPortions}
            completionDate={completionDate}
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
              openButtonsPopup(
                index,
                buttons,
                areButtonsFinished,
                readingDayIDs,
              );
            }}
          />
        );
      }
      return result;
    },
    [
      tableName,
      scheduleName,
      testID,
      completedHidden,
      updatePages,
      onUpdateReadStatus,
      openReadingPopup,
      closeReadingPopup,
      buttonsPopup.id,
      buttonsPopup.isDisplayed,
      buttonsPopup.areButtonsFinished,
      buttonsPopup.readingDayIDs,
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
