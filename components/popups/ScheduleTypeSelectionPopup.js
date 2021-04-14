import React from 'react';

import Popup from './Popup';
import Text, {Body} from '../text/Text';

import {translate} from '../../logic/localization/localization';

import styles from '../../styles/styles';
import CustomButton from '../buttons/CustomButton';
import {SCHEDULE_TYPES} from '../../logic/general';

const prefix = 'scheduleTypePopup.';

export default function ScheduleTypeSelectionPopup(props) {
  const {testID} = props;
  return (
    <Popup
      testID={testID}
      displayPopup={props.displayPopup}
      title={translate(prefix + 'scheduleType')}
      onClosePress={props.onClosePress}>
      <ScheduleSelectionButton
        testID={testID + '.sequentialButton'}
        title={translate(prefix + 'sequential')}
        description={translate(prefix + 'sequentialDescription')}
        onPress={() => {
          props.onConfirm(SCHEDULE_TYPES.SEQUENTIAL);
        }}
      />
      <ScheduleSelectionButton
        testID={testID + '.chronologicalButton'}
        title={translate(prefix + 'chronological')}
        description={translate(prefix + 'chronologicalDescription')}
        onPress={() => {
          props.onConfirm(SCHEDULE_TYPES.CHRONOLOGICAL);
        }}
      />
      <ScheduleSelectionButton
        testID={testID + '.thematicButton'}
        title={translate(prefix + 'thematic')}
        description={translate(prefix + 'thematicDescription')}
        onPress={() => {
          props.onConfirm(SCHEDULE_TYPES.THEMATIC);
        }}
      />
      <ScheduleSelectionButton
        testID={testID + '.customButton'}
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
  const {description, onPress, testID, title} = props;
  return (
    <CustomButton testID={testID} style={{width: '95%'}} onPress={onPress}>
      <Body style={styles.buttonText}>{title}</Body>
      <Text style={styles.buttonText}>{description}</Text>
    </CustomButton>
  );
}
