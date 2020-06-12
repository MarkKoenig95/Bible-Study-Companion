import React from 'react';
import {View} from 'react-native';

import TextButton from '../components/buttons/TextButton';
import Text from '../components/text/Text';

import styles from '../styles/styles';

import {translate} from '../localization/localization';

export default function Footer({navigation}) {
  return (
    <View style={styles.footer}>
      <Text>Footer</Text>
    </View>
  );
}
