import React, {useEffect, useState} from 'react';
import {StyleSheet, View} from 'react-native';
import {CheckBox} from 'react-native-elements';

import CustomButton from './CustomButton';
import Text from '../text/Text';

import styles, {colors} from '../../styles/styles';

export default function ScheduleDayButton(props) {
  const [isFinished, setIsFinished] = useState(props.isFinished);

  const [isDatePassed, setIsDatePassed] = useState(false);
  let {completionDate} = props;
  useEffect(() => {
    let date = Date.parse(completionDate);
    let today = new Date();
    today = Date.parse(today);
    setIsDatePassed(date < today);
  }, [completionDate]);

  function onPress(press) {
    press(status => setIsFinished(status));
  }

  return (
    <CustomButton
      style={[
        style.columnContainer,
        props.style,
        {
          display: isFinished && props.completedHidden ? 'none' : '',
        },
      ]}
      onPress={() => onPress(props.onPress)}
      onLongPress={() => onPress(props.onLongPress)}>
      <View style={{...style.rowContainer}}>
        <CheckBox
          containerStyle={style.checkBox}
          checked={isFinished}
          left
          onPress={() => onPress(props.onLongPress)}
          checkedColor={colors.lightGray}
          uncheckedColor={colors.lightGray}
        />
        <Text
          style={[
            styles.buttonText,
            props.textStyle,
            {
              color: !isDatePassed || isFinished ? colors.lightGray : '#f00',
            },
          ]}>
          {props.completionDate}
        </Text>
      </View>
      <Text
        style={[
          styles.buttonText,
          style.readingPortion,
          props.textStyle,
          {
            color: !isFinished ? colors.darkGray : colors.lightGray,
            textDecorationLine: !isFinished ? 'none' : 'line-through',
          },
        ]}>
        {props.readingPortion}
      </Text>
    </CustomButton>
  );
}

const style = StyleSheet.create({
  checkBox: {
    margin: 0,
    padding: 0,
  },
  columnContainer: {
    alignItems: 'stretch',
    flexDirection: 'column',
    justifyContent: 'space-around',
  },
  rowContainer: {
    alignContent: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  readingPortion: {
    alignSelf: 'center',
    fontSize: 17,
  },
});
