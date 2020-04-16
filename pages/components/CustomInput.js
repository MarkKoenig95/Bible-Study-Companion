import 'react-native-gesture-handler';
import React from 'react';
import { Text, TextInput, View } from 'react-native';

import styles, { colors } from '../styles/styles';

export default function CustomInput(props) {
  return (
    <View style={{ width: '90%', padding: 10, margin: 10 }}>
      <Text style={styles.text}>{props.title}</Text>
      <TextInput
        style={styles.input}
        onChangeText={text => props.onChange(text)}
        value={props.value}
        onBlur={() => {
          if (!props.value) {
            props.onChange(props.defaultValue);
          }
        }}
        onFocus={() => {
          if (!props.value || props.value === props.defaultValue) {
            props.onChange('');
          }
        }}
        defaultValue={props.defaultValue}
      />
    </View>
  );
}
