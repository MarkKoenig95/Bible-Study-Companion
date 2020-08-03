import React, {useContext, useEffect, useState} from 'react';
import {SafeAreaView, View, Linking} from 'react-native';

import IconButton from '../components/buttons/IconButton';
import TextButton from '../components/buttons/TextButton';
import ScheduleDayButton from '../components/buttons/ScheduleDayButton';
import {Heading, SubHeading} from '../components/text/Text';

import styles from '../styles/styles';

import {translate, linkFormulator} from '../localization/localization';

import {store} from '../data/Store/store.js';

import {formatDate, errorCB} from '../data/Database/generalTransactions';
import {
  formatScheduleTableName,
  updateDailyText,
} from '../data/Database/scheduleTransactions';
import {useUpdate} from '../logic/logic';
import useScheduleButtonsList from '../components/ScheduleButtonsList';

const prefix = 'homePage.';

async function populateScheduleButtons(userDB, updatePages, setState) {
  let result;
  let homeListItems = [];
  let date = new Date();
  let todayFormatted = formatDate(date);
  let today = Date.parse(todayFormatted);

  //Get the user's list of reading schedules
  await userDB
    .transaction(txn => {
      let sql = 'SELECT * FROM tblSchedules';
      txn.executeSql(sql, []).then(([t, res]) => {
        result = res;
      });
    })
    .catch(err => {
      errorCB(err);
    });

  //Loop through the list and select the first reading portion that is not completed
  for (let i = 0; i < result.rows.length; i++) {
    const id = result.rows.item(i).ScheduleID;
    const scheduleName = result.rows.item(i).ScheduleName;
    const tableName = formatScheduleTableName(id);

    let items;
    let completionDate;

    //Populate reading portions from all schedules for today
    await userDB
      .transaction(txn => {
        const sql = `SELECT * FROM ${tableName}
                WHERE IsFinished=0
                ORDER BY ReadingDayID ASC
                LIMIT 1`;
        txn.executeSql(sql, []).then(([t, res]) => {
          completionDate = res.rows.item(0).CompletionDate;
        });
      })
      .catch(err => {
        errorCB(err);
      });

    await userDB
      .transaction(txn => {
        const sql = `SELECT * FROM ${tableName}
                WHERE CompletionDate=?
                ORDER BY ReadingDayID ASC`;
        txn.executeSql(sql, [completionDate]).then(([t, res]) => {
          items = res.rows;
        });
      })
      .catch(err => {
        errorCB(err);
      });

    let innerHomeListItems = [];

    for (let j = 0; j < items.length; j++) {
      const item = items.item(j);

      if (Date.parse(item.CompletionDate) <= today) {
        //Add reading portion info to the list
        innerHomeListItems.push({
          StartBookNumber: item.StartBookNumber,
          StartChapter: item.StartChapter,
          StartVerse: item.StartVerse,
          EndBookNumber: item.EndBookNumber,
          EndChapter: item.EndChapter,
          EndVerse: item.EndVerse,
          CompletionDate: item.CompletionDate,
          IsFinished: item.IsFinished,
          ReadingDayID: item.ReadingDayID,
          ReadingPortion: item.ReadingPortion,
          title: scheduleName,
          tableName: tableName,
          update: updatePages,
        });
      }
    }
    if (innerHomeListItems.length > 0) {
      homeListItems.push(innerHomeListItems);
    }
  }

  setState(homeListItems);
}

async function populateDailyText(userDB, afterUpdate, update, setDailyText) {
  let date = new Date();
  let todayFormatted = formatDate(date);
  let today = Date.parse(todayFormatted);

  //Populate Daily text
  await userDB
    .transaction(txn => {
      txn
        .executeSql('SELECT * FROM tblDates WHERE Name="DailyText"')
        .then(([t, res]) => {
          let storedDate = Date.parse(res.rows.item(0).Date);

          if (storedDate < today) {
            let readingPortion = translate('dailyText');
            let completionDate = todayFormatted;
            let isFinished = false;
            let onLongPress = cb => {
              updateDailyText(userDB, todayFormatted, afterUpdate);
              cb(true);
            };

            let onPress = () => {
              Linking.openURL(linkFormulator('wol'));
            };

            let DailyTextButton = () => {
              return (
                <ScheduleDayButton
                  isFinished={isFinished ? true : false}
                  completionDate={completionDate}
                  completedHidden={true}
                  onLongPress={onLongPress}
                  onPress={onPress}
                  readingPortion={readingPortion}
                  title={translate('examiningTheScripturesDaily')}
                  update={update}
                />
              );
            };
            setDailyText(DailyTextButton);
          } else {
            setDailyText();
          }
        });
    })
    .catch(err => {
      errorCB(err);
    });
}

export default function Home(props) {
  console.log('loaded home page');
  const navigation = props.navigation;
  const globalState = useContext(store);

  const {dispatch} = globalState;
  const {userDB, updatePages} = globalState.state;
  const [DailyTextButton, setDailyTextButton] = useState();
  const [flatListItems, setFlatListItems] = useState([]);
  const completedHidden = true;

  useEffect(() => {
    if (userDB) {
      populateScheduleButtons(userDB, updatePages, setFlatListItems);
      populateDailyText(userDB, afterUpdate, updatePages, setDailyTextButton);
    }
  }, [userDB, updatePages, afterUpdate]);

  const afterUpdate = useUpdate(updatePages, dispatch);

  const {
    ScheduleButtonsList,
    ScheduleListPopups,
    openRemindersPopup,
  } = useScheduleButtonsList(
    userDB,
    afterUpdate,
    completedHidden,
    flatListItems,
    updatePages,
  );

  let isFlatListEmpty = flatListItems.length === 0 ? true : false;

  return (
    <SafeAreaView style={styles.container}>
      <ScheduleListPopups />
      <View style={styles.header}>
        <TextButton
          buttonStyle={{width: '90%'}}
          text={translate('readingRemindersPopup.readingReminders')}
          onPress={openRemindersPopup}
        />
      </View>
      <View style={styles.content}>
        <Heading style={{...styles.buttonText, alignSelf: 'center'}}>
          {translate('today')}
        </Heading>
        {!isFlatListEmpty || DailyTextButton ? (
          <ScheduleButtonsList ListHeaderComponent={DailyTextButton} />
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
