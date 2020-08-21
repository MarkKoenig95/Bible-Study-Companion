import React, {useState, useCallback} from 'react';
import {View, SectionList} from 'react-native';

import ScheduleDayButton from './buttons/ScheduleDayButton';
import ButtonsPopup, {useButtonsPopup} from './popups/SelectedDayButtonsPopup';
import ReadingRemindersPopup from './popups/ReadingRemindersPopup';
import ReadingInfoPopup, {useReadingInfoPopup} from './popups/ReadingInfoPopup';
import {
  updateReadStatus,
  VERSE_POSITION,
  checkReadingPortion,
  checkStartVerse,
  WEEKLY_READING_TABLE_NAME,
} from '../data/Database/scheduleTransactions';
import {arraysMatch} from '../logic/logic';
import SectionListHeader from './SectionListHeader';

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
    item,
    completedHidden,
    update,
    onUpdateReadStatus,
    openReadingPopup,
    tableName,
    title,
  } = props;

  const onLongPress = cb => {
    onUpdateReadStatus(cb, item.IsFinished, item.ReadingDayID, tableName);
  };

  let onPress = null;

  if (item.StartBookNumber) {
    onPress = cb => {
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
        cb,
        tableName,
      );
    };
  } else {
    onPress = onLongPress;
  }

  return (
    <ScheduleDayButton
      readingPortion={item.ReadingPortion}
      completionDate={item.CompletionDate}
      completedHidden={completedHidden}
      isFinished={item.IsFinished ? true : false}
      title={title}
      update={update}
      onLongPress={onLongPress}
      onPress={onPress}
    />
  );
}

function useScheduleListPopups(onUpdateReadStatus) {
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
          popupProps={{
            displayPopup: readingPopup.isDisplayed,
            title: readingPopup.title,
            message: readingPopup.message,
            onClosePress: closeReadingPopup,
          }}
          onConfirm={() => {
            onUpdateReadStatus(
              readingPopup.cb,
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
          displayPopup={buttonsPopup.isDisplayed}
          buttons={buttonsPopup.buttons}
          onClosePress={closeButtonsPopup}
        />
        <ReadingRemindersPopup
          displayPopup={isRemindersPopupDisplayed}
          onClosePress={() => {
            setIsRemindersPopupDisplayed(false);
          }}
        />
      </View>
    );
  };

  return {
    ScheduleListPopups: ScheduleListPopups,
    buttonsPopup: buttonsPopup,
    openButtonsPopup: openButtonsPopup,
    readingPopup: readingPopup,
    openReadingPopup: openReadingInfoPopup,
    openRemindersPopup: openRemindersPopup,
  };
}

export default function useScheduleButtonsList(
  userDB,
  afterUpdate,
  completedHidden,
  listItems,
  updatePages,
  tableName,
  scheduleName,
) {
  console.log('loaded schedule page');

  const onUpdateReadStatus = useCallback(
    (cb, status, readingDayID, tableName) => {
      readingDayID = readingDayID || readingPopup.readingDayID;

      updateReadStatus(userDB, tableName, readingDayID, !status, afterUpdate);
      cb(!status);
    },
    [readingPopup, userDB, afterUpdate],
  );

  const {
    ScheduleListPopups,
    buttonsPopup,
    openButtonsPopup,
    readingPopup,
    openReadingPopup,
    openRemindersPopup,
  } = useScheduleListPopups(onUpdateReadStatus);

  const setScheduleButtons = useCallback(
    (items, index) => {
      let result;
      let thisTableName;
      let title;
      if (items.length === 1) {
        let item = items[0];
        if (!item.onPress) {
          thisTableName = tableName || item.tableName;
          title = scheduleName || item.title;
          result = (
            <ScheduleButton
              item={item}
              tableName={thisTableName}
              title={title}
              completedHidden={completedHidden}
              update={updatePages}
              onUpdateReadStatus={onUpdateReadStatus}
              openReadingPopup={openReadingPopup}
            />
          );
        } else {
          result = (
            <ScheduleDayButton
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
        let areButtonsFinished = [];
        let readingDayIDs = [];
        let readingPortions;
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
            readingPortions += condenseReadingPortion(item, prevBookNum);
          } else {
            thisTableName = tableName || item.tableName;
            title = scheduleName || item.title;
            readingPortions = item.ReadingPortion;
            completionDate = item.CompletionDate;
            isFinished = tempIsFinished;
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
            }
            if (i === items.length - 1) {
              endBook = item.EndBookName;
              endChapter = item.EndChapter;
              endVerse = item.EndVerse;

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
            }
          }
          readingDayIDs.push(item.ReadingDayID);

          isFinished = tempIsFinished && isFinished;

          areButtonsFinished.push(tempIsFinished);

          buttons.push(
            <ScheduleButton
              key={Math.random() * 10000 + 'w'}
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
          !arraysMatch(areButtonsFinished, buttonsPopup.areButtonsFinished)
        ) {
          openButtonsPopup(index, buttons, areButtonsFinished);
        }

        result = (
          <ScheduleDayButton
            readingPortion={readingPortions}
            completionDate={completionDate}
            completedHidden={completedHidden}
            isFinished={isFinished}
            title={title}
            update={updatePages}
            onLongPress={cb => {
              for (let i = 0; i < readingDayIDs.length; i++) {
                onUpdateReadStatus(
                  cb,
                  isFinished,
                  readingDayIDs[i],
                  thisTableName,
                );
              }
            }}
            onPress={() => {
              openButtonsPopup(index, buttons, areButtonsFinished);
            }}
          />
        );
      }
      return result;
    },
    [
      buttonsPopup,
      completedHidden,
      onUpdateReadStatus,
      openButtonsPopup,
      openReadingPopup,
      tableName,
      scheduleName,
      updatePages,
    ],
  );

  const ScheduleButtonsList = props => {
    return (
      <SectionList
        sections={listItems}
        keyExtractor={(item, index) => index.toString()}
        renderItem={({item, index}) => {
          return setScheduleButtons(item, index);
        }}
        renderSectionHeader={SectionListHeader}
      />
    );
  };

  return {
    ScheduleButtonsList: ScheduleButtonsList,
    ScheduleListPopups: ScheduleListPopups,
    openRemindersPopup: openRemindersPopup,
  };
}