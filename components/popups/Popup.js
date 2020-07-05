import React from 'react';
import {ScrollView, StyleSheet, View} from 'react-native';

import IconButton from '../buttons/IconButton';
import Text from '../text/Text';

import styles, {colors} from '../../styles/styles';

export default function Popup(props) {
  return (
    <View
      style={[styles.background, {display: !props.displayPopup ? 'none' : ''}]}>
      <View
        style={{
          ...styles.popup,
          ...props.style,
        }}>
        <View style={style.title}>
          <Text style={style.text}>{props.title}</Text>
          <IconButton name="close" invertColor onPress={props.onClosePress} />
        </View>
        {!props.flatView ? (
          <ScrollView
            style={style.content}
            contentContainerStyle={style.contentContainer}>
            {props.children}
          </ScrollView>
        ) : (
          <View style={[style.content, style.contentContainer]}>
            {props.children}
          </View>
        )}
      </View>
    </View>
  );
}
const style = StyleSheet.create({
  closeButton: {
    backgroundColor: colors.lightBlue,
  },
  buttonText: {
    color: colors.darkGray,
    fontWeight: 'bold',
  },
  content: {
    marginTop: 60,
    marginBottom: 10,
    width: '100%',
  },
  contentContainer: {
    alignItems: 'center',
    flexDirection: 'column',
    justifyContent: 'space-around',
    padding: 10,
  },
  text: {
    ...styles.lightText,
    flex: 4,
    padding: 10,
    fontSize: 25,
    color: colors.darkGray,
  },
  title: {
    alignItems: 'center',
    backgroundColor: colors.smoke,
    flexDirection: 'row',
    height: 60,
    justifyContent: 'space-around',
    padding: 10,
    position: 'absolute',
    top: 0,
    width: '100%',
  },
});
