import React, {useState, useEffect} from 'react';
import {SafeAreaView, View, Text, FlatList} from 'react-native';
import {StackActions} from '@react-navigation/native';

import ScheduleDayButton from './components/ScheduleDayButton';
import IconButton from './components/IconButton';
import {CheckBox} from 'react-native-elements';

import styles from './styles/styles';
import Database from '../scripts/Database/Database';
import {
  openTable,
  deleteSchedule,
  updateReadStatus,
  formatTableName,
} from '../scripts/Database/generalTransactions';

const db = Database.getConnection();

function SchedulePage(props) {
  const [flatListItems, setFlatListItems] = useState([]);
  const [completedHidden, setCompletedHidden] = useState(false);

  const scheduleName = props.route.params.name;

  const tableName = formatTableName(scheduleName);

  useEffect(() => {
    const interval = setInterval(() => {
      openTable(db, tableName, function(txn, res) {
        txn.executeSql('SELECT * FROM ' + tableName, [], (txn, results) => {
          var temp = [];

          for (let i = 0; i < results.rows.length; ++i) {
            temp.push(results.rows.item(i));
          }

          setFlatListItems(temp);
        });
      });
    }, 200);
    return () => clearInterval(interval);
  }, [tableName]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <CheckBox
          left
          containerStyle={[
            styles.button,
            {
              backgroundColor: 'transparent',
              borderWidth: 0,
            },
          ]}
          title="Hide Completed"
          checked={completedHidden}
          onIconPress={() => {
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
      <View style={styles.footer}>
        <Text style={styles.text}>Footer</Text>
      </View>
    </SafeAreaView>
  );
}

export default SchedulePage;
