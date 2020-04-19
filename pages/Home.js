import React, {useState, useEffect} from 'react';
import {SafeAreaView, View, Text, FlatList} from 'react-native';

import TextButton from './components/TextButton';
import CreateSchedulePopup from './components/CreateSchedulePopup';
import MessagePopup from './components/MessagePopup';
import styles from './styles/styles';
import Database from '../scripts/Database/Database';
import {openTable, addSchedule} from '../scripts/Database/generalTransactions';

const db = Database.getConnection();

function Home({navigation}) {
  const [flatListItems, setFlatListItems] = useState([]);
  const [
    isCreateSchedulePopupDisplayed,
    setIsCreateSchedulePopupDisplayed,
  ] = useState(false);
  const [isErrorPopupDisplayed, setIsErrorPopupDisplayed] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  //TODO: Don't reload so much. Only reload on first render and when new schedule is added

  useEffect(() => {
    const interval = setInterval(() => {
      loadData();
    }, 100);
    return () => clearInterval(interval);
  }, []);

  function loadData() {
    openTable(db, 'tblSchedules', function(txn, res) {
      if (!res.rows.length) {
        txn.executeSql('DROP TABLE IF EXISTS tblSchedules', []);
        txn.executeSql(
          'CREATE TABLE IF NOT EXISTS tblSchedules(ScheduleID INTEGER PRIMARY KEY AUTOINCREMENT UNIQUE, ScheduleName VARCHAR(20) UNIQUE)',
          [],
        );
      }
      txn.executeSql('SELECT * FROM tblSchedules', [], (txn, results) => {
        var temp = [];

        for (let i = 0; i < results.rows.length; ++i) {
          temp.push(results.rows.item(i));
        }
        setFlatListItems(temp);
      });
    });
  }

  function onAddSchedule(scheduleName, duration, bookId, chapter, verse) {
    addSchedule(
      db,
      scheduleName,
      duration,
      bookId,
      chapter,
      verse,
      () => {
        setIsCreateSchedulePopupDisplayed(false);
      },
      displayError,
    );
  }

  function displayError(error) {
    console.log(error.message);

    setIsErrorPopupDisplayed(true);
    setErrorMessage(error.message);
  }

  return (
    <SafeAreaView style={styles.container}>
      <MessagePopup
        displayPopup={isErrorPopupDisplayed}
        title="Error"
        message={errorMessage}
        onClosePress={() => setIsErrorPopupDisplayed(false)}
      />
      <CreateSchedulePopup
        displayPopup={isCreateSchedulePopupDisplayed}
        onAdd={onAddSchedule}
        onClosePress={() => setIsCreateSchedulePopupDisplayed(false)}
      />
      <View style={styles.header}>
        <TextButton
          text="Add New Schedule"
          onPress={() => {
            setIsCreateSchedulePopupDisplayed(!isCreateSchedulePopupDisplayed);
          }}
        />
      </View>
      <View style={styles.content}>
        <FlatList
          data={flatListItems}
          keyExtractor={(item, index) => index.toString()}
          renderItem={({item}) => (
            <TextButton
              key={item.ScheduleID}
              text={item.ScheduleName}
              onPress={() =>
                navigation.navigate('SchedulePage', {
                  id: item.ScheduleID,
                  title: item.ScheduleName,
                  name: item.ScheduleName,
                })
              }
            />
          )}
        />
      </View>
      <View style={styles.footer}>
        <Text style={styles.text}>Navigation Will Go Here</Text>
      </View>
    </SafeAreaView>
  );
}

export default Home;
