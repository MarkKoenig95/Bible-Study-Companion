import React, {useContext, useState, useEffect} from 'react';
import {StyleSheet, SafeAreaView, View} from 'react-native';
import {StackActions} from '@react-navigation/native';
import {translate} from '../logic/localization/localization';

import MessagePopup, {useMessagePopup} from '../components/popups/MessagePopup';
import IconButton from '../components/buttons/IconButton';
import {CheckBox} from 'react-native-elements';

import styles, {colors} from '../styles/styles';

import {store} from '../data/Store/store.js';
import {loadData} from '../data/Database/generalTransactions';
import {
  deleteSchedule,
  formatScheduleTableName,
  setHideCompleted,
  getHideCompleted,
  WEEKLY_READING_TABLE_NAME,
} from '../data/Database/scheduleTransactions';
import TextButton from '../components/buttons/TextButton';
import {useUpdate} from '../logic/logic';
import useScheduleButtonsList from '../components/ScheduleButtonsList';

const prefix = 'schedulePage.';

function SchedulePage(props) {
  console.log('loaded schedule page');
  const globalState = useContext(store);
  const {dispatch} = globalState;
  const {userDB, updatePages} = globalState.state;

  const scheduleName = props.route.params.name;
  const scheduleID = props.route.params.id;

  const tableName =
    scheduleName !== translate('reminders.weeklyReading')
      ? formatScheduleTableName(scheduleID)
      : WEEKLY_READING_TABLE_NAME;

  const [listItems, setListItems] = useState([]);

  const [completedHidden, setCompletedHidden] = useState(false);

  const {messagePopup, openMessagePopup, closeMessagePopup} = useMessagePopup();

  const afterUpdate = useUpdate(updatePages, dispatch);

  const {
    ScheduleButtonsList,
    ScheduleListPopups,
    openRemindersPopup,
  } = useScheduleButtonsList(
    userDB,
    afterUpdate,
    completedHidden,
    listItems,
    updatePages,
    tableName,
    scheduleName,
  );

  //Set delete button in nav bar with appropriate onPress attribute
  props.navigation.setOptions({
    headerRight: () => {
      if (tableName !== WEEKLY_READING_TABLE_NAME) {
        return (
          <IconButton
            iconOnly
            invertColor
            onPress={() => {
              let title = translate('warning');
              let message = translate('schedulePage.deleteScheduleMessage', {
                scheduleName: scheduleName,
              });
              let onConfirm = onDeleteSchedule;

              openMessagePopup(message, title, onConfirm);
            }}
            name="delete"
          />
        );
      }
    },
  });

  useEffect(() => {
    loadData(userDB, tableName).then(res => {
      if (res) {
        setListItems(res);
      }
    });
  }, [userDB, tableName, setListItems, updatePages]);

  useEffect(() => {
    getHideCompleted(userDB, scheduleName, setCompletedHidden);
  }, [userDB, scheduleName]);

  function onDeleteSchedule() {
    props.navigation.dispatch(StackActions.pop(1));
    deleteSchedule(userDB, tableName, scheduleName).then(() => {
      afterUpdate();
    });
  }

  return (
    <SafeAreaView style={styles.container}>
      <MessagePopup
        displayPopup={messagePopup.isDisplayed}
        title={messagePopup.title}
        message={messagePopup.message}
        onClosePress={closeMessagePopup}
        onConfirm={messagePopup.onConfirm}
      />
      <ScheduleListPopups />
      <View style={styles.header}>
        <CheckBox
          center
          containerStyle={styles.checkBox}
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
          onPress={openRemindersPopup}
        />
      </View>
      <View style={styles.content}>
        <ScheduleButtonsList />
      </View>
    </SafeAreaView>
  );
}

export default SchedulePage;
