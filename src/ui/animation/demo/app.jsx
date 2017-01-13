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
import { MultiAnimation } from '../';

const locations = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
let locationIndex = 0;
const stages = [1, 2, 3, 4];

const colorScale = scaleOrdinal().domain(stages)
  .range(['red', 'blue', 'orange', 'green']);

const symbolScale = scaleOrdinal().domain(stages)
  .range(['circle', 'cross', 'diamond', 'star']);

const dims = {
  width: 400,
  height: 200,
};

const padding = { top: 20, bottom: 40, left: 55, right: 20 };

const axisStyle = {
  fontFamily: 'sans-serif',
  fontSize: '11px',
};

const areaStyle = { strokeWidth: '1px', fillOpacity: '0.5' };

const pageStyle = { display: 'flex', flexDirection: 'column' };
const rowStyle = { display: 'flex' };

const keyField = 'year_id';
const valueField = 'values';
const valueField_2 = 'values_2';
const chartClassName = ['foo', 'bar'];

const data = dataGenerator({
  primaryKeys: [
    { name: 'location_id', values: locations },
    { name: 'stage_id', values: stages },
  ],
  valueKeys: [
    { name: valueField, range: [200, 500], uncertainty: true },
    { name: valueField_2, range: [100, 300], uncertainty: false},
  ],
  length: 20,
});

class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      settings: {
        location_id: locations[locationIndex],
        stage_id: [2, 3, 4],
        checked: false,
      },
    };

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
    // disabled at the moment.

    // let nextSettings;
    // if (e.target.checked) {
    //   nextSettings = assign({}, this.state.settings, { checked: e.target.checked, stage_id: [1, 2, 3, 4] })
    // } else {
    //   nextSettings = assign({}, this.state.settings, { checked: e.target.checked, stage_id: [2, 3, 4] })
    // }
    //
    // this.setState({
    //   lineData: this.filterLineData(nextSettings, data),
    //   scatterData: this.filterScatterData(nextSettings, data),
    //   settings: nextSettings,
    // });
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
    const groupedData = groupBy(map(filteredData, d => assign({}, d, { [valueField]: random(100), [valueField_2]: random(200)})), 'stage_id');
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
        <MultiAnimation
          transitionTargetProp="data"
          transitionToData={lineData}
          duration={200}
        >
          <MultiLine
            areaStyle={areaStyle}
            colorScale={colorScale}
            data={lineData}
            fieldAccessors={fieldAccessors}
            showUncertainty
            dataAccessors={dataAccessors}
            onClick={()=>{console.log('click')}}
          />
        </MultiAnimation>
        <XAxis style={axisStyle} label="Year" />
        <YAxis style={axisStyle} label="# of cases" />
      </AxisChart>
    );
  }

  renderScatterChart() {
    const dataAccessors = {
      fill: 'stage_id',
      key: 'id',
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
        <MultiAnimation
          transitionTargetProp="data"
          transitionToData={scatterData}
          duration={500}
        >
          <MultiScatter
            colorScale={colorScale}
            data={scatterData}
            fieldAccessors={fieldAccessors}
            dataAccessors={dataAccessors}
            onClick={()=>{console.log('click')}}
            symbolField="stage_id"
            symbolScale={symbolScale}
          />
        </MultiAnimation>
        <XAxis style={axisStyle} label="Value 1" />
        <YAxis style={axisStyle} label="Value 2" />
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
                {"stage one: "}
                <input type="checkbox" value={1} onChange={this.onChange} />
              </label>
            </p>
          </div>
        </div>
        {this.renderLineChart()}
        {this.renderScatterChart()}
      </div>
    );
  }
}

render(<App />, document.getElementById('app'));
