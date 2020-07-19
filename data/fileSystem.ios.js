import RNFS from 'react-native-fs';

export const LocalDBPath = RNFS.LibraryDirectoryPath + '/LocalDatabase';

export const PrePopulatedDBPath = RNFS.MainBundlePath + '/www';

export function accessDirectory() {
  // get a list of files and directories in the main bundle
  RNFS.readDir(LocalDBPath)
    .then(result => {
      for (let i = 0; i < result.length; i++) {
        const element = result[i];
        console.log('RESULT', i, element.name);
      }
    })
    .catch(err => {
      console.log(err.message, err.code);
    });

  // get a list of files and directories in the main bundle
  RNFS.readDir(PrePopulatedDBPath) // On Android, use "RNFS.DocumentDirectoryPath" (MainBundlePath is not defined)
    .then(result => {
      for (let i = 0; i < result.length; i++) {
        const element = result[i];
        console.log('RESULT', i, element.name);
      }
    })
    .catch(err => {
      console.log(err.message, err.code);
    });
}
