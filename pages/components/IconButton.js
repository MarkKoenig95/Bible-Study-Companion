import React from 'react';
import TextButton from './TextButton';

export default function IconButton(props) {
  const size = props.size || 5;
  const buttonStyle = {
    ...props.buttonStyle,
    borderRadius: size * 5,
    height: size * 10,
    width: size * 10,
    padding: size,
    margin: 10,
  };

  return (
    <TextButton
      buttonStyle={buttonStyle}
      textStyle={[props.textStyle, {fontSize: size * 6}]}
      text={props.icon}
      onPress={props.onPress}
    />
  );
}
