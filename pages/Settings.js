import React, {useContext} from 'react';
import {SafeAreaView, Switch, View} from 'react-native';

import {Body} from '../components/text/Text';

import styles, {colors} from '../styles/styles';
import {translate} from '../logic/localization/localization';
import {store} from '../data/Store/store.js';

import {useUpdate} from '../logic/logic';
import {SettingsWrapper} from '../components/SettingsWrapper';
import WeekdayPicker from '../components/inputs/WeekdayPicker';
import {updateValue} from '../data/Database/generalTransactions';

const prefix = 'settingsPage.';

export default function Settings(props) {
  console.log('loaded Settings page');
  const navigation = props.navigation;
  const globalState = useContext(store);

  const {dispatch} = globalState;
  const {
    userDB,
    updatePages,
    showDaily,
    midweekMeeting,
    weekendMeeting,
  } = globalState.state;

  const afterUpdate = useUpdate(updatePages, dispatch);

  function toggleIsShown() {
    updateValue(
      userDB,
      'tblUserPrefs',
      showDaily.id,
      'Value',
      showDaily.value ? 0 : 1,
      afterUpdate,
    );
  }

  function updateWeekend(value) {
    updateValue(
      userDB,
      'tblUserPrefs',
      weekendMeeting.id,
      'Value',
      value.toString(),
      afterUpdate,
    );
  }

  function updateMidweek(value) {
    updateValue(
      userDB,
      'tblUserPrefs',
      midweekMeeting.id,
      'Value',
      value.toString(),
      afterUpdate,
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.contentWithoutHeader}>
        <WeeklyReadingSettings
          isShown={showDaily.value}
          toggleIsShown={toggleIsShown}
        />
        <MeetingSettings
          midweekDay={midweekMeeting.value}
          setMidweekDay={updateMidweek}
          weekendDay={weekendMeeting.value}
          setWeekendDay={updateWeekend}
        />
        <SettingsWrapper
          iconName="alarm"
          onPress={() => navigation.navigate('Notifications', {})}
          text={translate('notificationsPage.title')}
        />
        <SettingsWrapper
          iconName="check-box"
          onPress={() => navigation.navigate('Reminders', {})}
          text={translate('remindersPage.title')}
        />
      </View>
    </SafeAreaView>
  );
}

function WeeklyReadingSettings(props) {
  const {isShown, toggleIsShown} = props;

  const activeColor = colors.darkBlue;

  const color = isShown ? activeColor : colors.gray;

  return (
    <SettingsWrapper noArrow text={translate('reminders.weeklyReading.title')}>
      <BreakLine />
      <View style={styles.wrapperContent}>
        <Body dark style={{color: colors.darkBlue}}>
          {translate('reminders.weeklyReading.showDaily')}
        </Body>
        <Switch
          onValueChange={toggleIsShown}
          trackColor={{true: colors.lightBlue}}
          thumbColor={color}
          value={isShown}
        />
      </View>
    </SettingsWrapper>
  );
}

function MeetingSettings(props) {
  const {midweekDay, setMidweekDay, weekendDay, setWeekendDay} = props;

  return (
    <SettingsWrapper noArrow text={translate(prefix + 'meetingDays')}>
      <BreakLine />
      <View style={{width: '90%'}}>
        <Body dark style={{alignSelf: 'flex-start', color: colors.darkBlue}}>
          {translate(prefix + 'dayOfMidweek')}
        </Body>
        <WeekdayPicker
          containerStyle={{alignSelf: 'flex-end'}}
          onChange={setMidweekDay}
          currentValue={midweekDay}
        />
      </View>

      <BreakLine />

      <View style={{width: '90%'}}>
        <Body dark style={{alignSelf: 'flex-start', color: colors.darkBlue}}>
          {translate(prefix + 'dayOfWeekend')}
        </Body>
        <WeekdayPicker
          containerStyle={{alignSelf: 'flex-end'}}
          onChange={setWeekendDay}
          currentValue={weekendDay}
        />
      </View>
    </SettingsWrapper>
  );
}

const BreakLine = () => {
  return (
    <View
      style={{borderWidth: 1, borderColor: colors.lightGray, width: '90%'}}
    />
  );
};
