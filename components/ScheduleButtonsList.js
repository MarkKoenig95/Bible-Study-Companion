import React, {useState, useCallback} from 'react';
import {View, FlatList} from 'react-native';

import ScheduleDayButton from './buttons/ScheduleDayButton';
import ButtonsPopup, {useButtonsPopup} from './popups/SelectedDayButtonsPopup';
import ReadingRemindersPopup from './popups/ReadingRemindersPopup';
import ReadingInfoPopup, {useReadingInfoPopup} from './popups/ReadingInfoPopup';
import {updateReadStatus} from '../data/Database/scheduleTransactions';
import {arraysMatch} from '../logic/logic';

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
  const {
    readingPopup,
    openReadingPopup,
    closeReadingPopup,
  } = useReadingInfoPopup();

  const {buttonsPopup, openButtonsPopup, closeButtonsPopup} = useButtonsPopup();

  const [isRemindersPopupDisplayed, setIsRemindersPopupDisplayed] = useState(
    false,
  );

  const openRemindersPopup = () => {
    setIsRemindersPopupDisplayed(true);
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
    openReadingPopup: openReadingPopup,
    openRemindersPopup: openRemindersPopup,
  };
}

export default function useScheduleButtonsList(
  userDB,
  afterUpdate,
  completedHidden,
  flatListItems,
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
        thisTableName = tableName || items[0].tableName;
        title = scheduleName || items[0].title;
        result = (
          <ScheduleButton
            item={items[0]}
            tableName={thisTableName}
            title={title}
            completedHidden={completedHidden}
            update={updatePages}
            onUpdateReadStatus={onUpdateReadStatus}
            openReadingPopup={openReadingPopup}
          />
        );
      } else {
        let buttons = [];
        let areButtonsFinished = [];
        let readingDayIDs = [];
        let readingPortions;
        let completionDate;
        let isFinished;
        for (let i = 0; i < items.length; i++) {
          const item = items[i];
          let tempIsFinished = item.IsFinished ? true : false;
          if (readingPortions) {
            readingPortions += '\r\n' + item.ReadingPortion;
          } else {
            thisTableName = tableName || item.tableName;
            title = scheduleName || item.title;
            readingPortions = item.ReadingPortion;
            completionDate = item.CompletionDate;
            isFinished = tempIsFinished;
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
    const {ListHeaderComponent} = props;
    return (
      <FlatList
        data={flatListItems}
        keyExtractor={(item, index) => index.toString()}
        ListHeaderComponent={ListHeaderComponent}
        renderItem={({item, index}) => {
          return setScheduleButtons(item, index);
        }}
      />
    );
  };

  return {
    ScheduleButtonsList: ScheduleButtonsList,
    ScheduleListPopups: ScheduleListPopups,
    openRemindersPopup: openRemindersPopup,
  };
}
