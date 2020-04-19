const WIDTH = 560;
const HEIGHT = 400;
const margin = { top: 40, right: 20, bottom: 50, left: 100 };
const graphWidth = WIDTH - margin.left - margin.right;
const graphHeight = HEIGHT - margin.top - margin.bottom;

// colors
const lightGreen = '#00bfa5';
const lightGray = '#ccc';

// svg and graph
const svg = d3.select('.canvas')
  .append('svg')
    .attr('width', WIDTH)
    .attr('height', HEIGHT);

const graph = svg.append('g')
  .attr('width', graphWidth)
  .attr('height', graphHeight)
  .attr('transform', `translate(${margin.left}, ${margin.top})`);

// line path
const path = graph.append('path');

// crosshairs line group
const lineGroup = graph.append('g');

// axes groups
const xAxisGroup = graph.append('g')
  .attr('class', 'x-axis')
  .attr('transform', `translate(0, ${graphHeight})`);

const yAxisGroup = graph.append('g')
  .attr('class', 'y-axis');

// scales
const y = d3.scaleLinear()
  .range([graphHeight, 0]);

const x = d3.scaleTime()
  .range([0, graphWidth]);

// axes
const xAxis = d3.axisBottom(x)
  .ticks(4)
  .tickFormat(d3.timeFormat('%b %d'));

const yAxis = d3.axisLeft(y)
  .ticks(4)
  .tickFormat(d => `${d} mi`);

// line path generator
const line = d3.line()
  .x(d => x(new Date(d.date)))
  .y(d => y(d.distance));

// data and firestore listener
let data = [];

db.collection('activities').onSnapshot(res => {
  res.docChanges().forEach(change => {
    const doc = { ...change.doc.data(), id: change.doc.id };

    if (change.type === 'added') {
      data.push(doc);
    } else if (change.type === 'modified') {
      const idx = data.findIndex(item => item.id == doc.id);
      data[idx] = doc;
    } else if (change.type === 'removed') {
      data = data.filter(item => item.id !== doc.id);
    }
  });

  update(data);
});

const update = data => {

  data = data.filter(item => item.activity === activity);

  data.sort((a, b) => new Date(a.date) - new Date(b.date));

  // update scales
  y.domain( [0, d3.max(data, d => d.distance)] );
  x.domain( d3.extent(data, d => new Date(d.date)) );

  // call axes
  xAxisGroup.call(xAxis);
  yAxisGroup.call(yAxis);

  // rotate axis text
  xAxisGroup.selectAll('text')
    .attr('transform', 'rotate(-40)')
    .attr('text-anchor', 'end');

  // set path d attr
  path
    .data([data])
      .attr('fill', 'none')
      .attr('stroke', lightGreen)
      .attr('stroke-width', '2')
      .attr('d', line);

  // join data
  const circles = graph.selectAll('circle')
    .data(data);

  // handle exit selection
  circles.exit().remove();

  // handle enter and update selections
  circles.enter().append('circle')
    .attr('r', 4)
    .attr('fill', lightGray)
    .merge(circles)
    .attr('cx', d => x(new Date(d.date)))
    .attr('cy', d => y(d.distance));

  // event listeners
  graph.selectAll('circle')
    .on('mouseenter', (d, i, n) => {
      d3.select(n[i])
        .transition('circle').duration(250)
        .attr('r', 8)
        .attr('fill', '#fff');

      lineGroup.append('line')
        .attr('stroke', lightGray)
        .attr('stroke-width', 1)
        .attr('stroke-dasharray', 8)
        .attr('x1', 0)
        .attr('x2', x(new Date(d.date)))
        .attr('y1', y(d.distance))
        .attr('y2', y(d.distance));

      lineGroup.append('line')
        .attr('stroke', lightGray)
        .attr('stroke-width', 1)
        .attr('stroke-dasharray', 8)
        .attr('x1', x(new Date(d.date)))
        .attr('x2', x(new Date(d.date)))
        .attr('y1', graphHeight)
        .attr('y2', y(d.distance));
    })
    .on('mouseleave', (d, i, n) => {
      d3.select(n[i])
        .transition('circle').duration(250)
        .attr('r', 4)
        .attr('fill', lightGray);

      lineGroup.selectAll('line').remove();
    });
};
