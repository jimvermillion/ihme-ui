import React from 'react';
import { render } from 'react-dom';
import {
  assign,
  filter,
  flatMap,
  forEach,
  groupBy,
  includes,
  maxBy,
  minBy,
  map,
  uniqBy,
  random,
} from 'lodash';
import { scaleOrdinal } from 'd3';

import { dataGenerator } from '../../../test-utils/data';
import AxisChart from '../../axis-chart';
import { MultiLine, MultiScatter } from '../../shape';
import { XAxis, YAxis } from '../../axis';
import Button from '../../button';
import { default as Animation } from '../src/animation';
import { default as Timer } from '../src/utils/timer';

const locations = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
let locationIndex = 0;
const stages = [1, 2, 3];

const colorScale = scaleOrdinal().domain(stages)
  .range(['red', 'blue', 'orange', 'green']);

const symbolScale = scaleOrdinal().domain(stages)
  .range(['circle', 'cross', 'diamond', 'star']);

const dims = {
  width: 300,
  height: 300,
};

const DURATION = 500;

const padding = { top: 20, bottom: 40, left: 55, right: 20 };

const axisStyle = {
  fontFamily: 'sans-serif',
  fontSize: '11px',
};

const areaStyle = { strokeWidth: '1px', fillOpacity: '0.5' };

const pageStyle = { display: 'flex', flexDirection: 'column' };
const rowStyle = { display: 'flex' };

const keyField = 'year_id';
const valueField = 'value';
const valueField_2 = 'value_B';
const chartClassName = ['foo', 'bar'];

const data = dataGenerator({
  primaryKeys: [
    { name: 'location_id', values: locations },
    { name: 'stage_id', values: stages },
  ],
  valueKeys: [
    { name: valueField, range: [200, 500], uncertainty: true },
    { name: valueField_2, range: [0, 1], uncertainty: true},
  ],
  length: 30,
});

