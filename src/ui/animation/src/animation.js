import React, { PropTypes } from 'react';
import Timer from './utils/timer';
import { interpolateArray } from 'd3-interpolate';
import {
  assign,
  bindAll,
  slice,
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
