import React, {useCallback, useEffect, useState} from 'react';
import {StyleSheet, TextStyle, View} from 'react-native';

import CheckBox from './CheckBox';
import CustomButton from './CustomButton';
import Text from '../text/Text';

import styles, {colors} from '../../styles/styles';
import {formatDate} from '../../data/Database/generalTransactions';

interface ScheduleDayButtonProps {
  completedHidden: boolean;
  completionDate: Date;
  doesTrack: boolean;
  isFinished: boolean;
  onLongPress: () => void;
  onPress: () => void;
  readingPortion: string;
  testID: string;
  textStyle?: TextStyle;
  title: string;
  update: number;
}
let isFinishedStateIsSet = false;

const ScheduleDayButton = React.memo((props: ScheduleDayButtonProps) => {
  const {
    completedHidden,
    completionDate,
    doesTrack,
    isFinished,
    onLongPress,
    onPress,
    readingPortion,
    testID,
    textStyle,
    title,
    update,
  } = props;

  const [isDatePassed, setIsDatePassed] = useState(false);
  const [compDate, setCompDate] = useState(formatDate(completionDate));
  const [isFinishedState, setIsFinishedState] = useState(isFinished);

  const display = isFinishedState && completedHidden ? 'none' : 'flex';
  const color = !isDatePassed || isFinishedState ? colors.lightGray : '#f00';
  const hasTitle = title ? true : false;

  useEffect(() => {
    let date = completionDate;
    let today = new Date();
    date.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);
    setCompDate(formatDate(date));
    setIsDatePassed(date.getTime() < today.getTime());
    if (isFinishedStateIsSet && isFinished === isFinishedState) {
      isFinishedStateIsSet = false;
    }
    if (!isFinishedStateIsSet) {
      setIsFinishedState(isFinished);
    }
  }, [completionDate, isFinished, isFinishedState, update]);

  const _handlePress = useCallback(() => {
    setIsFinishedState(!isFinishedState);
    isFinishedStateIsSet = true;
    onPress();
  }, [isFinishedState, onPress]);

  const _handleLongPress = useCallback(() => {
    setIsFinishedState(!isFinishedState);
    isFinishedStateIsSet = true;
    onLongPress();
  }, [isFinishedState, onLongPress]);

  return (
    <CustomButton
      testID={testID}
      style={[style.columnContainer, style, {display: display}]}
      onPress={_handlePress}
      onLongPress={_handleLongPress}>
      <View style={{...style.rowContainer}}>
        <CheckBox
          testID={testID + '.checkBox'}
          checked={isFinishedState}
          onPress={_handleLongPress}
          checkedColor={colors.lightGray}
          uncheckedColor={colors.lightGray}
        />
        {hasTitle && (
          <Text
            style={[
              styles.buttonText,
              textStyle,
              {
                color: colors.lightGray,
                fontWeight: 'bold',
              },
            ]}>
            {title}
          </Text>
        )}
        <Text
          testID={testID + '.completionDate'}
          style={[
            styles.buttonText,
            textStyle,
            {
              color: color,
            },
          ]}>
          {doesTrack ? compDate : '      '}
        </Text>
      </View>
      <Text
        testID={testID + '.readingPortion'}
        style={[
          styles.buttonText,
          style.readingPortion,
          textStyle,
          {
            color: !isFinishedState ? colors.darkGray : colors.lightGray,
            textDecorationLine: !isFinishedState ? 'none' : 'line-through',
          },
        ]}>
        {readingPortion}
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
