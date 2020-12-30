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
import {createWeeklyReadingSchedule} from '../data/Database/scheduleTransactions';

const prefix = 'settingsPage.';

export default function Settings(props) {
  console.log('loaded Settings page');
  const navigation = props.navigation;
  const globalState = useContext(store);

  const {dispatch} = globalState;
  const {
    bibleDB,
    userDB,
    updatePages,
    showDaily,
    weeklyReadingResetDay,
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

  function updateWeeklyReadingResetDay(value) {
    let saniVal = parseInt(value, 10);
    /*
      At the begining of the process of updating the picker there is a synthedic event.
      If that is passed straight into the query there will be massive bugs. this reduces
      the value to update only if it truely is a number or can at least be parsed to one.
    */
    if (!isNaN(saniVal)) {
      updateValue(
        userDB,
        'tblUserPrefs',
        weeklyReadingResetDay.id,
        'Value',
        saniVal.toString(),
        () => {
          createWeeklyReadingSchedule(userDB, bibleDB, saniVal, true).then(
            afterUpdate,
          );
        },
      );
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.contentWithoutHeader}>
        <WeeklyReadingSettings
          isShown={showDaily.value}
          readingResetDay={weeklyReadingResetDay.value}
          setReadingResetDay={updateWeeklyReadingResetDay}
          toggleIsShown={toggleIsShown}
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
  const {isShown, toggleIsShown, readingResetDay, setReadingResetDay} = props;

  const activeColor = colors.darkBlue;

  const color = isShown ? activeColor : colors.gray;

  return (
    <SettingsWrapper noArrow text={translate('reminders.weeklyReading.title')}>
      <BreakLine />
      <View style={styles.wrapperContent}>
        <Body dark style={{alignSelf: 'flex-start', color: colors.darkBlue}}>
          {translate('reminders.weeklyReading.showDaily')}
        </Body>
        <Switch
          style={{alignSelf: 'flex-end'}}
          onValueChange={toggleIsShown}
          trackColor={{true: colors.lightBlue}}
          thumbColor={color}
          value={isShown}
        />
      </View>
      <BreakLine />
      <View style={{width: '90%'}}>
        <Body dark style={{alignSelf: 'flex-start', color: colors.darkBlue}}>
          {translate(prefix + 'weeklyReadingResetDay')}
        </Body>
        <WeekdayPicker
          containerStyle={{alignSelf: 'flex-end'}}
          onChange={setReadingResetDay}
          currentValue={readingResetDay}
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
