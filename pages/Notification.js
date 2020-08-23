import React, {useContext, useEffect, useState} from 'react';
import {
  FlatList,
  SafeAreaView,
  Switch,
  View,
  TouchableOpacity,
} from 'react-native';

import {LargeButtonText} from '../components/text/Text';

import styles, {colors} from '../styles/styles';

import {translate} from '../logic/localization/localization';

import {store} from '../data/Store/store.js';

import {errorCB} from '../data/Database/generalTransactions';
import {useUpdate} from '../logic/logic';
import TimePickerButton from '../components/buttons/TimePickerButton';
import {updateNotification} from '../data/Database/notificationTransactions';

const prefix = 'notificationPage.';

const WeekdayWrapper = React.memo(props => {
  const {day, isNotifActive, itemID, onUpdate} = props;
  const isActiveProp = props.isActive;

  const [isActive, setIsActive] = useState(isActiveProp && isNotifActive);
  const [time, setTime] = useState(props.time);

  const color = isActive ? colors.darkBlue : colors.gray;

  const style = {
    wrapper: {
      ...styles.wrapper,
      borderColor: color,
    },
  };
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
    <TouchableOpacity onPress={props.onPress}>
      <View style={style.wrapper}>
        <View style={styles.wrapperContent}>
          <View>
            <LargeButtonText style={{color: color}}>
              {props.weekday}
            </LargeButtonText>
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
    </TouchableOpacity>
  );
});

export default function Notification(props) {
  console.log('loaded notification page');
  const globalState = useContext(store);
  const {dispatch} = globalState;
  const {userDB, updatePages, notification} = globalState.state;

  const notificationID = props.route.params.id;

  const [listItems, setListItems] = useState([]);

  const afterUpdate = useUpdate(updatePages, dispatch);

  async function updateWeekday(id, isNotifActive, day, isActive, time) {
    let isActiveBool = isActive ? 1 : 0;
    let isNotifActiveBool = !isNotifActive ? 1 : 0;
    let baseDate = new Date(0);

    notification.cancelNotif(id);
    await updateNotification(
      userDB,
      id,
      'NextNotifDate',
      baseDate.toString(),
      () => {},
    );

    if (!isNotifActive) {
      await updateNotification(
        userDB,
        id,
        'IsNotificationActive',
        isNotifActiveBool,
        () => {},
      );
    }

    await updateNotification(
      userDB,
      id,
      `Day${day}Time`,
      time.toString(),
      () => {},
    );
    await updateNotification(
      userDB,
      id,
      `IsDay${day}Active`,
      isActiveBool,
      afterUpdate,
    );
  }

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
