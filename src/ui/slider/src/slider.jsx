import React, { PropTypes } from 'react';
import classNames from 'classnames';
import { scaleLinear } from 'd3';
import bindAll from 'lodash/bindAll';
import difference from 'lodash/difference';
import identity from 'lodash/identity';
import inRange from 'lodash/inRange';
import map from 'lodash/map';
import noop from 'lodash/noop';
import range from 'lodash/range';
import reduce from 'lodash/reduce';
import round from 'lodash/round';
import zipObject from 'lodash/zipObject';
import { CommonPropTypes, PureComponent } from '../../../utils';
import { stateFromPropUpdates, updateFunc } from '../../../utils/props';

import Track from './track';
import Fill from './fill';
import Handle from './handle';
import ResponsiveContainer from '../../responsive-container';
import style from './style.css';

const VALUE_KEYS = ['low', 'high'];

/**
 * Return object of indexes for 'low' and 'high' values
 * @param values
 * @param rangeList
 * @return {Object}
 */
function getIndexesForValues(values, rangeList) {
  return reduce(values, (acc, value, key) => {
    /* eslint-disable no-nested-ternary */
    // if value is not in the range list, assign either first or last element, depending on key
    const index = rangeList.indexOf(value);
    return {
      ...acc,
      [key]: index !== -1 ?
               index : key === 'low' ? 0 : rangeList.length - 1,
    };
    /* eslint-enable no-nested-ternary */
  }, {});
}

/**
 * Return object of values for 'low' and 'high' indexes
 * @param indexes
 * @param rangeList
 * @return {Object}
 */
function getValuesForIndexes(indexes, rangeList) {
  return reduce(indexes, (acc, value, key) => {
    return {
      ...acc,
      [key]: rangeList[value],
    };
  }, {});
}

/**
 * Evaluate value param and return a compatible object with keys 'low' and 'high'.
 * @param value
 * @returns {Object}
 */
function getLowHighValues(value) {
  if (Array.isArray(value)) {
    return zipObject(VALUE_KEYS, value);
  } else if (typeof value === 'object') {
    if (difference(Object.keys(value), VALUE_KEYS).length) {
      throw new TypeError(`Unexpected value keys: [${difference(Object.keys(value), VALUE_KEYS)}]`);
    }
    return value;
  }
  return { low: value };
}

/**
 * `import Slider from 'ihme-ui/ui/slider'`
 */
export default class Slider extends PureComponent {
  constructor(props) {
    super(props);

    this.state = {
      ...stateFromPropUpdates(Slider.propUpdates, {}, props, { scale: scaleLinear() }),
      render: false,
      snapTarget: {},
    };

    this.handleCount = Object.keys(this.state.indexes).length;

    bindAll(this, [
      'onHandleEnd',
      'onHandleDrag',
      'onHandleKeyDown',
      'onTrackClick',
      'trackRef',
      'doSetState',
    ]);
  }

  componentDidMount() {
    this.doSetState(this.receiveTrackWidth(this.state));
  }

  componentWillReceiveProps(nextProps) {
    let state = {
      range: this.state.range,
      scale: this.state.scale,
    };

    state = stateFromPropUpdates(Slider.propUpdates, this.props, nextProps, state);

    // If the extents or width changes, the scale and snapTarget must be recalculated.
    if (this.props.range !== nextProps.range) {
      state = this.receiveTrackWidth(state);
    }

    this.setState(state);
  }

  componentDidUpdate(prevProps) {
    if (this.props.width !== prevProps.width) {
      this.doSetState(this.receiveTrackWidth(this.state));
    }
  }

  onHandleDrag(key, offset) {
    return (event) => {
      if (!event.dx) return;

      const { pageX, dx } = event;
      const { scale, indexes } = this.state;

      // Calculate next position, handle extent, and index value
      const nextPos = scale(indexes[key]) + dx;
      const handleExtent = nextPos - (offset * 2);
      const index = round(scale.invert(nextPos));

      // Check that the mouse X pos is within the handle extent,
      // and that the computed value is in the range list
      if (!inRange(pageX - handleExtent, nextPos - handleExtent) ||
            !this.state.range[index]) return;

      this.updateValueFromEvent(event, index, key, this.props.onDrag);
    };
  }

  onHandleKeyDown(key) {
    return (event) => {
      let step;
      switch (event.keyCode) {
        case 37: // ArrowLeft
          step = -1;
          break;
        case 39: // ArrowRight
          step = 1;
          break;
        default:
          return;
      }

      event.stopPropagation();
      event.preventDefault();

      const index = this.state.indexes[key] + step;

      this.updateValueFromEvent(event, index, key, this.props.onKey);
    };
  }

