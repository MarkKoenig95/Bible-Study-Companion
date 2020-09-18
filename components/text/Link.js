import React from 'react';
import {Linking, TouchableOpacity, StyleSheet} from 'react-native';

import Text from '../text/Text';

import {colors} from '../../styles/styles';

export default function Link(props) {
  const {containerStyle, href, text, textStyle} = props;
  const hasText = text ? true : false;

  return (
    <TouchableOpacity
      style={containerStyle}
      onPress={() => Linking.openURL(href)}>
      {hasText && <Text style={[style.link, textStyle]}>{text}</Text>}
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
