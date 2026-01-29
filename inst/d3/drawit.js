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

  // This sets up what part of the actual plot we can draw in. expects array
  function setup_drawable_points({ data, free_draw }) {
    if (free_draw) {
      return data.map(d => ({ x: d.x, y: null }));
    } else {
      return data.map((d, i) => ({
        x: d.x,
        y: i === 0 ? d.y : null
      }));
    }
  }

  function fill_in_closest_point({ drawable_points, pin_start, free_draw }, drag_x, drag_y) {
    let last_dist = Infinity;
    let closest_index = drawable_points.length - 1;
    const starting_index = free_draw ? 0 : (pin_start ? 1 : 0);

    for (let i = starting_index; i < drawable_points.length; i++) {
      const current_dist = Math.abs(drawable_points[i].x - drag_x);
      if (last_dist - current_dist < 0) {
        closest_index = i - 1;
        break;
      }
      last_dist = current_dist;
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

    const user_line = g.selectAll("path.user_line")
      .data(status === "unstarted" ? [] : [state.drawable_points]);

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

    let drawSpace;

    if (status === "unstarted") {
      drawSpace = state.free_draw ? 0 : x(state.draw_start); // free draw conditional rewritten
    } else if (status === "done") {
      drawSpace = w + 10000;

    } else {
      const df = state.drawable_points.filter(d => d.y === null); // rewritten for simplicity
      const minx = df[0].x - state.x_by;
      drawSpace = Math.max(0, x(minx)); // Don't change this, had to be updated (pain in ass)
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
    const { overlay, g, x, y } = state.plot;

    overlay.call(
      d3.drag()
        .on("drag", function (event) {
          const [mx, my] = d3.pointer(event, g.node());
          const drag_x = x.invert(mx);
          const drag_y = y.invert(my);

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
      } else {
        alert("Sending message to " + state.shiny_message_loc);
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
  window.youdrawitAttachDrawit = function (svg, width, height, data, options) {
    // "Is there actually a graph here?"
    const plot = svg.node().__plot__;
    if (!plot) return;

    const state = ensureState(svg);

    state.plot = plot;
    state.data = rowsFrom(data);

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
