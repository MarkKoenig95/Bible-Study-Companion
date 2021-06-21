import React, {useState, useCallback} from 'react';
import {View} from 'react-native';

import Popup from './Popup';
import ScheduleButton, {
  ScheduleButtonProps,
} from '../ScheduleButtonsList/ScheduleButton';

import {translate} from '../../logic/localization/localization';
import {removeElementFromArrayAtIndex} from '../../logic/general';
import {ButtonsPopupState} from '../ScheduleButtonsList/types';

interface ButtonsPopupProps {
  buttonsPopupState: ButtonsPopupState;
  displayPopup: boolean;
  onClosePress: () => void;
  testID: string;
}

export default function ButtonsPopup(props: ButtonsPopupProps) {
  const {buttonsPopupState} = props;
  const {buttons} = buttonsPopupState;
  return (
    <Popup {...props} title={translate('buttonsPopup.title')}>
      <View style={{width: '95%'}}>
        {buttons.map((btn: ScheduleButtonProps) => (
          <ScheduleButton {...btn} />
        ))}
      </View>
    </Popup>
  );
}

const baseState: ButtonsPopupState = {
  areButtonsFinished: [],
  buttons: [],
  isDisplayed: false,
  readingDayIDs: [],
  tableName: '',
};

export function useButtonsPopup() {
  const [buttonsPopup, setButtonsPopup] = useState(baseState);

  const closeButtonsPopup = useCallback(() => {
    setButtonsPopup((prevValue) => {
      return {...prevValue, isDisplayed: false};
    });
  }, []);

  const openButtonsPopup = useCallback(
    (buttons, tableName, areButtonsFinished = [], readingDayIDs = []) => {
      setButtonsPopup({
        areButtonsFinished,
        buttons,
        isDisplayed: true,
        readingDayIDs,
        tableName,
      });
    },
    [],
  );

  const markButtonInPopupComplete = useCallback(
    (readingDayID: number, completedHidden: boolean) => {
      setButtonsPopup((prevButtonsPopupState) => {
        const {areButtonsFinished, buttons, readingDayIDs} =
          prevButtonsPopupState;

        let indexOfID = readingDayIDs.findIndex(
          (id: number) => id === readingDayID,
        );

        let returnState = prevButtonsPopupState;

        if (!completedHidden) {
          let buttonStateItem = returnState.buttons[indexOfID].item;
          returnState.buttons[indexOfID].item = {
            ...buttonStateItem,
            isFinished: !buttonStateItem.isFinished,
          };
          returnState.areButtonsFinished[indexOfID] = true;
          return returnState;
        }

        returnState.areButtonsFinished = removeElementFromArrayAtIndex(
          areButtonsFinished,
          indexOfID,
        );
        returnState.buttons = removeElementFromArrayAtIndex(buttons, indexOfID);
        returnState.readingDayIDs = removeElementFromArrayAtIndex(
          readingDayIDs,
          indexOfID,
        );

        return returnState;
      });
    },
    [],
  );

  return {
    buttonsPopup,
    closeButtonsPopup,
    markButtonInPopupComplete,
    openButtonsPopup,
  };
}
