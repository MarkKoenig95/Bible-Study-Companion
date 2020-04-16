import {StyleSheet} from 'react-native';

var lightGray = '#93b5b3';
var darkGray = '#63707e';
var lightBlue = '#c8dad3';
var smoke = '#f2f6f5';

const colors = {
  lightGray: lightGray,
  darkGray: darkGray,
  lightBlue: lightBlue,
  smoke: smoke,
};

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 10,
    margin: 10,
  },
  container: {
    flex: 1,
    flexDirection: 'column',
    backgroundColor: lightBlue,
    alignItems: 'center',
  },
  content: {
    width: '100%',
    padding: 10,
    position: 'relative',
    marginBottom: 95,
    top: 70,
  },
  footer: {
    height: 50,
    width: '100%',
    padding: 10,
    position: 'absolute',
    bottom: 0,
    backgroundColor: lightGray,
  },
  header: {
    minHeight: 50,
    height: 'auto',
    padding: 10,
    width: '100%',
    position: 'absolute',
    top: 0,
    backgroundColor: lightGray,
  },
  input: {
    height: 40,
    width: '100%',
    padding: 10,
    color: colors.darkGray,
    backgroundColor: colors.smoke,
    borderColor: colors.lightGray,
    borderWidth: 1,
    borderRadius: 10,
  },
  text: {
    color: smoke,
  },
  popup: {
    backgroundColor: lightGray,
    borderRadius: 10,
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: '25%',
    width: '75%',
    minHeight: 300,
    zIndex: 2,
  },
  versePicker: {
    width: '90%',
    padding: 10,
    margin: 10,
  },
});

export {styles as default, colors};
