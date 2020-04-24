import React, {useContext, useState, useEffect} from 'react';
import {StyleSheet, SafeAreaView, View, Text, FlatList} from 'react-native';
import {StackActions} from '@react-navigation/native';

import ScheduleDayButton from '../components/ScheduleDayButton';
import IconButton from '../components/IconButton';
import {CheckBox} from 'react-native-elements';

import styles from '../styles/styles';
import {store} from '../data/Store/store.js';
import {
  openTable,
  deleteSchedule,
  updateReadStatus,
  formatTableName,
} from '../data/Database/generalTransactions';

function loadData(db, setState, tableName) {
  openTable(db, tableName, function(txn, res) {
    txn.executeSql('SELECT * FROM ' + tableName, [], (txn, results) => {
      var temp = [];

      for (let i = 0; i < results.rows.length; ++i) {
        temp.push(results.rows.item(i));
      }

      setState(temp);
    });
  });
}

function SchedulePage(props) {
  const globalState = useContext(store);
  const {db} = globalState.state;

  const [flatListItems, setFlatListItems] = useState([]);

  const [completedHidden, setCompletedHidden] = useState(false);

  const scheduleName = props.route.params.name;

  const tableName = formatTableName(scheduleName);

  useEffect(() => {
    const interval = setInterval(() => {
      loadData(db, setFlatListItems, tableName);
    }, 200);
    return () => clearInterval(interval);
  }, [db, tableName]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <CheckBox
          left
          containerStyle={style.checkBox}
          title="Hide Completed"
          checked={completedHidden}
          onPress={() => {
            setCompletedHidden(!completedHidden);
          }}
        />
        <IconButton
          name="delete"
          color={styles.button.backgroundColor}
          onPress={() => {
            props.navigation.dispatch(StackActions.pop(1));
            deleteSchedule(db, tableName, scheduleName);
          }}
        />
      </View>
      <View style={styles.content}>
        <FlatList
          data={flatListItems}
          keyExtractor={(item, index) => index.toString()}
          renderItem={({item}) => (
            <ScheduleDayButton
              key={item.ReadingDayID}
              readingPortion={item.ReadingPortion}
              completedHidden={completedHidden}
              isFinished={item.IsFinished}
              onPress={cb => {
                updateReadStatus(
                  db,
                  tableName,
                  item.ReadingDayID,
                  !item.IsFinished,
                );
                cb(!item.IsFinished);
              }}
            />
          )}
        />
      </View>
      <View style={styles.footer} />
    </SafeAreaView>
  );
}

const style = StyleSheet.create({
  checkBox: {
    ...styles.button,
    backgroundColor: 'transparent',
    borderWidth: 0,
  },
});

export default SchedulePage;
