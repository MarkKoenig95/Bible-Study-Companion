import React from 'react';

export const notification = {
  scheduleNotif: jest.fn,
  getScheduledLocalNotifications: cb => {
    let notifications = [{id: -1}];
    cb(notifications);
  },
  cancelNotif: jest.fn,
};

export function useNotifications() {
  return notification;
}
