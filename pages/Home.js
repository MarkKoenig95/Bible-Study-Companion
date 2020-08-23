import React, {useContext, useEffect, useState} from 'react';
import {SafeAreaView, View, Linking} from 'react-native';

import IconButton from '../components/buttons/IconButton';
import TextButton from '../components/buttons/TextButton';
import {SubHeading} from '../components/text/Text';

import styles from '../styles/styles';

import {translate, linkFormulator} from '../logic/localization/localization';

import {store} from '../data/Store/store.js';

import {formatDate, errorCB} from '../data/Database/generalTransactions';
import {
  formatScheduleTableName,
  updateDates,
  createWeeklyReadingSchedule,
  WEEKLY_READING_TABLE_NAME,
} from '../data/Database/scheduleTransactions';
import {useUpdate} from '../logic/logic';
import useScheduleButtonsList from '../components/ScheduleButtonsList';

const prefix = 'homePage.';
let populatingHomeList = false;

async function populateDailyText(userDB, afterUpdate, update, setDailyText) {
  let result;
  let date = new Date();
  let todayFormatted = formatDate(date);
  let today = Date.parse(todayFormatted);
  let storedDate;

  //Populate Daily text
  await userDB
    .transaction(txn => {
      txn
        .executeSql('SELECT * FROM tblDates WHERE Name="DailyText"')
        .then(([t, res]) => {
          storedDate = Date.parse(res.rows.item(0).Date);
        });
    })
    .catch(err => {
      errorCB(err);
    });

  if (storedDate < today) {
    let title = translate('examiningTheScripturesDaily');
    let readingPortion = translate('reminders.dailyText');
    let completionDate = todayFormatted;
    let isFinished = false;
    let onLongPress = cb => {
      updateDates(userDB, todayFormatted, 'DailyText', afterUpdate);
      cb(true);
    };

    let onPress = () => {
      Linking.openURL(linkFormulator('wol'));
    };

    result = [
      {
        isFinished: isFinished ? true : false,
        completionDate: completionDate,
        completedHidden: true,
        onLongPress: onLongPress,
        onPress: onPress,
        readingPortion: readingPortion,
        title: title,
        update: update,
      },
    ];
  } else {
    result = [];
  }
  return result;
}

async function populateScheduleButtons(userDB, updatePages) {
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
    const tableName =
      scheduleName !== translate('reminders.weeklyReading')
        ? formatScheduleTableName(id)
        : WEEKLY_READING_TABLE_NAME;

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
          ...item,
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

  return homeListItems;
}

async function populateWeeklyReading(userDB, bibleDB, update) {
  let tableName = WEEKLY_READING_TABLE_NAME;
  let title = translate('reminders.weeklyReading');
  let items;
  let listItems = [];

  await createWeeklyReadingSchedule(userDB, bibleDB);

  await userDB
    .transaction(txn => {
      const sql = `SELECT * FROM ${tableName}
            ORDER BY ReadingDayID ASC`;
      txn.executeSql(sql, []).then(([t, res]) => {
        items = res.rows;
      });
    })
    .catch(err => {
      errorCB(err);
    });

  let innerListItems = [];

  for (let j = 0; j < items.length; j++) {
    const item = items.item(j);

    if (!item.IsFinished) {
      //Add reading portion info to the list
      innerListItems.push({
        ...item,
        title: title,
        tableName: tableName,
        update: update,
      });
    }
  }
  if (innerListItems.length > 0) {
    listItems.push(innerListItems);
  }

  return listItems;
}

async function populateHomeList(userDB, bibleDB, afterUpdate, updatePages) {
  let data = [];
  let todayListItems = [];
  let thisWeekListItems = [];
  let todayTitle = translate('today');
  let thisWeekTitle = translate('thisWeek');

  await populateDailyText(userDB, afterUpdate, updatePages).then(res => {
    if (res.length > 0) {
      todayListItems.push(res);
    }
  });

  await populateScheduleButtons(userDB, updatePages).then(results => {
    results.map(res => {
      if (res.length > 0) {
        todayListItems.push(res);
      }
    });
  });

  if (todayListItems.length > 0) {
    data.push({
      title: todayTitle,
      data: todayListItems,
    });
  }

  await populateWeeklyReading(userDB, bibleDB, updatePages).then(results => {
    results.map(res => {
      thisWeekListItems.push(res);
    });
  });

  if (thisWeekListItems.length > 0) {
    data.push({
      title: thisWeekTitle,
      data: thisWeekListItems,
    });
  }

  return data;
}

export default function Home(props) {
  console.log('loaded home page');
  const navigation = props.navigation;
  const globalState = useContext(store);

  const {dispatch} = globalState;
  const {userDB, bibleDB, updatePages} = globalState.state;
  const [scheduleListItems, setScheduleListItems] = useState([]);
  const completedHidden = true;

  useEffect(() => {
    if (userDB && bibleDB) {
      if (!populatingHomeList) {
        populatingHomeList = true;
        populateHomeList(userDB, bibleDB, afterUpdate, updatePages).then(
          res => {
            setScheduleListItems(res);
            populatingHomeList = false;
          },
        );
      }
    }
  }, [userDB, bibleDB, updatePages, afterUpdate]);

  const afterUpdate = useUpdate(updatePages, dispatch);

  const {
    ScheduleButtonsList,
    ScheduleListPopups,
    openRemindersPopup,
  } = useScheduleButtonsList(
    userDB,
    afterUpdate,
    completedHidden,
    scheduleListItems,
    updatePages,
  );

  let isScheduleListEmpty = scheduleListItems.length === 0 ? true : false;

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
        {!isScheduleListEmpty ? (
          <ScheduleButtonsList />
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
