import React, {useContext, useEffect, useState} from 'react';
import {I18nManager, SafeAreaView, View, FlatList} from 'react-native';

import TextButton from '../components/buttons/TextButton';
import Text from '../components/text/Text';
import MessagePopup from '../components/popups/MessagePopup';

import styles from '../styles/styles';

import {translate, linkFormulator} from '../localization/localization';

import {store} from '../data/Store/store.js';
import {
  setFirstRender,
  setQryMaxVerses,
  setTblVerseIndex,
} from '../data/Store/actions';
import {openTable} from '../data/Database/generalTransactions';

export default function Home(props) {
  const navigation = props.navigation;
  const globalState = useContext(store);

  console.log(
    linkFormulator(
      'www',
      'library',
      'bible',
      'nwt',
      'introduction',
      'how-to-read-the-bible',
    ),
  );

  const {dispatch} = globalState;
  const {db, isFirstRender, qryMaxVerses, tblVerseIndex} = globalState.state;

  return (
    <SafeAreaView style={styles.container}>
      <TextButton
        text={translate('schedules')}
        onPress={() => navigation.navigate('Schedules')}
      />
      <View style={styles.footer}>
        <Text>Footer</Text>
      </View>
    </SafeAreaView>
  );
}
