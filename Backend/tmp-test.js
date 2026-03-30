import * as cron from 'node-cron';
import { jest } from '@jest/globals';

test('spy on cron', () => {
  const spy = jest.spyOn(cron, 'schedule').mockImplementation(() => { });
  cron.schedule('* * * * *', () => { });
  console.log(spy.mock.calls.length === 1 ? 'SPY_WORKS' : 'SPY_FAILED');
});
