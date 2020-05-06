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
    backgroundColor: lightGray + '60',
    height: '100%',
    width: '100%',
    zIndex: 2,
  },
  button: {
    alignItems: 'center',
    backgroundColor: smoke,
    borderRadius: 10,
    padding: 10,
    margin: 10,
  },
  buttonText: {
    color: darkGray,
  },
  container: {
    alignItems: 'center',
    backgroundColor: lightBlue,
    flexDirection: 'column',
    height: '100%',
    width: '100%',
  },
  content: {
    marginBottom: 83,
    padding: 10,
    position: 'relative',
    top: 80,
    width: '100%',
  },
  footer: {
    backgroundColor: lightGray,
    bottom: 0,
    height: 50,
    justifyContent: 'space-around',
    padding: 10,
    position: 'absolute',
    width: '100%',
  },
  header: {
    alignItems: 'center',
    backgroundColor: lightGray,
    flexDirection: 'row',
    justifyContent: 'space-around',
    minHeight: 50,
    padding: 10,
    position: 'absolute',
    top: 0,
    width: '100%',
  },
  input: {
    backgroundColor: colors.smoke,
    borderColor: colors.lightGray,
    borderRadius: 10,
    borderWidth: 1,
    color: colors.darkGray,
    height: 40,
    marginTop: 5,
    padding: 10,
    width: '100%',
  },
  text: {
    color: smoke,
  },
  popup: {
    alignItems: 'center',
    backgroundColor: lightGray,
    borderRadius: 10,
    marginTop: 100,
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
