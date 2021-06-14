import React, {useEffect, useState} from 'react';
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

  const display = isFinished && completedHidden ? 'none' : 'flex';
  const color = !isDatePassed || isFinished ? colors.lightGray : '#f00';
  const hasTitle = title ? true : false;

  useEffect(() => {
    let date = completionDate;
    let today = new Date();
    date.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);
    setCompDate(formatDate(date));
    setIsDatePassed(date.getTime() < today.getTime());
  }, [completionDate, update]);

  return (
    <CustomButton
      testID={testID}
      style={[style.columnContainer, style, {display: display}]}
      onPress={onPress}
      onLongPress={onLongPress}>
      <View style={{...style.rowContainer}}>
        <CheckBox
          testID={testID + '.checkBox'}
          checked={isFinished}
          onPress={onLongPress}
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
            color: !isFinished ? colors.darkGray : colors.lightGray,
            textDecorationLine: !isFinished ? 'none' : 'line-through',
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
