import RNFS from 'react-native-fs';

export const LocalDBPath = '/data/user/0/com.biblestudycompanion/databases';

export const PrePopulatedDBPath = RNFS.DocumentDirectoryPath;

export function accessDirectory() {
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
  RNFS.readDirAssets('www')
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
