import React, {useState} from 'react';
import {StyleSheet, View} from 'react-native';

import IconButton from '../buttons/IconButton';
import Text, {Body} from '../text/Text';

import CustomInput from './CustomInput';
import {useToggleState} from '../../logic/general';
import styles from '../../styles/styles';

const Editing = (props: {
  onCancelEdit: () => void;
  onChangeText: (name: string) => void;
  onConfirmEdit: () => void;
  text: string;
  testID: string;
  title: string;
}) => {
  const {
    onCancelEdit,
    onChangeText,
    onConfirmEdit,
    text,
    testID,
    title,
  } = props;
  return (
    <View style={styles.row}>
      <CustomInput
        testID={testID}
        title={title}
        onChangeText={onChangeText}
        value={text}
      />
      <IconButton
        testID={testID + '.closeButton'}
        name="close"
        onPress={onCancelEdit}
        size={4}
      />
      <IconButton
        testID={testID + '.confirmButton'}
        name="check"
        onPress={onConfirmEdit}
        size={4}
      />
    </View>
  );
};

const Displaying = (props: {
  testID: string;
  text: string;
  title: string;
  toggleIsEditing: () => void;
}) => {
  const {testID, text, title, toggleIsEditing} = props;
  return (
    <View style={styles.row}>
      <View>
        <Text>{title}</Text>
        <Body>{text}</Body>
      </View>

      <IconButton
        testID={testID + '.editButton'}
        name="edit"
        onPress={toggleIsEditing}
        size={4}
      />
    </View>
  );
};

export const ToggleEditInput = (props: {
  onTextChange: (name: string) => void;
  text: string;
  testID: string;
  title: string;
}) => {
  const {onTextChange, text, testID, title} = props;
  const [isEditing, toggleIsEditing] = useToggleState(false);
  const [thisText, setThisText] = useState(text);

  const onCancelEdit = () => {
    setThisText(text);
    toggleIsEditing();
  };
  const onConfirmEdit = () => {
    onTextChange(thisText);
    toggleIsEditing();
  };

  return (
    <View style={style.container}>
      {isEditing ? (
        <Editing
          testID={testID}
          title={title}
          onCancelEdit={onCancelEdit}
          onConfirmEdit={onConfirmEdit}
          onChangeText={setThisText}
          text={thisText}
        />
      ) : (
        <Displaying
          testID={testID}
          text={thisText}
          title={title}
          toggleIsEditing={toggleIsEditing}
        />
      )}
    </View>
  );
};

const style = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
});
