import React from 'react';
import {StyleSheet, TouchableOpacity, View} from 'react-native';

import Icon from 'react-native-vector-icons/MaterialIcons';
import {LargeText} from '../components/text/Text';

import styles, {colors} from '../styles/styles';

export default function SettingsWrapper(props) {
  const {iconName, noArrow, testID, text} = props;
  const onPress = props.onPress ? props.onPress : () => {};
  const hasIcon = iconName ? true : false;
  const hasText = text ? true : false;
  return (
    <TouchableOpacity testID={testID} style={style.wrapper} onPress={onPress}>
      <View style={style.wrapperContent}>
        {(hasIcon || hasText) && (
          <View style={style.titleContent}>
            {hasIcon && <Icon style={style.icon} name={iconName} />}
            {hasText && <LargeText style={style.text}>{text}</LargeText>}
          </View>
        )}

        {!noArrow && <Icon style={style.icon} name={'chevron-right'} />}
      </View>

      {props.children}
    </TouchableOpacity>
  );
}

const style = StyleSheet.create({
  icon: {
    color: colors.darkBlue,
    fontSize: 30,
    padding: 10,
  },
  text: {color: colors.darkBlue, margin: 5},
  titleContent: {flexDirection: 'row', alignItems: 'center'},
  wrapper: {
    ...styles.wrapper,
    borderWidth: 0,
    borderRadius: 0,
    borderBottomWidth: 2,
    borderTopWidth: 2,
    width: '100%',
  },
  wrapperContent: {
    ...styles.wrapperContent,
    width: '90%',
  },
});