  onHandleEnd(callback) {
    return (event) => {
      callback(event, getValuesForIndexes(this.state.indexes, this.state.range), this);
    };
  }

  onTrackClick(event) {
    const { scale, indexes } = this.state;

    const index = round(scale.invert(event.snap.x));

    /* Determine which handle is closer. 'low' == true, 'high' == false */
    const comp = indexes.high === undefined ||
      (Math.abs(indexes.low - index) < Math.abs(indexes.high - index) || indexes.low > index);

    const key = comp ? 'low' : 'high';

    this.updateValueFromEvent(event, index, key, this.props.onTrackClick);
  }

  updateValueFromEvent(event, index, key, callback) {
    if (index !== this.state.indexes[key] && this.state.range[index]) {
      const indexes = { ...this.state.indexes, [key]: index };
      const values = getValuesForIndexes(indexes, this.state.range);

      if (indexes.low === undefined ||
            indexes.high === undefined ||
            indexes.low <= indexes.high) {
        callback(event, values, this);
      }
    }
  }

  receiveTrackWidth(state) {
    return {
      ...state,
      render: true,
      scale: state.scale.range([0, this._track.width]),
      snapTarget: { x: this._track.width / (state.range.length - 1) },
    };
  }

  doSetState(state) {
    this.setState(state);
  }

  trackRef(ref) {
    this._track = ref;
  }

  renderFill() {
    if (!this.state.render || !this.props.fill) return null;

    const { indexes, scale } = this.state;
    const { fillStyle, fillClassName } = this.props;

    return map(indexes, (index, key) => {
      const direction = key === 'low' ? 'left' : 'right';
      const position = scale(index);
      return (
        <Fill
          key={`fill:${key}`}
          className={fillClassName}
          style={fillStyle}
          direction={direction}
          width={position}
        />
      );
    });
  }

  renderHandles() {
    if (!this.state.render) return null;

    const { indexes, scale, snapTarget } = this.state;
    const { labelFunc, handleClassName, handleStyle } = this.props;

    return (
      <div className={style['handle-track']}>
        <div className={style['flag-base']}></div>
        {map(indexes, (index, key) => {
          const direction = key === 'low' ? 'left' : 'right';
          const position = scale(index);
          return (
            <ResponsiveContainer
              key={`handle:${key}`}
            >
              <Handle
                className={classNames(handleClassName,
                                      { [style.connected]: indexes.low === indexes.high })}
                style={handleStyle}
                onDrag={this.onHandleDrag}
                onDragEnd={this.onHandleEnd(this.props.onDragEnd)}
                onKeyDown={this.onHandleKeyDown}
                onKeyUp={this.onHandleEnd(this.props.onKeyEnd)}
                name={key}
                direction={direction}
                position={position}
                label={this.state.range[index]}
                labelFunc={labelFunc}
                snapTarget={snapTarget}
              />
            </ResponsiveContainer>
          );
        })}
      </div>
    );
  }

  render() {
    const { fontSize, width, wrapperClassName, wrapperStyle, ticks } = this.props;
    const { snapTarget } = this.state;

    const wrapperStyles = {
      fontSize: `${fontSize}`,
      width: `${width}px`,
      ...wrapperStyle,
    };

    return (
      <div
        className={classNames(style.slider, wrapperClassName)}
        style={wrapperStyles}
      >
        {this.renderHandles()}
        <Track
          ref={this.trackRef}
          className={this.props.trackClassName}
          style={this.props.trackStyle}
          onClick={this.onTrackClick}
          snapTarget={snapTarget}
          ticks={ticks}
          ticksClassName={this.props.ticksClassName}
          ticksStyle={this.props.ticksStyle}
          tickClassName={this.props.tickClassName}
          tickStyle={this.props.tickStyle}
        >
          {this.renderFill()}
        </Track>
      </div>
    );
  }
}

