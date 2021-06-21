import React, {useState, useCallback} from 'react';

import Popup from './Popup';

import {translate} from '../../logic/localization/localization';
import {View} from 'react-native';
import {ButtonsPopupState} from '../ScheduleButtonsList/types';

interface ButtonsPopupProps {
  buttonsPopupState: ButtonsPopupState;
  onClosePress: () => void;
  testID: string;
}

export default function ButtonsPopup(props: ButtonsPopupProps) {
  const {buttonsPopupState} = props;
  const {buttons} = buttonsPopupState;
  return (
    <Popup {...props} title={translate('buttonsPopup.title')}>
      <View style={{width: '95%'}}>{buttons.map((btn: Element) => btn)}</View>
    </Popup>
  );
}

export function useButtonsPopup() {
  const [buttonsPopup, setButtonsPopup] = useState({
    areButtonsFinished: [],
    buttons: [],
    isDisplayed: false,
    readingDayIDs: [],
    tableName: '',
  });

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

  return {
    openButtonsPopup,
    closeButtonsPopup,
    buttonsPopup,
  };
}
