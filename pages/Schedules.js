import React, {useContext, useEffect, useState} from 'react';
import {SafeAreaView, View, FlatList} from 'react-native';

import TextButton from '../components/buttons/TextButton';

import IconButton from '../components/buttons/IconButton';
import CreateSchedulePopup from '../components/popups/CreateSchedulePopup';
import MessagePopup from '../components/popups/MessagePopup';

import styles from '../styles/styles';

import {store} from '../data/Store/store.js';
import {openTable} from '../data/Database/generalTransactions';
import {
  addSchedule,
  createtblSchedules,
} from '../data/Database/scheduleTransactions';

import {translate} from '../localization/localization';

export default function Schedules(props) {
  const navigation = props.navigation;
  const globalState = useContext(store);

  const {dispatch} = globalState;
  const {bibleDB, userDB, qryMaxVerses, tblVerseIndex} = globalState.state;

  const [flatListItems, setFlatListItems] = useState([]);

  const [
    isCreateSchedulePopupDisplayed,
    setIsCreateSchedulePopupDisplayed,
  ] = useState(false);

  const [messagePopup, setMessagePopup] = useState({
    isDisplayed: false,
    message: '',
    title: '',
  });

  //Set delete button in nav bar with appropriate onPress attribute
  props.navigation.setOptions({
    headerRight: () => (
      <IconButton
        iconOnly
        invertColor
        onPress={() => {
          setIsCreateSchedulePopupDisplayed(!isCreateSchedulePopupDisplayed);
        }}
        name="add"
      />
    ),
  });

  useEffect(() => {
    const interval = setInterval(() => {
      loadData();
    }, 200);
    return () => clearInterval(interval);
  });

  function loadData() {
    openTable(userDB, 'tblSchedules', (txn, res) => {
      if (!res.rows.length) {
        txn.executeSql('DROP TABLE IF EXISTS tblSchedules', []);
        createtblSchedules(txn);
      }
      txn.executeSql('SELECT * FROM tblSchedules', [], (txn, results) => {
        var temp = [];

        for (let i = 0; i < results.rows.length; ++i) {
          temp.push(results.rows.item(i));
        }
        setFlatListItems(temp);
      });
    });
  }

  function onAddSchedule(scheduleName, duration, bookId, chapter, verse) {
    addSchedule(
      userDB,
      bibleDB,
      scheduleName,
      duration,
      bookId,
      chapter,
      verse,
      tblVerseIndex,
      qryMaxVerses,
      () => {
        setIsCreateSchedulePopupDisplayed(false);
      },
      openMessagePopup,
    );
  }

  function openMessagePopup(thisMessage, thisTitle) {
    let message = thisMessage.message || thisMessage;
    let title = thisTitle || translate('warning');

    setMessagePopup({isDisplayed: true, message: message, title: title});
  }

  function closeMessagePopup() {
    setMessagePopup(prevValue => {
      return {...prevValue, isDisplayed: false};
    });
  }

  return (
    <SafeAreaView style={styles.container}>
      <MessagePopup
        displayPopup={messagePopup.isDisplayed}
        title={messagePopup.title}
        message={messagePopup.message}
        onClosePress={closeMessagePopup}
      />
      <CreateSchedulePopup
        displayPopup={isCreateSchedulePopupDisplayed}
        onAdd={onAddSchedule}
        onClosePress={() => {
          setIsCreateSchedulePopupDisplayed(false);
        }}
        onError={(message, title) => openMessagePopup(message, title)}
      />
      <View style={styles.content}>
        <FlatList
          data={flatListItems}
          keyExtractor={(item, index) => index.toString()}
          renderItem={({item}) => (
            <TextButton
              key={item.ScheduleID}
              text={item.ScheduleName}
              onPress={() =>
                navigation.navigate('SchedulePage', {
                  id: item.ScheduleID,
                  title: item.ScheduleName,
                  name: item.ScheduleName,
                })
              }
            />
          )}
        />
        <IconButton
          buttonStyle={{alignSelf: 'center'}}
          onPress={() => {
            setIsCreateSchedulePopupDisplayed(!isCreateSchedulePopupDisplayed);
          }}
          name="add"
        />
      </View>
    </SafeAreaView>
  );
}
