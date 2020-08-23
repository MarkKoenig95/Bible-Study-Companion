import React from 'react';

import Popup from './Popup';
import Text, {Body} from '../text/Text';

import {translate} from '../../logic/localization/localization';

import styles from '../../styles/styles';
import CustomButton from '../buttons/CustomButton';

const prefix = 'scheduleTypePopup.';

export const SCHEDULE_TYPES = {
  SEQUENTIAL: 0,
  CHRONOLOGICAL: 1,
  THEMATIC: 2,
  CUSTOM: 3,
};

export default function ScheduleTypeSelectionPopup(props) {
  return (
    <Popup
      displayPopup={props.displayPopup}
      title={translate(prefix + 'scheduleType')}
      onClosePress={props.onClosePress}>
      <ScheduleSelectionButton
        title={translate(prefix + 'sequential')}
        description={translate(prefix + 'sequentialDescription')}
        onPress={() => {
          props.onConfirm(SCHEDULE_TYPES.SEQUENTIAL);
        }}
      />
      <ScheduleSelectionButton
        title={translate(prefix + 'chronological')}
        description={translate(prefix + 'chronologicalDescription')}
        onPress={() => {
          props.onConfirm(SCHEDULE_TYPES.CHRONOLOGICAL);
        }}
      />
      <ScheduleSelectionButton
        title={translate(prefix + 'thematic')}
        description={translate(prefix + 'thematicDescription')}
        onPress={() => {
          props.onConfirm(SCHEDULE_TYPES.THEMATIC);
        }}
      />
      <ScheduleSelectionButton
        title={translate(prefix + 'custom')}
        description={translate(prefix + 'customDescription')}
        onPress={() => {
          props.onConfirm(SCHEDULE_TYPES.CUSTOM);
        }}
      />
    </Popup>
  );
}

function ScheduleSelectionButton(props) {
  return (
    <CustomButton style={{width: '95%'}} onPress={props.onPress}>
      <Body style={styles.buttonText}>{props.title}</Body>
      <Text style={styles.buttonText}>{props.description}</Text>
    </CustomButton>
  );
}
