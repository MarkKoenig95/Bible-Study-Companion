import 'react-native-gesture-handler';
import React, {useState, useEffect, useContext} from 'react';
import {StyleSheet, Text, TextInput, View} from 'react-native';
import SearchableDropdown from 'react-native-searchable-dropdown';

import CustomInput from './CustomInput';

import styles, {colors} from '../styles/styles';
import {store} from '../data/Store/store.js';

import {openTable} from '../data/Database/generalTransactions';

const items = [];

function loadData(db, tableName = 'tblBibleBooks') {
  openTable(db, tableName, function(txn, res) {
    txn.executeSql(
      'SELECT BibleBookID, BookName FROM ' + tableName,
      [],
      (txn, results) => {
        for (let i = 0; i < results.rows.length; ++i) {
          let item = results.rows.item(i);
          items.push({id: item.BibleBookID, name: item.BookName});
        }
      },
    );
  });
}

export default function VersePicker(props) {
  const globalState = useContext(store);
  const {db} = globalState.state;
  const selectedItems = props.selectedItems;
  const setSelectedItems = items => props.onChange('selectedItems', items);
  const [bookName, setBookName] = useState('');

  useEffect(() => {
    loadData(db);
  }, []);

  return (
    <View style={styles.versePicker}>
      <Text style={style.title}>{props.title}</Text>

      <View style={style.container}>
        <SearchableDropdown
          onItemSelect={item => {
            const items = selectedItems;
            items.pop();
            items.push(item);
            setSelectedItems(items);
          }}
          containerStyle={style.dropdownContainer}
          onRemoveItem={(item, index) => {
            const items = selectedItems.filter(sitem => sitem.id !== item.id);
            setSelectedItems(items);
          }}
          itemStyle={style.item}
          itemTextStyle={styles.buttonText}
          itemsContainerStyle={style.itemContainer}
          items={items}
          defaultIndex={0}
          resetValue={false}
          textInputProps={{
            placeholder: 'Bible Book',
            placeholderTextColor: colors.gray,
            underlineColorAndroid: 'transparent',
            style: {...styles.input, marginLeft: 0},
            onChangeText: text => setBookName,
          }}
          listProps={{
            nestedScrollEnabled: true,
          }}
        />

        <CustomInput
          style={style.input}
          containerStyle={style.inputContainer}
          onChangeText={text => props.onChange('chapter', text)}
          textAlign="center"
          value={props.chapterValue}
          defaultValue={props.defaultChapterValue}
          placeholder={'ch'}
        />

        <Text style={style.text}>:</Text>

        <CustomInput
          style={style.input}
          containerStyle={style.inputContainer}
          onChangeText={text => props.onChange('verse', text)}
          textAlign="center"
          value={props.verseValue}
          defaultValue={props.defaultVerseValue}
          placeholder={'v'}
        />
      </View>
    </View>
  );
}

const style = StyleSheet.create({
  container: {
    flexDirection: 'row',
    width: '100%',
  },
  dropdownContainer: {
    padding: 5,
    paddingLeft: 0,
    width: 145,
  },
  item: {
    ...styles.button,
    padding: 10,
    margin: 2,
  },
  itemContainer: {
    backgroundColor: colors.lightBlue,
    borderRadius: 10,
    maxHeight: 120,
  },
  input: {
    ...styles.input,
    marginTop: 10,
    width: 50,
  },
  inputContainer: {
    width: 50,
    padding: 0,
    margin: 0,
  },
  text: {
    ...styles.lightText,
    fontSize: 35,
    margin: 5,
  },
  title: {
    ...styles.lightText,
    width: '100%',
  },
});
