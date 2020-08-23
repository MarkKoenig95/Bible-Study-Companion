import React, {useContext, useEffect, useState} from 'react';
import {SafeAreaView, View} from 'react-native';

import IconButton from '../components/buttons/IconButton';
import TextButton from '../components/buttons/TextButton';
import {SubHeading} from '../components/text/Text';

import styles from '../styles/styles';

import {translate} from '../logic/localization/localization';

import {store} from '../data/Store/store.js';

import {useUpdate} from '../logic/logic';

const prefix = 'TEMPLATE_Page.';

export default function TEMPLATE(props) {
  console.log('loaded TEMPLATE page');
  const navigation = props.navigation;
  const globalState = useContext(store);

  const {dispatch} = globalState;
  const {userDB, bibleDB, updatePages} = globalState.state;

  const afterUpdate = useUpdate(updatePages, dispatch);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <SubHeading>Header</SubHeading>
      </View>
      <View style={styles.content}>
        <SubHeading>Content</SubHeading>
      </View>
    </SafeAreaView>
  );
}
