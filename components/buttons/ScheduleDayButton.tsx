import React, {
  Dispatch,
  SetStateAction,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
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
  readingPortionWidth: number;
  setReadingPortionWidth: Dispatch<SetStateAction<number>>;
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
    readingPortionWidth,
    setReadingPortionWidth,
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
      // NOTE: Use this for sizing (For instance with the FlatList component
      onLayout={(event: {
        nativeEvent: {
          layout: {x: number; y: number; width: number; height: number};
        };
      }) => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        let {x, y, width, height} = event.nativeEvent.layout;
        if (
          !readingPortionWidth &&
          typeof setReadingPortionWidth === 'function'
        ) {
          setReadingPortionWidth(width - 90);
        }
      }}
      onLongPress={_handleLongPress}>
      <View style={[style.rowContainer, {width: '100%'}]}>
        <View style={[style.columnContainer, {alignItems: 'flex-start'}]}>
          {hasTitle && <Text style={[textStyle, style.title]}>{title}</Text>}
          <Text
            testID={testID + '.readingPortion'}
            style={[
              style.readingPortion,
              textStyle,
              {
                color: !isFinishedState ? colors.darkGray : colors.lightGray,
                textDecorationLine: !isFinishedState ? 'none' : 'line-through',
                width: readingPortionWidth || 'auto',
              },
            ]}>
            {readingPortion}
          </Text>
        </View>
        <View style={[style.columnContainer, {alignItems: 'flex-end'}]}>
          <Text
            testID={testID + '.completionDate'}
            style={[
              styles.buttonText,
              textStyle,
              {
                color: color,
              },
            ]}>
            {doesTrack ? compDate : ' '}
          </Text>
          <CheckBox
            testID={testID + '.checkBox'}
            checked={isFinishedState}
            onPress={_handleLongPress}
            checkedColor={colors.lightGray}
            uncheckedColor={colors.lightGray}
          />
        </View>
      </View>
    </CustomButton>
  );
});

export default ScheduleDayButton;

const style = StyleSheet.create({
  columnContainer: {
    flexDirection: 'column',
    justifyContent: 'space-around',
  },
  rowContainer: {
    flexDirection: 'row',
    flexWrap: 'nowrap',
    justifyContent: 'space-between',
    paddingLeft: 10,
    paddingRight: 10,
  },
  readingPortion: {
    fontSize: 19,
  },
  title: {
    color: colors.lightGray,
    fontWeight: 'bold',
  },
});
