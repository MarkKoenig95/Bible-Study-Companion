import React, {useContext, useEffect, useState} from 'react';
import {
  SafeAreaView,
  Switch,
  View,
  TouchableOpacity,
  StyleSheet,
  SectionList,
} from 'react-native';

import Icon from 'react-native-vector-icons/MaterialIcons';
import IconButton from '../components/buttons/IconButton';
import Text, {LargeText, Heading} from '../components/text/Text';

import styles, {colors} from '../styles/styles';

import {translate} from '../logic/localization/localization';

import {store} from '../data/Store/store.js';

import {
  errorCB,
  loadData,
  log,
  updateValue,
} from '../data/Database/generalTransactions';

import {addNotification} from '../data/Database/notificationTransactions';

import {useUpdate, ERROR} from '../logic/logic';
import CreateNotificationPopup, {
  useCreateNotificationPopup,
} from '../components/popups/CreateNotificationPopup';
import MessagePopup, {useMessagePopup} from '../components/popups/MessagePopup';

const prefix = 'notificationsPage.';

const days = [];

const NotificationsWrapper = React.memo(props => {
  const {days, itemID, onPress, onUpdateIsActive, text} = props;
  const isActiveProp = props.isActive;

  const [isActive, setIsActive] = useState(isActiveProp);

  const activeColor = colors.darkBlue;

  const color = isActive ? activeColor : colors.gray;

  function updateIsNotificationActive() {
    onUpdateIsActive(itemID, !isActive);
    setIsActive(!isActive);
  }

  const style = StyleSheet.create({
    icon: {
      color: colors.darkBlue,
      fontSize: 40,
    },
  });

  return (
    <TouchableOpacity onPress={onPress}>
      <View style={{...styles.wrapper, flexDirection: 'row'}}>
        <View style={{width: '90%'}}>
          <View style={styles.wrapperContent}>
            <LargeText style={{color: activeColor}}>{text}</LargeText>
            <Switch
              onValueChange={updateIsNotificationActive}
              trackColor={{true: colors.lightBlue}}
              thumbColor={color}
              value={isActive}
            />
          </View>
          <View style={styles.wrapperContent}>
            {days.map(day => {
              return (
                <DayMarker
                  key={Math.random() * 1000000000}
                  color={color}
                  day={day}
                  isNotificationActive={isActive}
                />
              );
            })}
          </View>
        </View>

        <Icon style={style.icon} name={'chevron-right'} />
      </View>
    </TouchableOpacity>
  );
});

function DayMarker(props) {
  const isDayActive = props.day.value;
  const {color} = props;
  const activeColor = isDayActive ? color : colors.smoke;
  return (
    <View style={style.dayContainer}>
      <Text
        style={{
          ...style.dayAbrev,
          color: color,
        }}>
        {props.day.abrev}
      </Text>
      <View
        style={{
          ...style.dayMarker,
          borderColor: color,
          backgroundColor: activeColor,
        }}
      />
    </View>
  );
}

export default function Notifications(props) {
  console.log('loaded notifications page');
  const navigation = props.navigation;
  const globalState = useContext(store);

  const {dispatch} = globalState;
  const {userDB, updatePages, notification} = globalState.state;

  const afterUpdate = useUpdate(updatePages, dispatch);

  const [listItems, setListItems] = useState([]);

  const {messagePopup, openMessagePopup, closeMessagePopup} = useMessagePopup();

  const {notificationPopup} = useCreateNotificationPopup();

  //Set add button in nav bar with appropriate onPress attribute
  navigation.setOptions({
    headerRight: () => (
      <IconButton
        iconOnly
        invertColor
        onPress={notificationPopup.open}
        name="add"
      />
    ),
  });

  useEffect(() => {
    loadData(userDB, 'tblNotifications').then(res => {
      setListItems(res);
    });
  }, [userDB, setListItems, updatePages]);

  async function onAddNotification(notificationName, days, time) {
    log(
      'adding notification',
      'notificationName',
      notificationName,
      'days',
      days,
      'time',
      time,
    );
    let notificationID;

    let times = days.map(day => time);

    let hasError = false;

    await addNotification(
      userDB,
      notification,
      notificationName,
      days,
      times,
    ).catch(err => {
      hasError = err;
      console.log('Error adding notification:', err);
      if (err === ERROR.NAME_TAKEN) {
        let message = translate('prompts.nameTaken');
        let title = translate('warning');
        openMessagePopup(message, title);
      }
    });

    if (hasError) {
      return;
    }

    log('successfully added notification to table');

    await userDB
      .transaction(txn => {
        txn
          .executeSql(
            `SELECT ID FROM tblNotifications WHERE Name="${notificationName}"`,
            [],
          )
          .then(([t, res]) => {
            notificationID = res.rows.item(0).ID;
          });
      })
      .catch(err => {
        errorCB(err);
      });

    notificationPopup.close();

    afterUpdate();

    goToNotification(notificationID, notificationName);
  }

  function goToNotification(notificationID, notificationName) {
    navigation.navigate('Notification', {
      id: notificationID,
      title: notificationName,
      name: notificationName,
    });
  }

  async function updateIsNotificationActive(id, status) {
    let bool = status ? 1 : 0;
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

    await updateValue(
      userDB,
      'tblNotifications',
      id,
      'IsNotificationActive',
      bool,
      afterUpdate,
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <MessagePopup
        displayPopup={messagePopup.isDisplayed}
        title={messagePopup.title}
        message={messagePopup.message}
        onClosePress={closeMessagePopup}
      />
      <CreateNotificationPopup
        prefix={prefix}
        onAddPress={onAddNotification}
        displayPopup={notificationPopup.isDisplayed}
        title={notificationPopup.title}
        onClosePress={notificationPopup.close}
      />
      <View style={styles.contentWithoutHeader}>
        <SectionList
          sections={listItems}
          keyExtractor={(item, index) => index + JSON.stringify(item)}
          renderSectionHeader={({section: {title}}) => {
            if (title) {
              <Heading style={styles.header}>{title}</Heading>;
            }
          }}
          renderItem={({item}) => {
            for (let i = 0; i < 7; i++) {
              const value = item[`IsDay${i}Active`] ? true : false;
              const abrev = translate('weekdays.' + i + '.abrev');
              days[i] = {abrev: abrev, value: value};
            }

            return (
              <NotificationsWrapper
                itemID={item.ID}
                text={item.Name}
                days={days}
                isActive={item.IsNotificationActive ? true : false}
                onUpdateIsActive={updateIsNotificationActive}
                onPress={() => {
                  goToNotification(item.ID, item.Name);
                }}
              />
            );
          }}
        />
      </View>
    </SafeAreaView>
  );
}

const style = StyleSheet.create({
  dayMarker: {
    borderRadius: 10,
    borderWidth: 2,
    height: 20,
    margin: 10,
    width: 20,
  },
  dayAbrev: {
    fontSize: 15,
    margin: 10,
    marginBottom: 0,
  },
  dayContainer: {alignItems: 'center'},
});
