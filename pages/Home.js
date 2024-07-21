import React, {useContext, useEffect, useRef, useState} from 'react';
import {SafeAreaView, SectionList, View} from 'react-native';

import {
  updateValue,
  log,
  runSQL,
  appVersion,
  convertDBItemToJSItem,
} from '../data/Database/generalTransactions';
import {
  formatScheduleTableName,
  createWeeklyReadingSchedule,
  handleMemorialReadingSchedule,
} from '../data/Database/scheduleTransactions';
import {
  useUpdate,
  FREQS,
  WEEKLY_READING_TABLE_NAME,
  legacyBugFixForv1_1_0,
  legacyBugFixForv1_3_3,
} from '../logic/general';
import {translate} from '../logic/localization/localization';
import {store} from '../data/Store/store';

import IconButton from '../components/buttons/IconButton';
import TextButton from '../components/buttons/TextButton';
import {SubHeading} from '../components/text/Text';
import useScheduleButtonsList from '../components/ScheduleButtonsList/useScheduleButtonsList';
import SectionListHeader from '../components/SectionListHeader';
import MessagePopup, {useMessagePopup} from '../components/popups/MessagePopup';
import LoadingPopup from '../components/popups/LoadingPopup';

import styles from '../styles/styles';
import {setAppVersion} from '../data/Store/actions';
import {useLocalization} from '../logic/localization/localization';

const pageTitle = 'homePage';

/**
 * Returns an array of objects with information about unfinished reminders matching the given frequency
 * @param {Database} userDB
 * @param {Frequency} frequency
 * @param {Function} openMessagePopup
 * @param {Function} afterUpdate A function used to force pages to rerender after an event
 * @param {integer} update A value used to keep all pages in the app rendered after the database updates
 * @returns {Array<object>}
 */
export async function populateReminders(
  userDB,
  frequency,
  openMessagePopup,
  afterUpdate,
  update,
) {
  let result = [];

  let reminders = await runSQL(
    userDB,
    'SELECT * FROM tblReminders WHERE Frequency=? AND IsFinished=0;',
    [frequency],
  );

  if (reminders.rows.length > 0) {
    for (let i = 0; i < reminders.rows.length; i++) {
      log('currently checking reminder', reminders.rows.item(i));
      const reminder = reminders.rows.item(i);
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
        completionDate: completionDate,
        completedHidden: true,
        doesTrack: true,
        onLongPress: onLongPress,
        onPress: onPress,
        readingPortion: readingPortion,
        title: title,
        type: 'Reminder',
        update: update,
      });
    }
  }
  return result;
}

/**
 * Returns an array of arrays containing reading day item objects
 * @param {Database} userDB
 * @param {boolean} shouldShowDaily
 * @param {boolean} doesTrack
 * @param {integer} updatePages
 * @returns {Array<Array<object>>}
 */
