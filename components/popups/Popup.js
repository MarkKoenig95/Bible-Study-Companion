import React, {useEffect, useState} from 'react';
import {Keyboard, ScrollView, StyleSheet, View} from 'react-native';

import IconButton from '../buttons/IconButton';
import Text from '../text/Text';

import styles, {colors} from '../../styles/styles';

export default function Popup(props) {
  const {children, displayPopup, onClosePress, testID, title} = props;
  const [spacing, setSpacing] = useState(0);

  useEffect(() => {
    let listeners = [
      Keyboard.addListener('keyboardDidShow', _keyboardDidShow),
      Keyboard.addListener('keyboardDidHide', _keyboardDidHide),
    ];

    return () => {
      listeners.forEach((listener) => listener?.remove?.());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [justifyContent, setJustifyContent] = useState('center');
  const display = !displayPopup ? 'none' : 'flex';

  const _keyboardDidShow = () => {
    setJustifyContent('flex-start');
    setSpacing(300);
  };

  const _keyboardDidHide = () => {
    setJustifyContent('center');
    setSpacing(0);
  };
  return (
    <View
      testID={testID}
      style={[
        styles.background,
        {
          display: display,
          justifyContent: justifyContent,
        },
      ]}>
      <View style={[styles.popup, style]}>
        <View style={style.title}>
          <Text style={style.text}>{title}</Text>
          <IconButton
            testID={testID + '.closeButton'}
            name="close"
            invertColor
            onPress={onClosePress}
          />
        </View>
        <ScrollView
          testID={testID + '.scrollView'}
          keyboardShouldPersistTaps="handled"
          style={style.content}
          contentContainerStyle={style.contentContainer}>
          {children}

          <View testID={testID + '.view'} style={{height: spacing}} />
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
