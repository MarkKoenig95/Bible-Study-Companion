import React, {useState, useCallback} from 'react';
import {View} from 'react-native';

import Popup from './Popup';
import ScheduleButton, {
  ScheduleButtonProps,
} from '../ScheduleButtonsList/ScheduleButton';

import {translate} from '../../logic/localization/localization';
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
  const [popupWidth, setPopupWidth] = useState(0);

  return (
    <Popup {...props} title={translate('buttonsPopup.title')}>
      <View
        style={{width: '95%'}}
        onLayout={(event: {
          nativeEvent: {
            layout: {x: number; y: number; width: number; height: number};
          };
        }) => {
          let {width} = event.nativeEvent.layout;
          let leftAndRightMarginsWidth = 100;

          if (!popupWidth || popupWidth) {
            setPopupWidth(width - leftAndRightMarginsWidth);
          }
        }}>
        {buttons.map((btn: ScheduleButtonProps) => (
          <ScheduleButton {...btn} readingPortionWidth={popupWidth} />
        ))}
      </View>
    </Popup>
  );
}

const toggleButtonFinishedState = (
  currentState: ButtonsPopupState,
  index: number,
) => {
  let buttonStateItem = currentState.buttons[index].item;
  currentState.buttons[index].item = {
    ...buttonStateItem,
    isFinished: !buttonStateItem.isFinished,
  };
  currentState.areButtonsFinished[index] = true;
  return currentState;
};

const modifyButtonsPopupStateForScheduleDay = (
  prevButtonsPopupState: ButtonsPopupState,
  ID: number,
) => {
  const {IDs} = prevButtonsPopupState;

  let indexOfID = IDs.findIndex((id: number) => id === ID);

  let returnState = prevButtonsPopupState;

  return toggleButtonFinishedState(returnState, indexOfID);
};

const baseState: ButtonsPopupState = {
  areButtonsFinished: [],
  buttons: [],
  isDisplayed: false,
  IDs: [],
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
    (buttons, tableName, areButtonsFinished = [], IDs = []) => {
      setButtonsPopup({
        areButtonsFinished,
        buttons,
        isDisplayed: true,
        IDs,
        tableName,
      });
    },
    [],
  );

  const markButtonInPopupComplete = useCallback((ID: number) => {
    setButtonsPopup((prevValue) => {
      return modifyButtonsPopupStateForScheduleDay(prevValue, ID);
    });
  }, []);

  return {
    buttonsPopup,
    closeButtonsPopup,
    markButtonInPopupComplete,
    openButtonsPopup,
  };
}
