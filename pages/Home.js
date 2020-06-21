import React, {useContext, useEffect, useState} from 'react';
import {SafeAreaView, View, FlatList} from 'react-native';

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

  const {dispatch} = globalState;
  const {db, isFirstRender} = globalState.state;

  useEffect(() => {
    if (isFirstRender) {
      dispatch(setFirstRender(false));
      runQueries();
    }
  });

  function runQueries() {
    db.transaction(
      txn => {
        let sql = `SELECT BookName, Verse, Chapter, BibleBook
                    FROM tblVerseIndex
                    INNER JOIN tblBibleBooks on tblBibleBooks.BibleBookID = tblVerseIndex.BibleBook;`;
        txn.executeSql(sql, [], (txn, tblVerseIndex) => {
          txn.executeSql(
            'SELECT * FROM qryMaxVerses',
            [],
            (txn, qryMaxVerses) => {
              dispatch(setQryMaxVerses(qryMaxVerses));
              dispatch(setTblVerseIndex(tblVerseIndex));
            },
          );
        });
      },
      err => {
        console.log('SQL Error: ' + err.message);
      },
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Text>To-Do</Text>
    </SafeAreaView>
  );
}
