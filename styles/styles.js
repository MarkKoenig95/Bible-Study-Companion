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
  lightText: smoke,
  darkText: darkGray,
};

const styles = StyleSheet.create({
  background: {
    alignItems: 'center',
    backgroundColor: lightGray + '60',
    justifyContent: 'center',
    height: '100%',
    width: '100%',
    elevation: 3,
    zIndex: 2,
  },
  button: {
    alignItems: 'center',
    backgroundColor: smoke,
    borderRadius: 10,
    elevation: 5,
    padding: 10,
    margin: 10,
    shadowColor: colors.darkBlue,
    shadowOffset: {width: 6, height: 6},
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  buttonText: {
    color: darkGray,
  },
  container: {
    alignItems: 'center',
    backgroundColor: lightBlue,
    flex: 1,
    flexDirection: 'column',
    height: '100%',
    width: '100%',
  },
  content: {
    flex: 1,
    marginBottom: 55,
    padding: 10,
    position: 'relative',
    top: 65,
    width: '100%',
  },
  contentWithoutHeader: {
    flex: 1,
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
    elevation: 0,
    zIndex: -1,
  },
  input: {
    backgroundColor: colors.smoke,
    borderColor: colors.lightGray,
    borderRadius: 10,
    borderWidth: 1,
    color: colors.darkGray,
    flex: 1,
    padding: 10,
    width: '100%',
  },
  inputContainer: {
    flex: 1,
    padding: 10,
    paddingBottom: 5,
    width: '90%',
  },
  lightText: {
    color: smoke,
  },
  navHeaderButton: {height: 'auto', width: 'auto', margin: 5, padding: 5},
  navHeaderContainer: {
    alignContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  popup: {
    alignItems: 'center',
    backgroundColor: lightGray,
    borderRadius: 10,
    maxHeight: '95%',
    minHeight: 300,
    overflow: 'hidden',
    width: '85%',
    zIndex: 2,
  },
  versePicker: {
    flex: 1,
    margin: 10,
    padding: 10,
    width: '90%',
  },
  wrapper: {
    alignSelf: 'center',
    alignItems: 'center',
    backgroundColor: colors.smoke + 'af',
    borderColor: colors.darkBlue,
    borderRadius: 10,
    borderWidth: 2,
    justifyContent: 'space-between',
    margin: 10,
    width: '95%',
  },
  wrapperContent: {
    alignSelf: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    margin: 5,
    width: '90%',
  },
});

export {styles as default, colors};
