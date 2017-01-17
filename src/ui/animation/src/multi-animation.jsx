import React, { PropTypes } from 'react';
import { PureComponent } from '../../../utils';
import Timer from './utils/timer';
import {
  assign,
  concat,
  difference,
  filter,
  find,
  includes,
  intersection,
  map,
  zip,
} from 'lodash';
import { interpolateObject } from 'd3-interpolate';

export default class MultiAnimation extends PureComponent {
  constructor(props) {
    super(props);

    this.getTimer = this.getTimer.bind(this);
    this.frameCallback = this.frameCallback.bind(this);

    this.timer = null;
    this.loopId = null;
  }

  componentWillMount() {
    this.setState({ nextFrameData: this.props.transitionToData });
  }

  componentWillReceiveProps(nextProps) {
    this.getTimer().unsubscribe(this.loopId);

    const childProps = React.Children.only(this.props.children).props;
    const keyField = childProps.fieldAccessors.key;
    const dataField = childProps.fieldAccessors.data;

    const nextData = nextProps.transitionToData;
    const prevData = this.state.nextFrameData;

    const nextDataKeys = map(nextData, d => d[keyField]);
    const prevDataKeys = map(prevData, d => d[keyField]);

    const enterKeys = difference(nextDataKeys, prevDataKeys);
    const updateKeys = intersection(nextDataKeys, prevDataKeys);

    const enterData = filter(nextData, d => includes(enterKeys, d[keyField]));
    const updateData = map(updateKeys, updateKey => ({
      [keyField]: updateKey,
      [dataField]: map(
        zip(
          find(nextData, d => d[keyField] === updateKey)[dataField],
          find(prevData, d => d[keyField] === updateKey)[dataField]
        ),
        datumPair => interpolateObject(datumPair[1], datumPair[0])
      ),
    }));

    const interpolateData = (t) => {
      return map(updateData, d => ({
        [keyField]: d[keyField],
        [dataField]: map(d[dataField], interpolateDatum => interpolateDatum(t)),
      }));
    };

    this.loopId = this.getTimer().subscribe(this.frameCallback(interpolateData, enterData), this.props.duration);
  }

  frameCallback(interpolator, enterData) {
    return (elapsed, duration) => {
      let t = elapsed / duration;

      if (t > 1) {
        t = 1;
        this.getTimer().unsubscribe(this.loopId);
      }

      this.setState({
        nextFrameData: enterData ? concat(interpolator(t), enterData) : interpolator(t),
      });
    };
  }

  getTimer() {
    if (this.timer === null) {
      this.timer = new Timer();
    }

    return this.timer;
  }

  render() {
    const passedProps = assign(
      {}, this.props, { [this.props.transitionTargetProp]: this.state.nextFrameData }
    );

    return (
      React.cloneElement(
        React.Children.only(this.props.children),
        passedProps
      )
    );
  }
}

MultiAnimation.propTypes = {
  transitionToData: PropTypes.arrayOf(PropTypes.object),
  transitionTargetProp: PropTypes.string,
  duration: PropTypes.number,
};

MultiAnimation.defaultProps = {
  duration: 1000,
};
