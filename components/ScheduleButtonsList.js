import React, {useState, useCallback} from 'react';
import {View} from 'react-native';

import ScheduleDayButton from './buttons/ScheduleDayButton';
import ButtonsPopup, {useButtonsPopup} from './popups/SelectedDayButtonsPopup';
import ReadingRemindersPopup from './popups/ReadingRemindersPopup';
import ReadingInfoPopup, {useReadingInfoPopup} from './popups/ReadingInfoPopup';
import {
  updateReadStatus,
  VERSE_POSITION,
  checkReadingPortion,
  checkStartVerse,
} from '../data/Database/scheduleTransactions';
import {WEEKLY_READING_TABLE_NAME, arraysMatch} from '../logic/logic';

function condenseReadingPortion(item, prevBookNum) {
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

function ScheduleButton(props) {
  const {
    closeReadingPopup,
    completedHidden,
    item,
    onUpdateReadStatus,
    openReadingPopup,
    tableName,
    testID,
    title,
    update,
  } = props;

  const onLongPress = () => {
    onUpdateReadStatus(item.IsFinished, item.ReadingDayID, tableName);
  };

  let onPress = null;

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
        item.IsFinished,
        item.ReadingDayID,
        () => {
          onLongPress();
          closeReadingPopup();
        },
        tableName,
      );
    };
  } else {
    onPress = onLongPress;
  }

  return (
    <ScheduleDayButton
      testID={testID + '.' + item.ReadingPortion}
      readingPortion={item.ReadingPortion}
      completionDate={item.doesTrack && item.CompletionDate}
      completedHidden={completedHidden}
      isFinished={item.IsFinished ? true : false}
      title={title}
      update={update}
      onLongPress={onLongPress}
      onPress={onPress}
    />
  );
}

function useScheduleListPopups(onUpdateReadStatus, testID) {
  const {buttonsPopup, openButtonsPopup, closeButtonsPopup} = useButtonsPopup();

  const [isRemindersPopupDisplayed, setIsRemindersPopupDisplayed] = useState(
    false,
  );

  const openRemindersPopup = () => {
    setIsRemindersPopupDisplayed(true);
  };

  const {
    readingPopup,
    openReadingPopup,
    closeReadingPopup,
  } = useReadingInfoPopup();

  const openReadingInfoPopup = (...args) => {
    closeButtonsPopup();
    openReadingPopup(...args);
  };

  const ScheduleListPopups = props => {
    return (
      <View style={{width: '100%'}}>
        <ReadingInfoPopup
          testID={testID + '.readingInfoPopup'}
          popupProps={{
            displayPopup: readingPopup.isDisplayed,
            title: readingPopup.title,
            message: readingPopup.message,
            onClosePress: closeReadingPopup,
          }}
          onConfirm={() => {
            onUpdateReadStatus(
              readingPopup.isFinished,
              readingPopup.readingDayID,
              readingPopup.tableName,
            );
            closeReadingPopup();
          }}
          startBookNumber={readingPopup.startBookNumber}
          startChapter={readingPopup.startChapter}
          startVerse={readingPopup.startVerse}
          endBookNumber={readingPopup.endBookNumber}
          endChapter={readingPopup.endChapter}
          endVerse={readingPopup.endVerse}
          readingPortion={readingPopup.readingPortion}
        />
        <ButtonsPopup
          testID={testID + '.buttonsPopup'}
          displayPopup={buttonsPopup.isDisplayed}
          buttons={buttonsPopup.buttons}
          onClosePress={closeButtonsPopup}
        />
        <ReadingRemindersPopup
          testID={testID + '.readingRemindersPopup'}
          displayPopup={isRemindersPopupDisplayed}
          onClosePress={() => {
            setIsRemindersPopupDisplayed(false);
          }}
        />
      </View>
    );
  };

  return {
    ScheduleListPopups,
    buttonsPopup,
    openButtonsPopup,
    readingPopup,
    openReadingPopup: openReadingInfoPopup,
    openRemindersPopup,
    closeReadingPopup,
  };
}

export default function useScheduleButtonsList(
  userDB,
  afterUpdate,
  completedHidden,
  updatePages,
  tableName,
  scheduleName,
  testID,
) {
  console.log('loaded schedule page');

  const onUpdateReadStatus = useCallback(
    (status, readingDayID, tableName) => {
      readingDayID = readingDayID || readingPopup.readingDayID;

      updateReadStatus(userDB, tableName, readingDayID, !status, afterUpdate);
    },
    [readingPopup, userDB, afterUpdate],
  );

  const {
    ScheduleListPopups,
    buttonsPopup,
    openButtonsPopup,
    readingPopup,
    openReadingPopup,
    closeReadingPopup,
    openRemindersPopup,
  } = useScheduleListPopups(onUpdateReadStatus, testID);

  const setScheduleButtons = useCallback(
    (items, index) => {
      let result;
      let thisTableName;
      let title;
      let readingDayIDs = [];
      let areButtonsFinished = [];
      if (items.length === 1) {
        let item = items[0];
        if (!item.onPress) {
          thisTableName = tableName || item.tableName;
          title = scheduleName || item.title;
          result = (
            <ScheduleButton
              testID={testID}
              item={item}
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
              onLongPress={item.onLongPress}
              onPress={item.onPress}
              readingPortion={item.readingPortion}
              title={item.title}
              update={item.update}
            />
          );
        }
      } else {
        let buttons = [];
        let firstPortion;
        let readingPortions;
        let hiddenPortions;
        let completionDate;
        let isFinished;
        let prevBookNum = 0;
        let startBook;
        let startChapter;
        let startVerse;
        let isStart;
        let endBook;
        let endChapter;
        let endVerse;
        // When we go through with chronological like schedules we can determine if 2 sections have the same
        //   book and then set the second one to a ; symbol. otherwise we set it to a new line plus the book name
        for (let i = 0; i < items.length; i++) {
          const item = items[i];
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
                isStart,
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
              item={item}
              tableName={thisTableName}
              title={title}
              completedHidden={completedHidden}
              update={updatePages}
              onUpdateReadStatus={onUpdateReadStatus}
              openReadingPopup={openReadingPopup}
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
            isFinished={isFinished}
            title={title}
            update={updatePages}
            onLongPress={cb => {
              for (let i = 0; i < readingDayIDs.length; i++) {
                onUpdateReadStatus(isFinished, readingDayIDs[i], thisTableName);
              }
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
    ],
  );

  return {
    ScheduleListPopups,
    setScheduleButtons,
    openRemindersPopup,
  };
}
