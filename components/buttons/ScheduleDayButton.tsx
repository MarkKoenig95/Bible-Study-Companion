import React, {useCallback, useEffect, useRef, useState} from 'react';
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
  isDelayed?: boolean;
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
    isDelayed,
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
  const [key, setKey] = useState(testID + completionDate);
  const isIsFinishedStateSet = useRef(false);

  const display = isFinishedState && completedHidden ? 'none' : 'flex';
  const color = !isDatePassed || isFinishedState ? colors.lightGray : '#f00';
  const hasTitle = title ? true : false;

  useEffect(() => {
    setKey(testID + completionDate);
    isIsFinishedStateSet.current = false;
  }, [completionDate, testID]);

  useEffect(() => {
    let date = completionDate;
    let today = new Date();
    date.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);
    setCompDate(formatDate(date));
    setIsDatePassed(date.getTime() < today.getTime());

    if (isIsFinishedStateSet.current && isFinished === isFinishedState) {
      isIsFinishedStateSet.current = false;
    }

    if (!isIsFinishedStateSet.current && isFinished !== isFinishedState) {
      setIsFinishedState(isFinished);
    }
  }, [
    completionDate,
    isFinished,
    isFinishedState,
    isIsFinishedStateSet,
    testID,
    update,
  ]);

  const _handlePress = useCallback(() => {
    onPress();

    if (isDelayed) return;

    setIsFinishedState(!isFinishedState);
    isIsFinishedStateSet.current = true;
  }, [isDelayed, isFinishedState, onPress]);

  const _handleLongPress = useCallback(() => {
    setIsFinishedState(!isFinishedState);
    isIsFinishedStateSet.current = true;
    onLongPress();
  }, [isFinishedState, isIsFinishedStateSet, onLongPress]);

  return (
    <CustomButton
      key={key}
      testID={testID}
      style={[style.columnContainer, style, {display: display}]}
      onPress={_handlePress}
      onLongPress={_handleLongPress}
      // NOTE: Use this for sizing (For instance with the FlatList component
      // onLayout={(event: {
      //   nativeEvent: {
      //     layout: {x: number; y: number; width: number; height: number};
      //   };
      // }) => {
      //   let {x, y, width, height} = event.nativeEvent.layout;
      //   console.log('layout', x, y, width, height);
      // }}
    >
      <View style={style.rowContainer}>
        <CheckBox
          testID={testID + '.checkBox'}
          containerStyle={style.checkBox}
          checked={isFinishedState}
          onPress={_handleLongPress}
          checkedColor={colors.lightGray}
          uncheckedColor={colors.lightGray}
        />
        {hasTitle && (
          <Text style={[styles.buttonText, textStyle, style.title]}>
            {title}
          </Text>
        )}
        <Text
          testID={testID + '.completionDate'}
          style={[
            styles.buttonText,
            textStyle,
            style.date,
            {
              color: color,
            },
          ]}>
          {doesTrack ? compDate : ''}
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
  checkBox: {position: 'absolute', left: 0},
  columnContainer: {
    alignItems: 'stretch',
    flexDirection: 'column',
    justifyContent: 'space-around',
  },
  date: {
    position: 'absolute',
    right: 0,
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
  title: {
    color: colors.lightGray,
    fontWeight: 'bold',
    textAlign: 'center',
    width: '100%',
  },
});
