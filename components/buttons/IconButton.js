import React from 'react';

import {View} from 'react-native';

import Icon from 'react-native-vector-icons/MaterialIcons';

import Text from '../text/Text';

import styles, {colors} from '../../styles/styles';
import CustomButton from './CustomButton';

export default function IconButton(props) {
  //Props
  const {
    buttonStyle,
    iconOnly,
    iconStyle,
    invertColor,
    name,
    onPress,
    testID,
    textStyle,
    title,
    titleStyle,
  } = props;
  const size = props.size || 5;
  //End props

  const hasTitle = title ? true : false;

  //Styles based on given size
  const buttonBackground = !invertColor
    ? styles.button.backgroundColor
    : colors.lightGray;

  const buttonText = !invertColor
    ? styles.buttonText.color
    : styles.button.backgroundColor;

  const thisButtonStyle = {
    ...styles.button,
    backgroundColor: !iconOnly ? buttonBackground : 'transparent',
    borderRadius: size * 5,
    height: size * 10,
    elevation: 0,
    width: size * 10,
    padding: size * 2,
    margin: size * 2,
    ...buttonStyle,
  };

  const containerStyle = {
    backgroundColor: !iconOnly ? buttonBackground : 'transparent',
    padding: 2,
    margin: 2,
    marginTop: 5,
    ...buttonStyle,
  };

  const thisIconStyle = {
    ...styles.buttonText,
    color: buttonText,
    fontSize: size * 6,
    ...textStyle,
    ...iconStyle,
  };

  const thisTitleStyle = {
    ...styles.buttonText,
    alignSelf: 'center',
    color: buttonText,
    fontSize: size * 3,
    ...textStyle,
    ...titleStyle,
  };

  return (
    <View>
      <CustomButton
        testID={testID}
        style={!hasTitle ? thisButtonStyle : containerStyle}
        onPress={onPress}>
        <Icon style={thisIconStyle} name={name} />
      </CustomButton>
      {hasTitle && <Text style={thisTitleStyle}>{title}</Text>}
    </View>
  );
}
