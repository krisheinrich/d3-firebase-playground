const WIDTH = 500;
const HEIGHT = 500;
const margin = {
  top: 10,
  right: 10,
  bottom: 100,
  left: 100
};

const graphWidth = WIDTH - margin.left - margin.right;
const graphHeight = HEIGHT - margin.top - margin.bottom;

const svg = d3.select('.canvas')
  .append('svg')
    .attr('width', WIDTH)
    .attr('height', HEIGHT);

// groups for the graph and each set of axes
const graphGroup = svg.append('g')
  .attr('width', graphWidth)
  .attr('height', graphHeight)
  .attr('transform', `translate(${margin.left},${margin.top})`);

const xAxisGroup = graphGroup.append('g')
  .attr('transform', `translate(0,${graphHeight})`);
const yAxisGroup = graphGroup.append('g');

d3.json('data.json').then(data => {
  // set up a vertical linear scale
  const y = d3.scaleLinear()
    // inverted: domain is low -> high, range is high -> low
    // so that y-axis shows highest number at the top
    .domain([0, d3.max(data, d => d.amount)])
    .range([graphHeight, 0]);

  // set up a horizontal band scale
  const x = d3.scaleBand()
    .domain(data.map(d => d.name))
    .range([0, graphWidth])
    .paddingInner(0.2)
    .paddingOuter(0.2);

  // bind data to rects
  const rects = graphGroup.selectAll('rect')
    .data(data);

  // style update selection
  rects
    .attr('width', x.bandwidth)
    // height is complement of y()
    .attr('height', d => graphHeight - y(d.amount))
    .attr('x', d => x(d.name))
    // y() gives y position of rect top, i.e. graphHeight - height
    // (defined earlier), since we inverted the y-axis range
    .attr('y', d => y(d.amount))
    .attr('fill', 'orange');

  // style enter selection
  rects.enter()
    .append('rect')
      .attr('width', x.bandwidth)
      .attr('height', d => graphHeight - y(d.amount))
      .attr('x', d => x(d.name))
      .attr('y', d => y(d.amount))
      .attr('fill', 'orange');

  // draw axes
  const xAxis = d3.axisBottom(x);
  const yAxis = d3.axisLeft(y)
    .ticks(4)
    .tickFormat(d => `${d} units`);

  xAxisGroup.call(xAxis);
  yAxisGroup.call(yAxis);

  // configure x-axis text
  xAxisGroup.selectAll('text')
    .attr('transform', 'rotate(-40)')
    .attr('text-anchor', 'end')
    .attr('fill', 'orange');
});
