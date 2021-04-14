import React, {useContext, useEffect, useState} from 'react';
import {FlatList, SafeAreaView, Switch, View} from 'react-native';
import {StackActions} from '@react-navigation/native';

import {LargeText} from '../components/text/Text';

import styles, {colors} from '../styles/styles';

import {translate} from '../logic/localization/localization';

import {store} from '../data/Store/store.js';

import {errorCB, updateValue} from '../data/Database/generalTransactions';
import {useUpdate} from '../logic/general';
import TimePickerButton from '../components/buttons/TimePickerButton';
import {deleteNotification} from '../data/Database/notificationTransactions';
import IconButton from '../components/buttons/IconButton';
import MessagePopup, {useMessagePopup} from '../components/popups/MessagePopup';

const pageTitle = 'notificationPage';

const WeekdayWrapper = React.memo(props => {
  const {day, isNotifActive, itemID, onUpdate, testID, weekday} = props;
  const isActiveProp = props.isActive;
  const timeProp = props.time;

  const [isActive, setIsActive] = useState(isActiveProp && isNotifActive);
  const [time, setTime] = useState(timeProp);

  const activeColor = colors.darkBlue;

  const color = isActive ? activeColor : colors.gray;

  function toggleIsActive() {
    onUpdate(itemID, isNotifActive, day, !isActive, time);
    setIsActive(!isActive);
  }

  function onTimeChange(newTime) {
    onUpdate(itemID, isNotifActive, day, true, newTime);
    setTime(newTime);
    setIsActive(true);
  }

  return (
    <View testID={testID} style={styles.wrapper}>
      <View style={styles.wrapperContent}>
        <View>
          <LargeText style={{color: activeColor}}>{weekday}</LargeText>
          <TimePickerButton
            testID={testID + '.timePicker'}
            invert
            textStyle={{color: color}}
            time={time}
            onChange={onTimeChange}
          />
        </View>
        <Switch
          testID={testID + '.switch'}
          onValueChange={toggleIsActive}
          trackColor={{true: colors.lightBlue}}
          thumbColor={color}
          value={isActive}
        />
      </View>
    </View>
  );
});

export default function Notification(props) {
  const {navigation, route} = props;

  console.log('loaded notification page');
  const globalState = useContext(store);
  const {dispatch} = globalState;
  const {userDB, updatePages, notification} = globalState.state;

  const notificationName = route.params.name;
  const notificationID = route.params.id;

  const [listItems, setListItems] = useState([]);

  const {messagePopup, openMessagePopup, closeMessagePopup} = useMessagePopup();

  const afterUpdate = useUpdate(updatePages, dispatch);

  async function updateWeekday(id, isNotifActive, day, isActive, time) {
    let isActiveBool = isActive ? 1 : 0;
    let isNotifActiveBool = !isNotifActive ? 1 : 0;
    let baseDate = new Date(0);

    notification.cancelNotif(id);
    await updateValue(
      userDB,
      'tblNotifications',
      id,
      'NextNotifDate',
      baseDate.toString(),
      () => {},
    );

    if (!isNotifActive) {
      await updateValue(
        userDB,
        'tblNotifications',
        id,
        'IsNotificationActive',
        isNotifActiveBool,
        () => {},
      );
    }

    await updateValue(
      userDB,
      'tblNotifications',
      id,
      `Day${day}Time`,
      time.toString(),
      () => {},
    );
    await updateValue(
      userDB,
      'tblNotifications',
      id,
      `IsDay${day}Active`,
      isActiveBool,
      afterUpdate,
    );
  }

  function onDeleteNotification() {
    navigation.dispatch(StackActions.pop(1));
    deleteNotification(userDB, notificationID, notification).then(() => {
      afterUpdate();
    });
  }

  //Set delete button in nav bar with appropriate onPress attribute
  navigation.setOptions({
    headerRight: () => (
      <IconButton
        testID={pageTitle + '.header.deleteButton'}
        iconOnly
        invertColor
        onPress={() => {
          let title = translate('warning');
          let message = translate(pageTitle + '.deleteNotificationMessage', {
            notificationName: notificationName,
          });
          let onConfirm = onDeleteNotification;

          openMessagePopup(message, title, onConfirm);
        }}
        name="delete"
      />
    ),
  });

  const renderItem = ({item}) => (
    <WeekdayWrapper
      testID={pageTitle + '.' + item.weekday}
      itemID={item.id}
      time={item.time}
      day={item.day}
      weekday={item.weekday}
      isNotifActive={item.isNotifActive ? true : false}
      isActive={item.isActive ? true : false}
      onUpdate={updateWeekday}
    />
  );

  useEffect(() => {
    userDB
      .executeSql('SELECT * FROM tblNotifications WHERE ID=?;', [
        notificationID,
      ])
      .then(([res]) => {
        let thisNotif = res.rows.item(0);
        let tempListItems = [];
        for (let i = 0; i < 7; i++) {
          tempListItems.push({
            day: i,
            id: thisNotif.ID,
            isActive: thisNotif[`IsDay${i}Active`],
            isNotifActive: thisNotif.IsNotificationActive,
            time: new Date(thisNotif[`Day${i}Time`]),
            weekday: translate(`weekdays.${i}.name`),
          });
        }
        setListItems(tempListItems);
      })
      .catch(errorCB);
  }, [userDB, updatePages, notificationID]);

  return (
    <SafeAreaView testID={pageTitle} style={styles.container}>
      <MessagePopup
        testID={pageTitle + '.messagePopup'}
        displayPopup={messagePopup.isDisplayed}
        title={messagePopup.title}
        message={messagePopup.message}
        onClosePress={closeMessagePopup}
        onConfirm={messagePopup.onConfirm}
      />
      <View style={styles.contentWithoutHeader}>
        <FlatList
          testID={pageTitle + '.list'}
          data={listItems}
          renderItem={renderItem}
          keyExtractor={item => item.weekday}
        />
      </View>
    </SafeAreaView>
  );
}
