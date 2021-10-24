import React from 'react';
import {TouchableOpacity, View, StyleSheet} from 'react-native';

import Icon from 'react-native-vector-icons/FontAwesome';
import Text from '../text/Text';

import styles, {colors} from '../../styles/styles';

//Font awesome
const checkedIcon = 'check-square-o';
const uncheckedIcon = 'square-o';

export default function CheckBox(props) {
  const {checked, containerStyle, onPress, size, testID, title} = props;
  const checkedColor = props.checkedColor || colors.darkBlue;
  const uncheckedColor = props.uncheckedColor || colors.darkBlue;

  const iconName = checked ? checkedIcon : uncheckedIcon;
  const iconColor = checked ? checkedColor : uncheckedColor;
  const hasTitle = title ? true : false;
  return (
    <TouchableOpacity testID={testID} onPress={onPress}>
      <View style={[containerStyle, style.container]}>
        <Icon name={iconName} color={iconColor} size={size || 25} />
        {hasTitle && <Text style={style.title}>{title}</Text>}
      </View>
    </TouchableOpacity>
  );
}

const style = StyleSheet.create({
  title: {...styles.lightText, padding: 10, fontWeight: 'bold'},
  container: {
    alignItems: 'center',
    flexDirection: 'row',
    paddingLeft: 5,
  },
});
