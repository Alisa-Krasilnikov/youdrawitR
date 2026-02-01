(function () {
  // Make sure the data is row oriented
  // Return an empty array if not
  function rowsFrom(input) {
    return Array.isArray(input) ? input : [];
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

  // Uses Dillon's code to simplify the data
  function simplify_data({line_data, x_range, threshold_percentage}) {
    // simplify the drawable_points by binning the points based on a certain threshold_percentage
    // only allow 3 points per bin (when too many points in a cluster drawing line takes a while and
    // if a large cluster can sometime be impossible to draw)
    const bin_size = x_range * threshold_percentage;
    const simplified_points = [];
    let current_bin = [];

    for (let i = 0; i < line_data.length; i++) {
      current_bin.push(line_data[i]);


      const next_x = line_data[i + 1]?.x;
      if (!next_x || next_x - current_bin[0].x > bin_size) {

        // if there are more than 3 points in bin add the first, middle, and last point to drawable_points
        if (current_bin.length > 3) {
          simplified_points.push(
            current_bin[0],
            current_bin[Math.floor(current_bin.length / 2)],
            current_bin[current_bin.length - 1]
            // else add all points in current bin to drawable_points
          );
        } else {
          simplified_points.push(...current_bin);
        }
        // reset current bin to empty
        current_bin = [];
      }
    }
    return simplified_points;
  }

  // Also Dillon's code, used to prevent "jumping" between gaps
  // Could be replaced by a dense grid? (no, needed for the data to input connection)
  function interpolate_x({x_range, threshold_size, simplified_points}) {
    // Set threshold distance as % of the x-range
    const threshold_distance = x_range * threshold_size; // Might benefit from being user-adj
    // interpolate x value (adds drawble_points between extreme x values so the line does not jump)
    const drawable_points = [];


    for (let i = 0; i < simplified_points.length; i++) {
      const d = simplified_points[i];
      drawable_points.push(d);

      // If there is another point after this one and their X-distance is larger than
      // the threshold value then we need to add interpolated points between them.
      if (i + 1 < simplified_points.length) {
        const next = simplified_points[i + 1];
        if (Math.abs(next.x - d.x) > threshold_distance) { // Smaller threshold_distance means more interpolated points
          const interpolated_x = d3.range(d.x + threshold_distance, next.x, threshold_distance);

          interpolated_x.forEach(x => drawable_points.push({x, y: null}));
        }
      }
    }
    // remove repeated x values from drawable_points
    return drawable_points;

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

  // create a spacing threshold that adjusts to average gaps in data
  // Maybe not necessary? (I think it's good as default, could use stuff from user)
  function get_dynamic_threshold(drawable_points, fraction = 0.1) {
    if(drawable_points.length < 2) return 0.01; // fallback for tiny datasets
    const diffs = [];

    for(let i=1; i<drawable_points.length; i++){
      diffs.push(drawable_points[i].x - drawable_points[i-1].x);
    }
    diffs.sort((a,b)=>a-b);

    const mid = Math.floor(diffs.length/2);
    const median_diff = diffs.length % 2 === 0 ? (diffs[mid-1] + diffs[mid])/2 : diffs[mid];
    return median_diff * fraction;  // scale fraction of median spacing
    }

  // This has been redone based on Dillon's adjustments (prevent gapping)
  function setup_drawable_points(state) {
    let line_data = state.line_data ? [...state.line_data] : [];
    const free_draw = state.free_draw;
    const draw_start = state.draw_start;
    const x_range = state.x_range;


    if (!line_data.length) return [];

    // Add endpoints if outside x_range
    if (x_range && x_range[0] < line_data[0].x) line_data.unshift({ x: x_range[0], y: null });
    if (x_range && x_range[1] > line_data[line_data.length - 1].x) line_data.push({ x: x_range[1], y: null });

    // Get range of x values from first and last point
    const total_x_range = line_data[line_data.length - 1].x - line_data[0].x || 1;

    let simplified = simplify_data({ line_data, x_range: total_x_range, threshold_percentage: 0.05 });
    let drawable_points = interpolate_x({ x_range: total_x_range, threshold_size: 0.05, simplified_points: simplified });


    // Ensure all original xs are included (Needed for data to input connection)
    const all_x = line_data.map(d => d.x);
    all_x.forEach(xVal => {
      if (!drawable_points.some(d => d.x === xVal)) {
        drawable_points.push({ x: xVal, y: null });
        }
    });

    // Remove repeated x values
    //const threshold = get_dynamic_threshold(drawable_points, 0.1);
    //drawable_points = drawable_points.filter((d, i, arr) => i === 0 || Math.abs(d.x - arr[i - 1].x) > threshold);

    drawable_points.sort((a, b) => a.x - b.x);

    if (free_draw) {
      return drawable_points.map(d => ({ x: d.x, y: null }));

    } else {
      return drawable_points.map((d, i) => ({ x: d.x, y: i === 0 ? d.y : null }));

    }
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
    // Rewritten for simplicity
    state.plot.overlay.call(
      d3.drag()
        .on("drag", function (event) {
          const [mx, my] = d3.pointer(event, state.plot.g.node());
          const drag_x = state.plot.x.invert(mx);
          const drag_y = state.plot.y.invert(my);

          fill_in_closest_point(state, drag_x, drag_y);
          draw_user_line(state);
          draw_rectangle(state);
        })
        .on("end", function () { on_end(state); })
    );
  }

  // "on end" behavior, basically whether we send to Shiny
  function on_end(state) {
    const line_status = get_user_line_status(state);

    if (line_status !== "done") return;
    if (state._sent_done) return;
    state._sent_done = true;

    if (state.shiny_message_loc) {
      if (typeof Shiny !== "undefined") {
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
