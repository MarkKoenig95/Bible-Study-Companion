import React, {useState, useCallback} from 'react';

import Popup from './Popup';

import {translate} from '../../logic/localization/localization';
import {View} from 'react-native';

export default function ButtonsPopup(props) {
  const {buttons} = props;
  return (
    <Popup {...props} title={translate('buttonsPopup.title')}>
      <View style={{width: '95%'}}>{buttons.map((btn) => btn)}</View>
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
