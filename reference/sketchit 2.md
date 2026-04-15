# Free-form drawing on ggplot2 visualizations using D3

The sketchit function enables flexible, free-form drawing on a ggplot2
visualization. Unlike
[`drawit()`](https://alisa-krasilnikov.github.io/youdrawitR/reference/drawit%202.html),
which restricts users to a single continuous line,
[`sketchit()`](https://alisa-krasilnikov.github.io/youdrawitR/reference/sketchit%202.html)
allows multiple lines, color selection, and greater control over drawing
behavior. This makes it suitable for exploratory tasks, annotation, or
situations where users may wish to sketch multiple patterns or highlight
different features of the data.

## Usage

``` r
sketchit(
  p,
  ...,
  width = NULL,
  height = NULL,
  shiny_message_loc = NULL,
  color_options = TRUE,
  starting_color = NULL,
  palette = NULL,
  stroke_width = 2,
  button_position = c(1, 1),
  max_lines = NULL,
  min_lines = NULL
)
```

## Arguments

- p:

  A `ggplot2` object.

- ...:

  Additional arguments passed

- width:

  Width of the output widget in **pixels**.

- height:

  Height of the output widget in **pixels**.

- shiny_message_loc:

  Name of the Shiny input/output binding used for messaging.

- color_options:

  If `TRUE`, enables multiple drawing colors.

- starting_color:

  Initial drawing color.

- palette:

  Set of colors available for drawing as a character vector.

- stroke_width:

  Width of the drawn lines.

- button_position:

  Position of the control interface within the plot. Note that this is a
  numeric vector of length 2, with acceptable values from 0 to 1. c(1,1)
  is the top right of the graph, and c(0,0) is the bottom left.

- max_lines:

  Maximum number of lines the user can draw.

- min_lines:

  Minimum number of lines required before the user can click "Done".

## Value

An `r2d3` htmlwidget.

## Details

Currently, sketchit can support `geom_scatter`, `geom_line`, and
`geom_smooth`.

When `color_options` = `TRUE`, the default color pallete is "steelblue",
"orange", "green", "red".

If `starting_color` is updated, the `starting_color` value will be added
to the pallete, assuming it has not been turned off.

If `palette` is updated, the `starting_color` will be the first color
within the palette.

## Shiny Integration

When used within a `shiny` application, the widget returns the recorded
drawing data as a structured object once the user clicks the "Done"
button. The recorded user data includes:

- `x` and `y`: The coordinates of each point along a drawn line

- `color`: The color used to draw the line

- `line_id`: An identifier distinguishing separate lines

- `order`: The chronological order in which lines were created

The `line_id` variable groups observations belonging to the same drawn
line, while `order` reflects the historical sequence of drawing actions.
Importantly, `order` is not reset when lines are removed.

For example, if a user draws a blue line, then a red line, removes the
red line, and finally draws a green line, the resulting identifiers may
be:

- Blue line: `line_id = 1`, `order = 0`

- Green line: `line_id = 2`, `order = 2`

This behavior preserves the full interaction history and allows
downstream reconstruction or analysis of user actions.

## Examples

``` r
if (FALSE) { # \dontrun{
# Basic usage
p <- ggplot(mtcars, aes(x = wt, y = mpg)) +
  geom_point()

sketchit(p)

# Custom colors and multiple lines
sketchit(
  p,
  color_options = TRUE,
  palette = c("red", "blue", "green"),
  max_lines = 3
)

# Pipe-friendly usage
(ggplot(mtcars, aes(x = wt, y = mpg)) +
  geom_point()) |>
 sketchit(palette = c("red", "blue", "green"),
          max_lines = 3)
} # }
```
