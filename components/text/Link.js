import React from 'react';
import {Linking, TouchableOpacity, StyleSheet} from 'react-native';

import Text from '../text/Text';

import {colors} from '../../styles/styles';

export default function Link(props) {
  const {children, containerStyle, href, testID, text, textStyle} = props;
  const hasText = text ? true : false;

  return (
    <TouchableOpacity
      testID={testID}
      style={containerStyle}
      onPress={() => Linking.openURL(href)}>
      {hasText && <Text style={[style.link, textStyle]}>{text}</Text>}
      {children}
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
