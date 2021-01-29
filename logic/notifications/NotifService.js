import PushNotification from 'react-native-push-notification';
import NotificationHandler from './NotificationHandler';

import {colors} from '../../styles/styles';
import {useState} from 'react';
import {translate} from '../localization/localization';
import {log} from '../../data/Database/generalTransactions';

//This is a template for the most relevant options for me
var defaultOptions = {
  /* Android Only Properties */
  color: colors.lightGray, // (optional) default: system default
  vibrate: true, // (optional) default: true
  vibration: 300, // vibration length in milliseconds, ignored if vibrate=false, default: 1000
  invokeApp: false, // (optional) This enable click on actions to bring back the application to foreground or stay in background, default: true

  /* iOS only properties */
  alertAction: 'view', // (optional) default: view
  category: '', // (optional) default: empty string

  /* iOS and Android properties */
  playSound: true,
  soundName: 'default', // (optional) Sound to play when the notification is shown. Value of 'default' plays the default sound. It can be set to a custom sound such as 'android.resource://com.xyz/raw/my_sound'. It will look for the 'my_sound' audio file in 'res/raw' directory and play it. default: 'default' (default sound is played)

  //For scheduled notifications
  date: new Date(Date.now() + 30 * 1000), // in 30 secs
};

export default class NotifService {
  constructor(onRegister, onNotification) {
    this.lastId = 0;
    this.lastChannelCounter = 0;

    NotificationHandler.attachRegister(onRegister);
    NotificationHandler.attachNotification(onNotification);

    // Clear badge number at start
    PushNotification.getApplicationIconBadgeNumber(number => {
      if (number > 0) {
        PushNotification.setApplicationIconBadgeNumber(0);
      }
    });

    PushNotification.getChannels(channels => {
      log('getChanels:', channels);
    });

    const notifText = {
      title: translate('notification.baseTitle'),
      bigText: translate('notification.bigText'),
      message: translate('notification.message'),
    };

    defaultOptions = {
      ...defaultOptions,
      ...notifText,
    };
  }

  createOrUpdateChannel() {
    this.lastChannelCounter++;
    PushNotification.createChannel(
      {
        channelId: 'custom-channel-id', // (required)
        channelName: `Custom channel - Counter: ${this.lastChannelCounter}`, // (required)
        channelDescription: `A custom channel to categorise your custom notifications. Updated at: ${Date.now()}`, // (optional) default: undefined.
        soundName: 'default', // (optional) See `soundName` parameter of `localNotification` function
        importance: 4, // (optional) default: 4. Int value of the Android notification importance
        vibrate: true, // (optional) default: true. Creates the default vibration patten if true.
      },
      created => log(`createChannel returned '${created}'`), // (optional) callback returns whether the channel was created, false means it already existed.
    );
  }

  popInitialNotification() {
    PushNotification.popInitialNotification(notification =>
      log('InitialNotication:', notification),
    );
  }

  localNotif(options) {
    let curOptions;
    curOptions = {...defaultOptions, ...options};
    this.lastId++;
    curOptions.id = this.lastId;
    PushNotification.localNotification(curOptions);
  }

  scheduleNotif(options) {
    let curOptions;
    if (!options || typeof options === 'string') {
      curOptions = defaultOptions;
    } else {
      curOptions = {...defaultOptions, ...options};
    }
    PushNotification.localNotificationSchedule(curOptions);
  }

  checkPermission(cbk) {
    return PushNotification.checkPermissions(cbk);
  }

  requestPermissions() {
    return PushNotification.requestPermissions();
  }

  cancelNotif(id) {
    PushNotification.cancelLocalNotifications({id: '' + id});
  }

  cancelAll() {
    PushNotification.cancelAllLocalNotifications();
  }

  abandonPermissions() {
    PushNotification.abandonPermissions();
  }

  getScheduledLocalNotifications(callback) {
    PushNotification.getScheduledLocalNotifications(callback);
  }
}

export function useNotifications() {
  const [registration, setRegistration] = useState({
    registerToken: '',
    fcmRegistered: false,
  });

  log('Set Notifications');

  const notification = new NotifService(onRegister, onNotif);

  function onRegister(token) {
    setRegistration({registerToken: token.token, fcmRegistered: true});
  }

  function onNotif(notif) {
    log('Notification opened:', notif);
    log(notif.title, notif.message);
  }

  function handlePerm(perms) {
    log('Permissions', JSON.stringify(perms));
  }

  return {notification: notification};
}
