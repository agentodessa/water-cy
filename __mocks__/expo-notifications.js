module.exports = {
  setNotificationHandler: jest.fn(),
  requestPermissionsAsync: jest.fn(() => Promise.resolve({ status: 'granted' })),
  scheduleNotificationAsync: jest.fn(() => Promise.resolve('mock-id')),
  getPermissionsAsync: jest.fn(() => Promise.resolve({ status: 'granted' })),
};
