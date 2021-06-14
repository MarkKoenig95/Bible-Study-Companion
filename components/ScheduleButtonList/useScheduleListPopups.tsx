import React, {useState} from 'react';
import {View} from 'react-native';

import ButtonsPopup, {useButtonsPopup} from '../popups/SelectedDayButtonsPopup';
import ReadingRemindersPopup from '../popups/ReadingRemindersPopup';
import ReadingInfoPopup, {
  useReadingInfoPopup,
} from '../popups/ReadingInfoPopup';

import {OpenReadingInfoPopup} from './types';

interface ReadingPopup {
  cb: () => void;
  endBookNumber?: number;
  endChapter?: number;
  endVerse?: number;
  isDisplayed: boolean;
  message: string;
  startBookNumber?: number;
  startChapter?: number;
  startVerse?: number;
  readingPortion: string;
  title: string;
}

interface ButtonsPopup {
  buttons: Element[];
  isDisplayed: boolean;
}

interface ScheduleButtonListPopupsProps {
  buttonsPopup: ButtonsPopup;
  closeButtonsPopup: () => void;
  closeReadingPopup: () => void;
  isRemindersPopupDisplayed: boolean;
  readingPopup: ReadingPopup;
  setIsRemindersPopupDisplayed: (bool: boolean) => void;
  testID: string;
}

function ScheduleButtonListPopups(props: ScheduleButtonListPopupsProps) {
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
        displayPopup={buttonsPopup.isDisplayed}
        buttons={buttonsPopup.buttons}
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
  const {buttonsPopup, openButtonsPopup, closeButtonsPopup} = useButtonsPopup();

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
      <ScheduleButtonListPopups
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
    openButtonsPopup,
    openReadingPopup: openReadingInfoPopup,
    openRemindersPopup,
    readingPopup,
    testID: pageTitle,
  };
}
