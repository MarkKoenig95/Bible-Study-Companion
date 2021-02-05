import React, {useEffect, useState} from 'react';
import {View} from 'react-native';
import {Picker} from '@react-native-community/picker';

import styles, {colors} from '../../styles/styles';

export default function CustomPicker(props) {
  const {onChange, values, currentValue, containerStyle, testID} = props;
  //The values prop is an array of objects with label and value keys i.e. [{value:0, label:'Valuable'}]
  const [value, setValue] = useState(currentValue);

  useEffect(() => {
    setValue(currentValue);
  }, [currentValue]);

  return (
    <View style={[styles.button, {width: 175}, containerStyle]}>
      <Picker
        testID={testID}
        selectedValue={value}
        style={{color: colors.darkGray, height: 20, width: 175}}
        onValueChange={(itemValue, itemIndex) => {
          onChange(itemValue);
          setValue(itemValue);
        }}
        {...props}>
        {values.map(val => (
          <Picker.Item
            testID={testID + '.' + val.label}
            key={Math.random() * 100000}
            label={val.label}
            value={val.value}
          />
        ))}
      </Picker>
    </View>
  );
}
