import React, {useState} from 'react';
import {Text} from 'react-native';
import CustomButton from './CustomButton';

import styles from '../styles/styles';

export default function ScheduleDayButton(props) {
  const [isFinished, setIsFinished] = useState(props.isFinished);

  function onPress() {
    props.onPress(status => setIsFinished(status));
  }
  return (
    <CustomButton style={props.style} onPress={onPress}>
      <Text
        style={[
          styles.text,
          {
            textDecorationLine: !isFinished ? 'none' : 'line-through',
            // display: !isFinished ? 'none' : 'line-through',
          },
        ]}>
        {props.readingPortion}
      </Text>
    </CustomButton>
  );
}