class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      settings: {
        location_id: locations[locationIndex],
        stage_id: [1],
        checked: false,
      },
    };

    this.animation = new Animation();
    this.timer = new Timer();
    this.yAxisWithAnimation = this.animation.YAxisAnimate(YAxis);
    this.xAxisWithAnimation = this.animation.XAxisAnimate(XAxis);

    this.onClick = this.onClick.bind(this);
    this.getNextData = this.getNextData.bind(this);
    this.onChange = this.onChange.bind(this);
  }

  componentWillMount() {
    this.setState({
      lineData: this.filterLineData(this.state.settings, data),
      scatterData: this.filterScatterData(this.state.settings, data)
    });
  }

  onClick() {
    this.getNextData(this.state.settings, data);
  }

  onChange(e) {
    let nextSettings;
    if (e.target.checked) {
      nextSettings = assign({}, this.state.settings, { checked: e.target.checked, stage_id: stages })
    } else {
      nextSettings = assign({}, this.state.settings, { checked: e.target.checked, stage_id: [1] })
    }

    this.setState({
      lineData: this.filterLineData(nextSettings, data),
      scatterData: this.filterScatterData(nextSettings, data),
      settings: nextSettings,
    });
  }

  filterLineData(settings, data) {
    const filteredData = filter(
      data,
      d => d.location_id === settings.location_id && includes(settings.stage_id, d.stage_id)
    );
    const groupedData = groupBy(filteredData, 'stage_id');
    return map(groupedData, (group, stage) => ({
      key: stage,
      line: group,
    }));
  }

  filterScatterData(settings, data) {
    const filteredData = filter(
      data,
      d => d.location_id === settings.location_id && includes(settings.stage_id, d.stage_id)
    );
    const groupedData = groupBy(map(filteredData, d => {
      const x_0 = d[`${valueField_2}_lb`];
      const x_1 = d[`${valueField_2}_ub`];
      const y_0 = d[`${valueField}_lb`];
      const y_1 = d[`${valueField}_ub`];

      return assign(
        {},
        d,
        {
          [valueField]: random(x_0, x_1),
          [valueField_2]: random(y_0, y_1),
        }
      )
    }), 'stage_id');
    return map(groupedData, (group, stage) => ({
      key: stage,
      scatter: group,
    }));
  }

  getNextData(settings, data) {
    locationIndex = (locationIndex + 3) % locations.length;
    const nextSettings = assign({}, settings, { location_id: locations[locationIndex] });

    this.setState({
      lineData: this.filterLineData(nextSettings, data),
      scatterData: this.filterScatterData(nextSettings, data),
      settings: nextSettings,
    });
  }

  getLineYDomain(data) {
    return [
      minBy(data, `${valueField}_lb`)[`${valueField}_lb`],
      maxBy(data, `${valueField}_ub`)[`${valueField}_ub`],
    ];
  }

  getLineXDomain(data) {
    return [
      minBy(data, keyField)[keyField],
      maxBy(data, keyField)[keyField],
    ];
  }

  getScatterYDomain(data) {
    return [
      minBy(data, valueField_2)[valueField_2],
      maxBy(data, valueField_2)[valueField_2],
    ];
  }

  getScatterXDomain(data) {
    return [
      minBy(data, valueField)[valueField],
      maxBy(data, valueField)[valueField],
    ];
  }

  renderLineChart() {
    const dataAccessors = {
      x: keyField,
      y: valueField,
      y0: `${valueField}_lb`,
      y1: `${valueField}_ub`,
    };
    const fieldAccessors = { data: 'line', key: 'key' };

    const lineData = this.state.lineData;
    const xDomain = this.getLineXDomain(flatMap(lineData, (d) => d.line));
    const yDomain = this.getLineYDomain(flatMap(lineData, (d) => d.line));

    const YAxisAnimate = this.yAxisWithAnimation;

    return (
      <AxisChart
        clipPath
        width={dims.width}
        height={dims.height}
        padding={padding}
        xDomain={xDomain}
        xScaleType="linear"
        yDomain={yDomain}
        yScaleType="linear"
        className={chartClassName}
      >
        <MultiLine
          animate={{
            duration: DURATION,
            timer: this.timer,
          }}
          areaStyle={areaStyle}
          colorScale={colorScale}
          data={lineData}
          fieldAccessors={fieldAccessors}
          showUncertainty
          dataAccessors={dataAccessors}
          onClick={()=>{console.log('click')}}
        />
        <XAxis style={axisStyle} label="Year" />
        <YAxisAnimate duration={DURATION} style={axisStyle} label="# of cases" />
      </AxisChart>
    );
  }

  renderScatterChart() {
    const dataAccessors = {
      fill: 'stage_id',
      key: 'year_id',
      symbol: 'stage_id',
      x: valueField,
      y: valueField_2,
    };
    const fieldAccessors = {
      data: 'scatter',
      key: 'key',
    };

    const scatterData = this.state.scatterData;
    const xDomain = this.getScatterXDomain(flatMap(scatterData, (d) => d.scatter));
    const yDomain = this.getScatterYDomain(flatMap(scatterData, (d) => d.scatter));

    const YAxisAnimate = this.yAxisWithAnimation;
    const XAxisAnimate = this.xAxisWithAnimation;

    return (
      <AxisChart
        clipPath
        width={dims.width}
        height={dims.height}
        padding={padding}
        xDomain={xDomain}
        xScaleType="linear"
        yDomain={yDomain}
        yScaleType="linear"
        className={chartClassName}
      >
        <MultiScatter
          animate={{
            duration: DURATION,
            timer: this.timer,
          }}
          colorScale={colorScale}
          data={scatterData}
          fieldAccessors={fieldAccessors}
          dataAccessors={dataAccessors}
          onClick={()=>{console.log('click')}}
          style={{ fillOpacity: 0.5 }}
          symbolField="stage_id"
          symbolScale={symbolScale}
        />
        <XAxisAnimate style={axisStyle} label="Value 1" duration={DURATION} />
        <YAxisAnimate style={axisStyle} label="Value 2" duration={DURATION} />
      </AxisChart>
    );
  }

  render() {
    return (
      <div style={pageStyle}>
        <div style={rowStyle}>
          <div>
            <p>
              {`location: ${this.state.settings.location_id}`}
            </p>
            <Button
              text="change location"
              onClick={this.onClick}
            />
          </div>
          <div>
            <p>
              <label>
                {"more stages: "}
                <input type="checkbox" value={1} onChange={this.onChange} />
              </label>
            </p>
          </div>
        </div>
        <div style={rowStyle}>
          {this.renderLineChart()}
          {this.renderScatterChart()}
          {this.renderLineChart()}
          {this.renderScatterChart()}
        </div>
      </div>
    );
  }
}

render(<App />, document.getElementById('app'));
