import React, {useState} from 'react';
import {Text} from 'react-native';
import CustomButton from './CustomButton';

import {colors} from '../styles/styles';

export default function ScheduleDayButton(props) {
  const [isFinished, setIsFinished] = useState(props.isFinished);

  function onPress() {
    props.onPress(status => setIsFinished(status));
  }

  return (
    <CustomButton
      style={
        (props.style,
        {
          display: isFinished && props.completedHidden ? 'none' : '',
        })
      }
      onPress={onPress}>
      <Text
        style={[
          props.textStyle,
          {
            color: colors.darkGray,
            textDecorationLine: !isFinished ? 'none' : 'line-through',
          },
        ]}>
        {props.readingPortion}
      </Text>
    </CustomButton>
  );
}
