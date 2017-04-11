import React from 'react';
import { bindAll, noop } from 'lodash';

import { PureComponent } from '../../../../utils';

export default class AsterScore extends PureComponent {
  constructor(props) {
    super(props);

    bindAll(this, [
      'onClick',
    ]);
  }

  // e.g., select the average (score)
  onClick(e) {
    e.preventDefault();

    this.props.onClick(e, this.props, this);
  }

  // e.g., destroy tooltip
  onMouseLeave(e) {
    e.preventDefault();

    this.props.onMouseLeave(e, this.props, this);
  }

  // e.g., position tooltip
  onMouseMove(e) {
    e.preventDefault();

    this.props.onMouseMove(e, this.props, this);
  }

  // e.g., init tooltip
  onMouseOver(e) {
    e.preventDefault();

    this.props.onMouseOver(e, this.props, this);
  }

  render() {
    const { content, radius, className } = this.props;
    const { average, centerText } = content;

    return (
      <g
        className={className}
        textAnchor="middle"
        dy="1em"
        onClick={this.onClick}
      >
        <text
          dy="-1.1em"
          fontSize={`${radius / 14}px`}
        >
          {centerText.top}
        </text>
        <text
          dy=".39em"
          fontSize={`${radius / 6}px`}
        >
          {average}
        </text>
        <text
          dy="3.2em"
          fontSize={`${radius / 25}px`}
        >
          {centerText.bottom}
        </text>
      </g>
    );
  }
}

AsterScore.propTypes = {
  /* class of asterScore */
  className: React.PropTypes.string,

  /* the content of the aster-score */
  content: React.PropTypes.shape({
    average: React.PropTypes.number,
    centerText: React.PropTypes.shape({
      bottom: React.PropTypes.string,
      topText: React.PropTypes.string
    }),
  }).isRequired,

  /* radius of the aster chart */
  radius: React.PropTypes.number.isRequired,

  /* function to be called when clicked */
  onClick: React.PropTypes.func,

  /* function to be called when onMouseLeave */
  onMouseLeave: React.PropTypes.func,

  /* function to be called when onMouseMove */
  onMouseMove: React.PropTypes.func,

  /* function to be called when onMouseOver */
  onMouseOver: React.PropTypes.func,
};

AsterScore.defaultProps = {
  className: 'asterScore',
  onClick: noop,
  onMouseLeave: noop,
  onMouseMove: noop,
  onMouseOver: noop,
};
