import React from 'react';

import Icon from 'react-native-vector-icons/MaterialIcons';

import styles, {colors} from '../../styles/styles';
import CustomButton from './CustomButton';

export default function IconButton(props) {
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

  const iconStyle = {
    ...styles.buttonText,
    color: buttonText,
    fontSize: size * 6,
    ...props.iconStyle,
  };

  return (
    <CustomButton style={buttonStyle} onPress={props.onPress}>
      <Icon style={iconStyle} name={props.name} />
    </CustomButton>
  );
}
