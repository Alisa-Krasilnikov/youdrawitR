window.renderSmoothLayer = function(svg, plot, layer) {

  const g = plot.g;
  const x = plot.x;
  const y = plot.y;

  // Normalize data
  function asRows(x) {
    if (Array.isArray(x)) return x;
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

  const rows = asRows(layer.data);

  const line = d3.line()
    .x(d => x(d.x))
    .y(d => y(d.y));

  // drawing CI ribbon if we have one
  if (rows[0]?.ymin != null && rows[0]?.ymax != null) {
  const area = d3.area()
    .x(d => x(+d.x))
    .y0(d => y(+d.ymin))
    .y1(d => y(+d.ymax));

  g.append("path")
    .datum(rows)
    .attr("fill", "#999999")
    .attr("opacity", 0.2)
    .attr("d", area);
  }

  // strokeWidth accounting for "size" or "linewidth"
  const strokeWidth =
    rows[0]?.linewidth ??
    rows[0]?.size ??
    layer.aes_params?.linewidth ??
    layer.aes_params?.size ??
    5;

  g.append("path")
    .datum(rows)
    .attr("class", "geom-smooth")
    .attr("fill", "none")
    .attr("stroke", layer.aes_params?.colour || "blue")
    .attr("stroke-width", strokeWidth + 2) // Make it look similar to ggplot
    .attr("stroke-linecap", "round") // make the ends round
    .attr("d", line);
};
