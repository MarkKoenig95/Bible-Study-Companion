import React, {useContext, useEffect, useState} from 'react';
import {SafeAreaView, View, FlatList, Linking} from 'react-native';

import TextButton from '../components/buttons/TextButton';
import ScheduleDayButton from '../components/buttons/ScheduleDayButton';
import Text, {Heading, SubHeading} from '../components/text/Text';
import MessagePopup from '../components/popups/MessagePopup';
import ReadingInfoPopup, {
  useReadingInfoPopup,
} from '../components/popups/ReadingInfoPopup';

import styles from '../styles/styles';

import {translate, linkFormulator} from '../localization/localization';

import {store} from '../data/Store/store.js';
import {setFirstRender} from '../data/Store/actions';

import {
  openTable,
  getVersion,
  log,
  formatDate,
  errorCB,
  getQuery,
} from '../data/Database/generalTransactions';
import {
  runQueries,
  formatScheduleTableName,
  updateReadStatus,
  updateDailyText,
} from '../data/Database/scheduleTransactions';
import {colors} from 'react-native-elements';
import IconButton from '../components/buttons/IconButton';

const prefix = 'homePage.';

async function populateHomeList(userDB, setState, openReadingPopup) {
  let wasSuccessful;
  let result;
  let temp = [];
  let date = new Date();
  let todayFormatted = formatDate(date);
  let today = Date.parse(todayFormatted);

  await userDB
    .transaction(txn => {
      txn
        .executeSql('SELECT * FROM tblDates WHERE Name="DailyText"')
        .then(([t, res]) => {
          wasSuccessful = true;
          let storedDate = Date.parse(res.rows.item(0).Date);

          console.log(
            res.rows.item(0).Date,
            storedDate,
            new Date(),
            today,
            formatDate(new Date()),
            todayFormatted,
          );

          if (storedDate < today) {
            let readingPortion = translate('dailyText');
            let completionDate = todayFormatted;
            let isFinished = false;
            let onLongPress = cb => {
              updateDailyText(userDB, todayFormatted);
              cb(true);
            };
            let onPress = () => {
              Linking.openURL(linkFormulator('wol'));
            };

            temp.push({
              readingDayID: 0,
              readingPortion: readingPortion,
              completionDate: completionDate,
              isFinished: isFinished,
              onLongPress: onLongPress,
              onPress: onPress,
            });
          }
        });
    })
    .catch(err => {
      wasSuccessful = false;
      errorCB(err);
    });

  //Get the user's list of reading schedules
  await userDB
    .transaction(txn => {
      let sql = 'SELECT * FROM tblSchedules';
      txn.executeSql(sql, []).then(([t, res]) => {
        if (wasSuccessful) {
          wasSuccessful = true;
        }
        result = res;
      });
    })
    .catch(err => {
      wasSuccessful = false;
      errorCB(err);
    });

  //Loop through the list and select the first reading portion that is not completed
  for (let i = 0; i < result.rows.length; i++) {
    const id = result.rows.item(i).ScheduleID;
    const scheduleName = result.rows.item(i).ScheduleName;
    const tableName = formatScheduleTableName(id);

    let item;

    await userDB
      .transaction(txn => {
        let sql = `SELECT * FROM ${tableName}
                  WHERE IsFinished=0
                  ORDER BY ReadingDayID ASC
                  LIMIT 1`;
        txn.executeSql(sql, []).then(([txn, res]) => {
          if (wasSuccessful) {
            wasSuccessful = true;
          }
          item = res.rows.item(0);
        });
      })
      .catch(err => {
        wasSuccessful = false;
        errorCB(err);
      });

    if (Date.parse(item.CompletionDate) <= today) {
      let readingDayID = item.ReadingDayID;
      let readingPortion = item.ReadingPortion;
      let completionDate = item.CompletionDate;
      let isFinished = item.IsFinished;
      let onLongPress = cb => {
        onUpdateReadStatus(
          userDB,
          cb,
          item.IsFinished,
          item.ReadingDayID,
          tableName,
        );
      };
      let onPress;

      if (item.StartBookNumber) {
        onPress = cb => {
          openReadingPopup(
            item.StartBookNumber,
            item.StartChapter,
            item.StartVerse,
            item.EndBookNumber,
            item.EndChapter,
            item.EndVerse,
            item.ReadingPortion,
            item.IsFinished,
            item.ReadingDayID,
            cb,
            tableName,
          );
        };
      } else {
        onPress = onLongPress;
      }

      //Add reading portion info to the list
      temp.push({
        readingDayID: readingDayID,
        readingPortion: readingPortion,
        completionDate: completionDate,
        isFinished: isFinished,
        onLongPress: onLongPress,
        onPress: onPress,
      });
    }
  }
  setState(temp);
  return wasSuccessful;
}

