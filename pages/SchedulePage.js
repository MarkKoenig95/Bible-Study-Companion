import React, {useContext, useState, useEffect} from 'react';
import {StyleSheet, SafeAreaView, View, FlatList} from 'react-native';
import {StackActions} from '@react-navigation/native';
import {translate} from '../localization/localization';

import ScheduleDayButton from '../components/buttons/ScheduleDayButton';
import MessagePopup from '../components/popups/MessagePopup';
import ReadingRemindersPopup from '../components/popups/ReadingRemindersPopup';
import ReadingInfoPopup from '../components/popups/ReadingInfoPopup';
import IconButton from '../components/buttons/IconButton';
import {CheckBox} from 'react-native-elements';

import styles, {colors} from '../styles/styles';

import {store} from '../data/Store/store.js';
import {openTable} from '../data/Database/generalTransactions';
import {
  deleteSchedule,
  updateReadStatus,
  formatScheduleTableName,
  setHideCompleted,
  getHideCompleted,
} from '../data/Database/scheduleTransactions';
import TextButton from '../components/buttons/TextButton';

const prefix = 'schedulePage.';

function loadData(userDB, setState, tableName) {
  openTable(userDB, tableName, function(txn, res) {
    txn.executeSql('SELECT * FROM ' + tableName, [], (txn, results) => {
      var temp = [];

      for (let i = 0; i < results.rows.length; ++i) {
        temp.push(results.rows.item(i));
      }

      setState(temp);
    });
  });
}

function SchedulePage(props) {
  const globalState = useContext(store);
  const {userDB} = globalState.state;

  const [flatListItems, setFlatListItems] = useState([]);

  const [completedHidden, setCompletedHidden] = useState(false);

  const [messagePopup, setMessagePopup] = useState({
    isDisplayed: false,
    message: '',
    title: '',
  });

  const [readingPopup, setReadingPopup] = useState({
    isDisplayed: false,
    bookNumber: 0,
    chapter: 0,
    verse: 0,
    readingPortion: '',
  });

  const [isRemindersPopupDisplayed, setIsRemindersPopupDisplayed] = useState(
    false,
  );

  const scheduleName = props.route.params.name;
  const scheduleID = props.route.params.id;

  const tableName = formatScheduleTableName(scheduleID);

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

  useEffect(() => {
    const interval = setInterval(() => {
      loadData(userDB, setFlatListItems, tableName);
    }, 200);
    return () => clearInterval(interval);
  }, [userDB, tableName, scheduleName]);

  useEffect(() => {
    getHideCompleted(userDB, scheduleName, setCompletedHidden);
  }, [userDB, scheduleName]);

  function onDeleteSchedule() {
    props.navigation.dispatch(StackActions.pop(1));
    deleteSchedule(userDB, tableName, scheduleName);
  }

  function closeMessagePopup() {
    setMessagePopup(prevValue => {
      return {...prevValue, isDisplayed: false};
    });
  }

  function closeReadingPopup() {
    setReadingPopup(prevValue => {
      return {...prevValue, isDisplayed: false};
    });
  }

  function openReadingPopup(
    startBookNumber,
    startChapter,
    startVerse,
    endBookNumber,
    endChapter,
    endVerse,
    readingPortion,
    isFinished,
    readingDayID,
    cb,
  ) {
    setReadingPopup({
      isDisplayed: true,
      startBookNumber: startBookNumber,
      startChapter: startChapter,
      startVerse: startVerse,
      endBookNumber: endBookNumber,
      endChapter: endChapter,
      endVerse: endVerse,
      readingPortion: readingPortion,
      isFinished: isFinished,
      readingDayID: readingDayID,
      cb: cb,
    });
  }

  function openMessagePopup(message, title) {
    setMessagePopup({isDisplayed: true, message: message, title: title});
  }

  function onUpdateReadStatus(cb, status, readingDayID) {
    readingDayID = readingDayID || readingPopup.readingDayID;

    updateReadStatus(userDB, tableName, readingDayID, !status);
    cb(!status);
  }

  return (
    <SafeAreaView style={styles.container}>
      <MessagePopup
        displayPopup={messagePopup.isDisplayed}
        title={messagePopup.title}
        message={messagePopup.message}
        onClosePress={closeMessagePopup}
        onConfirm={onDeleteSchedule}
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
          text={translate(prefix + 'readingReminders')}
          onPress={() => {
            setIsRemindersPopupDisplayed(true);
          }}
        />
      </View>
      <View style={styles.content}>
        <FlatList
          data={flatListItems}
          keyExtractor={(item, index) => index.toString()}
          renderItem={({item}) => (
            <ScheduleDayButton
              key={item.ReadingDayID}
              readingPortion={item.ReadingPortion}
              completionDate={item.CompletionDate}
              completedHidden={completedHidden}
              isFinished={item.IsFinished ? true : false}
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
          )}
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
