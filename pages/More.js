import React, {useContext} from 'react';
import {Linking, SafeAreaView, ScrollView} from 'react-native';

import styles from '../styles/styles';
import {translate} from '../logic/localization/localization';
import {store} from '../data/Store/store';

import SettingsWrapper from '../components/SettingsWrapper';
import {log} from '../data/Database/generalTransactions';

const pageTitle = 'morePage';

export default function More(props) {
  const {navigation} = props;

  log('loaded More page');
  const globalState = useContext(store);

  const {appVersion} = globalState.state;

  return (
    <SafeAreaView testID={pageTitle} style={styles.container}>
      <ScrollView style={styles.contentWithoutHeader}>
        <SettingsWrapper
          testID={pageTitle + '.notifications'}
          iconName="alarm"
          onPress={() => navigation.navigate('Notifications', {})}
          text={translate('notificationsPage.title')}
        />
        <SettingsWrapper
          testID={pageTitle + '.reminders'}
          iconName="check-box"
          onPress={() => navigation.navigate('Reminders', {})}
          text={translate('remindersPage.title')}
        />
        <SettingsWrapper
          testID={pageTitle + '.settings'}
          iconName="settings"
          onPress={() => navigation.navigate('Settings', {})}
          text={translate('settingsPage.title')}
        />
        <SettingsWrapper
          testID={pageTitle + '.contact'}
          iconName="mail-outline"
          text={translate(pageTitle + '.contact')}
          onPress={() => {
            Linking.openURL('mailto:humanappmaker@gmail.com');
          }}
        />
        <SettingsWrapper
          testID={pageTitle + '.about'}
          iconName="web"
          text={translate(pageTitle + '.about')}
          onPress={() => {
            Linking.openURL('https://app.biblesc.com');
          }}
        />
        <SettingsWrapper
          testID={pageTitle + '.donate'}
          iconName="favorite"
          onPress={() =>
            Linking.openURL('https://paypal.me/biblestudycompanion')
          }
          text={translate('donatePage.title')}
        />
        <SettingsWrapper
          testID={pageTitle + '.version'}
          noArrow
          iconName="settings"
          text={translate(pageTitle + '.version') + ':   ' + appVersion}
        />
      </ScrollView>
    </SafeAreaView>
  );
}
