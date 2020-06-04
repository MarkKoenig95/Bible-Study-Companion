import React from 'react';
import {Text, StyleSheet} from 'react-native';

import styles from '../../styles/styles';

export default function CustomText(props) {
  return (
    <Text {...props} style={[styles.lightText, props.style]}>
      {props.children}
    </Text>
  );
}

export function Body(props) {
  return (
    <Text {...props} style={{...style.body, ...props.style}}>
      {props.children}
    </Text>
  );
}

export function SubHeading(props) {
  return (
    <Text {...props} style={{...style.subheading, ...props.style}}>
      {props.children}
    </Text>
  );
}

export function Heading(props) {
  return (
    <Text {...props} style={{...style.heading, ...props.style}}>
      {props.children}
    </Text>
  );
}

const base = {
  ...styles.lightText,
  padding: 10,
  alignSelf: 'flex-start',
};

const style = StyleSheet.create({
  body: {...base, fontSize: 20},
  subheading: {
    ...base,
    fontSize: 20,
    fontWeight: 'bold',
    paddingTop: 20,
  },
  heading: {
    ...base,
    fontSize: 25,
    fontWeight: 'bold',
    paddingTop: 20,
  },
});