export async function populateScheduleButtons(
  userDB,
  shouldShowDaily,
  doesTrack,
  updatePages,
) {
  let homeListItems = [];
  let today = new Date();
  today.setHours(0, 0, 0, 0);

  //Get the user's list of reading schedules
  let schedules = await runSQL(
    userDB,
    'SELECT * FROM tblSchedules WHERE DoesTrack=?;',
    [doesTrack ? 1 : 0],
  );

  //Loop through the list and select the first reading portion that is not completed
  for (let i = 0; i < schedules.rows.length; i++) {
    const schedule = schedules.rows.item(i);
    const id = schedule.ScheduleID;
    const scheduleName = schedule.ScheduleName;
    const creationInfo = schedule.CreationInfo;
    let tableName;

    if (creationInfo.slice(0, 3) === 'tbl') {
      if (creationInfo === WEEKLY_READING_TABLE_NAME && !shouldShowDaily) {
        continue;
      }
      tableName = creationInfo;
    } else {
      tableName = formatScheduleTableName(id);
    }

    let completionDate;

    //Populate reading portions from all schedules for today
    await runSQL(
      userDB,
      `SELECT * FROM ${tableName}
         WHERE IsFinished=0
         ORDER BY ID ASC
         LIMIT 1;`,
    ).then((res) => {
      if (res.rows.length > 0) {
        completionDate = res.rows.item(0).CompletionDate;
      }
    });

    let table = await runSQL(
      userDB,
      `SELECT * FROM ${tableName}
         WHERE CompletionDate=?
         ORDER BY ID ASC;`,
      [completionDate],
    );

    let innerHomeListItems = [];

    for (let j = 0; j < table.rows.length; j++) {
      const item = table.rows.item(j);
      const newItem = convertDBItemToJSItem(item, doesTrack);
      let itemDate = newItem.completionDate;

      if (itemDate.getTime() <= today.getTime()) {
        //Add reading portion info to the list
        innerHomeListItems.push({
          ...newItem,
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

/**
 * Returns an array of arrays containing weekly reading day item objects
 * @param {Database} userDB
 * @param {Database} bibleDB
 * @param {integer} weeklyReadingReset - The day of the week on which the user wants their weekly reading schedule to reset
 * @param {integer} update
 * @returns {Array<Array<object>>}
 */
export async function populateWeeklyReading(
  userDB,
  bibleDB,
  weeklyReadingReset,
  update,
) {
  let tableName = WEEKLY_READING_TABLE_NAME;
  let title = translate('reminders.weeklyReading.title');
  let listItems = [];

  //TODO: Make pages update after creation of these schedules if we do create them. .then(whatever)
  await createWeeklyReadingSchedule(userDB, bibleDB, weeklyReadingReset);
  let table;

  try {
    table = await runSQL(
      userDB,
      `SELECT * FROM ${tableName}
       ORDER BY ID ASC;`,
    );
  } catch (e) {
    console.warn(e);
  }

  if (!table) {
    return [];
  }

  let innerListItems = [];
  if (table.rows.length > 0) {
    for (let j = 0; j < table.rows.length; j++) {
      const item = table.rows.item(j);
      const newItem = convertDBItemToJSItem(item, true);

      if (!newItem.isFinished) {
        //Add reading portion info to the list
        innerListItems.push({
          ...newItem,
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

/**
 * Returns an Array of sections for the home page
 * @param {Database} userDB
 * @param {Database} bibleDB
 * @param {integer} weeklyReadingReset
 * @param {boolean} shouldShowDaily
 * @param {Function} openMessagePopup
 * @param {Function} afterUpdate
 * @param {integer} updatePages
 * @returns {Array<object>}
 */
export async function populateHomeList(
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

  await handleMemorialReadingSchedule(userDB, bibleDB);

  // -------------------------- Populate daily reminders --------------------------
  await populateReminders(
    userDB,
    FREQS.DAILY,
    openMessagePopup,
    afterUpdate,
    updatePages,
  ).then((res) => {
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
  ).then((results) => {
    results.map((res) => {
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

  // -------------------------- Populate weekly reminders --------------------------

  await populateWeeklyReading(
    userDB,
    bibleDB,
    weeklyReadingReset,
    updatePages,
  ).then((results) => {
    if (results.length > 0) {
      results.map((res) => {
        log('weekly reading is', res);
        thisWeekListItems.push(res);
      });
    }
  });

  await populateReminders(
    userDB,
    FREQS.WEEKLY,
    openMessagePopup,
    afterUpdate,
    updatePages,
  ).then((res) => {
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

  // -------------------------- Populate monthly reminders --------------------------
  await populateReminders(
    userDB,
    FREQS.MONTHLY,
    openMessagePopup,
    afterUpdate,
    updatePages,
  ).then((res) => {
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

  // -------------------------- Populate untracked reminders --------------------------

  await populateScheduleButtons(
    userDB,
    shouldShowDaily,
    false,
    updatePages,
  ).then((results) => {
    results.map((res) => {
      if (res.length > 0) {
        log('schedule buttons are', res);
        otherListItems.push(res);
      }
    });
  });

  await populateReminders(userDB, FREQS.NEVER, afterUpdate, updatePages).then(
    (res) => {
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
  log('loaded home page');
  const navigation = props.navigation;
  const globalState = useContext(store);

  const {dispatch} = globalState;
  const {
    userDB,
    bibleDB,
    languageInfo,
    updatePages,
    weeklyReadingResetDay,
    showDaily,
  } = globalState.state;
  const [scheduleListItems, setScheduleListItems] = useState([]);
  const [weeklyReadingReset, setweeklyReadingReset] = useState();
  const [shouldShowDaily, setShouldShowDaily] = useState();
  const [isLoading, setIsLoading] = useState(false);
  const populatingHomeList = useRef(false);
  const completedHidden = true;

  const afterUpdate = useUpdate(dispatch);

  const {messagePopup, openMessagePopup, closeMessagePopup} = useMessagePopup();

  const {ScheduleListPopups, setScheduleButtons, openRemindersPopup} =
    useScheduleButtonsList(
      userDB,
      afterUpdate,
      completedHidden,
      updatePages,
      null,
      null,
      pageTitle,
    );

  useLocalization(languageInfo);

  useEffect(() => {
    navigation.setOptions({
      title: translate('homePage.title'),
    });
  });

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

    if (userDB && bibleDB) {
      appVersion(userDB).then(async ({prevVersion, currVersion}) => {
        dispatch(setAppVersion(currVersion));
        if (!prevVersion) {
          navToSchedules();
        }

        legacyBugFixForv1_1_0(userDB, bibleDB, prevVersion, setIsLoading);
        await legacyBugFixForv1_3_3(userDB, prevVersion);
      });
    }
  }, [bibleDB, dispatch, navigation, userDB]);

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
      if (!populatingHomeList.current) {
        populatingHomeList.current = true;
        populateHomeList(
          userDB,
          bibleDB,
          weeklyReadingReset,
          shouldShowDaily,
          openMessagePopup,
          afterUpdate,
          updatePages,
        ).then((res) => {
          setScheduleListItems(res);
          populatingHomeList.current = false;
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
      <LoadingPopup
        testID={pageTitle + '.loadingPopup'}
        displayPopup={isLoading}
      />
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
            testID={pageTitle + '.list'}
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
