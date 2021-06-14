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
    id: undefined,
    isDisplayed: false,
    areButtonsFinished: [],
    buttons: [],
    readingDayIDs: [],
  });

  const closeButtonsPopup = useCallback(() => {
    setButtonsPopup((prevValue) => {
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
