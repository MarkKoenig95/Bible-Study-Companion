import React, {useContext, useState, useEffect, useCallback} from 'react';
import {StyleSheet, SafeAreaView, View, FlatList} from 'react-native';
import {StackActions} from '@react-navigation/native';
import {translate} from '../localization/localization';

import ScheduleDayButton from '../components/buttons/ScheduleDayButton';
import MessagePopup, {useMessagePopup} from '../components/popups/MessagePopup';
import ButtonsPopup, {
  useButtonsPopup,
} from '../components/popups/SelectedDayButtonsPopup';
import ReadingRemindersPopup from '../components/popups/ReadingRemindersPopup';
import ReadingInfoPopup, {
  useReadingInfoPopup,
} from '../components/popups/ReadingInfoPopup';
import IconButton from '../components/buttons/IconButton';
import {CheckBox} from 'react-native-elements';

import styles, {colors} from '../styles/styles';

import {store} from '../data/Store/store.js';
import {setUpdatePages} from '../data/Store/actions';
import {loadData} from '../data/Database/generalTransactions';
import {
  deleteSchedule,
  updateReadStatus,
  formatScheduleTableName,
  setHideCompleted,
  getHideCompleted,
} from '../data/Database/scheduleTransactions';
import TextButton from '../components/buttons/TextButton';
import {useOpenPopupFunction, arraysMatch} from '../logic/logic';

const prefix = 'schedulePage.';

function ScheduleButton(props) {
  const {
    item,
    completedHidden,
    update,
    onUpdateReadStatus,
    openReadingPopup,
  } = props;

  return (
    <ScheduleDayButton
      readingPortion={item.ReadingPortion}
      completionDate={item.CompletionDate}
      completedHidden={completedHidden}
      isFinished={item.IsFinished ? true : false}
      update={update}
      onLongPress={cb => {
        onUpdateReadStatus(cb, item.IsFinished, item.ReadingDayID);
      }}
      onPress={cb => {
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
        );
      }}
    />
  );
}

function SchedulePage(props) {
  console.log('loaded schedule page');
  const globalState = useContext(store);
  const {dispatch} = globalState;
  const {userDB, updatePages} = globalState.state;

  const scheduleName = props.route.params.name;
  const scheduleID = props.route.params.id;

  const tableName = formatScheduleTableName(scheduleID);

  const [flatListItems, setFlatListItems] = useState([]);

  const [completedHidden, setCompletedHidden] = useState(false);

  const {
    readingPopup,
    openReadingInfoPopup,
    closeReadingPopup,
  } = useReadingInfoPopup();

  const {
    messagePopup,
    openMessagePopupBase,
    closeMessagePopup,
  } = useMessagePopup();

  const {
    buttonsPopup,
    openButtonsPopupBase,
    closeButtonsPopup,
  } = useButtonsPopup();

  const [isRemindersPopupDisplayed, setIsRemindersPopupDisplayed] = useState(
    false,
  );

  const closePopupFunctions = [
    setIsRemindersPopupDisplayed,
    closeMessagePopup,
    closeReadingPopup,
    closeButtonsPopup,
  ];

  const openReadingPopup = useOpenPopupFunction(
    openReadingInfoPopup,
    closePopupFunctions,
  );

  const openMessagePopup = useOpenPopupFunction(
    openMessagePopupBase,
    closePopupFunctions,
  );

  const openButtonsPopup = useOpenPopupFunction(
    openButtonsPopupBase,
    closePopupFunctions,
  );

  const openRemindersPopup = useOpenPopupFunction(
    setIsRemindersPopupDisplayed,
    closePopupFunctions,
  );

  //Set delete button in nav bar with appropriate onPress attribute
  props.navigation.setOptions({
    headerRight: () => (
      <IconButton
        iconOnly
        invertColor
        onPress={() => {
          let title = translate('warning');
          let message = translate('schedulePage.deleteScheduleMessage', {
            scheduleName: scheduleName,
          });
          openMessagePopup(message, title);
        }}
        name="delete"
      />
    ),
  });

  const afterUpdate = useCallback(() => {
    dispatch(setUpdatePages(updatePages));
  }, [dispatch, updatePages]);

  useEffect(() => {
    loadData(userDB, setFlatListItems, tableName);
  }, [userDB, tableName, setFlatListItems, updatePages]);

  useEffect(() => {
    getHideCompleted(userDB, scheduleName, setCompletedHidden);
  }, [userDB, scheduleName]);

  function onDeleteSchedule() {
    props.navigation.dispatch(StackActions.pop(1));
    deleteSchedule(userDB, tableName, scheduleName).then(() => {
      afterUpdate();
    });
  }

  const onUpdateReadStatus = useCallback(
    (cb, status, readingDayID) => {
      readingDayID = readingDayID || readingPopup.readingDayID;

      updateReadStatus(userDB, tableName, readingDayID, !status, afterUpdate);
      cb(!status);
    },
    [readingPopup, userDB, afterUpdate, tableName],
  );

  const setScheduleButtons = useCallback(
    (items, index) => {
      let result;
      if (items.length === 1) {
        result = (
          <ScheduleButton
            item={items[0]}
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
          openButtonsPopupBase(index, buttons, areButtonsFinished);
        }

        result = (
          <ScheduleDayButton
            readingPortion={readingPortions}
            completionDate={completionDate}
            completedHidden={completedHidden}
            isFinished={isFinished}
            update={updatePages}
            onLongPress={cb => {
              for (let i = 0; i < readingDayIDs.length; i++) {
                onUpdateReadStatus(cb, isFinished, readingDayIDs[i]);
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
      completedHidden,
      updatePages,
      buttonsPopup,
      onUpdateReadStatus,
      openReadingPopup,
      openButtonsPopup,
      openButtonsPopupBase,
    ],
  );

  return (
    <SafeAreaView style={styles.container}>
      <MessagePopup
        displayPopup={messagePopup.isDisplayed}
        title={messagePopup.title}
        message={messagePopup.message}
        onClosePress={closeMessagePopup}
        onConfirm={onDeleteSchedule}
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
      <ReadingInfoPopup
        popupProps={{
          displayPopup: readingPopup.isDisplayed,
          title: readingPopup.title,
          message: readingPopup.message,
          onClosePress: closeReadingPopup,
        }}
        onConfirm={() => {
          onUpdateReadStatus(readingPopup.cb, readingPopup.isFinished);
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
      <View style={styles.header}>
        <CheckBox
          center
          containerStyle={style.checkBox}
          title={translate(prefix + 'hideCompleted')}
          checked={completedHidden}
          textStyle={styles.lightText}
          uncheckedColor={styles.lightText.color}
          checkedColor={colors.darkBlue}
          onPress={() => {
            setHideCompleted(
              userDB,
              scheduleName,
              !completedHidden,
              setCompletedHidden,
            );
          }}
        />
        <TextButton
          text={translate('readingRemindersPopup.readingReminders')}
          onPress={() => {
            openRemindersPopup(true);
          }}
        />
      </View>
      <View style={styles.content}>
        <FlatList
          data={flatListItems}
          keyExtractor={(item, index) => index.toString()}
          renderItem={({item, index}) => {
            return setScheduleButtons(item, index);
          }}
        />
      </View>
    </SafeAreaView>
  );
}

const style = StyleSheet.create({
  checkBox: {
    ...styles.button,
    backgroundColor: 'transparent',
    borderWidth: 0,
  },
});

export default SchedulePage;
