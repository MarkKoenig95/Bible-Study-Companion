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
  appVersion,
} from '../data/Database/generalTransactions';
import {
  formatScheduleTableName,
  createWeeklyReadingSchedule,
} from '../data/Database/scheduleTransactions';
import {
  WEEKLY_READING_TABLE_NAME,
  legacyBugFixForV062,
  useUpdate,
  FREQS,
} from '../logic/logic';
import useScheduleButtonsList from '../components/ScheduleButtonsList';
import SectionListHeader from '../components/SectionListHeader';
import MessagePopup, {useMessagePopup} from '../components/popups/MessagePopup';
import {setAppVersion} from '../data/Store/actions';

const pageTitle = 'homePage';
let populatingHomeList = false;

async function populateReminders(
  userDB,
  frequency,
  openMessagePopup,
  afterUpdate,
  update,
) {
  let result = [];
  let reminders;

  await userDB
    .executeSql(
      'SELECT * FROM tblReminders WHERE Frequency=? AND IsFinished=0;',
      [frequency],
    )
    .then(([res]) => {
      reminders = res.rows;
    })
    .catch(errorCB);

  if (reminders.length > 0) {
    for (let i = 0; i < reminders.length; i++) {
      log('currently checking reminder', reminders.item(i));
      const reminder = reminders.item(i);
      let compDate =
        frequency !== FREQS.NEVER ? reminder.CompletionDate : new Date();
      let completionDate = new Date(compDate);

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

      let message = translate('reminders.completeReminderMessage', {
        reminderName: readingPortion,
      });

      let onPress = () => {
        openMessagePopup(message, '', onLongPress);
      };

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
    .executeSql('SELECT * FROM tblSchedules WHERE DoesTrack=?;', [
      doesTrack ? 1 : 0,
    ])
    .then(([res]) => {
      result = res;
    })
    .catch(errorCB);

  //Loop through the list and select the first reading portion that is not completed
  for (let i = 0; i < result.rows.length; i++) {
    const id = result.rows.item(i).ScheduleID;
    const scheduleName = result.rows.item(i).ScheduleName;
    const creationInfo = result.rows.item(i).CreationInfo;
    let tableName;
    if (creationInfo !== WEEKLY_READING_TABLE_NAME && creationInfo) {
      tableName = formatScheduleTableName(id);
    } else {
      if (!creationInfo) {
        await legacyBugFixForV062(userDB);
      }
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
      .executeSql(
        `SELECT * FROM ${tableName}
         WHERE IsFinished=0
         ORDER BY ReadingDayID ASC
         LIMIT 1;`,
        [],
      )
      .then(([res]) => {
        if (res.rows.length > 0) {
          completionDate = res.rows.item(0).CompletionDate;
        }
      })
      .catch(errorCB);

    await userDB
      .executeSql(
        `SELECT * FROM ${tableName}
         WHERE CompletionDate=?
         ORDER BY ReadingDayID ASC;`,
        [completionDate],
      )
      .then(([res]) => {
        items = res.rows;
      })
      .catch(errorCB);

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

  await createWeeklyReadingSchedule(userDB, bibleDB, weeklyReadingReset);

  await userDB
    .executeSql(
      `SELECT * FROM ${tableName}
       ORDER BY ReadingDayID ASC;`,
      [],
    )
    .then(([res]) => {
      items = res.rows;
    })
    .catch(errorCB);

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
  openMessagePopup,
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
  await populateReminders(
    userDB,
    FREQS.DAILY,
    openMessagePopup,
    afterUpdate,
    updatePages,
  ).then(res => {
    if (res.length > 0) {
      for (let i = 0; i < res.length; i++) {
        log('daily reminder', i, 'is', res[i]);
        todayListItems.push([res[i]]);
      }
    }
  });

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

  await populateReminders(
    userDB,
    FREQS.WEEKLY,
    openMessagePopup,
    afterUpdate,
    updatePages,
  ).then(res => {
    if (res.length > 0) {
      for (let i = 0; i < res.length; i++) {
        log('weekly reminder', i, 'is', res[i]);
        thisWeekListItems.push([res[i]]);
      }
    }
  });

  if (thisWeekListItems.length > 0) {
    data.push({
      title: thisWeekTitle,
      data: thisWeekListItems,
    });
  }

  //Populate monthly reminders
  await populateReminders(
    userDB,
    FREQS.MONTHLY,
    openMessagePopup,
    afterUpdate,
    updatePages,
  ).then(res => {
    if (res.length > 0) {
      for (let i = 0; i < res.length; i++) {
        log('monthly reminder', i, 'is', res[i]);
        thisMonthListItems.push([res[i]]);
      }
    }
  });

  if (thisMonthListItems.length > 0) {
    data.push({
      title: thisMonthTitle,
      data: thisMonthListItems,
    });
  }

  //Populate untracked reminders

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

  await populateReminders(userDB, FREQS.NEVER, afterUpdate, updatePages).then(
    res => {
      if (res.length > 0) {
        for (let i = 0; i < res.length; i++) {
          log('other reminder', i, 'is', res[i]);
          otherListItems.push([res[i]]);
        }
      }
    },
  );

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

  const afterUpdate = useUpdate(updatePages, dispatch);

  const {messagePopup, openMessagePopup, closeMessagePopup} = useMessagePopup();

  const {
    ScheduleListPopups,
    setScheduleButtons,
    openRemindersPopup,
  } = useScheduleButtonsList(
    userDB,
    afterUpdate,
    completedHidden,
    updatePages,
    pageTitle,
  );

  //Set add and settings button in nav bar with appropriate onPress attribute
  useEffect(() => {
    let navToSchedules = () => {
      navigation.navigate('SchedulesStack', {
        screen: 'Schedules',
        params: {
          isCreatingSchedule: true,
        },
      });
    };

    navigation.setOptions({
      headerRight: () => (
        <View testID={pageTitle + '.header'} style={styles.navHeaderContainer}>
          <JWLibButton testID={pageTitle + '.header.jwLibraryButton'} />
          <IconButton
            testID={pageTitle + '.header.addScheduleButton'}
            buttonStyle={styles.navHeaderButton}
            iconOnly
            invertColor
            onPress={navToSchedules}
            name="add"
          />
        </View>
      ),
    });

    if (userDB) {
      appVersion(userDB).then(({prevVersion, currVersion}) => {
        dispatch(setAppVersion(currVersion));
        if (!prevVersion) {
          navToSchedules();
        }
      });
    }
  }, [dispatch, navigation, userDB]);

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
          openMessagePopup,
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
    openMessagePopup,
  ]);

  let isScheduleListEmpty = scheduleListItems.length === 0 ? true : false;

  return (
    <SafeAreaView style={styles.container} testID={pageTitle}>
      <MessagePopup
        testID={pageTitle + '.messagePopup'}
        displayPopup={messagePopup.isDisplayed}
        title={messagePopup.title}
        message={messagePopup.message}
        onClosePress={closeMessagePopup}
        onConfirm={messagePopup.onConfirm}
      />
      <ScheduleListPopups />
      <View style={styles.header}>
        <TextButton
          testID={pageTitle + '.readingRemindersButton'}
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
          <View testID={pageTitle + '.emptyList'}>
            <SubHeading
              testID={pageTitle + '.emptyList.text'}
              style={{...styles.buttonText, alignSelf: 'center'}}>
              {translate(pageTitle + '.emptyList')}
            </SubHeading>
            <IconButton
              testID={pageTitle + '.emptyList.addScheduleButton'}
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
