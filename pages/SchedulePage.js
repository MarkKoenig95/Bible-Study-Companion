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

import styles from '../styles/styles';

import {store} from '../data/Store/store.js';
import {openTable} from '../data/Database/generalTransactions';
import {
  deleteSchedule,
  updateReadStatus,
  formatTableName,
} from '../data/Database/scheduleTransactions';
import TextButton from '../components/buttons/TextButton';

const prefix = 'schedulePage.';

function loadData(db, setState, tableName) {
  openTable(db, tableName, function(txn, res) {
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
  const {db} = globalState.state;

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

  const tableName = formatTableName(scheduleName);

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
      loadData(db, setFlatListItems, tableName);
    }, 200);
    return () => clearInterval(interval);
  }, [db, tableName]);

  function onDeleteSchedule() {
    props.navigation.dispatch(StackActions.pop(1));
    deleteSchedule(db, tableName, scheduleName);
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
    bookNumber,
    chapter,
    verse,
    readingPortion,
    isFinished,
    readingDayID,
    cb,
  ) {
    setReadingPopup({
      isDisplayed: true,
      bookNumber: bookNumber,
      chapter: chapter,
      verse: verse,
      readingPortion: readingPortion,
      isFinished: isFinished,
      readingDayID: readingDayID,
      cb: cb,
    });
  }

  function openMessagePopup(message, title) {
    setMessagePopup({isDisplayed: true, message: message, title: title});
  }

  function onUpdateReadStatus(cb, status) {
    updateReadStatus(db, tableName, readingPopup.readingDayID, !status);
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
        bookNumber={readingPopup.bookNumber}
        bookName={readingPopup.bookName}
        chapter={readingPopup.chapter}
        verse={readingPopup.verse}
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
          onPress={() => {
            setCompletedHidden(!completedHidden);
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
                onUpdateReadStatus(cb, item.IsFinished);
              }}
              onPress={cb => {
                openReadingPopup(
                  item.StartBookNumber,
                  item.StartChapter,
                  item.StartVerse,
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
      <View style={styles.footer} />
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
