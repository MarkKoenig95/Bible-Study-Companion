import React from 'react';
import {View} from 'react-native';

import IconButton from '../../components/buttons/IconButton';
import TextButton from '../../components/buttons/TextButton';
import Text from '../../components/text/Text';

import styles from '../../styles/styles';

import {translate} from '../../localization/localization';

export default function Footer({navigation}) {
  function goHome() {
    navigation.navigate('Home');
  }
  function goToSchedules() {
    navigation.navigate('Schedules');
  }
  return (
    <View style={styles.footer}>
      <IconButton iconOnly invertColor onPress={goHome} name="home" />
      <IconButton iconOnly invertColor onPress={goToSchedules} name="list" />
    </View>
  );
}
