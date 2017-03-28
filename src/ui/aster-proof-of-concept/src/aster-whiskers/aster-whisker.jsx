import React from 'react';

export default function AsterWhisker(props) {
  const { className, stroke, x1, x2, y1, y2 } = props;

  return (
    <line
      className={className}
      stroke={stroke}
      x1={x1}
      y1={y1}
      x2={x2}
      y2={y2}
    />
  );
};

AsterWhisker.propTypes = {
  /**
   * the css class of the whisker
   */
  className: React.PropTypes.string,

  /**
   * the css stroke of whisker
   */
  stroke: React.PropTypes.string,

  /**
   * the x1 attribute of the whisker line
   */
  x1: React.PropTypes.number,

  /**
   * the x2 attribute of the whisker line
   */
  x2: React.PropTypes.number,

  /**
   * the y1 attribute of the whisker line
   */
  y1: React.PropTypes.number,

  /**
   * the y2 attribute of the whisker line
   */
  y2: React.PropTypes.number,
};

AsterWhisker.defaultProps = {
  stroke: '#454545',
};
