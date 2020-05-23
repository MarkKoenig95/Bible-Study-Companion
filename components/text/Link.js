import React from 'react';
import {Linking, Text, TouchableOpacity, StyleSheet} from 'react-native';

import {colors} from '../../styles/styles';

export default function Link(props) {
  return (
    <TouchableOpacity onPress={() => Linking.openURL(props.href)}>
      {props.text && (
        <Text style={[style.link, props.style]}>{props.text}</Text>
      )}
      {props.children}
    </TouchableOpacity>
  );
}

const style = StyleSheet.create({
  link: {
    color: colors.darkBlue,
    fontSize: 20,
    paddingLeft: 10,
    textDecorationLine: 'underline',
  },
});
