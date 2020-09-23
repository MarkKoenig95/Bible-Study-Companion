import React, {useContext, useEffect, useState} from 'react';
import {SafeAreaView, SectionList, View} from 'react-native';

import IconButton from '../components/buttons/IconButton';
import TextButton from '../components/buttons/TextButton';
import JWLibButton from '../components/buttons/JWLibButton';
import {SubHeading} from '../components/text/Text';

import styles from '../styles/styles';

import {translate} from '../logic/localization/localization';

import {store} from '../data/Store/store.js';

import {
  formatDate,
  errorCB,
  updateValue,
  log,
} from '../data/Database/generalTransactions';
import {
  formatScheduleTableName,
  createWeeklyReadingSchedule,
  WEEKLY_READING_TABLE_NAME,
} from '../data/Database/scheduleTransactions';
import {useUpdate} from '../logic/logic';
import useScheduleButtonsList from '../components/ScheduleButtonsList';
import {FREQS} from '../data/Database/reminderTransactions';
import SectionListHeader from '../components/SectionListHeader';

const prefix = 'homePage.';
let populatingHomeList = false;

async function populateReminders(userDB, frequency, afterUpdate, update) {
  let result = [];
  let reminders;

  await userDB
    .transaction(txn => {
      txn
        .executeSql(
          'SELECT * FROM tblReminders WHERE Frequency=? AND IsFinished=0',
          [frequency],
        )
        .then(([t, res]) => {
          reminders = res.rows;
        });
    })
    .catch(err => {
      errorCB(err);
    });

  if (reminders.length > 0) {
    for (let i = 0; i < reminders.length; i++) {
      log('currently checking reminder', reminders.item(i));
      const reminder = reminders.item(i);
      let completionDate = new Date(reminder.CompletionDate);

      let title = translate('reminders.reminder');
      let readingPortion = reminder.Name;
      let isFinished = reminder.IsFinished ? true : false;
      let onLongPress = () => {
        updateValue(
          userDB,
          'tblReminders',
          reminder.ID,
          'IsFinished',
          reminder.IsFinished ? 0 : 1,
          afterUpdate,
        );
      };

      let onPress = onLongPress;

      result.push({
        isFinished: isFinished,
        completionDate: formatDate(completionDate),
        completedHidden: true,
        onLongPress: onLongPress,
        onPress: onPress,
        readingPortion: readingPortion,
        title: title,
        update: update,
      });
    }
  }
  return result;
}

