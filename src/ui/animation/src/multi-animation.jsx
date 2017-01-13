import React, { PropTypes } from 'react';
import { PureComponent } from '../../../utils';
import {
  assign,
  difference,
  find,
  includes,
  intersection,
  map,
  zip,
} from 'lodash';
import { interpolateObject } from 'd3-interpolate';
import { timer } from 'd3-timer';

export default class MultiAnimation extends PureComponent {
  componentWillMount() {
    this.setState({ nextFrameData: this.props.transitionToData });
  }

  componentWillReceiveProps(nextProps) {
    const childProps = React.Children.only(this.props.children).props;
    const keyField = childProps.fieldAccessors.key;
    const dataField = childProps.fieldAccessors.data;

    const nextData = nextProps.transitionToData;
    const prevData = childProps.data;

    const nextDataKeys = map(nextData, d => d[keyField]);
    const prevDataKeys = map(prevData, d => d[keyField]);

    const enterKeys = difference(nextDataKeys, prevDataKeys);
    const updateKeys = intersection(nextDataKeys, prevDataKeys);
    const removeKeys = difference(nextDataKeys, prevDataKeys);

    const enterData = find(nextData, d => includes(enterKeys, d[keyField]));
    const updateData = map(updateKeys, updateKey => ({
      [keyField]: updateKey,
      [dataField]: map(
        zip(
          find(nextData, d => d[keyField] === updateKey)[dataField],
          find(prevData, d => d[keyField] === updateKey)[dataField]
        ),
        datumPair => interpolateObject(datumPair[0], datumPair[1])
      ),
    }));
    const removeData = find(prevData, d => includes(removeKeys, d[keyField]));

    const interpolateData = (t) => {
      return map(updateData, d => ({
        [keyField]: d[keyField],
        [dataField]: map(d[dataField], interpolateDatum => interpolateDatum(t)),
      }));
    };

    const d3Timer = timer((elapsed) => {
      let t = (elapsed / this.props.duration);
      if (t > 1) {
        d3Timer.stop();
        t = 1;
      }

      this.setState({
        nextFrameData: interpolateData(t),
      });
    });
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
