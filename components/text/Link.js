import React from 'react';
import {Linking, TouchableOpacity, StyleSheet} from 'react-native';

import Text from '../text/Text';

import {colors} from '../../styles/styles';

export default function Link(props) {
  const hasText = props.text ? true : false;

  return (
    <TouchableOpacity
      style={props.containerStyle}
      onPress={() => Linking.openURL(props.href)}>
      {hasText && (
        <Text style={[style.link, props.textStyle]}>{props.text}</Text>
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
    paddingBottom: 10,
  },
});
