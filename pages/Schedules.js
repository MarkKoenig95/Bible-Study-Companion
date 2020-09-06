import React, {useContext, useEffect, useState} from 'react';
import {SafeAreaView, View, FlatList, SectionList} from 'react-native';

import TextButton from '../components/buttons/TextButton';

import IconButton from '../components/buttons/IconButton';
import CreateSchedulePopup from '../components/popups/CreateSchedulePopup';
import MessagePopup, {useMessagePopup} from '../components/popups/MessagePopup';

import styles from '../styles/styles';

import {store} from '../data/Store/store';
import {setUpdatePages} from '../data/Store/actions';
import {loadData} from '../data/Database/generalTransactions';
import {addSchedule} from '../data/Database/scheduleTransactions';

import {translate} from '../logic/localization/localization';
import LoadingPopup from '../components/popups/LoadingPopup';
import {useUpdate} from '../logic/logic';
import ScheduleTypeSelectionPopup from '../components/popups/ScheduleTypeSelectionPopup';
import {Heading} from '../components/text/Text';

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

  const [listItems, setListItems] = useState([]);

  const [
    isCreateSchedulePopupDisplayed,
    setIsCreateSchedulePopupDisplayed,
  ] = useState(false);

  const [
    isScheduleTypePopupDisplayed,
    setIsScheduleTypePopupDisplayed,
  ] = useState(isCreatingSchedule);

  const {messagePopup, openMessagePopup, closeMessagePopup} = useMessagePopup();

  const [isLoading, setLoadingPopup] = useState(false);

  //Set add button in nav bar with appropriate onPress attribute
  navigation.setOptions({
    headerRight: () => (
      <IconButton
        iconOnly
        invertColor
        onPress={() => {
          setIsScheduleTypePopupDisplayed(!isScheduleTypePopupDisplayed);
        }}
        name="add"
      />
    ),
  });

  useEffect(() => {
    loadData(userDB, 'tblSchedules').then(res => {
      setListItems(res);
    });
  }, [userDB, setListItems, updatePages]);

  const afterUpdate = useUpdate(updatePages, dispatch);

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
    setIsScheduleTypePopupDisplayed(false);
    setLoadingPopup(true);
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
        setLoadingPopup(false);
      },
      message => {
        setLoadingPopup(false);
        openMessagePopup(message);
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
      <CreateSchedulePopup
        displayPopup={isCreateSchedulePopupDisplayed}
        onAdd={onAddSchedule}
        onClosePress={() => {
          setIsCreateSchedulePopupDisplayed(false);
        }}
        onError={(message, title) => openMessagePopup(message, title)}
        type={scheduleType}
      />
      <ScheduleTypeSelectionPopup
        displayPopup={isScheduleTypePopupDisplayed}
        onConfirm={type => {
          scheduleType = type;
          setIsCreateSchedulePopupDisplayed(true);
          setIsScheduleTypePopupDisplayed(false);
        }}
        onClosePress={() => {
          setIsScheduleTypePopupDisplayed(false);
        }}
      />
      <View style={styles.content}>
        <SectionList
          sections={listItems}
          keyExtractor={(item, index) => index.toString()}
          renderSectionHeader={({section: {title}}) => {
            if (title) {
              <Heading style={styles.header}>{title}</Heading>;
            }
          }}
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
      </View>
    </SafeAreaView>
  );
}
