import 'react-native-gesture-handler';
import React, {useState, useEffect} from 'react';
import {StyleSheet, Text, TextInput, View} from 'react-native';
import SearchableDropdown from 'react-native-searchable-dropdown';

import styles, {colors} from '../styles/styles';

import Database from '../../scripts/Database/Database';
import {openTable} from '../../scripts/Database/generalTransactions';

const db = Database.getConnection();

const items = [];

function loadData(tableName = 'tblBibleBooks') {
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
  const [selectedItems, setSelectedItems] = useState([]);
  const [bookName, setBookName] = useState('');

  const defaults = {
    book: 'Genesis',
    chapter: '1',
    verse: '1',
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <View style={styles.versePicker}>
      <Text style={{...styles.text, width: '100%'}}>{props.title}</Text>
      <View
        style={{
          flexDirection: 'row',
          width: '100%',
        }}>
        <SearchableDropdown
          onItemSelect={item => {
            const items = selectedItems;
            items.push(item);
            setSelectedItems(items);
          }}
          containerStyle={{
            padding: 5,
            paddingLeft: 0,
            width: 145,
          }}
          onRemoveItem={(item, index) => {
            const items = selectedItems.filter(sitem => sitem.id !== item.id);
            setSelectedItems(items);
          }}
          itemStyle={style.item}
          itemTextStyle={styles.buttonText}
          itemsContainerStyle={{
            backgroundColor: colors.lightBlue,
            borderRadius: 10,
            maxHeight: 140,
          }}
          items={items}
          defaultIndex={0}
          resetValue={false}
          textInputProps={{
            placeholder: 'Bible Book',
            underlineColorAndroid: 'transparent',
            style: {...styles.input, marginLeft: 0},
            onTextChange: text => setBookName,
          }}
          listProps={{
            nestedScrollEnabled: true,
          }}
        />
        <TextInput
          style={{...styles.input, marginTop: 10, width: 50}}
          textAlign="center"
          onChangeText={text => props.onChange('chapter', text)}
          value={props.chapterValue}
          onBlur={() => {
            if (!props.chapterValue) {
              props.onChange('chapter', props.defaultChapterValue);
            }
          }}
          onFocus={() => {
            if (
              !props.chapterValue ||
              props.chapterValue === props.defaultChapterValue
            ) {
              props.onChange('chapter', '');
            }
          }}
          defaultValue={props.defaultChapterValue}
        />
        <Text style={{...styles.text, fontSize: 35, margin: 5}}>:</Text>
        <TextInput
          style={{...styles.input, marginTop: 10, width: 50}}
          textAlign="center"
          onChangeText={text => props.onChange('verse', text)}
          value={props.verseValue}
          onBlur={() => {
            if (!props.verseValue) {
              props.onChange('verse', props.defaultVerseValue);
            }
          }}
          onFocus={() => {
            if (
              !props.verseValue ||
              props.verseValue === props.defaultVerseValue
            ) {
              props.onChange('verse', '');
            }
          }}
          defaultValue={props.defaultVerseValue}
        />
      </View>
    </View>
  );
}

const style = StyleSheet.create({
  item: {
    ...styles.button,
    padding: 10,
    margin: 2,
  },
});
