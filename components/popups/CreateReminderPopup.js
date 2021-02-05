import React, {useState, useEffect} from 'react';
import {StyleSheet} from 'react-native';
import {setReminderCompDate} from '../../data/Database/reminderTransactions';
import {translate} from '../../logic/localization/localization';
import {FREQS, createPickerArray, sanitizeNumber} from '../../logic/logic';
import {View} from 'react-native';
import IconButton from '../buttons/IconButton';
import {Body} from '../text/Text';
import WeekdayPicker from '../inputs/WeekdayPicker';
import CustomInput from '../inputs/CustomInput';
import Picker from '../inputs/CustomPicker';
import Popup from './Popup';

import styles from '../../styles/styles';

let prefix;

export default function CreateReminderPopup(props) {
  const {displayPopup, onAddReminder, onClosePress, testID, title} = props;
  prefix = props.prefix;

  //State values for reminder info
  const [frequency, setFrequency] = useState(0);
  const [name, setName] = useState(translate('reminders.reminder'));
  const [resetStr, setResetStr] = useState('');
  const [resetValue, setResetValue] = useState(1);

  //State values which control appearance
  const [isDaily, setIsDaily] = useState(false);
  const [isWeekly, setIsWeekly] = useState(false);

  const RECURS = {
    [FREQS.DAILY]: translate('frequencies.daily'),
    [FREQS.WEEKLY]: translate('frequencies.weekly'),
    [FREQS.MONTHLY]: translate('frequencies.monthly'),
  };

  const frequencyPickerValues = createPickerArray(
    RECURS[FREQS.DAILY],
    RECURS[FREQS.WEEKLY],
    RECURS[FREQS.MONTHLY],
  );

  useEffect(() => {
    switch (frequency) {
      case FREQS.DAILY:
        setIsDaily(true);
        setIsWeekly(false);
        break;
      case FREQS.WEEKLY:
        setIsDaily(false);
        setIsWeekly(true);
        setResetStr(translate(`weekdays.${resetValue}.name`));
        break;
      case FREQS.MONTHLY:
        setIsDaily(false);
        setIsWeekly(false);
        setResetStr(resetValue.toString());
        break;
      default:
        console.log('Reminder frequency not defined');
        break;
    }
  }, [frequency, resetValue]);

  function onAddPress() {
    const {newCompDate} = setReminderCompDate(
      new Date(0),
      false,
      frequency,
      resetValue,
    );

    onAddReminder(name, frequency, resetValue, newCompDate);
  }

  return (
    <Popup
      testID={testID}
      displayPopup={displayPopup}
      title={title}
      onClosePress={onClosePress}
      style={style.reminderContainer}>
      <NameSection
        testID={testID + '.nameSection'}
        name={name}
        setName={setName}
      />

      <FrequencySection
        testID={testID + '.frequencySection'}
        frequency={frequency}
        frequencyPickerValues={frequencyPickerValues}
        setFrequency={setFrequency}
      />

      {!isDaily && (
        <RecursSection
          testID={testID + '.recursSection'}
          isWeekly={isWeekly}
          resetStr={resetStr}
          resetValue={resetValue}
          setResetStr={setResetStr}
          setResetValue={setResetValue}
        />
      )}

      <IconButton
        testID={testID + '.addButton'}
        name="add"
        onPress={onAddPress}
      />
    </Popup>
  );
}

const RecursSection = props => {
  const {
    isWeekly,
    resetStr,
    resetValue,
    setResetStr,
    setResetValue,
    testID,
  } = props;

  //If it's not editing we display the text as is
  //If it is editing, then we either show a picker for a weekday or we show a numerical input
  return (
    <View testID={testID} style={style.reminderContent}>
      <Body style={{alignSelf: 'center'}}>{translate(prefix + 'every')}</Body>
      {isWeekly ? (
        <WeekdayPicker
          testID={testID + '.weekdayPicker'}
          onChange={setResetValue}
          currentValue={resetValue}
        />
      ) : (
        <CustomInput
          testID={testID + '.resetValueInput'}
          containerStyle={{maxWidth: 100}}
          value={resetStr}
          onChangeText={newValue => {
            let newStr = sanitizeNumber(resetStr, newValue, 1, 31);
            setResetStr(newStr);
            if (newStr) {
              setResetValue(parseInt(newStr, 10));
            }
          }}
          keyboardType={'number-pad'}
          textAlign={'center'}
        />
      )}
    </View>
  );
};

const FrequencySection = props => {
  const {frequency, frequencyPickerValues, setFrequency, testID} = props;
  return (
    <View testID={testID} style={style.reminderContent}>
      <Body style={{alignSelf: 'center'}}>{translate(prefix + 'repeats')}</Body>

      <Picker
        testID={testID + '.picker'}
        onChange={setFrequency}
        values={frequencyPickerValues}
        currentValue={frequency}
      />
    </View>
  );
};

const NameSection = props => {
  const {name, setName, testID} = props;
  return (
    <View testID={testID} style={[style.reminderContent, {borderTopWidth: 0}]}>
      <Body style={{alignSelf: 'center'}}>{translate(prefix + 'name')}</Body>

      <CustomInput
        testID={testID + '.nameInput'}
        value={name}
        onChangeText={setName}
        textAlign={'center'}
      />
    </View>
  );
};

export function useCreateReminderPopup() {
  const openReminderPopup = () => {
    setReminderPopup({
      ...reminderPopup,
      isDisplayed: true,
    });
  };

  const closeReminderPopup = () => {
    setReminderPopup({
      ...reminderPopup,
      isDisplayed: false,
    });
  };

  const [reminderPopup, setReminderPopup] = useState({
    isDisplayed: false,
    title: translate('remindersPage.reminderPopupTitle'),
    open: openReminderPopup,
    close: closeReminderPopup,
  });

  return {reminderPopup};
}

const style = StyleSheet.create({
  buttonContainer: {
    alignItems: 'center',
    flex: 1,
  },
  deleteButton: {
    marginTop: 25,
    marginBottom: 0,
  },
  editButton: {
    marginTop: 0,
    marginBottom: 25,
  },
  reminderContainer: {
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'space-between',
    margin: 10,
  },
  reminderContent: {
    ...styles.wrapperContent,
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    margin: 0,
  },
});
