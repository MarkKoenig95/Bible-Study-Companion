import React, {useContext, useEffect, useState} from 'react';
import {SafeAreaView, View, FlatList} from 'react-native';

import TextButton from '../components/buttons/TextButton';

import IconButton from '../components/buttons/IconButton';
import CreateSchedulePopup from '../components/popups/CreateSchedulePopup';
import MessagePopup, {useMessagePopup} from '../components/popups/MessagePopup';

import styles from '../styles/styles';

import {store} from '../data/Store/store';
import {setUpdatePages} from '../data/Store/actions';
import {loadData} from '../data/Database/generalTransactions';
import {addSchedule} from '../data/Database/scheduleTransactions';

import {translate} from '../localization/localization';
import LoadingPopup from '../components/popups/LoadingPopup';
import {useOpenPopupFunction} from '../logic/logic';
import ScheduleTypeSelectionPopup from '../components/popups/ScheduleTypeSelectionPopup';

let scheduleType;

export default function Schedules(props) {
  console.log('loaded schedules page');
  const navigation = props.navigation;
  const globalState = useContext(store);

  const {dispatch} = globalState;
  const {bibleDB, userDB, updatePages} = globalState.state;

  const isCreatingSchedule = props.route.params
    ? props.route.params.isCreatingSchedule
    : false;

  const [flatListItems, setFlatListItems] = useState([]);

  const [
    isCreateSchedulePopupDisplayed,
    setIsCreateSchedulePopupDisplayed,
  ] = useState(false);

  const [
    isScheduleTypePopupDisplayed,
    setIsScheduleTypePopupDisplayed,
  ] = useState(isCreatingSchedule);

  const {
    messagePopup,
    openMessagePopupBase,
    closeMessagePopup,
  } = useMessagePopup();

  const [isLoading, setLoadingPopup] = useState(false);

  const closePopupFunctions = [
    setLoadingPopup,
    closeMessagePopup,
    setIsCreateSchedulePopupDisplayed,
    setIsScheduleTypePopupDisplayed,
  ];

  const openCreateSchedulePopup = useOpenPopupFunction(
    setIsCreateSchedulePopupDisplayed,
    closePopupFunctions,
  );

  const openScheduleTypePopup = useOpenPopupFunction(
    setIsScheduleTypePopupDisplayed,
    closePopupFunctions,
  );

  const openMessagePopup = useOpenPopupFunction(
    openMessagePopupBase,
    closePopupFunctions,
  );

  const openLoadingPopup = useOpenPopupFunction(
    setLoadingPopup,
    closePopupFunctions,
  );

  //Set delete button in nav bar with appropriate onPress attribute
  props.navigation.setOptions({
    headerRight: () => (
      <IconButton
        iconOnly
        invertColor
        onPress={() => {
          openScheduleTypePopup(!isScheduleTypePopupDisplayed);
        }}
        name="add"
      />
    ),
  });

  useEffect(() => {
    loadData(userDB, setFlatListItems, 'tblSchedules');
  }, [userDB, setFlatListItems, updatePages]);

  const afterUpdate = () => {
    dispatch(setUpdatePages(updatePages));
  };

  function onAddSchedule(
    scheduleName,
    duration,
    bookId,
    chapter,
    verse,
    startingPortion,
    maxPortion,
    readingPortionDesc,
    portionsPerDay,
  ) {
    setIsCreateSchedulePopupDisplayed(false);
    openLoadingPopup(true);
    addSchedule(
      userDB,
      bibleDB,
      scheduleType,
      scheduleName,
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
        //If there is no timeout the initial setLoading popup can race with this setLoadingPopup and it might never close
        setTimeout(() => {
          setLoadingPopup(false);
        }, 500);
      },
      message => {
        //We have to make sure that one modal is closed before we show another one
        setTimeout(() => {
          setLoadingPopup(false);
          openMessagePopup(message);
        }, 500);
      },
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <LoadingPopup displayPopup={isLoading} />
      <MessagePopup
        displayPopup={messagePopup.isDisplayed}
        title={messagePopup.title}
        message={messagePopup.message}
        onClosePress={closeMessagePopup}
      />
      <ScheduleTypeSelectionPopup
        displayPopup={isScheduleTypePopupDisplayed}
        onConfirm={type => {
          scheduleType = type;
          openCreateSchedulePopup(true);
        }}
        onClosePress={() => {
          setIsScheduleTypePopupDisplayed(false);
        }}
      />
      <CreateSchedulePopup
        displayPopup={isCreateSchedulePopupDisplayed}
        onAdd={onAddSchedule}
        onClosePress={() => {
          setIsCreateSchedulePopupDisplayed(false);
        }}
        onError={(message, title) => openMessagePopup(message, title)}
        type={scheduleType}
      />
      <View style={styles.content}>
        <FlatList
          data={flatListItems}
          keyExtractor={(item, index) => index.toString()}
          renderItem={({item}) => {
            return (
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
            );
          }}
        />
        <IconButton
          buttonStyle={{alignSelf: 'center'}}
          onPress={() => {
            openScheduleTypePopup(!isScheduleTypePopupDisplayed);
          }}
          name="add"
        />
      </View>
    </SafeAreaView>
  );
}
