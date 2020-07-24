import React, {useState, useCallback, useEffect} from 'react';

import Popup from './Popup';

import {translate} from '../../localization/localization';
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
    buttons: [],
  });

  const closeButtonsPopup = useCallback(() => {
    setButtonsPopup(prevValue => {
      return {...prevValue, isDisplayed: false};
    });
  }, []);

  const openButtonsPopupBase = useCallback(
    (id, buttons, areButtonsFinished) => {
      setButtonsPopup({
        id: id,
        isDisplayed: true,
        buttons: buttons,
        areButtonsFinished: areButtonsFinished,
      });
    },
    [],
  );

  return {
    openButtonsPopupBase: openButtonsPopupBase,
    closeButtonsPopup: closeButtonsPopup,
    buttonsPopup: buttonsPopup,
  };
}
