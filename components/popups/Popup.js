import React, {useEffect, useRef, useState} from 'react';
import {
  Animated,
  Keyboard,
  Modal,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';

import IconButton from '../buttons/IconButton';
import Text from '../text/Text';

import styles, {colors} from '../../styles/styles';

export default function Popup(props) {
  useEffect(() => {
    Keyboard.addListener('keyboardDidShow', _keyboardDidShow);
    Keyboard.addListener('keyboardDidHide', _keyboardDidHide);

    return () => {
      Keyboard.removeListener('keyboardDidShow', _keyboardDidShow);
      Keyboard.removeListener('keyboardDidHide', _keyboardDidHide);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [justifyContent, setJustifyContent] = useState('center');
  const display = !props.displayPopup ? 'none' : 'flex';

  const _keyboardDidShow = () => {
    setJustifyContent('flex-start');
  };

  const _keyboardDidHide = () => {
    setJustifyContent('center');
  };
  return (
    <View
      style={[
        styles.background,
        {
          display: display,
          justifyContent: justifyContent,
        },
      ]}>
      <View style={[styles.popup, props.style]}>
        <View style={style.title}>
          <Text style={style.text}>{props.title}</Text>
          <IconButton name="close" invertColor onPress={props.onClosePress} />
        </View>
        <ScrollView
          keyboardShouldPersistTaps="handled"
          style={style.content}
          contentContainerStyle={style.contentContainer}>
          {props.children}
        </ScrollView>
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
    alignContent: 'center',
    flexDirection: 'column',
    marginTop: 60,
    marginBottom: 10,
    width: '100%',
  },
  contentContainer: {
    alignContent: 'center',
    alignItems: 'center',
    flexDirection: 'column',
    justifyContent: 'space-around',
    padding: 10,
    maxWidth: '100%',
  },
  text: {
    ...styles.lightText,
    flex: 4,
    padding: 10,
    fontSize: 20,
    color: colors.darkGray,
  },
  title: {
    alignItems: 'center',
    backgroundColor: colors.smoke,
    flexDirection: 'row',
    height: 60,
    justifyContent: 'space-around',
    padding: 5,
    paddingLeft: 20,
    paddingRight: 20,
    position: 'absolute',
    top: 0,
    width: '100%',
  },
});
