import 'react-native-gesture-handler';
import React from 'react';
import {StyleSheet, TextInput, View} from 'react-native';

import Text from '../text/Text';

import styles, {colors} from '../../styles/styles';

export default function CustomInput(props) {
  const {
    containerStyle,
    defaultValue,
    description,
    inputStyle,
    onChangeText,
    testID,
    title,
    titleStyle,
    value,
  } = props;

  let hasDescription = description ? true : false;
  return (
    <View style={{...styles.inputContainer, ...containerStyle}}>
      {title && (
        <Text style={{...styles.lightText, ...titleStyle}}>{title}</Text>
      )}
      <View style={style.inputContainer}>
        <TextInput
          testID={testID}
          placeholderTextColor={colors.gray}
          style={[styles.input, inputStyle]}
          onBlur={() => {
            if (!value) {
              onChangeText(defaultValue);
            }
          }}
          onFocus={() => {
            if (!value || value === defaultValue) {
              onChangeText('');
            }
          }}
          {...props}
        />
        {hasDescription && (
          <Text style={style.placeholderText}>{description}</Text>
        )}
      </View>
    </View>
  );
}

const style = StyleSheet.create({
  inputContainer: {
    alignContent: 'center',
    backgroundColor: colors.smoke + '50',
    borderRadius: 10,
    flexDirection: 'row',
    marginTop: 5,
    width: '100%',
  },
  placeholderText: {
    color: colors.smoke,
    height: 40,
    marginTop: 5,
    marginLeft: 10,
    textAlignVertical: 'center',
    width: '75%',
  },
});
