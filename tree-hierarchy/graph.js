const dims = { width: 1100, height: 500 };
const margin = 50;

const nodeHeight = 50;

// svg graph
const svg = d3.select('.canvas')
  .append('svg')
    .attr('viewBox', `0 0 ${dims.width + 2*margin} ${dims.height + 2*margin}`);

const graph = svg.append('g')
  .attr('transform', `translate(${margin}, ${margin})`);

const linksGroup = graph.append('g')
  .attr('class', 'links');

// data stratify
const stratify = d3.stratify()
  .id(d => d.name)
  .parentId(d => d.parent);

// tree generator
const tree = d3.tree()
  .size([dims.width, dims.height]);

// link generator
const link = d3.linkVertical()
  .x(d => d.x)
  .y(d => d.y);

// ordinal color scale
const color = d3.scaleOrdinal(d3['schemeSet1']);

// handle data update
const update = data => {

  // update color scale
  color.domain(data.map(d => d.department));

  // join new data to tree nodes
  const root = stratify(data);
  const treeRoot = tree(root);

  // join nodes and links selections
  const nodes = graph.selectAll('.node')
    .data(treeRoot.descendants(), d => d.id);

  const links = linksGroup.selectAll('path')
    .data(treeRoot.links(), d => `${d.source.id}-${d.target.id}`);

  // handle exit selections
  nodes.exit()
    .transition().duration(400)
      .style('opacity', 0)
    .remove();

  links.exit()
    .transition().duration(400)
      .style('opacity', 0)
    .remove();

  // transition links on update
  links
    .transition().duration(1000)
      .attrTween('d', linkTweenUpdate);

  // transition nodes on update
  nodes
    .transition().duration(1000)
      .attrTween('transform', nodeTweenUpdate)

  // enter links
  const enterLinks = links.enter()
    .append('path')
      .style('opacity', 0)
      .attr('fill', 'none')
      .attr('stroke', '#aaa')
      .attr('stroke-width', 2)
      .attr('d', link)
      .each(function (d) {
        this._current = d;
      });

  enterLinks
    .transition().duration(300).delay(500)
    .style('opacity', 1);

  // enter node groups
  const enterNodes = nodes.enter()
    .append('g')
      .style('opacity', 0)
      .attr('class', 'node')
      .attr('transform', d => `translate(${d.x}, ${d.y})`)
      .each(function (d) {
        this._x = d.x;
        this._y = d.y;
      });

  enterNodes
      .transition().duration(300).delay(500)
      .style('opacity', 1);

  // append rects to enter nodes
  enterNodes.append('rect')
    .attr('fill', d => color(d.data.department))
    .attr('stroke', '#555')
    .attr('stroke-width', 2)
    .attr('height', nodeHeight)
    .attr('width', d => 20 * d.data.name.length)
    .attr('rx', 8)
    .attr('transform', d => `translate(${-10 * d.data.name.length}, ${-nodeHeight/2})`);

  // append name text to enter nodes
  enterNodes.append('text')
    .attr('text-anchor', 'middle')
    .attr('fill', '#fff')
    .attr('dominant-baseline', 'middle')
    .text(d => d.data.name);
};

// setup change listener
let data = [];

db.collection('employees').onSnapshot(res => {
  res.docChanges().forEach(change => {
    const doc = { id: change.doc.id, ...change.doc.data() };

    if (change.type === 'added') {
      data.push(doc);
    } else if (change.type === 'modified') {
      const idx = data.findIndex(item => item.id === doc.id);
      data[idx] = doc;
    } else if (change.type === 'removed') {
      data = data.filter(item => item.id !== doc.id);
    }
  });

  update(data);
});

// tweens
function nodeTweenUpdate(d) {
  const i_x = d3.interpolate(this._x, d.x);
  const i_y = d3.interpolate(this._y, d.y);
  this._x = d.x;
  this._y = d.y;
  return t => `translate(${i_x(t)}, ${i_y(t)})`;
}

function linkTweenUpdate(d) {
  const i = d3.interpolate(link(this._current), link(d));
  this._current = d;
  return t => i(t);
}
