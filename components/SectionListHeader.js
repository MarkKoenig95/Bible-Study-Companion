import React from 'react';
import {Heading} from './text/Text';
import styles from '../styles/styles';
import {StyleSheet, View} from 'react-native';

export default function SectionListHeader({section: {title}}) {
  if (title) {
    return (
      <View style={style.container}>
        <Heading style={style.heading}>{title}</Heading>
      </View>
    );
  }
}

const style = StyleSheet.create({
  container: {...styles.container, height: 'auto'},
  heading: {...styles.buttonText, alignSelf: 'center'},
});
