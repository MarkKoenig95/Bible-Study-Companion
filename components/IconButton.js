import React from 'react';

import Icon from 'react-native-vector-icons/MaterialIcons';

import styles, {colors} from '../styles/styles';
import CustomButton from './CustomButton';

export default function IconButton(props) {
  const buttonBackground = styles.button.backgroundColor;
  const buttonText = styles.buttonText.color;

  const size = props.size || 5;

  const buttonStyle = {
    ...styles.button,
    ...props.buttonStyle,
    backgroundColor: !props.invertColor ? buttonBackground : colors.lightGray,
    borderRadius: size * 5,
    height: size * 10,
    width: size * 10,
    padding: size * 2,
    margin: size * 2,
  };

  const iconStyle = {
    ...styles.buttonText,
    ...props.iconStyle,
    fontSize: size * 6,
    color: !props.invertColor ? buttonText : buttonBackground,
  };

  return (
    <CustomButton style={buttonStyle} onPress={props.onPress}>
      <Icon style={iconStyle} name={props.name} />
    </CustomButton>
  );
}
