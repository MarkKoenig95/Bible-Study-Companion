import React, {useState} from 'react';
import {View} from 'react-native';

import IconButton from '../../buttons/IconButton';
import Text from '../../text/Text';

import {translate} from '../../../logic/localization/localization';

import CustomInput from '../../inputs/CustomInput';
import {useToggleState} from '../../../logic/general';

export const ScheduleNameInput = (props: {
  onScheduleNameChange: (name: string) => void;
  scheduleName: string;
  testID: string;
}) => {
  const {onScheduleNameChange, scheduleName, testID} = props;
  const [isEditing, toggleIsEditing] = useToggleState(false);
  const [thisScheduleName, setThisScheduleName] = useState(scheduleName);

  return (
    <View>
      {isEditing ? (
        <CustomInput
          testID={testID}
          title={translate('createSchedulePopup.scheduleName')}
          onChangeText={setThisScheduleName}
          value={thisScheduleName}
          placeholder={translate('createSchedulePopup.scheduleName')}
        />
      ) : (
        <Text>{thisScheduleName}</Text>
      )}

      {isEditing ? (
        <>
          <IconButton
            testID={testID + '.closeButton'}
            iconOnly
            name="close"
            onPress={() => {
              setThisScheduleName(scheduleName);
              toggleIsEditing();
            }}
          />
          <IconButton
            testID={testID + '.confirmButton'}
            iconOnly
            name="check"
            onPress={() => {
              onScheduleNameChange(thisScheduleName);
            }}
          />
        </>
      ) : (
        <IconButton
          testID={testID + '.editButton'}
          iconOnly
          name="edit"
          onPress={toggleIsEditing}
        />
      )}
    </View>
  );
};
