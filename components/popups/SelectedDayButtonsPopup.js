import React, {useState, useCallback, useEffect} from 'react';

import Popup from './Popup';

import {translate} from '../../logic/localization/localization';
import {View} from 'react-native';

export default function ButtonsPopup(props) {
  return (
    <Popup {...props} title={translate('buttonsPopup.title')}>
      <View>{props.buttons.map(btn => btn)}</View>
    </Popup>
  );
}

export function useButtonsPopup() {
  const [buttonsPopup, setButtonsPopup] = useState({
    isDisplayed: false,
    areButtonsFinished: [],
    buttons: [],
    readingDayIDs: [],
  });

  const closeButtonsPopup = useCallback(() => {
    setButtonsPopup(prevValue => {
      return {...prevValue, isDisplayed: false};
    });
  }, []);

  const openButtonsPopup = useCallback(
    (id, buttons, areButtonsFinished = [], readingDayIDs = []) => {
      setButtonsPopup({
        id: id,
        isDisplayed: true,
        buttons: buttons,
        areButtonsFinished: areButtonsFinished,
        readingDayIDs: readingDayIDs,
      });
    },
    [],
  );

  return {
    openButtonsPopup: openButtonsPopup,
    closeButtonsPopup: closeButtonsPopup,
    buttonsPopup: buttonsPopup,
  };
}
