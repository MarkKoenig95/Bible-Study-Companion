import React, {useEffect, useRef} from 'react';
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
  const yTransform = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Keyboard.addListener('keyboardDidShow', _keyboardDidShow);
    Keyboard.addListener('keyboardDidHide', _keyboardDidHide);

    return () => {
      Keyboard.removeListener('keyboardDidShow', _keyboardDidShow);
      Keyboard.removeListener('keyboardDidHide', _keyboardDidHide);
    };
  }, []);

  const _keyboardDidShow = () => {
    Animated.timing(yTransform, {
      toValue: -60,
      duration: 200,
      useNativeDriver: true,
    }).start();
  };

  const _keyboardDidHide = () => {
    Animated.timing(yTransform, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start();
  };
  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={props.displayPopup}>
      <View style={styles.background}>
        <Animated.View
          style={{
            transform: [{translateY: yTransform}],
          }}>
          <View
            style={{
              ...styles.popup,
              ...props.style,
            }}>
            <View style={style.title}>
              <Text style={style.text}>{props.title}</Text>
              <IconButton
                name="close"
                invertColor
                onPress={props.onClosePress}
              />
            </View>
            <ScrollView
              keyboardShouldPersistTaps="handled"
              style={style.content}
              contentContainerStyle={style.contentContainer}>
              {props.children}
            </ScrollView>
          </View>
        </Animated.View>
      </View>
    </Modal>
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
    padding: 5,
    paddingLeft: 20,
    paddingRight: 20,
    position: 'absolute',
    top: 0,
    width: '100%',
  },
});
