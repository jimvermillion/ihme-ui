import React, { PropTypes } from 'react';
import Timer from './utils/timer';
import { interpolateArray, interpolateObject } from 'd3-interpolate';
import {
  assign,
  bindAll,
  concat,
  difference,
  filter,
  find,
  includes,
  intersection,
  map,
  slice,
  zip,
} from 'lodash';
import { getScale, getScaleTypes } from '../../../utils';
const SCALE_TYPES = getScaleTypes();


export default class Animation {
  constructor() {
    bindAll(
      this,
      [
        'getTimer',
        'YAxisAnimate',
        'MultiShapeAnimate',
      ]
    );
    this.timer = null;
  }

  getTimer() {
    if (this.timer === null) {
      this.timer = new Timer();
    }

    return this.timer;
  }

  MultiShapeAnimate(WrappedComponent) {
    const timer = this.getTimer;

    class MultiShapeWithAnimate extends React.Component {
      componentWillMount() {
        this.setState({
          nextFrameData: this.props.data,
          nextFrameYScaleDomain: this.props.scales.y.domain(),
          nextFrameXScaleDomain: this.props.scales.x.domain(),
        });
      }

      componentWillReceiveProps(nextProps) {
        timer().unsubscribe(this.loopId);

        const keyField = nextProps.fieldAccessors.key;
        const dataField = nextProps.fieldAccessors.data;

        const nextData = nextProps.data;
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

        const interpolateData = (t) => map(updateData, d => ({
            [keyField]: d[keyField],
            [dataField]: map(d[dataField], interpolateDatum => interpolateDatum(t)),
          }));

        const nextYScaleDomain = nextProps.scales.y.domain();
        const nextXScaleDomain = nextProps.scales.x.domain();

        if (
          !nextYScaleDomain.length
          || !(nextYScaleDomain[0] > -Infinity)
          || !(nextYScaleDomain[1] < Infinity)
        ) return;
        if (!nextXScaleDomain.length
          || !(nextXScaleDomain[0] > -Infinity)
          || !(nextXScaleDomain[1] < Infinity)
        ) return;

        const prevYScaleDomain = this.state.nextFrameYScaleDomain;
        const prevXScaleDomain = this.state.nextFrameXScaleDomain;

        const updateYScaleDomain = interpolateArray(prevYScaleDomain, nextYScaleDomain);
        const updateXScaleDomain = interpolateArray(prevXScaleDomain, nextXScaleDomain);

        const interpolateYScaleDomain = (t) => slice(updateYScaleDomain(t), 0);
        const interpolateXScaleDomain = (t) => slice(updateXScaleDomain(t), 0);

        const interpolator = (t) => ({
          data: interpolateData(t),
          xScales: interpolateXScaleDomain(t),
          yScales: interpolateYScaleDomain(t),
        });

        this.loopId = timer()
          .subscribe(this.frameCallback(interpolator, enterData), this.props.duration);
      }

      frameCallback(interpolator, enterData) {
        return (elapsed, duration) => {
          let t = elapsed / duration;

          if (t > 1) {
            t = 1;
            timer().unsubscribe(this.loopId);
          }

          const frameData = interpolator(t);

          this.setState({
            nextFrameData: enterData ? concat(frameData.data, enterData) : frameData.data,
            nextFrameXScaleDomain: frameData.xScales,
            nextFrameYScaleDomain: frameData.yScales,
          });
        };
      }

      render() {
        const props = assign(
          {},
          this.props,
          { data: this.state.nextFrameData },
          {
            scales: {
              y: getScale(this.props.yScaleType)()
                .domain(this.state.nextFrameYScaleDomain)
                .range(this.props.scales.y.range()),
              x: getScale(this.props.xScaleType)()
                .domain(this.state.nextFrameXScaleDomain)
                .range(this.props.scales.x.range()),
            },
          }
        );

        return (
          <WrappedComponent {...props} />
        );
      }
    }

    MultiShapeWithAnimate.propTypes = {
      data: PropTypes.arrayOf(PropTypes.object),
      duration: PropTypes.number,
      scales: PropTypes.shape({
        x: PropTypes.func,
        y: PropTypes.func,
      }).isRequired,
      xScaleType: PropTypes.oneOf(SCALE_TYPES),
      yScaleType: PropTypes.oneOf(SCALE_TYPES),
    };

    return MultiShapeWithAnimate;
  }

