import React, {useContext, useEffect, useState} from 'react';
import {SafeAreaView, View, FlatList} from 'react-native';

import TextButton from '../components/buttons/TextButton';
import Text from '../components/text/Text';
import IconButton from '../components/buttons/IconButton';
import CreateSchedulePopup from '../components/popups/CreateSchedulePopup';
import MessagePopup from '../components/popups/MessagePopup';

import styles from '../styles/styles';
import {store} from '../data/Store/store.js';
import {
  setFirstRender,
  setQryMaxVerses,
  setTblVerseIndex,
} from '../data/Store/actions';
import {openTable} from '../data/Database/generalTransactions';
import {addSchedule} from '../data/Database/scheduleTransactions';

function Home(props) {
  const navigation = props.navigation;
  const globalState = useContext(store);

  const {dispatch} = globalState;
  const {db, isFirstRender, qryMaxVerses, tblVerseIndex} = globalState.state;
  return <Text>Hello</Text>;
}
