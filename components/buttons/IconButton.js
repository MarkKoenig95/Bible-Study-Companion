import React from 'react';

import {View} from 'react-native';

import Icon from 'react-native-vector-icons/MaterialIcons';

import Text from '../text/Text';

import styles, {colors} from '../../styles/styles';
import CustomButton from './CustomButton';

export default function IconButton(props) {
  const hasTitle = props.title ? true : false;

  const buttonBackground = !props.invertColor
    ? styles.button.backgroundColor
    : colors.lightGray;

  const buttonText = !props.invertColor
    ? styles.buttonText.color
    : styles.button.backgroundColor;

  const size = props.size || 5;

  const buttonStyle = {
    ...styles.button,
    backgroundColor: !props.iconOnly ? buttonBackground : 'transparent',
    borderRadius: size * 5,
    height: size * 10,
    width: size * 10,
    padding: size * 2,
    margin: size * 2,
    ...props.buttonStyle,
  };

  const containerStyle = {
    backgroundColor: !props.iconOnly ? buttonBackground : 'transparent',
    padding: 2,
    margin: 2,
    marginTop: 5,
    ...props.buttonStyle,
  };

  const iconStyle = {
    ...styles.buttonText,
    color: buttonText,
    fontSize: size * 6,
    ...props.textStyle,
    ...props.iconStyle,
  };

  const titleStyle = {
    ...styles.buttonText,
    alignSelf: 'center',
    color: buttonText,
    fontSize: size * 3,
    ...props.textStyle,
    ...props.titleStyle,
  };

  return (
    <View>
      <CustomButton
        style={!hasTitle ? buttonStyle : containerStyle}
        onPress={props.onPress}>
        <Icon style={iconStyle} name={props.name} />
      </CustomButton>
      {hasTitle && <Text style={titleStyle}>{props.title}</Text>}
    </View>
  );
}