async function populateScheduleButtons(
  userDB,
  shouldShowDaily,
  doesTrack,
  updatePages,
) {
  let result;
  let homeListItems = [];
  let date = new Date();
  let todayFormatted = formatDate(date);
  let today = Date.parse(todayFormatted);

  //Get the user's list of reading schedules
  await userDB
    .transaction(txn => {
      let sql = 'SELECT * FROM tblSchedules WHERE DoesTrack=?';
      txn.executeSql(sql, [doesTrack ? 1 : 0]).then(([t, res]) => {
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
    let tableName;
    if (scheduleName !== translate('reminders.weeklyReading.title')) {
      tableName = formatScheduleTableName(id);
    } else {
      if (!shouldShowDaily) {
        continue;
      } else {
        tableName = WEEKLY_READING_TABLE_NAME;
      }
    }

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
          if (res.rows.length > 0) {
            completionDate = res.rows.item(0).CompletionDate;
          }
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
          doesTrack: doesTrack,
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

async function populateWeeklyReading(
  userDB,
  bibleDB,
  weeklyReadingReset,
  update,
) {
  let tableName = WEEKLY_READING_TABLE_NAME;
  let title = translate('reminders.weeklyReading.title');
  let items;
  let listItems = [];

  await createWeeklyReadingSchedule(userDB, bibleDB, weeklyReadingReset + 1);

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
  if (items.length > 0) {
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
  }

  return listItems;
}

async function populateHomeList(
  userDB,
  bibleDB,
  weeklyReadingReset,
  shouldShowDaily,
  afterUpdate,
  updatePages,
) {
  let data = [];
  let todayListItems = [];
  let thisWeekListItems = [];
  let thisMonthListItems = [];
  let otherListItems = [];
  let todayTitle = translate('today');
  let thisWeekTitle = translate('thisWeek');
  let thisMonthTitle = translate('thisMonth');
  let otherTitle = translate('other');

  //Populate daily reminders
  await populateReminders(userDB, FREQS.DAILY, afterUpdate, updatePages).then(
    res => {
      if (res.length > 0) {
        for (let i = 0; i < res.length; i++) {
          log('daily reminder', i, 'is', res[i]);
          todayListItems.push([res[i]]);
        }
      }
    },
  );

  await populateScheduleButtons(
    userDB,
    shouldShowDaily,
    true,
    updatePages,
  ).then(results => {
    results.map(res => {
      if (res.length > 0) {
        log('schedule buttons are', res);
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

  //Populate weekly reminders

  await populateWeeklyReading(
    userDB,
    bibleDB,
    weeklyReadingReset,
    updatePages,
  ).then(results => {
    results.map(res => {
      log('weekly reading is', res);
      thisWeekListItems.push(res);
    });
  });

  await populateReminders(userDB, FREQS.WEEKLY, afterUpdate, updatePages).then(
    res => {
      if (res.length > 0) {
        for (let i = 0; i < res.length; i++) {
          log('weekly reminder', i, 'is', res[i]);
          thisWeekListItems.push([res[i]]);
        }
      }
    },
  );

  if (thisWeekListItems.length > 0) {
    data.push({
      title: thisWeekTitle,
      data: thisWeekListItems,
    });
  }

  //Populate monthly reminders
  await populateReminders(userDB, FREQS.MONTHLY, afterUpdate, updatePages).then(
    res => {
      if (res.length > 0) {
        for (let i = 0; i < res.length; i++) {
          log('monthly reminder', i, 'is', res[i]);
          thisMonthListItems.push([res[i]]);
        }
      }
    },
  );

  if (thisMonthListItems.length > 0) {
    data.push({
      title: thisMonthTitle,
      data: thisMonthListItems,
    });
  }

  await populateScheduleButtons(
    userDB,
    shouldShowDaily,
    false,
    updatePages,
  ).then(results => {
    results.map(res => {
      if (res.length > 0) {
        log('schedule buttons are', res);
        otherListItems.push(res);
      }
    });
  });

  if (otherListItems.length > 0) {
    data.push({
      title: otherTitle,
      data: otherListItems,
    });
  }

  return data;
}

export default function Home(props) {
  console.log('loaded home page');
  const navigation = props.navigation;
  const globalState = useContext(store);

  const {dispatch} = globalState;
  const {
    userDB,
    bibleDB,
    updatePages,
    weeklyReadingResetDay,
    showDaily,
  } = globalState.state;
  const [scheduleListItems, setScheduleListItems] = useState([]);
  const [weeklyReadingReset, setweeklyReadingReset] = useState();
  const [shouldShowDaily, setShouldShowDaily] = useState();
  const completedHidden = true;

  //Set add and settings button in nav bar with appropriate onPress attribute
  useEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <View style={styles.navHeaderContainer}>
          <JWLibButton />
          <IconButton
            buttonStyle={styles.navHeaderButton}
            iconOnly
            invertColor
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
      ),
    });
  }, [navigation]);

  useEffect(() => {
    if (weeklyReadingResetDay !== undefined) {
      setweeklyReadingReset(weeklyReadingResetDay.value);
    }

    if (showDaily !== undefined) {
      setShouldShowDaily(showDaily.value);
    }
  }, [weeklyReadingReset, shouldShowDaily, weeklyReadingResetDay, showDaily]);

  useEffect(() => {
    if (
      userDB &&
      bibleDB &&
      weeklyReadingReset !== undefined &&
      shouldShowDaily !== undefined
    ) {
      if (!populatingHomeList) {
        populatingHomeList = true;
        populateHomeList(
          userDB,
          bibleDB,
          weeklyReadingReset,
          shouldShowDaily,
          afterUpdate,
          updatePages,
        ).then(res => {
          setScheduleListItems(res);
          populatingHomeList = false;
        });
      }
    }
  }, [
    userDB,
    bibleDB,
    updatePages,
    weeklyReadingReset,
    shouldShowDaily,
    afterUpdate,
  ]);

  const afterUpdate = useUpdate(updatePages, dispatch);

  const {
    ScheduleListPopups,
    setScheduleButtons,
    openRemindersPopup,
  } = useScheduleButtonsList(userDB, afterUpdate, completedHidden, updatePages);

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
          <SectionList
            sections={scheduleListItems}
            keyExtractor={(item, index) => index.toString()}
            renderItem={({item, index}) => {
              return setScheduleButtons(item, index);
            }}
            renderSectionHeader={SectionListHeader}
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
