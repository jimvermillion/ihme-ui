import React, { PropTypes } from 'react';
import classNames from 'classnames';
import { scaleLinear } from 'd3';
import { map, pick } from 'lodash';

import Line from './line';
import Area from './area';
import {
  CommonDefaultProps,
  CommonPropTypes,
  propResolver,
  PureComponent,
} from '../../../utils';

export default class MultiLine extends PureComponent {
  render() {
    const {
      animate,
      areaClassName,
      areaStyle,
      areaValuesIteratee,
      className,
      clipPathId,
      colorScale,
      data,
      dataAccessors,
      fieldAccessors,
      lineClassName,
      lineStyle,
      lineValuesIteratee,
      scales,
      style,
    } = this.props;

    const {
      color: colorField,
      data: dataField,
      key: keyField,
    } = fieldAccessors;

    const childProps = pick(this.props, [
      'onClick',
      'onMouseLeave',
      'onMouseMove',
      'onMouseOver',
    ]);

    return (
      <g
        className={className && classNames(className)}
        clipPath={clipPathId && `url(#${clipPathId})`}
        style={style}
      >
        {
          map(data, (datum) => {
            const key = propResolver(datum, keyField);
            const values = propResolver(datum, dataField);
            const color = colorScale(colorField ? propResolver(datum, colorField) : key);

            const areaValues = areaValuesIteratee(values, key);
            const lineValues = lineValuesIteratee(values, key);

            const computedAreaStyle = typeof areaStyle === 'function'
              ? areaStyle(areaValues, key)
              : areaStyle;
            const computedLineStyle = typeof lineStyle === 'function'
              ? lineStyle(lineValues, key)
              : lineStyle;

            return (
              [
                (!!dataAccessors.x && !!dataAccessors.y0 && !!dataAccessors.y1 && !!areaValues) ?
                  <Area
                    animate={animate}
                    className={areaClassName}
                    dataAccessors={dataAccessors}
                    data={areaValues}
                    key={`area:${key}`}
                    scales={scales}
                    style={{
                      fill: color,
                      stroke: color,
                      ...computedAreaStyle,
                    }}
                    {...childProps}
                  /> : null,
                (!!dataAccessors.x && !!dataAccessors.y && !!lineValues) ?
                  <Line
                    animate={animate}
                    className={lineClassName}
                    dataAccessors={dataAccessors}
                    data={lineValues}
                    key={`line:${key}`}
                    scales={scales}
                    style={{
                      stroke: color,
                      ...computedLineStyle,
                    }}
                    {...childProps}
                  /> : null,
              ]
            );
          })
        }
      </g>
    );
  }
}

MultiLine.propTypes = {
  /* base classname to apply to Areas that are children of MultiLine */
  areaClassName: CommonPropTypes.className,

  /*
   if object, spread directly as inline-style object into <Area />
   if function, passed areaValues as first arg, area key as second arg
    return value is spread as inline-style object into <Area />
   */
  areaStyle: CommonPropTypes.style,

  /*
   function to apply to the datum to transform area values. default: _.identity
   @param values
   @param key
   @return transformed data (or undefined)
   */
  areaValuesIteratee: PropTypes.func,

  className: CommonPropTypes.className,

  /* string id url for clip path */
  clipPathId: PropTypes.string,

  /* fn that accepts keyfield, and returns stroke color for line */
  colorScale: PropTypes.func,

  /* array of objects
    e.g. [ {location: 'USA',values: []}, {location: 'Canada', values: []} ]
  */
  data: PropTypes.arrayOf(PropTypes.object),

  /*
    key names containing x, y data
      x -> accessor for xscale
      y -> accessor for yscale (when there's one, e.g. <Line />)
      y0 -> accessor for yscale (when there're two; e.g., lower bound)
      y1 -> accessor for yscale (when there're two; e.g., upper bound)

    To show only a line, include just x, y.
    To show only an area, include just x, y0, y1.
    To show line and area, include all properties.
  */
  dataAccessors: PropTypes.oneOfType([
    PropTypes.shape({
      x: CommonPropTypes.dataAccessor.isRequired,
      y: CommonPropTypes.dataAccessor.isRequired,
    }),
    PropTypes.shape({
      x: CommonPropTypes.dataAccessor.isRequired,
      y0: CommonPropTypes.dataAccessor.isRequired,
      y1: CommonPropTypes.dataAccessor.isRequired,
    }),
    PropTypes.shape({
      x: CommonPropTypes.dataAccessor.isRequired,
      y: CommonPropTypes.dataAccessor.isRequired,
      y0: CommonPropTypes.dataAccessor.isRequired,
      y1: CommonPropTypes.dataAccessor.isRequired,
    }),
  ]).isRequired,

  /*
   key names containing fields for child component configuration
     color -> (optional) color data as input to color scale.
     data -> data provided to child components. default: 'values'
     key -> unique key to apply to child components. used as input to color scale if color field is not specified. default: 'key'
   */
  fieldAccessors: PropTypes.shape({
    color: CommonPropTypes.dataAccessor,
    data: CommonPropTypes.dataAccessor.isRequired,
    key: CommonPropTypes.dataAccessor.isRequired,
  }),

  /* base classname to apply to Lines that are children of MultiLine */
  lineClassName: CommonPropTypes.className,

  /*
    if object, spread directly as inline-style object into <Line />
    if function, passed lineValues as first arg, line key as second arg
      return value is spread as inline-style object into <Line />
   */
  lineStyle: CommonPropTypes.style,

  /*
   function to apply to the datum to transform line values. default: _.identity
   @see areaValuesIteratee
   */
  lineValuesIteratee: PropTypes.func,

  /* mouse events signature: function(event, data, instance) {...} */
  onClick: PropTypes.func,
  onMouseLeave: PropTypes.func,
  onMouseMove: PropTypes.func,
  onMouseOver: PropTypes.func,

  /* scales from d3Scale */
  scales: PropTypes.shape({
    x: PropTypes.func,
    y: PropTypes.func,
  }).isRequired,

  style: CommonPropTypes.style,
};

MultiLine.defaultProps = {
  areaValuesIteratee: CommonDefaultProps.identity,
  colorScale() { return 'steelblue'; },
  fieldAccessors: {
    data: 'values',
    key: 'key',
  },
  lineValuesIteratee: CommonDefaultProps.identity,
  scales: { x: scaleLinear(), y: scaleLinear() },
};
