import React, {useState} from 'react';
import {View, StyleSheet} from 'react-native';

import styles, {colors} from '../../styles/styles';
import Popup from './Popup';
import CustomInput from '../inputs/CustomInput';
import {translate} from '../../logic/localization/localization';
import IconButton from '../buttons/IconButton';
import Text from '../text/Text';
import CheckBox from '../buttons/CheckBox';
import TimePickerButton from '../buttons/TimePickerButton';

function WeekdayCheckbox(props) {
  const {abrev, checked, id, onPress, testID} = props;
  return (
    <View style={style.weekdayCheckboxContainer}>
      <Text
        style={{
          ...style.weekdayAbrevText,
          color: !checked ? styles.lightText.color : colors.darkBlue,
        }}>
        {abrev}
      </Text>
      <CheckBox
        testID={testID}
        checked={checked}
        uncheckedColor={styles.lightText.color}
        checkedColor={colors.darkBlue}
        onPress={() => {
          onPress(id, !checked);
        }}
      />
    </View>
  );
}

export default function CreateNotificationPopup(props) {
  const {displayPopup, prefix, onAddPress, onClosePress, testID, title} = props;
  const [time, setTime] = useState(new Date(2020, 0, 1, 8, 0, 0));
  const [notificationName, setNotificationName] = useState('');
  const [dayValues, setDayValues] = useState({
    0: true,
    1: true,
    2: true,
    3: true,
    4: true,
    5: true,
    6: true,
  });

  const days = [];
  const weekdays = [];

  for (let i = 0; i < 7; i++) {
    const abrev = translate('weekdays.' + i + '.abrev');
    weekdays.push({id: i, abrev: abrev});
    days.push(dayValues[i]);
  }

  return (
    <Popup
      testID={testID}
      displayPopup={displayPopup}
      title={title}
      onClosePress={onClosePress}>
      <CustomInput
        testID={testID + '.nameInput'}
        title={translate(prefix + 'notificationName')}
        onChangeText={setNotificationName}
        value={notificationName}
        placeholder={translate(prefix + 'notificationName')}
      />
      <View style={styles.wrapperContent}>
        {weekdays.map(day => {
          return (
            <WeekdayCheckbox
              testID={testID + '.weekdayCheckbox.' + day.abrev}
              key={Math.random() * 1000000}
              abrev={day.abrev}
              id={day.id}
              checked={dayValues[day.id]}
              onPress={(id, value) => {
                setDayValues({...dayValues, [id]: value});
              }}
            />
          );
        })}
      </View>

      <TimePickerButton
        testID={testID + '.timePicker'}
        textPrefix={translate('prompts.setNotification')}
        time={time}
        onChange={setTime}
      />

      <IconButton
        testID={testID + '.addButton'}
        name="add"
        onPress={() => {
          onAddPress(notificationName, days, time);
        }}
      />
    </Popup>
  );
}

export function useCreateNotificationPopup() {
  const openNotificationPopup = () => {
    setNotificationPopup({
      ...notificationPopup,
      isDisplayed: true,
    });
  };

  const closeNotificationPopup = () => {
    setNotificationPopup({
      ...notificationPopup,
      isDisplayed: false,
    });
  };

  const [notificationPopup, setNotificationPopup] = useState({
    isDisplayed: false,
    title: translate('notificationsPage.notificationPopupTitle'),
    open: openNotificationPopup,
    close: closeNotificationPopup,
  });

  return {notificationPopup};
}

const style = StyleSheet.create({
  weekdayCheckboxContainer: {
    alignItems: 'center',
    flex: 1,
    margin: 0,
    padding: 0,
  },
  weekdayAbrevText: {
    fontSize: 15,
    margin: 0,
    padding: 0,
  },
});
