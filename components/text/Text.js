import React from 'react';
import {Text, StyleSheet} from 'react-native';

import {colors} from '../../styles/styles';

const base = {
  color: colors.lightText,
  padding: 10,
  alignSelf: 'flex-start',
};

const style = StyleSheet.create({
  body: {...base, fontSize: 18},
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
  large: {
    ...base,
    fontSize: 20,
    fontWeight: 'bold',
  },
});

export function createCustomTextComponent(thisStyle) {
  return props => {
    const {children, dark, style} = props;
    let color = {};
    color.color = dark ? colors.darkText : colors.lightText;
    return (
      <Text {...props} style={[thisStyle, color, style]}>
        {children}
      </Text>
    );
  };
}

export const Main = createCustomTextComponent({});

export default Main;

export const Body = createCustomTextComponent({...style.body});

export const SubHeading = createCustomTextComponent({...style.subheading});

export const Heading = createCustomTextComponent({...style.heading});

export const LargeText = createCustomTextComponent({...style.large});
