import RNFS from 'react-native-fs';

export const LocalDBPath = RNFS.LibraryDirectoryPath + '/LocalDatabase';

export const PrePopulatedDBPath = RNFS.MainBundlePath + '/www';

export function accessDirectory() {
  RNFS.readDir(LocalDBPath)
    .then((result) => {
      for (let i = 0; i < result.length; i++) {
        const element = result[i];
        console.log('RESULT', i, element.name);
      }
    })
    .catch((err) => {
      console.log(err.message, err.code);
    });

  RNFS.readDir(PrePopulatedDBPath)
    .then((result) => {
      for (let i = 0; i < result.length; i++) {
        const element = result[i];
        console.log('RESULT', i, element.name);
      }
    })
    .catch((err) => {
      console.log(err.message, err.code);
    });
}
