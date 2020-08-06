import 'react-native-gesture-handler';
import React from 'react';
import {StyleSheet, View, Text} from 'react-native';
import SearchableDropdown from 'react-native-searchable-dropdown';

import styles, {colors} from '../../styles/styles';

export default function CustomDropdown(props) {
  const {
    items,
    placeholder,
    selectedItems,
    setSelectedItems,
    onTextChange,
    width,
  } = props;

  return (
    <SearchableDropdown
      onItemSelect={item => {
        const sItems = selectedItems;
        sItems.pop();
        sItems.push(item);
        setSelectedItems(sItems);
      }}
      containerStyle={{...style.dropdownContainer, width: width}}
      onRemoveItem={(item, index) => {
        const sItems = selectedItems.filter(sItem => sItem.id !== item.id);
        setSelectedItems(sItems);
      }}
      itemStyle={style.item}
      itemTextStyle={styles.buttonText}
      itemsContainerStyle={style.itemContainer}
      items={items}
      defaultIndex={0}
      resetValue={false}
      textInputProps={{
        placeholder: placeholder,
        placeholderTextColor: colors.gray,
        underlineColorAndroid: 'transparent',
        style: {...styles.input, marginLeft: 0},
        onChangeText: onTextChange,
      }}
      listProps={{
        nestedScrollEnabled: true,
      }}
    />
  );
}

const style = StyleSheet.create({
  dropdownContainer: {
    padding: 5,
    paddingLeft: 0,
  },
  item: {
    ...styles.button,
    padding: 10,
    margin: 2,
  },
  itemContainer: {
    backgroundColor: colors.lightBlue,
    borderRadius: 10,
    maxHeight: 140,
  },
});
