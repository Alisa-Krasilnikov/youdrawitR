window.renderPointLayer = function(svg, plot, layer) {

  const g = plot.g;
  const xScale = plot.x;
  const yScale = plot.y;

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

  const pts = asRows(layer.data);

  const rDefault = layer.aes_params?.size ?? 3;
  const alphaDefault = layer.aes_params?.alpha ?? 1;

  g.append("g")
    .attr("class", "geom-point")
    .selectAll("circle")
    .data(pts)
    .enter()
    .append("circle")
    .attr("cx", d => xScale(d.x))
    .attr("cy", d => yScale(d.y))
    .attr("r", d => d.size ? (+d.size * 3) : rDefault)
    .attr("fill", d => d.colour || layer.aes_params?.colour || "black")
    .attr("opacity", d => d.alpha != null ? d.alpha : alphaDefault);

};
