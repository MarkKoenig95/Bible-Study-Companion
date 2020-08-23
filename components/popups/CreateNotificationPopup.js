import React, {useState, useEffect} from 'react';
import {View, StyleSheet} from 'react-native';

import styles, {colors} from '../../styles/styles';
import Popup from './Popup';
import CustomInput from '../inputs/CustomInput';
import {translate} from '../../logic/localization/localization';
import IconButton from '../buttons/IconButton';
import Text from '../text/Text';
import {CheckBox} from 'react-native-elements';
import TimePickerButton from '../buttons/TimePickerButton';

function WeekdayCheckbox(props) {
  const {abrev, id, checked, onPress} = props;
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
        center
        containerStyle={styles.checkBox}
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
  const {prefix, onAddPress} = props;
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
      displayPopup={props.displayPopup}
      title={props.title}
      onClosePress={props.onClosePress}>
      <CustomInput
        title={translate(prefix + 'notificationName')}
        onChangeText={setNotificationName}
        value={notificationName}
        placeholder={translate(prefix + 'notificationName')}
      />
      <View style={styles.wrapperContent}>
        {weekdays.map(day => {
          return (
            <WeekdayCheckbox
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
        textPrefix={translate('prompts.setNotification')}
        time={time}
        onChange={setTime}
      />

      <IconButton
        name="add"
        onPress={() => {
          onAddPress(notificationName, days, time);
        }}
      />
    </Popup>
  );
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
