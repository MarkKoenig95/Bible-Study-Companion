import React, {useContext, useEffect, useState} from 'react';
import {FlatList, SafeAreaView, Switch, View} from 'react-native';
import {StackActions} from '@react-navigation/native';

import {LargeText} from '../components/text/Text';

import styles, {colors} from '../styles/styles';

import {translate} from '../logic/localization/localization';

import {store} from '../data/Store/store.js';

import {errorCB, updateValue} from '../data/Database/generalTransactions';
import {useUpdate} from '../logic/logic';
import TimePickerButton from '../components/buttons/TimePickerButton';
import {deleteNotification} from '../data/Database/notificationTransactions';
import IconButton from '../components/buttons/IconButton';
import MessagePopup, {useMessagePopup} from '../components/popups/MessagePopup';

const prefix = 'notificationPage.';

const WeekdayWrapper = React.memo(props => {
  const {day, isNotifActive, itemID, onUpdate} = props;
  const isActiveProp = props.isActive;

  const [isActive, setIsActive] = useState(isActiveProp && isNotifActive);
  const [time, setTime] = useState(props.time);

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
    <View style={styles.wrapper}>
      <View style={styles.wrapperContent}>
        <View>
          <LargeText style={{color: activeColor}}>{props.weekday}</LargeText>
          <TimePickerButton
            invert
            textStyle={{color: color}}
            time={time}
            onChange={onTimeChange}
          />
        </View>
        <Switch
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
  console.log('loaded notification page');
  const globalState = useContext(store);
  const {dispatch} = globalState;
  const {userDB, updatePages, notification} = globalState.state;

  const notificationName = props.route.params.name;
  const notificationID = props.route.params.id;

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
    props.navigation.dispatch(StackActions.pop(1));
    deleteNotification(userDB, notificationID, notification).then(() => {
      afterUpdate();
    });
  }

  //Set delete button in nav bar with appropriate onPress attribute
  props.navigation.setOptions({
    headerRight: () => (
      <IconButton
        iconOnly
        invertColor
        onPress={() => {
          let title = translate('warning');
          let message = translate(prefix + 'deleteNotificationMessage', {
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
      .transaction(txn => {
        txn
          .executeSql('SELECT * FROM tblNotifications WHERE ID=?;', [
            notificationID,
          ])
          .then(([t, res]) => {
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
          });
      })
      .catch(errorCB);
  }, [userDB, updatePages, notificationID]);

  return (
    <SafeAreaView style={styles.container}>
      <MessagePopup
        displayPopup={messagePopup.isDisplayed}
        title={messagePopup.title}
        message={messagePopup.message}
        onClosePress={closeMessagePopup}
        onConfirm={messagePopup.onConfirm}
      />
      <View style={styles.contentWithoutHeader}>
        <FlatList
          data={listItems}
          renderItem={renderItem}
          keyExtractor={item => item.weekday}
        />
      </View>
    </SafeAreaView>
  );
}