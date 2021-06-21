import React, {useState} from 'react';
import {View} from 'react-native';

import ButtonsPopup, {useButtonsPopup} from '../popups/SelectedDayButtonsPopup';
import ReadingRemindersPopup from '../popups/ReadingRemindersPopup';
import ReadingInfoPopup, {
  useReadingInfoPopup,
} from '../popups/ReadingInfoPopup';

import {
  ButtonsPopupState,
  OpenReadingInfoPopup,
  ReadingPopupState,
} from './types';

interface ScheduleButtonsListPopupsProps {
  buttonsPopup: ButtonsPopupState;
  closeButtonsPopup: () => void;
  closeReadingPopup: () => void;
  isRemindersPopupDisplayed: boolean;
  readingPopup: ReadingPopupState;
  setIsRemindersPopupDisplayed: (bool: boolean) => void;
  testID: string;
}

function ScheduleButtonsListPopups(props: ScheduleButtonsListPopupsProps) {
  const {
    buttonsPopup,
    closeButtonsPopup,
    closeReadingPopup,
    isRemindersPopupDisplayed,
    readingPopup,
    setIsRemindersPopupDisplayed,
    testID,
  } = props;

  return (
    <View style={{width: '100%'}}>
      <ReadingInfoPopup
        testID={testID + '.readingInfoPopup'}
        popupProps={{
          displayPopup: readingPopup.isDisplayed,
          title: readingPopup.title,
          message: readingPopup.message,
          onClosePress: closeReadingPopup,
        }}
        onConfirm={readingPopup.cb}
        startBookNumber={readingPopup.startBookNumber}
        startChapter={readingPopup.startChapter}
        startVerse={readingPopup.startVerse}
        endBookNumber={readingPopup.endBookNumber}
        endChapter={readingPopup.endChapter}
        endVerse={readingPopup.endVerse}
        readingPortion={readingPopup.readingPortion}
      />
      <ButtonsPopup
        testID={testID + '.buttonsPopup'}
        buttonsPopupState={buttonsPopup}
        displayPopup={buttonsPopup.isDisplayed}
        onClosePress={closeButtonsPopup}
      />
      <ReadingRemindersPopup
        testID={testID + '.readingRemindersPopup'}
        displayPopup={isRemindersPopupDisplayed}
        onClosePress={() => {
          setIsRemindersPopupDisplayed(false);
        }}
      />
    </View>
  );
}

export default function useScheduleListPopups(pageTitle: string) {
  const {
    buttonsPopup,
    closeButtonsPopup,
    markButtonInPopupComplete,
    openButtonsPopup,
  } = useButtonsPopup();

  const [isRemindersPopupDisplayed, setIsRemindersPopupDisplayed] =
    useState(false);

  const openRemindersPopup = () => {
    setIsRemindersPopupDisplayed(true);
  };

  const {readingPopup, openReadingPopup, closeReadingPopup} =
    useReadingInfoPopup();

  const openReadingInfoPopup: OpenReadingInfoPopup = (...args) => {
    closeButtonsPopup();
    openReadingPopup(...args);
  };

  const ScheduleListPopups = () => {
    return (
      <ScheduleButtonsListPopups
        buttonsPopup={buttonsPopup}
        closeButtonsPopup={closeButtonsPopup}
        closeReadingPopup={closeReadingPopup}
        isRemindersPopupDisplayed={isRemindersPopupDisplayed}
        readingPopup={readingPopup}
        setIsRemindersPopupDisplayed={setIsRemindersPopupDisplayed}
        testID={pageTitle}
      />
    );
  };

  return {
    ScheduleListPopups,
    buttonsPopup,
    closeReadingPopup,
    isRemindersPopupDisplayed,
    markButtonInPopupComplete,
    openButtonsPopup,
    openReadingPopup: openReadingInfoPopup,
    openRemindersPopup,
    readingPopup,
    testID: pageTitle,
  };
}
