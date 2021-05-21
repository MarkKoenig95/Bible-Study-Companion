import React, {useContext, useEffect, useState} from 'react';
import {SafeAreaView, View, FlatList, SectionList} from 'react-native';

import TextButton from '../components/buttons/TextButton';

import IconButton from '../components/buttons/IconButton';
import CreateSchedulePopup from '../components/popups/CreateSchedulePopup';
import MessagePopup, {useMessagePopup} from '../components/popups/MessagePopup';

import styles from '../styles/styles';

import {store} from '../data/Store/store';
import {loadData} from '../data/Database/generalTransactions';
import {
  addSchedule,
  formatScheduleTableName,
} from '../data/Database/scheduleTransactions';

import LoadingPopup from '../components/popups/LoadingPopup';
import {WEEKLY_READING_TABLE_NAME, useUpdate} from '../logic/general';
import ScheduleTypeSelectionPopup from '../components/popups/ScheduleTypeSelectionPopup';

let scheduleType;
const pageTitle = 'schedulesPage';

export default function Schedules(props) {
  console.log('loaded schedules page');
  const navigation = props.navigation;
  const globalState = useContext(store);

  const {dispatch} = globalState;
  const {bibleDB, userDB, updatePages} = globalState.state;

  const isCreatingSchedule = props.route.params
    ? props.route.params.isCreatingSchedule
    : false;

  const [listItems, setListItems] = useState([]);

  const [isCreateSchedulePopupDisplayed, setIsCreateSchedulePopupDisplayed] =
    useState(false);

  const [isScheduleTypePopupDisplayed, setIsScheduleTypePopupDisplayed] =
    useState(isCreatingSchedule);

  const {messagePopup, openMessagePopup, closeMessagePopup} = useMessagePopup();

  const [isLoading, setLoadingPopup] = useState(false);

  useEffect(() => {
    //Set add button in nav bar with appropriate onPress attribute
    navigation.setOptions({
      headerRight: () => (
        <IconButton
          testID={pageTitle + '.header.addButton'}
          iconOnly
          invertColor
          onPress={() => {
            setIsScheduleTypePopupDisplayed(!isScheduleTypePopupDisplayed);
          }}
          name="add"
        />
      ),
    });
  }, [isScheduleTypePopupDisplayed, navigation]);

  useEffect(() => {
    loadData(userDB, 'tblSchedules').then((res) => {
      setListItems(res);
    });
  }, [userDB, setListItems, updatePages]);

  const afterUpdate = useUpdate(updatePages, dispatch);

  function onAddSchedule(
    scheduleName,
    doesTrack,
    duration,
    bookId,
    chapter,
    verse,
    startingPortion,
    maxPortion,
    readingPortionDesc,
    portionsPerDay,
    startDate,
  ) {
    let activeDays = [1, 1, 1, 1, 1, 1, 1];
    setIsCreateSchedulePopupDisplayed(false);
    setIsScheduleTypePopupDisplayed(false);
    setLoadingPopup(true);
    addSchedule(
      userDB,
      bibleDB,
      scheduleType,
      scheduleName,
      doesTrack,
      activeDays,
      duration,
      bookId,
      chapter,
      verse,
      startingPortion,
      maxPortion,
      readingPortionDesc,
      portionsPerDay,
      () => {
        afterUpdate();
        setLoadingPopup(false);
      },
      (message) => {
        setLoadingPopup(false);
        openMessagePopup(message);
      },
      startDate,
    );
  }

  return (
    <SafeAreaView testID={pageTitle} style={styles.container}>
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
      />
      <CreateSchedulePopup
        testID={pageTitle + '.createSchedulePopup'}
        displayPopup={isCreateSchedulePopupDisplayed}
        onAdd={onAddSchedule}
        onClosePress={() => {
          setIsCreateSchedulePopupDisplayed(false);
        }}
        onError={(message, title) => openMessagePopup(message, title)}
        type={scheduleType}
      />
      <ScheduleTypeSelectionPopup
        testID={pageTitle + '.scheduleTypePopup'}
        displayPopup={isScheduleTypePopupDisplayed}
        onConfirm={(type) => {
          scheduleType = type;
          setIsCreateSchedulePopupDisplayed(true);
          setIsScheduleTypePopupDisplayed(false);
        }}
        onClosePress={() => {
          setIsScheduleTypePopupDisplayed(false);
        }}
      />
      <View style={styles.content}>
        <FlatList
          data={listItems}
          keyExtractor={(item, index) => index.toString()}
          renderItem={({item}) => {
            return (
              <TextButton
                testID={pageTitle + '.' + item.ScheduleName}
                key={item.ScheduleID}
                text={item.ScheduleName}
                onPress={() => {
                  let table =
                    item.CreationInfo === WEEKLY_READING_TABLE_NAME
                      ? WEEKLY_READING_TABLE_NAME
                      : formatScheduleTableName(item.ScheduleID);
                  navigation.navigate('SchedulePage', {
                    id: item.ScheduleID,
                    title: item.ScheduleName,
                    name: item.ScheduleName,
                    table: table,
                  });
                }}
              />
            );
          }}
        />
      </View>
    </SafeAreaView>
  );
}
