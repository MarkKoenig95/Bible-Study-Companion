import 'react-native-gesture-handler';
import React from 'react';
import {StyleSheet, TextInput, View} from 'react-native';

import Text from '../text/Text';

import styles, {colors} from '../../styles/styles';

export default function CustomInput(props) {
  let hasDescription = props.description ? true : false;
  return (
    <View style={{...styles.inputContainer, ...props.containerStyle}}>
      {props.title && (
        <Text style={{...styles.lightText, ...props.titleStyle}}>
          {props.title}
        </Text>
      )}
      <View style={style.inputContainer}>
        <TextInput
          placeholderTextColor={colors.gray}
          style={[styles.input, props.inputStyle]}
          onBlur={() => {
            if (!props.value) {
              props.onChangeText(props.defaultValue);
            }
          }}
          onFocus={() => {
            if (!props.value || props.value === props.defaultValue) {
              props.onChangeText('');
            }
          }}
          {...props}
        />
        {hasDescription && (
          <Text style={style.placeholderText}>{props.description}</Text>
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
