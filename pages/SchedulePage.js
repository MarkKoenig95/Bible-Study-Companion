import React, {useContext, useState, useEffect} from 'react';
import {StyleSheet, SafeAreaView, View, FlatList} from 'react-native';
import {StackActions} from '@react-navigation/native';

import ScheduleDayButton from '../components/ScheduleDayButton';
import MessagePopup from '../components/MessagePopup';
import IconButton from '../components/IconButton';
import {CheckBox} from 'react-native-elements';

import styles from '../styles/styles';

import {store} from '../data/Store/store.js';
import {openTable} from '../data/Database/generalTransactions';
import {
  deleteSchedule,
  updateReadStatus,
  formatTableName,
} from '../data/Database/scheduleTransactions';

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

  const scheduleName = props.route.params.name;

  const tableName = formatTableName(scheduleName);

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
      <View style={styles.header}>
        <CheckBox
          center
          containerStyle={style.checkBox}
          title="Hide Completed"
          checked={completedHidden}
          textStyle={styles.text}
          uncheckedColor={styles.text.color}
          onPress={() => {
            setCompletedHidden(!completedHidden);
          }}
        />
        <IconButton
          name="delete"
          onPress={() => {
            let title = 'Warning';
            let message = `Are you sure you want to delete "${scheduleName}" schedule?`;
            openMessagePopup(message, title);
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
