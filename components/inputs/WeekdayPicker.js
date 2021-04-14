import React from 'react';

import {translate} from '../../logic/localization/localization';
import {createPickerArray} from '../../logic/general';

import Picker from './CustomPicker';

export default function WeekdayPicker(props) {
  let {currentValue, onChange} = props;

  if (parseInt(currentValue, 10) > 6) {
    currentValue = 6;
    onChange(currentValue);
  }
  const weekdays = createPickerArray(
    translate('weekdays.0.name'),
    translate('weekdays.1.name'),
    translate('weekdays.2.name'),
    translate('weekdays.3.name'),
    translate('weekdays.4.name'),
    translate('weekdays.5.name'),
    translate('weekdays.6.name'),
  );

  return <Picker {...props} currentValue={currentValue} values={weekdays} />;
}
