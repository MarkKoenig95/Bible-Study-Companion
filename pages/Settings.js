import React, {useContext, useEffect} from 'react';
import {SafeAreaView, ScrollView, Switch, View} from 'react-native';

import {Body} from '../components/text/Text';

import styles, {colors} from '../styles/styles';
import {languages, translate} from '../logic/localization/localization';
import {store} from '../data/Store/store';

import {createPickerArray, useUpdate} from '../logic/general';
import SettingsWrapper from '../components/SettingsWrapper';
import WeekdayPicker from '../components/inputs/WeekdayPicker';
import {log, runSQL, updateValue} from '../data/Database/generalTransactions';
import {
  createWeeklyReadingSchedule,
  deleteMemorialReadingSchedules,
} from '../data/Database/scheduleTransactions';
import Picker from '../components/inputs/CustomPicker';

const pageTitle = 'settingsPage';

const BreakLine = () => {
  return (
    <View
      style={{borderWidth: 1, borderColor: colors.lightGray, width: '90%'}}
    />
  );
};

function WeeklyReadingSettings(props) {
  const {isShown, toggleIsShown, readingResetDay, setReadingResetDay, testID} =
    props;

  const activeColor = colors.darkBlue;

  const color = isShown ? activeColor : colors.gray;

  return (
    <SettingsWrapper
      testID={testID}
      noArrow
      text={translate('reminders.weeklyReading.title')}>
      <BreakLine />
      <View style={{...styles.wrapperContent, width: '90%'}}>
        <Body dark style={{alignSelf: 'flex-start', color: colors.darkBlue}}>
          {translate('reminders.weeklyReading.showDaily')}
        </Body>
        <Switch
          testID={testID + '.showWeeklySwitch'}
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
          {translate(pageTitle + '.weeklyReadingResetDay')}
        </Body>
        <WeekdayPicker
          testID={testID + '.weekdayPicker'}
          containerStyle={{alignSelf: 'flex-end'}}
          onChange={setReadingResetDay}
          currentValue={readingResetDay}
        />
      </View>
    </SettingsWrapper>
  );
}

function LanugagePicker(props) {
  const {afterUpdate, language, testID, userDB} = props;

  const languageTags = Object.keys(languages);
  const languagesGeneralInfo = Object.values(languages);
  const labels = languagesGeneralInfo.map((info) => info.language);

  const languageArray = createPickerArray(...labels);

  let currentValue = languageArray.filter((val) => {
    return val.label === language;
  });

  currentValue = currentValue[0].value;

  function setLanguage(value) {
    const languageTag = languageTags[value];

    let languageInfos = {};

    languageTags.forEach(
      (tag) =>
        (languageInfos[tag] = {languageTag: tag, isRTL: languages[tag].isRTL}),
    );

    let languageInfo = JSON.stringify(languageInfos[languageTag]);

    runSQL(
      userDB,
      'UPDATE tblUserPrefs SET Description=? WHERE Name="LanguageInfo"',
      [languageInfo],
    ).then(afterUpdate);
  }

  return (
    <SettingsWrapper
      testID={testID}
      noArrow
      text={translate('settingsPage.language')}>
      <Picker
        {...props}
        testID={testID + '.languagePicker'}
        onChange={setLanguage}
        currentValue={currentValue}
        values={languageArray}
      />
    </SettingsWrapper>
  );
}

function MemorialScheduleType(props) {
  const {testID, afterUpdate, bibleDB, memorialScheduleType, userDB} = props;

  const shortScheduleName = translate(
    'settingsPage.memorialReading.options.short.title',
  );
  const shortScheduleDescription = translate(
    'settingsPage.memorialReading.options.short.description',
  );
  const longScheduleName = translate(
    'settingsPage.memorialReading.options.long.title',
  );
  const longScheduleDescription = translate(
    'settingsPage.memorialReading.options.long.description',
  );
  const scheduleTypeLabels = [shortScheduleName, longScheduleName];
  const scheduleTypeDescriptions = [
    shortScheduleDescription,
    longScheduleDescription,
  ];

  const scheduleTypeArray = createPickerArray(...scheduleTypeLabels);

  let currentDescription = scheduleTypeDescriptions[memorialScheduleType];

  async function setScheduleType(value) {
    await runSQL(
      userDB,
      'UPDATE tblUserPrefs SET Value=? WHERE Name="MemorialScheduleType"',
      [value],
    );

    await deleteMemorialReadingSchedules(bibleDB, userDB);

    await runSQL(
      userDB,
      'UPDATE tblDates SET Description="INCOMPLETE" WHERE Name="UpcomingMemorial"',
    );

    afterUpdate();
  }

  return (
    <SettingsWrapper
      testID={testID}
      noArrow
      text={translate('settingsPage.memorialReading.title')}>
      <Picker
        testID={testID + '.typePicker'}
        onChange={setScheduleType}
        currentValue={memorialScheduleType}
        values={scheduleTypeArray}
      />
      <Body dark style={{alignSelf: 'flex-start', color: colors.darkBlue}}>
        {currentDescription}
      </Body>
    </SettingsWrapper>
  );
}

export default function Settings(props) {
  log('loaded Settings page');
  const {navigation} = props;

  const globalState = useContext(store);

  const {dispatch} = globalState;
  const {
    bibleDB,
    userDB,
    showDaily,
    memorialScheduleType,
    weeklyReadingResetDay,
  } = globalState.state;

  const afterUpdate = useUpdate(dispatch);

  useEffect(() => {
    navigation.setOptions({
      title: translate('settingsPage.title'),
    });
  });

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
      At the begining of the process of updating the picker there is a synthetic event.
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
    <SafeAreaView testID={pageTitle} style={styles.container}>
      <ScrollView style={styles.contentWithoutHeader}>
        <WeeklyReadingSettings
          testID={pageTitle + '.weeklyReading'}
          isShown={showDaily.value}
          readingResetDay={weeklyReadingResetDay.value}
          setReadingResetDay={updateWeeklyReadingResetDay}
          toggleIsShown={toggleIsShown}
        />
        <LanugagePicker
          testID={pageTitle + '.languagePicker'}
          afterUpdate={afterUpdate}
          language={translate('language')}
          userDB={userDB}
        />
        <MemorialScheduleType
          testID={pageTitle + '.memorialSchedule'}
          afterUpdate={afterUpdate}
          bibleDB={bibleDB}
          memorialScheduleType={memorialScheduleType.value}
          userDB={userDB}
        />
      </ScrollView>
    </SafeAreaView>
  );
}
