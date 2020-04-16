import 'react-native-gesture-handler';
import React, { useState, useEffect } from 'react';
import { Text, TextInput, View } from 'react-native';

import styles, { colors } from '../styles/styles';

export default function VersePicker(props) {
  const { onChange } = props;

  const defaults = {
    book: 'Genesis',
    chapter: '1',
    verse: '1',
  };

  useEffect(() => {
    console.log('Change');

    onChange('book', defaults.bookValue);
    onChange('chapter', defaults.chapterValue);
    onChange('verse', defaults.verseValue);
  }, [onChange, defaults]);

  return (
    <View style={styles.versePicker}>
      <Text style={styles.text}>{props.title}</Text>
      <View>
        <TextInput
          style={{ ...styles.input, width: '50%' }}
          onChangeText={text => props.onChange('book', text)}
          value={props.bookValue}
          onBlur={() => {
            if (!props.bookValue) {
              props.onChange('book', props.defaultBookValue);
            }
          }}
          onFocus={() => {
            if (!props.bookValue || props.value === props.defaultBookValue) {
              props.onChange('book', '');
            }
          }}
          defaultValue={props.defaultBookValue}
        />
        <TextInput
          style={{ ...styles.input, width: '20%' }}
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
        {/* <TextInput
          style={{ ...styles.input, width: '20%' }}
          onChangeText={text => props.onChange('verse', text)}
          value={props.verseValue}
          onBlur={() => {
            if (!props.verseValue) {
              props.onChange('verse', props.defaultVerseValue);
            }
          }}
          onFocus={() => {
            if (!props.verseValue || props.value === props.defaultVerseValue) {
              props.onChange('verse', '');
            }
          }}
          defaultValue={props.defaultVerseValue}
        /> */}
      </View>
    </View>
  );
}
