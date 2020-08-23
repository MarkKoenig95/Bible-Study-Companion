import React, {useContext, useEffect, useState} from 'react';
import {
  SafeAreaView,
  View,
  Linking,
  StyleSheet,
  ScrollView,
} from 'react-native';

import IconButton from '../components/buttons/IconButton';
import TextButton from '../components/buttons/TextButton';
import {LargeButtonText} from '../components/text/Text';

import styles, {colors} from '../styles/styles';

import {translate, linkFormulator} from '../logic/localization/localization';

import {store} from '../data/Store/store.js';

import {formatDate, errorCB} from '../data/Database/generalTransactions';
import {
  formatScheduleTableName,
  updateDates,
  createWeeklyReadingSchedule,
  WEEKLY_READING_TABLE_NAME,
} from '../data/Database/scheduleTransactions';
import {useUpdate} from '../logic/logic';
import useScheduleButtonsList from '../components/ScheduleButtonsList';
import NotifService from '../logic/notifications/NotifService';
import CustomInput from '../components/inputs/CustomInput';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {TouchableOpacity} from 'react-native-gesture-handler';

const prefix = 'morePage.';

export default function More(props) {
  console.log('loaded more page');
  const navigation = props.navigation;
  const globalState = useContext(store);

  const {dispatch} = globalState;
  const {userDB, bibleDB, updatePages} = globalState.state;

  const afterUpdate = useUpdate(updatePages, dispatch);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.contentWithoutHeader}>
        <SettingsWrapper
          arrow
          onPress={() => navigation.navigate('Notifications', {})}
          text={translate('notificationsPage.title')}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

function SettingsWrapper(props) {
  const hasChildren = props.children && true;
  const onPress = () => {};
  return (
    <TouchableOpacity style={styles.wrapper} onPress={props.onPress || onPress}>
      <View style={styles.wrapperContent}>
        <LargeButtonText style={{color: colors.darkBlue}}>
          {props.text}
        </LargeButtonText>

        {props.arrow && <Icon style={style.icon} name={'chevron-right'} />}
      </View>

      {hasChildren && (
        <View style={styles.wrapperContent}>{props.children}</View>
      )}
    </TouchableOpacity>
  );
}

const style = StyleSheet.create({
  icon: {
    color: colors.darkBlue,
    fontSize: 30,
    padding: 10,
  },
});
