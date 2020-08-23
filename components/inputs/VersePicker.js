import 'react-native-gesture-handler';
import React, {useState, useEffect, useContext} from 'react';
import {StyleSheet, View} from 'react-native';
import {translate} from '../../logic/localization/localization';

import CustomInput from './CustomInput';
import Text from '../text/Text';

import styles, {colors} from '../../styles/styles';
import {store} from '../../data/Store/store.js';
import CustomDropdown from './CustomDropdown';

const items = [];

async function loadData(bibleDB) {
  await bibleDB.transaction(txn => {
    txn
      .executeSql('SELECT BibleBookID, BookName FROM tblBibleBooks', [])
      .then(([txn, results]) => {
        for (let i = 0; i < results.rows.length; ++i) {
          let item = results.rows.item(i);
          items.push({
            id: item.BibleBookID,
            name: translate('bibleBooks.' + item.BibleBookID + '.name'),
          });
        }
      });
  });
}

export default function VersePicker(props) {
  const globalState = useContext(store);
  const {bibleDB} = globalState.state;
  const selectedItems = props.selectedItems;
  const setSelectedItems = items => props.onChange('selectedItems', items);
  const [bookName, setBookName] = useState('');

  useEffect(() => {
    loadData(bibleDB);
  }, [bibleDB]);

  return (
    <View style={styles.versePicker}>
      <Text style={style.title}>{props.title}</Text>

      <View style={style.container}>
        <CustomDropdown
          items={items}
          placeholder={translate('bibleBook')}
          selectedItems={selectedItems}
          setSelectedItems={setSelectedItems}
          text={bookName}
          onTextChange={text => setBookName}
          width={145}
        />

        <CustomInput
          style={style.input}
          containerStyle={style.inputContainer}
          onChangeText={text => props.onChange('chapter', text)}
          textAlign="center"
          value={props.chapterValue}
          defaultValue={props.defaultChapterValue}
          placeholder={translate('versePicker.chapterAbrev')}
          keyboardType={'number-pad'}
        />

        <Text style={style.text}>:</Text>

        <CustomInput
          style={style.input}
          containerStyle={style.inputContainer}
          onChangeText={text => props.onChange('verse', text)}
          textAlign="center"
          value={props.verseValue}
          defaultValue={props.defaultVerseValue}
          placeholder={translate('versePicker.verseAbrev')}
          keyboardType={'numeric'}
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
  input: {
    ...styles.input,
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
