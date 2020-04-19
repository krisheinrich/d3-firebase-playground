const dims = { h: 300, w: 300, r: 150 };
const center = { x: dims.w/2 + 5, y: dims.h/2 + 5 };

// init svg and graph group
const svg = d3.select('.canvas')
  .append('svg')
    .attr('width', dims.w + 150)
    .attr('height', dims.h + 150);

const graph = svg.append('g')
  .attr('transform', `translate(${center.x},${center.y})`);

// setup generators

// d3.pie() creates a generator that enhances an array of data with
// angle info (in rad) for each item, based on the specified value
const pie = d3.pie()
  .sort(null)  // prevent pie function from actumatically re-sorting data
  .value(d => d.cost);

// d3.arc() creates a generator that produce a path description for an arc 
// using the angles from the pie generator output and the inner/outer radii
const arcPath = d3.arc()
  .outerRadius(dims.r)
  .innerRadius(dims.r/2);

// d3.scaleOrdinal() creates a generator that assigns output based on input order
// here we define a range of colors; the domain will be updated dynamically later
const color = d3.scaleOrdinal(d3['schemeSet1']);

// setup legend
const legendGroup = svg.append('g')
  .attr('transform', `translate(${dims.w + 40}, 10)`);

const legend = d3.legendColor()
  .shape('circle')
  .shapePadding(10)
  .scale(color);

// setup tooltip
const tip = d3.tip()
  .attr('class', 'tip card')
  .html(d => {
    return `<div class="name">${d.data.name}</div>`
      + `<div class="cost">${d.data.cost}</div>`
      + `<div class="delete">Click slice to delete</div>`;
  });

graph.call(tip)

const update = data => {

  // update color scale domain
  color.domain(data.map(d => d.name));

  // update and call legend
  legendGroup.call(legend);
  legendGroup.selectAll('text').attr('fill', 'white');

  // join enhanced data to path elements
  const angles = pie(data)
  const paths = graph.selectAll('path')
    .data(angles);

  // handle exit selection
  paths.exit()
    .transition('arcAngles').duration(1000)
      .attrTween('d', arcTweenExit)
      .remove();

  // handle update selection
  paths
    .transition('arcAngles').duration(1000)
      .attrTween('d', arcTweenUpdate);

  // append paths to svg
  paths.enter()
    .append('path')
      .attr('class', 'arc')
      .attr('stroke', '#fff')
      .attr('stroke-width', 2)
      .attr('fill', d => color(d.data.name))
      // set the current pie-enhanced datum as a property on each path
      .each(function(d) { this._current = d; })
      .transition('arcAngles').duration(1000)
        .attrTween('d', arcTweenEnter);

  // register event listeners
  graph.selectAll('path')
    .on('mouseenter', handleMouseEnter)
    .on('mouseleave', handleMouseLeave)
    .on('click', handleClick);
};

// call update with current data on each DB changes
let data = [];

db.collection('expenses').onSnapshot(res => {

  res.docChanges().forEach(change => {
    const doc = { ...change.doc.data(), id: change.doc.id };

    if (change.type === 'added') {
      data.push(doc);
    } else if (change.type === 'modified') {
      const index = data.findIndex(item => item.id === doc.id);
      data[index] = doc;
    } else if (change.type === 'removed') {
      data = data.filter(item => item.id !== doc.id);
    }
  });

  update(data);
});

// arc tweening functions
const arcTweenEnter = d => {
  const i = d3.interpolate(d.endAngle, d.startAngle);
  return t => {
    d.startAngle = i(t);
    return arcPath(d);
  };
};

const arcTweenExit = d => {
  const i = d3.interpolate(d.startAngle, d.endAngle);
  return t => {
    d.startAngle = i(t);
    return arcPath(d);
  };
};

function arcTweenUpdate(d) {
  // since both startAngle and endAngle may change, interpolate between
  // current and updated versions of the entire pie-enhanced data item
  const i = d3.interpolate(this._current, d);
  this._current = d;
  return t => {
    d = i(t);
    return arcPath(d);
  };
}

// event listeners
const transitionNodeToColor = (node, color) => {
  d3.select(node)
    .transition("fillColor").duration(400)
      .attr('fill', color);
};

const handleMouseEnter = (d, i, n) => {
  tip.show(d, n[i]);
  transitionNodeToColor(n[i], 'white');
};

const handleMouseLeave = (d, i, n) => {
  tip.hide();
  transitionNodeToColor(n[i], color(d.data.name));
};

const handleClick = d => {
  const { id } = d.data;
  db.collection('expenses').doc(id).delete();
};
