(function () {
  // Key changes made due to the addition of multiple layers:
    // rowsFrom converts the data into row-oriented here; previously done by scatter.js
      // This is because we have to match multiLayer.js
    // Our gapping strategy is different as a consequence, also updated to be more data-driven
      // Previously relied heavily on Dillon's code, now restructured

  function rowsFrom(input) {
    if (Array.isArray(input)) return input;

    if (input && typeof input === "object") {
    const cols = Object.keys(input);
    if (!cols.length) return [];

    const n = Array.isArray(input[cols[0]]) ? input[cols[0]].length : 0;

    return d3.range(n).map(i => {
      const row = {};
      cols.forEach(k => {
        row[k] = Array.isArray(input[k]) ? input[k][i] : input[k];
      });
      return row;
    });
    }
    return [];
  }

  // Attach drawit state to the SVG DOM node
  // This allows multiple calls without reinitializing everything
  function ensureState(svg) {
    const root = svg.node();
    // We want to store drawing-related state on the SVG itself so that:
      // the state persists across function calls
      // multiple SVGs can each have their own independent state
    root.__drawit__ = root.__drawit__ || {};
    return root.__drawit__;
  }

  // helper to capitalize first letter (used later)
    function capitalize(str) {
      return str.charAt(0).toUpperCase() + str.slice(1);
    }

  // Get status on whether line is done or not based on how much is filled in
  // Only really care if it's done or not, used later
  function get_user_line_status(state) {
    const drawable_points = state.drawable_points || [];
    const num_points = drawable_points.length;
    const num_filled = d3.sum(drawable_points.map(d => d.y === null ? 0 : 1));
    const num_starting_filled = state.free_draw ? 0 : (state.pin_start ? 1 : 0);

    if (num_filled === num_starting_filled) return "unstarted";
    if (num_points === num_filled) return "done";
    return "in_progress";
  }

  // Based on Dillon's code, redone, used to prevent "jumping" between gaps
  // Could be replaced by a dense grid? (no, needed for the data to input connection)
  function interpolate_gaps(line_data, maxGap) {
    // If there is no data, return empty array early
    if (!line_data.length) return [];

    // Make a copy of the data and sort it from smallest x to largest x
    // We copy it so we don't change the original data by accident (learned the hard way)
    const sorted = line_data.slice().sort((a, b) => a.x - b.x);

    // This will store our final interpolated result
    const result = [];

    // Loop through each adjacent pair of points
    for (let i = 0; i < sorted.length - 1; i++) {
      const p1 = sorted[i]; // current point
      const p2 = sorted[i + 1]; // next point

      // Always keep the current original point
      result.push(p1);

      // Find the distance between the two x-values
      const gap = p2.x - p1.x;

      // Figure out how many smaller sections we need
      // This makes sure no section is bigger than maxGap
      if (gap > maxGap) {
        const steps = Math.ceil(gap / maxGap);

        // Insert intermediate points between p1 and p2
        for (let s = 1; s < steps; s++) {
          // t tells us how far between p1 and p2 we are (from 0 to 1) (normalized)
          const t = s / steps;

          // Add interpolated point at proportional x position
          // y is intentionally set to null bc this is a drawable point
          result.push({
            x: p1.x + t * gap,
            y: null   // keep null so user fills it
        });
      }
    }
  }

  // Push the final original point
  // (Because loop stops before last element)
  result.push(sorted[sorted.length - 1]);

  return result;

  }

  // create an x_by which adjusts to size of the data
  function get_dynamic_x_by(drawable_points) {
    if (drawable_points.length < 2) return 0.01; // fallback for very few points

    // Compute differences between consecutive x values
    const diffs = [];

    for (let i = 1; i < drawable_points.length; i++) {
      diffs.push(drawable_points[i].x - drawable_points[i - 1].x);
    }

    // Take the median spacing (because outliers)
    diffs.sort((a, b) => a - b);
    const mid = Math.floor(diffs.length / 2);
    const median_diff = diffs.length % 2 === 0
    ? (diffs[mid - 1] + diffs[mid]) / 2
    : diffs[mid];

    // This can be adjusted but I think it looks best
    return median_diff;
  }

  // This has been redone based on Dillon's adjustments (prevent gapping)
  // Note: Redone again due to the new interpolation stuff
  // This basically combines everything so we get the point-based drawable grid
  function setup_drawable_points(state) {
    const raw = state.line_data || [];
    if (!raw.length) return [];

    // Make a copy and sort from smallest x to largest x
      // Sorting may be redundant but I'd rather oversort and waste computation
    // copy so we don’t change the original data
    const sorted = raw.slice().sort((a, b) => a.x - b.x);

    // Find the spacing between each pair of neighboring points
    const gaps = [];
    for (let i = 1; i < sorted.length; i++) {
      gaps.push(sorted[i].x - sorted[i - 1].x);
    }

    // Find the middle gap (median... because outliers)
    // This helps us understand the "normal" spacing of the data
    const medianGap = gaps.sort((a,b)=>a-b)[Math.floor(gaps.length/2)];

    // Allow gaps up to twice the normal spacing
    // Bigger gaps will be filled in
    const maxGap = medianGap * 2;

    // Fill in large gaps with extra points, see interpolate_gaps function
    let interpolated = interpolate_gaps(sorted, maxGap);

    // Remove any points that are too close together
    // Google scared me about floating-point issues, so EPS is a very tiny number to avoid them
    const EPS = 1e-9;
    interpolated = interpolated.filter((d, i, arr) =>
      i === 0 || (d.x - arr[i - 1].x) > EPS
    );

    // If free_draw mode is on every point starts with y = null meaning the user must draw everything
    if (state.free_draw) {
      return interpolated.map(d => ({ x: d.x, y: null }));
    }

    // Otherwise if pin_start is true, keep the first point’s original y-value
    // All other points start as null and must be drawn by the user
    // NOT YET TESTED!!!!!!
    return interpolated.map((d, i) => ({
      x: d.x,
      y: i === 0 && state.pin_start ? sorted[0].y : null // this makes pinning "optional"
      // The logic is roughly the same, this just makes more intuitive sense
    }));
  }

  function fill_in_closest_point(state, drag_x, drag_y) {
    const { drawable_points, pin_start, free_draw } = state;
    let last_dist = Infinity;
    let closest_index = drawable_points.length - 1;
    const start_index = free_draw ? 0 : (pin_start ? 1 : 0);

    for (let i = start_index; i < drawable_points.length; i++) {
      const dist = Math.abs(drawable_points[i].x - drag_x);
      if (dist > last_dist) {
        closest_index = i - 1;
        break;
      }
      last_dist = dist;
    }
    drawable_points[closest_index].y = drag_y;
  }

  function make_line_drawer(x, y) {
    return d3.line()
      .defined(d => d.y != null)
      .x(d => x(+d.x))
      .y(d => y(+d.y));
  }

// Drawing functions ---------------------

  function draw_user_line(state) {
    const { g, x, y } = state.plot;
    const status = get_user_line_status(state);
    const line_drawer = make_line_drawer(x, y);

    const user_line = g.selectAll("path.user_line").data(status === "unstarted" ? [] : [state.drawable_points]);
    user_line.enter()
      .append("path")
      .attr("class", "user_line")
      .merge(user_line)
      .attr("fill", "none")
      .attr("stroke", state.drawn_line_color || "steelblue")
      .attr("stroke-width", 4)
      .attr("stroke-linejoin", "round")
      .attr("stroke-linecap", "round")
      .style("stroke-dasharray", "1,7")
      .attr("d", line_drawer);

    user_line.exit().remove();
  }

  function draw_rectangle(state) {
    const { g, x, w, h, overlay } = state.plot; // Lot of stuff rewritten due to this const
    const status = get_user_line_status(state);
    let drawSpace = 0;

    if (status === "unstarted") {
      drawSpace = state.free_draw ? 0 : x(state.draw_start); // free draw conditional rewritten
    } else if (status === "done") {
      drawSpace = w + 10000;


    } else { // This entire section was rewritten. This is what makes the yellow box move up to user line
      const null_points = state.drawable_points.filter(d => d.y == null);
      if (null_points.length) {
        const dynamic_x_by = get_dynamic_x_by(state.drawable_points);
        drawSpace = Math.max(0, x(null_points[0].x - dynamic_x_by)); // Uses dynamic x_by
      }
    }

    const draw_region = g.selectAll("rect.draw_region").data([null]);

    draw_region.enter()
      .append("rect")
      .attr("class", "draw_region")
      .merge(draw_region)
      .attr("x", drawSpace)
      .attr("width", Math.max(0, w - drawSpace))
      .attr("y", 0)
      .attr("height", h)
      .style("fill", "rgba(255,255,0,.8)")
      .style("fill-opacity", 0.4)
      overlay.raise(); // Key line, prevents overlay from sitting on bottom
  }

// Interaction ------------------------------
  function attach_drag(state) {

  const overlay = state.plot.overlay;

  // Clear any previous drag listeners
  overlay.on(".drag", null);

  overlay.call(
    d3.drag()
      .on("start drag", function (event) {

        const [mx, my] = d3.pointer(event, state.plot.g.node());
        const drag_x = state.plot.x.invert(mx);
        const drag_y = state.plot.y.invert(my);

        fill_in_closest_point(state, drag_x, drag_y);
        draw_user_line(state);
        draw_rectangle(state);
      })
      .on("end", function () {
        on_end(state);
      })
  );
}

  // "on end" behavior, basically whether we send to Shiny
  function on_end(state) {
    const line_status = get_user_line_status(state);

    if (line_status !== "done") return;
    if (state._sent_done) return;
    state._sent_done = true;

    // Render delayed layers dynamically
    // After the user finishes drawing, show any layers that were supposed to appear at the end
    if (state.delayed_layers) {
      // Go through each layer that was saved earlier (refer to multiLayer.js)
      state.delayed_layers.forEach(layer => {
        const rendererName = "render" + capitalize(layer.geom_type) + "Layer";

        // Look up that function on the global window object
        const renderer = window[rendererName];

        // If the function exists, call it to draw the layer
        if (typeof renderer === "function") {
          renderer(state.plot.svg, state.plot, layer);
        }
      });
      // Clear the list so we don’t render them again
      state.delayed_layers = [];
    }

    if (state.shiny_message_loc) {
      if (typeof Shiny !== "undefined") {
        setTimeout(() => {
          Shiny.setInputValue(
            state.shiny_message_loc,
            {
              x: state.drawable_points.map(d => d.x),
              y: state.drawable_points.map(d => d.y)
            },
            { priority: "event" }
            );

          alert("Sending message to " + state.shiny_message_loc); // Send an alert to where it's being sent
          // Maybe not necessary? Good for testing
        }, 50);  // short delay so delayed layers can render
      }
    }
  }

  function start(state) {
    state._sent_done = false;
    state.drawable_points = setup_drawable_points(state);
    draw_user_line(state);
    draw_rectangle(state);
    attach_drag(state);
  }

  // Entry point called by youdrawitR to enable drawing on an existing plot
  window.youdrawitAttachDrawit = function(svg, width, height, data, options) {
    // "Is there actually a graph here?"
    const plot = svg.node().__plot__;
    if (!plot) return;

    const state = ensureState(svg);

    state.plot = plot;
    state.line_data = rowsFrom(data); // Adjusted because of the gapping issue
    options = options || {};
    state.free_draw = !!options.free_draw;
    state.pin_start = !!options.pin_start;
    state.draw_start = options.draw_start != null
      ? +options.draw_start
      : plot.x.domain()[0];
    state.x_by = options.x_by != null ? +options.x_by : 1;

    state.drawn_line_color =
      options.drawn_line_color ||
      options.data_line_color ||
      "steelblue";
    // “If options.shiny_message_loc exists, store it in state.shiny_message_loc. Otherwise, store null”
    state.shiny_message_loc = options.shiny_message_loc || null;

    // This actually starts it
    start(state);
  };
})();