Slider.propTypes = {
  /**
   * Include fill in the track to indicate value.
   */
  fill: PropTypes.bool,

  /**
   * Class name applied to fill.
   */
  fillClassName: CommonPropTypes.className,

  /**
   * Inline styles applied to fill.
   */
  fillStyle: PropTypes.object,

  /**
   * Font size of handle labels.
   */
  fontSize: PropTypes.string,

  /**
   * Class name applied to slider handle.
   */
  handleClassName: CommonPropTypes.className,

  /**
   * Inline styles applied to slider handle.
   */
  handleStyle: PropTypes.object,

  /**
   * Function applied to label prior to rendering.
   * Signature: (value): string => {...}
   */
  labelFunc: PropTypes.func,

  /**
   * [dragmove](http://interactjs.io/docs/#interactevents) callback.
   * Called when slider value is changed with the following arguments:
   *  - {Object} SyntheticEvent - the triggered action
   *  - {Object} values - { high: ..., low: ... }
   *  - {Object} Slider - the slider object (class instance)
   */
  onDrag: PropTypes.func.isRequired,

  /**
   * [dragend](http://interactjs.io/docs/#interactevents) callback.
   * Called when slider handle is released with the following arguments:
   *  - {Object} SyntheticEvent - the triggered action
   *  - {Object} values - { high: ..., low: ... }
   *  - {Object} Slider - the slider object (class instance)
   */
  onDragEnd: PropTypes.func,

  /**
   * onKeyDown callback. Named for consistency with onDrag and onDragEnd.
   * Called with the following arguments:
   *  - {Object} SyntheticEvent - the triggered action
   *  - {Object} values - { high: ..., low: ... }
   *  - {Object} Slider - the slider object (class instance)
   */
  onKey: PropTypes.func,

  /**
   * onKeyUp callback. Named for consistency with onDrag and onDragEnd.
   * Called with the following arguments:
   *  - {Object} SyntheticEvent - the triggered action
   *  - {Object} values - { high: ..., low: ... }
   *  - {Object} Slider - the slider object (class instance)
   */
  onKeyEnd: PropTypes.func,

  /**
   * onClick callback for slider track.
   * Called with the following arguments:
   *  - {Object} SyntheticEvent - the triggered action
   *  - {Object} values - { high: ..., low: ... }
   *  - {Object} Slider - the slider object (class instance)
   */
  onTrackClick: PropTypes.func,

  /**
   *  Extent of slider values. Can be either an array of [min, max] or a configuration object.
   *  Config:
   *    - low: min value
   *    - high: max value
   *    - steps: number of steps between low and high
   *    - precision: rounding precision
   */
  range: PropTypes.oneOfType([
    PropTypes.array,
    PropTypes.shape({
      low: PropTypes.number.isRequired,
      high: PropTypes.number.isRequired,
      steps: PropTypes.number,
      precision: PropTypes.number,
    }),
  ]).isRequired,

  /**
   * Show ticks in track.
   */
  ticks: PropTypes.bool,

  /**
   * Class name applied to each tick marking within the track, if applicable.
   */
  tickClassName: CommonPropTypes.className,

  /**
   * Inline styles applied to each tick marking within the track, if applicable.
   */
  tickStyle: PropTypes.object,

  /**
   * Class name applied to slider track.
   */
  trackClassName: CommonPropTypes.className,

  /**
   * Inline styles applied to slider track.
   */
  trackStyle: PropTypes.object,

  /**
   * Selected value.
   * If number, a single slider handle will be rendered.
   * If object with keys 'low' and 'high', two slider handles (a "range slider") will be rendered.
   */
  value: PropTypes.oneOfType([
    PropTypes.number,
    PropTypes.string,
    PropTypes.array,
    PropTypes.shape({
      low: PropTypes.any,
      high: PropTypes.any,
    }),
  ]).isRequired,

  /**
   * Width of slider (in pixels).
   */
  width: PropTypes.number,

  /**
   * Class name applied to outermost wrapper.
   */
  wrapperClassName: CommonPropTypes.className,

  /**
   * Inline styles applied to outermost wrapper.
   */
  wrapperStyle: PropTypes.object,
};

Slider.defaultProps = {
  labelFunc: identity,
  onDrag: noop,
  onDragEnd: noop,
  onKey: noop,
  onKeyEnd: noop,
  onTrackClick: noop,
  width: 200,
};

/* Order is important here. */
Slider.propUpdates = {
  range: updateFunc((nextProp, propName, nextProps, state) => {
    let nextRange = nextProp;

    if (!Array.isArray(nextProp)) {
      const delta = nextProp.high - nextProp.low;
      const steps = nextProp.steps || delta + 1;
      nextRange = range(steps).map(
        (d) => round(d * delta / (steps - 1) + nextProp.low, nextProp.precision)
      );
    }

    return {
      range: nextRange,
      scale: state.scale.domain([0, nextRange.length - 1]),
    };
  }),
  value: updateFunc((nextProp, propName, nextProps, state) => {
    return { indexes: getIndexesForValues(getLowHighValues(nextProp), state.range) };
  }),
  width: updateFunc(() => {
    // Track needs to be rendered with new width before Handles and Fill can be rendered
    return { render: false };
  }),
};