  YAxisAnimate(WrappedComponent) {
    const timer = this.getTimer;

    class YAxisWithAnimate extends React.Component {
      componentWillMount() {
        this.setState({ nextFrameScale: this.props.scales.y.domain() });
      }

      componentWillReceiveProps(nextProps) {
        timer().unsubscribe(this.loopId);

        const nextScale = nextProps.scales.y.domain();
        if (!nextScale.length || !(nextScale[0] > -Infinity) || !(nextScale[1] < Infinity)) return;
        const prevScale = this.state.nextFrameScale;

        const updateScale = interpolateArray(prevScale, nextScale);

        const interpolateScale = (t) => slice(updateScale(t), 0);

        this.loopId = timer()
          .subscribe(this.frameCallback(interpolateScale), this.props.duration);
      }

      frameCallback(interpolator) {
        return (elapsed, duration) => {
          let t = elapsed / duration;

          if (t > 1) {
            t = 1;
            timer().unsubscribe(this.loopId);
          }

          this.setState({
            nextFrameScale: interpolator(t),
          });
        };
      }

      render() {
        const props = assign(
          {},
          this.props,
          { scales: {
            y: getScale(this.props.yScaleType)()
                .domain(this.state.nextFrameScale)
                .range(this.props.scales.y.range())
          } }
        );
        return (
          <WrappedComponent {...props} />
        );
      }
    }

    YAxisWithAnimate.propTypes = {
      duration: PropTypes.number,
      scales: PropTypes.shape({
        x: PropTypes.func,
        y: PropTypes.func,
      }).isRequired,
      yScaleType: PropTypes.oneOf(SCALE_TYPES),
    };

    return YAxisWithAnimate;
  }

  XAxisAnimate(WrappedComponent) {
    const timer = this.getTimer;

    class XAxisWithAnimate extends React.Component {
      componentWillMount() {
        this.setState({ nextFrameScale: this.props.scales.x.domain() });
      }

      componentWillReceiveProps(nextProps) {
        timer().unsubscribe(this.loopId);

        const nextScale = nextProps.scales.x.domain();
        if (!nextScale.length || !(nextScale[0] > -Infinity) || !(nextScale[1] < Infinity)) return;
        const preScale = this.state.nextFrameScale;

        const updateScale = interpolateArray(preScale, nextScale);

        const interpolateScale = (t) => slice(updateScale(t), 0);

        this.loopId = timer()
          .subscribe(this.frameCallback(interpolateScale), this.props.duration);
      }

      frameCallback(interpolator) {
        return (elapsed, duration) => {
          let t = elapsed / duration;

          if (t > 1) {
            t = 1;
            timer().unsubscribe(this.loopId);
          }

          this.setState({
            nextFrameScale: interpolator(t),
          });
        };
      }

      render() {
        const props = assign(
          {},
          this.props,
          { scales: {
            x: getScale(this.props.xScaleType)()
              .domain(this.state.nextFrameScale)
              .range(this.props.scales.x.range())
          } }
        );
        return (
          <WrappedComponent {...props} />
        );
      }
    }

    XAxisWithAnimate.propTypes = {
      duration: PropTypes.number,
      scales: PropTypes.shape({
        x: PropTypes.func,
        y: PropTypes.func,
      }).isRequired,
      xScaleType: PropTypes.oneOf(SCALE_TYPES),
    };

    return XAxisWithAnimate;
  }
}
