// This just draws a scatterplot from ggplot2
const layer = data.layers[0];
const labels = data.labels || {};
const scales = data.scales;

// Normalize data
function asRows(x) {
  if (Array.isArray(x)) return x;

  // column-oriented object to rows
  if (x && typeof x === "object") {
    const cols = Object.keys(x);
    if (!cols.length) return [];
    const n = Array.isArray(x[cols[0]]) ? x[cols[0]].length : 0;
    return d3.range(n).map(i => {
      const row = {};
      cols.forEach(k => row[k] = Array.isArray(x[k]) ? x[k][i] : x[k]);
      return row;
    });
  }
  return [];
}

const pts = asRows(layer.data);

const margin = { top: 20, right: 20, bottom: 45, left: 55 };
const innerW = width - margin.left - margin.right;
const innerH = height - margin.top - margin.bottom;

const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

const xScale = d3.scaleLinear().domain(scales.x_domain).range([0, innerW]);
const yScale = d3.scaleLinear().domain(scales.y_domain).range([innerH, 0]);

g.append("g")
  .attr("transform", `translate(0,${innerH})`)
  .call(d3.axisBottom(xScale));

g.append("g").call(d3.axisLeft(yScale));

if (labels.x) {
  g.append("text")
    .attr("x", innerW / 2)
    .attr("y", innerH + 38)
    .attr("text-anchor", "middle")
    .text(labels.x);
}

if (labels.y) {
  g.append("text")
    .attr("transform", `translate(-40, ${innerH / 2}) rotate(-90)`)
    .attr("text-anchor", "middle")
    .text(labels.y);
}

const rDefault = (layer.aes_params && layer.aes_params.size) ? layer.aes_params.size : 3;
const alphaDefault = (layer.aes_params && layer.aes_params.alpha) ? layer.aes_params.alpha : 1;

g.append("g")
  .selectAll("circle")
  .data(pts)
  .enter()
  .append("circle")
  .attr("cx", d => xScale(d.x))
  .attr("cy", d => yScale(d.y))
  .attr("r", d => d.size ? (+d.size * 3) : rDefault)
  .attr("fill", d => d.colour || "black")
  .attr("opacity", d => (d.alpha != null ? d.alpha : alphaDefault));

// One overlay rect (the interaction layer)
const overlay = g.append("rect")
  .attr("class", "interaction")
  .attr("width", innerW)
  .attr("height", innerH)
  .attr("fill", "transparent")
  .style("pointer-events", "all");

// Publish plot context so drawit.js can attach behavior
svg.node().__plot__ = {
  g,
  overlay,
  x: xScale,
  y: yScale,
  w: innerW,
  h: innerH,
  margin,
  labels,
  pts
};

// Call drawit enhancer
if (window.youdrawitAttachDrawit) {
  window.youdrawitAttachDrawit(svg, width, height, pts, options);
}
