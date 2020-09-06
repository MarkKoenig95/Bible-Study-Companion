import React, {useEffect, useState} from 'react';
import {StyleSheet, View} from 'react-native';

import CheckBox from './CheckBox';
import CustomButton from './CustomButton';
import Text from '../text/Text';

import styles, {colors} from '../../styles/styles';
import {formatDate} from '../../data/Database/generalTransactions';

const ScheduleDayButton = React.memo(props => {
  let {completionDate, update, isFinished} = props;

  const [isFinishedState, setIsFinishedState] = useState(isFinished);
  const [isDatePassed, setIsDatePassed] = useState(false);

  const display = isFinishedState && props.completedHidden ? 'none' : 'flex';
  const color = !isDatePassed || isFinishedState ? colors.lightGray : '#f00';
  const hasTitle = props.title ? true : false;

  useEffect(() => {
    let date = Date.parse(completionDate);
    let today = new Date();
    today = Date.parse(formatDate(today));
    setIsDatePassed(date < today);
    if (isFinishedState !== isFinished) {
      setIsFinishedState(isFinished);
    }
    //In order to achieve the desired result we do not want to run this when
    //the isFinishedState is changed
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [completionDate, isFinished, update]);

  function onPress(press) {
    press(status => {
      setIsFinishedState(status);
    });
  }

  return (
    <CustomButton
      style={[style.columnContainer, props.style, {display: display}]}
      onPress={() => onPress(props.onPress)}
      onLongPress={() => onPress(props.onLongPress)}>
      <View style={{...style.rowContainer}}>
        <CheckBox
          checked={isFinishedState}
          onPress={() => onPress(props.onLongPress)}
          checkedColor={colors.lightGray}
          uncheckedColor={colors.lightGray}
        />
        {hasTitle && (
          <Text
            style={[
              styles.buttonText,
              props.textStyle,
              {
                color: colors.lightGray,
                fontWeight: 'bold',
              },
            ]}>
            {props.title}
          </Text>
        )}
        <Text
          style={[
            styles.buttonText,
            props.textStyle,
            {
              color: color,
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
            color: !isFinishedState ? colors.darkGray : colors.lightGray,
            textDecorationLine: !isFinishedState ? 'none' : 'line-through',
          },
        ]}>
        {props.readingPortion}
      </Text>
    </CustomButton>
  );
});

export default ScheduleDayButton;

const style = StyleSheet.create({
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