function onUpdateReadStatus(userDB, cb, status, readingDayID, tableName) {
  updateReadStatus(userDB, tableName, readingDayID, !status);
  cb(!status);
}

export default function Home(props) {
  const navigation = props.navigation;
  const globalState = useContext(store);

  const {dispatch} = globalState;
  const {userDB, bibleDB, isFirstRender} = globalState.state;

  const [flatListItems, setFlatListItems] = useState([]);

  const {
    readingPopup,
    openReadingPopup,
    closeReadingPopup,
  } = useReadingInfoPopup();

  useEffect(() => {
    if (isFirstRender) {
      dispatch(setFirstRender(false));
      populateHomeList(userDB, setFlatListItems, openReadingPopup).then(
        wasSuccessful => {
          if (!wasSuccessful) {
            populateHomeList(userDB, setFlatListItems, openReadingPopup);
          }
        },
      );
      runQueries(bibleDB);
    }
  }, [
    userDB,
    bibleDB,
    dispatch,
    isFirstRender,
    setFlatListItems,
    openReadingPopup,
  ]);

  let isFlatListEmpty = flatListItems.length === 0 ? true : false;

  return (
    <SafeAreaView style={styles.container}>
      <ReadingInfoPopup
        popupProps={{
          displayPopup: readingPopup.isDisplayed,
          title: readingPopup.title,
          message: readingPopup.message,
          onClosePress: closeReadingPopup,
        }}
        onConfirm={() => {
          onUpdateReadStatus(
            userDB,
            readingPopup.cb,
            readingPopup.readingDayID,
            readingPopup.isFinished,
            readingPopup.tableName,
          );
          closeReadingPopup();
        }}
        startBookNumber={readingPopup.startBookNumber}
        startChapter={readingPopup.startChapter}
        startVerse={readingPopup.startVerse}
        endBookNumber={readingPopup.endBookNumber}
        endChapter={readingPopup.endChapter}
        endVerse={readingPopup.endVerse}
        readingPortion={readingPopup.readingPortion}
      />
      <Heading style={{...styles.buttonText, alignSelf: 'center'}}>
        {translate('today')}
      </Heading>
      <View style={styles.content}>
        {!isFlatListEmpty ? (
          <FlatList
            data={flatListItems}
            keyExtractor={(item, index) => index.toString()}
            renderItem={({item}) => (
              <ScheduleDayButton
                key={item.readingDayID}
                readingPortion={item.readingPortion}
                completionDate={item.completionDate}
                completedHidden={true}
                isFinished={item.isFinished ? true : false}
                onLongPress={item.onLongPress}
                onPress={item.onPress}
              />
            )}
          />
        ) : (
          <View>
            <SubHeading style={{...styles.buttonText, alignSelf: 'center'}}>
              {translate(prefix + 'emptyList')}
            </SubHeading>
            <IconButton
              buttonStyle={{alignSelf: 'center'}}
              onPress={() => {
                navigation.navigate('SchedulesStack', {
                  screen: 'Schedules',
                  params: {
                    isCreatingSchedule: true,
                  },
                });
              }}
              name="add"
            />
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}
