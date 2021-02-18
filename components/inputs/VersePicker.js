import 'react-native-gesture-handler';
import React, {useState, useEffect, useContext} from 'react';
import {StyleSheet, View} from 'react-native';
import {translate} from '../../logic/localization/localization';

import CustomInput from './CustomInput';
import Text from '../text/Text';

import styles from '../../styles/styles';
import {store} from '../../data/Store/store.js';
import CustomDropdown from './CustomDropdown';

const items = [];

async function loadData(bibleDB) {
  await bibleDB
    .executeSql('SELECT BibleBookID, BookName FROM tblBibleBooks;', [])
    .then(([res]) => {
      for (let i = 0; i < res.rows.length; ++i) {
        let item = res.rows.item(i);
        items.push({
          id: item.BibleBookID,
          name: translate('bibleBooks.' + item.BibleBookID + '.name'),
        });
      }
    });
}

export default function VersePicker(props) {
  const {
    chapterValue,
    defaultChapterValue,
    defaultVerseValue,
    onChange,
    selectedItems,
    testID,
    title,
    verseValue,
  } = props;

  const globalState = useContext(store);
  const {bibleDB} = globalState.state;
  const setSelectedItems = sItems => onChange('selectedItems', sItems);
  const [bookName, setBookName] = useState('');

  useEffect(() => {
    loadData(bibleDB);
  }, [bibleDB]);

  return (
    <View testID={testID} style={styles.versePicker}>
      <Text style={style.title}>{title}</Text>

      <View style={style.container}>
        <CustomDropdown
          testID={testID + '.bibleBookPicker'}
          items={items}
          placeholder={translate('bibleBook')}
          selectedItems={selectedItems}
          setSelectedItems={setSelectedItems}
          text={bookName}
          onTextChange={text => setBookName}
          width={145}
        />

        <CustomInput
          testID={testID + '.chapterInput'}
          style={style.input}
          containerStyle={style.inputContainer}
          onChangeText={text => onChange('chapter', text)}
          textAlign="center"
          value={chapterValue}
          defaultValue={defaultChapterValue}
          placeholder={translate('versePicker.chapterAbrev')}
          keyboardType={'number-pad'}
        />

        <Text style={style.text}>:</Text>

        <CustomInput
          testID={testID + '.verseInput'}
          style={style.input}
          containerStyle={style.inputContainer}
          onChangeText={text => onChange('verse', text)}
          textAlign="center"
          value={verseValue}
          defaultValue={defaultVerseValue}
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
