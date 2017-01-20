import { now, timer } from 'd3-timer';
import { forEach } from 'lodash';

export default class Timer {
  constructor() {
    this.subscribers = [];
    this.loop = this.loop.bind(this);
    this.timer = timer(this.loop);
  }

  loop() {
    forEach(this.subscribers, (subscriber) => {
      if (subscriber) {
        subscriber.callback(now() - subscriber.startTime, subscriber.duration);
      }
    });
  }

  subscribe(callback, duration) {
    return this.subscribers.push({
      startTime: now(),
      callback,
      duration,
    });
  }

  stop() {
    this.timer.stop();
  }

  unsubscribe(id) {
    if (id !== null) {
      delete this.subscribers[id - 1];
    }
  }
}

