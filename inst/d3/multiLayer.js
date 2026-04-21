// This actually renders the plots, determining what is the "initial" and "after" plot
const labels = data.labels || {};
const scales = data.scales;

// Note: data already normalized. Could add it here centrally? But works for window
// check if title
const title = labels.title;
const subtitle = labels.subtitle;

const hasTitle = !!labels.title;
const hasSubtitle = !!labels.subtitle;

const titleBlockHeight =
  (hasTitle ? 20 : 0) +
  (hasSubtitle ? 15 : 0);


const margin = {
  top: 20 + titleBlockHeight,
  right: 20,
  bottom: 55,
  left: 55
};

// This used to be in depricated scatter.js
const innerW = width - margin.left - margin.right;
const innerH = height - margin.top - margin.bottom;

// This is needed so that I can try to prevent hard coding...
function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

const g = svg.append("g")
  .attr("transform", `translate(${margin.left},${margin.top})`);

const xScale = d3.scaleLinear().domain(scales.x_domain).range([0, innerW]);

const yScale = d3.scaleLinear().domain(scales.y_domain).range([innerH, 0]);

// Axes
g.append("g")
  .attr("transform", `translate(0,${innerH})`)
  .call(d3.axisBottom(xScale));

g.append("g")
  .call(d3.axisLeft(yScale));

// One overlay rect (the interaction layer)
const overlay = g.append("rect")
  .attr("class", "interaction")
  .attr("width", innerW)
  .attr("height", innerH)
  .attr("fill", "transparent")
  .style("pointer-events", "all");

// I'm tired of accidentally highlighting the axes
// disable text selection and dragging effects on the SVG
svg.style("user-select", "none")
   .style("-webkit-user-select", "none") // Chrome and Safari
   .style("-moz-user-select", "none") // Firefox
   .style("-ms-user-select", "none"); // Edge

// Prevent pointer events from selecting axes text or lines
g.selectAll("text, line").style("pointer-events", "none"); // "don't highlight the axes"

// Axis labels
if (labels.x) {
  g.append("text")
    .attr("class", "x-label")
    .attr("x", innerW / 2)
    .attr("y", innerH + 45)
    .attr("text-anchor", "middle")
    .style("font-size", "12px") // Make em smaller
    .style("font-family", "sans-serif") // Looks like ggplot
    .text(labels.x);
}

if (labels.y) {
  g.append("text")
    .attr("class", "y-label")
    .attr("transform", "rotate(-90)")
    .attr("x", -innerH / 2)
    .attr("y", -40)
    .attr("text-anchor", "middle")
    .style("font-size", "12px")
    .style("font-family", "sans-serif")
    .text(labels.y);
}

// Title/subtitles
let currentY = 15;

if (title) {
  svg.append("text")
    .attr("x", margin.left)
    .attr("y", currentY)
    .style("font-family", "sans-serif")
    .text(title);

  currentY += 18;
}

if (subtitle) {
  svg.append("text")
    .attr("x", margin.left)
    .attr("y", currentY)
    .style("font-size", "12px") // smaller than title
    .style("fill", "#4D4D4D") // softer gray (closer to ggplot)
    .style("font-family", "sans-serif")
    .text(subtitle);
}


// Publish plot context so drawit.js can attach behavior
// -------------------------------
const plot = {
  svg,
  g,
  overlay,
  x: xScale,
  y: yScale,
  w: innerW,
  h: innerH,
  margin,
  labels,
  title,
  subtitle
};

svg.node().__plot__ = plot;

// -------------------------------

// Check if drawit state exists, and initialize only if needed
let state = null;

if (options?.drawit) {
  state = svg.node().__drawit__ || {};
  state.delayed_layers = state.delayed_layers || [];
  svg.node().__drawit__ = state;
}

// Layer render loop  (The LRL, if you will) (this is for the delayed rendering)
(data.layers || []).forEach(layer => {

  const rendererName = "render" + capitalize(layer.geom_type) + "Layer";
  const renderer = window[rendererName];

  if (typeof renderer !== "function") return;

  // Delay if requested
  if (options?.drawit && layer.show_on_finish) { // We don't want a show on finish for sketchit
    const state = svg.node().__drawit__;
    state.delayed_layers.push(layer);
    return;   // DO NOT render now
  }

  // Otherwise render immediately :)
  renderer(svg, plot, layer);
});


// ---------- Interaction modules

options.x_domain = scales.x_domain;

// Attach drawit if called
if (options?.drawit && window.youdrawitAttachDrawit) {
  window.youdrawitAttachDrawit(
    svg,
    width,
    height,
    data.layers?.[0]?.data,
    options
  );
}

// Attach sketchit if called
if (options?.sketchit && window.youdrawitAttachSketchit) {
  window.youdrawitAttachSketchit(
    svg,
    width,
    height,
    data.layers?.[0]?.data,
    options
  );
}
