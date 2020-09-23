import React, {useEffect, useState} from 'react';
import {View} from 'react-native';
import {Picker} from '@react-native-community/picker';
import CustomButton from '../buttons/CustomButton';
import Text from '../text/Text';

export default function CustomPicker(props) {
  let {onChange, TextComponent, values, currentValue, containerStyle} = props;
  //The values prop is an array of objects with label and value keys i.e. [{value:0, label:'Valuable'}]
  TextComponent = TextComponent || Text;
  const [value, setValue] = useState(currentValue);
  const [showPicker, setShowPicker] = useState(false);

  useEffect(() => {
    setValue(currentValue);
  }, [currentValue]);

  return (
    <View style={containerStyle}>
      <CustomButton
        style={{width: 175}}
        onPress={() => {
          setShowPicker(!showPicker);
        }}>
        {!showPicker ? (
          <TextComponent dark>{values[value].label}</TextComponent>
        ) : (
          <Picker
            selectedValue={value}
            style={{height: 'auto', width: 175}}
            onValueChange={(itemValue, itemIndex) => {
              setShowPicker(false);
              onChange(itemValue);
              setValue(itemValue);
            }}
            {...props}>
            {values.map(val => (
              <Picker.Item
                key={Math.random() * 100000}
                label={val.label}
                value={val.value}
              />
            ))}
          </Picker>
        )}
      </CustomButton>
    </View>
  );
}
