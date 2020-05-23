import React, {useContext, useState, useEffect} from 'react';
import {StyleSheet, SafeAreaView, View, FlatList} from 'react-native';
import {StackActions} from '@react-navigation/native';

import ScheduleDayButton from '../components/buttons/ScheduleDayButton';
import MessagePopup from '../components/popups/MessagePopup';
import ReadingRemindersPopup from '../components/popups/ReadingRemindersPopup';
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
          let title = 'Warning';
          let message = `Are you sure you want to delete "${scheduleName}" schedule?`;
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

  function closeMessagePopup() {
    setMessagePopup(false);
  }

  function openMessagePopup(message, title) {
    setMessagePopup({isDisplayed: true, message: message, title: title});
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
      <View style={styles.header}>
        <CheckBox
          center
          containerStyle={style.checkBox}
          title="Hide Completed"
          checked={completedHidden}
          textStyle={styles.lightText}
          uncheckedColor={styles.lightText.color}
          onPress={() => {
            setCompletedHidden(!completedHidden);
          }}
        />
        <TextButton
          text="Reading Reminders"
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
              onPress={cb => {
                updateReadStatus(
                  db,
                  tableName,
                  item.ReadingDayID,
                  !item.IsFinished,
                );
                cb(!item.IsFinished);
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
