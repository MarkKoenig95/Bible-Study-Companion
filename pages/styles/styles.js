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
  background: {
    alignItems: 'center',
    height: '100%',
    width: '100%',
    zIndex: 2,
  },
  button: {
    alignItems: 'center',
    backgroundColor: smoke,
    borderRadius: 10,
    flex: 1,
    padding: 10,
    margin: 10,
  },
  buttonText: {
    color: darkGray,
  },
  container: {
    height: '100%',
    width: '100%',
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
    flexDirection: 'row',
    alignItems: 'center',
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
    alignItems: 'center',
    backgroundColor: lightGray,
    borderRadius: 10,
    marginTop: '25%',
    minHeight: 300,
    overflow: 'hidden',
    width: '75%',
    zIndex: 2,
  },
  versePicker: {
    margin: 10,
    padding: 10,
    width: '90%',
  },
});

export {styles as default, colors};
