import { now, timer } from 'd3-timer';
import { forEach, uniqueId } from 'lodash';

export default class Timer {
  constructor() {
    this.subscribers = {};
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
    const id = uniqueId('loop_');

    this.subscribers[id] = {
      startTime: now(),
      callback,
      duration,
    };

    return id;
  }

  stop() {
    this.timer.stop();
  }

  unsubscribe(id) {
    if (id !== null) {
      delete this.subscribers[id];
    }
  }
}

