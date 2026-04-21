window.renderLineLayer = function(svg, plot, layer) {

  const g = plot.g;
  const x = plot.x;
  const y = plot.y;
  const alphaDefault = layer.aes_params?.alpha ?? 1;

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

  const rows = asRows(layer.data)
    .filter(d => d.x != null && d.y != null)
    .sort((a, b) => +a.x - +b.x); // Sorting AGAIN because D3

  const line = d3.line()
    .defined(d => d.y != null && !isNaN(d.y)) // handle missing values
    .x(d => x(+d.x))
    .y(d => y(+d.y));

  // accounting for "linewidth" or "size"
  const strokeWidth =
    rows[0]?.linewidth ??
    rows[0]?.size ??
    layer.aes_params?.linewidth ??
    layer.aes_params?.size ??
    5;

  g.append("path")
    .datum(rows)
    .attr("class", "geom-line")
    .attr("fill", "none")
    .attr("stroke", layer.aes_params?.colour || "black")
    .attr("opacity", d => d.alpha != null ? d.alpha : alphaDefault)
    .attr("stroke-width", strokeWidth + 2) // Make it look similar to ggplot
    .attr("stroke-linecap", "round") // make the ends round
    .attr("d", line);
};
