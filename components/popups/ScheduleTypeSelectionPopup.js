import React from 'react';

import Popup from './Popup';
import Text, {Heading, Subheading, Body} from '../text/Text';

import {translate} from '../../localization/localization';

import styles from '../../styles/styles';
import CustomButton from '../buttons/CustomButton';

const prefix = 'scheduleTypePopup.';

export default function ScheduleTypeSelectionPopup(props) {
  const scheduleTypes = getScheduleTypes();
  return (
    <Popup
      displayPopup={props.displayPopup}
      title={translate(prefix + 'scheduleType')}
      onClosePress={props.onClosePress}>
      <ScheduleSelectionButton
        title={translate(prefix + 'sequential')}
        description={translate(prefix + 'sequentialDescription')}
        onPress={() => {
          props.onConfirm(scheduleTypes.sequential);
        }}
      />
      <ScheduleSelectionButton
        title={translate(prefix + 'chronological')}
        description={translate(prefix + 'chronologicalDescription')}
        onPress={() => {
          props.onConfirm(scheduleTypes.chronological);
        }}
      />
      <ScheduleSelectionButton
        title={translate(prefix + 'thematic')}
        description={translate(prefix + 'thematicDescription')}
        onPress={() => {
          props.onConfirm(scheduleTypes.thematic);
        }}
      />
      <ScheduleSelectionButton
        title={translate(prefix + 'custom')}
        description={translate(prefix + 'customDescription')}
        onPress={() => {
          props.onConfirm(scheduleTypes.custom);
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

export function getScheduleTypes() {
  const scheduleTypes = {
    sequential: 0,
    chronological: 1,
    thematic: 2,
    custom: 3,
  };
  return scheduleTypes;
}
