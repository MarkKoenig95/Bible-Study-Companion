import React from 'react';
import {SafeAreaView, ScrollView} from 'react-native';

import styles, {colors} from '../styles/styles';

import {translate} from '../logic/localization/localization';
import {SettingsWrapper} from '../components/SettingsWrapper';

const prefix = 'morePage.';

export default function More(props) {
  console.log('loaded more page');
  const navigation = props.navigation;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.contentWithoutHeader}>
        <SettingsWrapper
          iconName="alarm"
          onPress={() => navigation.navigate('Notifications', {})}
          text={translate('notificationsPage.title')}
        />
        <SettingsWrapper
          iconName="check-box"
          onPress={() => navigation.navigate('Reminders', {})}
          text={translate('remindersPage.title')}
        />
        <SettingsWrapper
          iconName="settings"
          onPress={() => navigation.navigate('Settings', {})}
          text={translate('settingsPage.title')}
        />
      </ScrollView>
    </SafeAreaView>
  );
}
