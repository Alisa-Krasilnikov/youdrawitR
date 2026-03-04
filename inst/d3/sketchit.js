(function() {
  // This uses push and pop a lot:
    // push: adds something to the end of an array
    // pop: removes something from the end of an array
    // (Not really a need to do anything in the middle)

  // Attach sketchit state to the SVG DOM node
  function ensureState(svg) {
    const root = svg.node();
    root.__sketchit__ = root.__sketchit__ || {};
    return root.__sketchit__;
  }

  // Sketchit calls window first instead of at the end, and includes the functions inside
    // This helps keep each sketch separate
    // The helpers like undo can access the current sketch to know what to do
  window.youdrawitAttachSketchit = function(svg, width, height, data, options = {}) {
    // "Is there actually a graph here?"
    const plot = svg.node().__plot__;
    if (!plot) return;

    const state = ensureState(svg);

    state.plot = plot;

    const { overlay, g, x: xScale, y: yScale } = plot;

    state.paths = [];
    state.currentPath = null;
    state.currentData = [];
    state.isDrawing = true;  // initially allow drawing
    state.isDone = false;    // flag for "Done"
    state.strokeWidth = options.stroke_width || 2;
    // These are for the Shiny implementation
    state.completedLines = [];
    state.drawOrderCounter = 0;
    state.shiny_message_loc = options.shiny_message_loc;


    // This is the actual drawing function
    function startNewLine(color) {
      if (state.isDone) return;  // prevent drawing if done
      state.currentColor = color || state.currentColor;
      state.currentData = [];
      state.currentPath = g.append("path")
        .attr("fill", "none")
        .attr("stroke", state.currentColor)
        .attr("stroke-width", state.strokeWidth)
        .attr("stroke-linecap", "round")
        .attr("stroke-linejoin", "round"); // Make ends of lines round
      state.paths.push(state.currentPath);
    }

    // Undo function, used with undo button
    function undoLastLine() {
      if (state.isDone) return; // prevent undoing if done
      if (state.paths.length === 0) return; // if there's nothing to undo...

      // Undo the last line (if there is something to undo)
      const last = state.paths.pop();
      last.remove();

      // remove the undid lines from shiny data
      state.completedLines.pop();
      if (state.drawOrderCounter > 0) { // don't let the counter fall below 0
        state.drawOrderCounter--;
      }
    }

    // Done function, used with done button (see drag behavior also)
    function doneDrawing() {
      state.isDone = true; // send on done

      // This is done a little different from drawit since there's no need for a drawable_points thing
      if (state.shiny_message_loc && typeof Shiny !== "undefined") {
        setTimeout(() => {
          const x = [];
          const y = [];
          const color = [];
          // Order is historical time sequence
            // Ex. draw blue line, draw red, undo red, draw green
              // blue has line_id = 1, order = 0
              // green has line_id = 2, order = 2
          const order = []; // probably not necessary? Might be useful to include
          const line_id = [];

        // iterate through the lines
        state.completedLines.forEach((line, i) => {
          for (let j = 0; j < line.x.length; j++) {
            x.push(line.x[j]);
            y.push(line.y[j]);
            color.push(line.color);
            order.push(line.order);
            line_id.push(i + 1); // just simple line numbering, see above
          }
        });

        // This is already in data scale
        Shiny.setInputValue(
          state.shiny_message_loc,
          {
            x: x,
            y: y,
            color: color,
            order: order,
            line_id: line_id

          },
          { priority: "event" }
          );
          alert("Sending message to " + state.shiny_message_loc);
        });

      }
    }

    // Reset function, used with reset button
    function resetDrawing() {
      if (state.isDone) return; // prevent resetting if done
      state.paths.forEach(p => p.remove()); // get rid of everything
      state.paths = [];
      state.currentData = [];
      state.currentPath = null;
      state.isDrawing = false;

      // for Shiny functionality, eliminate all line data
      state.completedLines = [];
      state.drawOrderCounter = 0;
    }

    // Buttons --------------------------------------------
    if (!state.buttonGroup) {
      const margin = 10; // spacing from top/right
      const buttonGroup = svg.append("g").attr("class", "sketchit-buttons");

      // Undo button -------
      const undoButton = buttonGroup.append("g")
        .attr("transform", `translate(${width - 70}, ${margin})`)
        .style("cursor", "pointer")
        .on("click", undoLastLine);

      undoButton.append("rect")
        .attr("width", 60)
        .attr("height", 25)
        .attr("rx", 5)
        .attr("ry", 5)
        .style("fill", "#ECECEC")
        .style("stroke", "black")
        .style("stroke-width", 2);

      undoButton.append("text")
        .attr("x", 30)
        .attr("y", 15)
        .attr("text-anchor", "middle")
        .attr("alignment-baseline", "middle")
        .attr("font-size", 14)
        .text("Undo");

      // Reset button -------
      const resetButton = buttonGroup.append("g")
        .attr("transform", `translate(${width - 70}, ${margin + 35})`)
        .style("cursor", "pointer")
        .on("click", resetDrawing);

      resetButton.append("rect")
        .attr("width", 60)
        .attr("height", 25)
        .attr("rx", 5)
        .attr("ry", 5)
        .style("fill", "#ECECEC")
        .style("stroke", "black")
        .style("stroke-width", 2);

      resetButton.append("text")
        .attr("x", 30)
        .attr("y", 15)
        .attr("text-anchor", "middle")
        .attr("alignment-baseline", "middle")
        .attr("font-size", 14)
        .text("Reset");

      // Done button -------
      const doneButton = buttonGroup.append("g")
        .attr("transform", `translate(${width - 70}, ${margin + 70})`)
        .style("cursor", "pointer")
        .on("click", () => {
          doneDrawing();
          // make the Done button red on click
          doneButton.select("rect").style("fill", "red");
        });

      doneButton.append("rect")
        .attr("width", 60)
        .attr("height", 25)
        .attr("rx", 5)
        .attr("ry", 5)
        .style("fill", "#ECECEC")
        .style("stroke", "black")
        .style("stroke-width", 2);

      doneButton.append("text")
        .attr("x", 30)
        .attr("y", 15)
        .attr("text-anchor", "middle")
        .attr("alignment-baseline", "middle")
        .attr("font-size", 14)
        .text("Done");

      // Color palette buttons -------
      if (options.color_options) {

        let palette = (options.palette && options.palette.length > 0)
        ? [...options.palette] // start with user-given palette
        : ["steelblue", "orange", "green", "red", "purple"]; // switch to default if needed

        // Add starting_color if given, or take the first from palette
        const starting = options.starting_color ?? palette[0];

        // Add the starting color to the pallet if it's not there yet
        if (!palette.includes(starting)) {
          palette.unshift(starting); // "add to start of array"
          }

        // Ensure only unique colors
        palette = Array.from(new Set(palette)); // This is just a js trick I found. It's essentially just unique()

        // Set drawing color
        state.currentColor = starting;

        // Layout variables
        const squareSize = 12;
        const spacing = 2;   // space between squares
        const colorsPerRow = 5;

        // Figure out how many rows and columns we need for our color squares to prevent crowding
        palette.forEach((c, i) => {
          const col = i % colorsPerRow;
          const row = Math.floor(i / colorsPerRow);

          buttonGroup.append("rect")
            .attr("class", "color-button")
            .attr("x", width - 70 + col * (squareSize + spacing))
            .attr("y", margin + 105 + row * (squareSize + spacing))
            .attr("width", squareSize)
            .attr("height", squareSize)
            .style("fill", c)
            .style("stroke", "#666")
            .style("stroke-width", c === state.currentColor ? 2 : 1) // bold first color button to indicate selection
            .style("cursor", "pointer")
            .on("click", function() {
              state.currentColor = c; // set color based on click of color button

              state.buttonGroup.selectAll(".color-button")
                .style("stroke-width", 1); // reset

              d3.select(this)
                .style("stroke-width", 2); // bold clicked
            });

        });
      }
      // Starting color if no color option palette
      else {
        state.currentColor = options.starting_color ?? "steelblue";
      }

      state.buttonGroup = buttonGroup; // I don't remember why I have this
    }

    // On drag functionality
    overlay.on(".drag", null);

    overlay.call(
      d3.drag()
        .on("start", function(event) {
          if (state.isDone) return;
          startNewLine(); // always start a new line on drag
          const [mx, my] = d3.pointer(event, g.node());
          state.currentData.push({ x: xScale.invert(mx), y: yScale.invert(my) });
        })
        .on("drag", function(event) {
          if (state.isDone || !state.currentPath) return;
          const [mx, my] = d3.pointer(event, g.node());
          state.currentData.push({ x: xScale.invert(mx), y: yScale.invert(my) });

          const line = d3.line()
            .x(d => xScale(d.x))
            .y(d => yScale(d.y));

          state.currentPath.attr("d", line(state.currentData));
        })
        // This is the end functionality, see the done button functionality
        .on("end", function() {
          if (state.currentData.length > 0) {

            state.completedLines.push({
              order: state.drawOrderCounter++,
              color: state.currentColor,
              x: state.currentData.map(d => d.x),
              y: state.currentData.map(d => d.y)
            });
          }

          state.currentPath = null;
          state.currentData = [];

        })
        );
  };
})();
