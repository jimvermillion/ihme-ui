import React, { PropTypes } from 'react';
import { interpolateString, interpolateArray } from 'd3-interpolate';
import { assign, slice } from 'lodash';
import { getScale, getScaleTypes, PureComponent } from '../../../utils';

const SCALE_TYPES = getScaleTypes();

export default class PathAnimate extends PureComponent {
  constructor(props) {
    super(props);

    this.timer = this.props.animate.timer;

    this.state = {
      nextFrameD: this.props.d,
      nextFrameTransform: this.props.transform,
      nextFrameYScaleDomain: this.props.scales.y.domain(),
      nextFrameXScaleDomain: this.props.scales.x.domain(),
    };

    this.frameCallback = this.frameCallback.bind(this);
  }

  componentWillReceiveProps(nextProps) {
    const timer = this.props.animate.timer;

    timer.unsubscribe(this.loopId);

    // interpolate d
    const nextD = nextProps.d;
    const prevD = this.state.nextFrameD;

    const interpolateD = interpolateString(prevD, nextD);

    // interpolate transform
    const nextTransform = nextProps.transform;
    const prevTransform = this.state.nextFrameTransform;

    const interpolateTransform = interpolateString(prevTransform, nextTransform);

    // interpolate scales
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
      nextFrameD: interpolateD(t),
      nextFrameTransform: interpolateTransform(t),
      nextFrameXScaleDomain: interpolateXScaleDomain(t),
      nextFrameYScaleDomain: interpolateYScaleDomain(t),
    });

    this.loopId = timer
      .subscribe(this.frameCallback(interpolator), this.props.animate.duration || 500);
  }

  frameCallback(interpolator) {
    return (elapsed, duration) => {
      let t = elapsed / duration;

      if (t < 0) { t = 0; }

      if (t > 1) {
        t = 1;
        this.timer.unsubscribe(this.loopId);
      }

      this.setState(interpolator(t));
    };
  }

  render() {
    console.log('animate-path render');
    const props = assign(
      {},
      this.props,
      { d: this.state.nextFrameD },
      { transform: this.state.nextFrameTransform },
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
      <path
        {...props}
      />
    );
  }
}

PathAnimate.propTypes = {
  animate: PropTypes.object.isRequired,
  d: PropTypes.string.isRequired,
  duration: PropTypes.number,
  scales: PropTypes.shape({
    x: PropTypes.func,
    y: PropTypes.func,
  }),
  xScaleType: PropTypes.oneOf(SCALE_TYPES),
  yScaleType: PropTypes.oneOf(SCALE_TYPES),
};

PathAnimate.defaultProps = {
  scales: {
    y: getScale()(),
    x: getScale()(),
  },
};
