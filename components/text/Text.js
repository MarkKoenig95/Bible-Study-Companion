import React from 'react';
import {Text, StyleSheet} from 'react-native';

import styles from '../../styles/styles';

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
  largeButtonText: {
    ...styles.lightGray,
    fontSize: 20,
    fontWeight: 'bold',
    padding: 10,
  },
});

export function createCustomTextComponent(thisStyle) {
  return props => {
    return (
      <Text {...props} style={[thisStyle, props.style]}>
        {props.children}
      </Text>
    );
  };
}

export const Main = createCustomTextComponent();

export const Body = createCustomTextComponent({...style.body});

export default Main;

export const SubHeading = createCustomTextComponent({...style.subheading});

export const Heading = createCustomTextComponent({...style.heading});

export const LargeButtonText = createCustomTextComponent({
  ...style.largeButtonText,
});
