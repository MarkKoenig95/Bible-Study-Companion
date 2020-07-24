import {StyleSheet} from 'react-native';

const lightGray = '#93b5b3';
const gray = '#bdbdbd';
const darkGray = '#63707e';
const darkBlue = '#0f7a72';
const lightBlue = '#c8dad3';
const smoke = '#f2f6f5';

const colors = {
  lightGray: lightGray,
  gray: gray,
  darkGray: darkGray,
  darkBlue: darkBlue,
  lightBlue: lightBlue,
  smoke: smoke,
};

const styles = StyleSheet.create({
  background: {
    alignItems: 'center',
    backgroundColor: lightGray + '60',
    height: '100%',
    width: '100%',
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
    alignItems: 'center',
    backgroundColor: lightGray,
    flexDirection: 'row',
    bottom: 0,
    justifyContent: 'space-around',
    paddingBottom: 20,
    position: 'absolute',
    width: '100%',
  },
  header: {
    alignItems: 'center',
    backgroundColor: lightGray,
    flexDirection: 'row',
    justifyContent: 'space-around',
    minHeight: 50,
    paddingBottom: 10,
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
  inputContainer: {
    width: '90%',
    padding: 10,
    paddingBottom: 5,
  },
  lightText: {
    color: smoke,
  },
  popup: {
    alignItems: 'center',
    backgroundColor: lightGray,
    borderRadius: 10,
    marginTop: 100,
    maxHeight: '90%',
    minHeight: 300,
    overflow: 'hidden',
    width: '85%',
  },
  versePicker: {
    margin: 10,
    padding: 10,
    width: '90%',
  },
});

export {styles as default, colors};
