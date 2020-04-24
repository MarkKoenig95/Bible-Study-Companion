import 'react-native-gesture-handler';
import React from 'react';
import {StyleSheet, Text, TextInput, View} from 'react-native';

import styles from '../styles/styles';

export default function CustomInput(props) {
  return (
    <View style={{...style.container, ...props.containerStyle}}>
      {props.title && (
        <Text style={{...styles.text, ...props.titleStyle}}>{props.title}</Text>
      )}
      <TextInput
        style={styles.input}
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
    </View>
  );
}

const style = StyleSheet.create({
  container: {
    width: '90%',
    padding: 10,
    paddingBottom: 5,
  },
});
