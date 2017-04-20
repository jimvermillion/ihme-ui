import React from 'react';
import classNames from 'classnames';
import { isEmpty } from 'lodash';

import {
  CommonPropTypes,
  propResolver,
  PureComponent,
} from '../../../utils';

import AsterWhisker from './whisker';

export default class AsterWhiskers extends PureComponent {
  static getBounds({ x1, y1, x2, y2 }, lengthMultiplier) {
    const dx = (x2 - x1);
    const dy = (y2 - y1);
    const length = Math.max(1, Math.sqrt((dx * dx) + (dy * dy)));
    const hy = dy / length;
    const hx = dx / length;

    return {
      upper: {
        x1: x2 - (hy * lengthMultiplier),
        y1: y2 + (hx * lengthMultiplier),
        x2: x2 - (hy * -lengthMultiplier),
        y2: y2 + (hx * -lengthMultiplier),
      },
      lower: {
        x1: x1 - (hy * lengthMultiplier),
        y1: y1 + (hx * lengthMultiplier),
        x2: x1 - (hy * -lengthMultiplier),
        y2: y1 + (hx * -lengthMultiplier),
      },
    };
  }

  getRad(data, field) {
    const {
      domainEnd,
      innerRadius,
      radius,
    } = this.props;

    return ((radius - innerRadius) * (propResolver(data, field) / domainEnd)) + innerRadius;
  }

  getWhiskers(d) {
    const {
      boundsLowerField: lower,
      boundsUpperField: upper,
      domainEnd,
      innerRadius,
      radius,
    } = this.props;

    const r1 = ((radius - innerRadius) * (propResolver(d.data, lower) / domainEnd)) + innerRadius;
    const r2 = ((radius - innerRadius) * (propResolver(d.data, upper) / domainEnd)) + innerRadius;
    const a = ((d.startAngle + d.endAngle) / 2) - (Math.PI / 2);

    return {
      x1: Math.cos(a) * r1,
      y1: Math.sin(a) * r1,
      x2: Math.cos(a) * r2,
      y2: Math.sin(a) * r2,
    };
  }

  render() {
    const {
      boundsLowerField,
      className,
      data,
      lengthMultiplier,
    } = this.props;

    if (isEmpty(boundsLowerField)) return null;

    const whisker = this.getWhiskers(data);
    const bounds = AsterWhiskers.getBounds(whisker, lengthMultiplier);

    return (
      <g className={classNames(className)}>
        <g>
          <AsterWhisker
            x1={whisker.x1}
            y1={whisker.y1}
            x2={whisker.x2}
            y2={whisker.y2}
          />
          <AsterWhisker
            x1={bounds.lower.x1}
            y1={bounds.lower.y1}
            x2={bounds.lower.x2}
            y2={bounds.lower.y2}
          />
          <AsterWhisker
            x1={bounds.upper.x1}
            y1={bounds.upper.y1}
            x2={bounds.upper.x2}
            y2={bounds.upper.y2}
          />
        </g>
      </g>
    );
  }
}

AsterWhiskers.propTypes = {
  /**
   * what field to use to access the lower uncertainty property on the data
   */
  boundsLowerField: CommonPropTypes.dataAccessor,

  /**
   * what field to use to access the upper uncertainty property on the data
   */
  boundsUpperField: CommonPropTypes.dataAccessor,

  /**
   * css class of the uncertainty whiskers
   */
  className: CommonPropTypes.className,

  /**
   * last number of the domain
   */
  domainEnd: React.PropTypes.number.isRequired,

  /**
   * data for whisker (generated by d3.pie())
   */
  data: React.PropTypes.shape({
    endAngle: React.PropTypes.number,
    index: React.PropTypes.number,
    padAngle: React.PropTypes.number,
    startAngle: React.PropTypes.number,
  }).isRequired,

  /**
   * size of inner radius of aster-chart
   */
  innerRadius: React.PropTypes.number.isRequired,

  /**
   * multiply the resulting whisker by this prop, big number makes big whisker
   */
  lengthMultiplier: React.PropTypes.number,

  /**
   * size of full radius of aster-chart
   */
  radius: React.PropTypes.number.isRequired,
};

AsterWhiskers.defaultProps = {
  uncertaintyProps: null,
  lengthMultiplier: 5,
};
