import React, { PropTypes } from 'react';
import { interpolateArray, interpolateObject } from 'd3-interpolate';
import { assign, map, slice, zip } from 'lodash';
import { getScale, getScaleTypes, PureComponent } from '../../../utils';

const SCALE_TYPES = getScaleTypes();

export default class LineAnimate extends PureComponent {
  constructor(props) {
    super(props);

    this.timer = this.props.animate.timer;

    this.state = {
      nextFrameData: this.props.data,
      nextFrameYScaleDomain: this.props.scales.y.domain(),
      nextFrameXScaleDomain: this.props.scales.x.domain(),
    };

    this.frameCallback = this.frameCallback.bind(this);
  }

  componentWillReceiveProps(nextProps) {
    const timer = this.props.animate.getTimer;

    timer().unsubscribe(this.loopId);

    // interpolate data
    const nextData = nextProps.data;
    const prevData = this.state.nextFrameData;

    const zippedData = zip(prevData, nextData);

    const updateData = map(
      zippedData,
      (datumPair) => interpolateObject(datumPair[0], datumPair[1])
    );

    const interpolateData = (t) => map(updateData, interpolateDatum => interpolateDatum(t));

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
      data: interpolateData(t),
      xScales: interpolateXScaleDomain(t),
      yScales: interpolateYScaleDomain(t),
    });

    this.loopId = timer()
      .subscribe(this.frameCallback(interpolator), this.props.animate.duration || 500);
  }

  frameCallback(interpolator) {
    return (elapsed, duration) => {
      let t = elapsed / duration;

      if (t > 1) {
        t = 1;
        this.timer().unsubscribe(this.loopId);
      }

      const frameData = interpolator(t);

      this.setState({
        nextFrameData: frameData.data,
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

    const child = React.Children.toArray(this.props.children)[0];

    return (
      React.cloneElement(child, props)
    );
  }
}

LineAnimate.propTypes = {
  animate: PropTypes.object.isRequired,
  data: PropTypes.arrayOf(PropTypes.object).isRequired,
  duration: PropTypes.number,
  scales: PropTypes.shape({
    x: PropTypes.func,
    y: PropTypes.func,
  }),
  xScaleType: PropTypes.oneOf(SCALE_TYPES),
  yScaleType: PropTypes.oneOf(SCALE_TYPES),
};
