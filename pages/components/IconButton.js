import React from 'react';

import {Icon} from 'react-native-elements';

import styles, {colors} from '../styles/styles';

export default function IconButton(props) {
  const buttonBackground = styles.button.backgroundColor;
  const buttonText = styles.buttonText.color;

  return (
    <Icon
      reverse
      reverseColor={!props.invertColor ? buttonText : buttonBackground}
      name={props.name}
      type={props.type || 'material'}
      color={!props.invertColor ? buttonBackground : colors.lightGray}
      containerStyle={props.containerStyle}
      iconStyle={[{fontSize: 30}, props.iconStyle]}
      onPress={props.onPress}
    />
  );
}
