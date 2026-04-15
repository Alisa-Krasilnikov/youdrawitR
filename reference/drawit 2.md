# Interactive drawing on `ggplot2` visualizations using D3

The drawit function allows the user to draw a single, continuous,
one-to-one line. This is particularly useful for tasks in which the user
is expected to estimate trends or sketch expected relationships in the
data.

## Usage

``` r
drawit(
  p,
  ...,
  width = NULL,
  height = NULL,
  shiny_message_loc = NULL,
  show_on_finish = FALSE,
  draw_start = NULL,
  smoother = 0.001,
  interpolator = NULL
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

- show_on_finish:

  If `TRUE`, displays a secondary geom after the user finishes drawing.
  Note that this will always be the second geom layer within your
  `ggplot2` object.

- draw_start:

  Specifies where drawing interaction begins, on the scale of your data.

- smoother:

  A number greater than 0 that controls how much nearby x-values are
  binned together. Larger values group more points, creating a smoother
  but less detailed drawing (useful for dense data). Values closer to 0
  keep points more separate, preserving detail (useful when the exact
  x-y relationship matters)

- interpolator:

  A number greater than 0 that controls how may "in between" x-values
  are added to gaps between data. Values closer to zero indicate that
  the function is looking for smaller gaps, thus filling in more points.
  Higher values avoid adding interpolated points, making the drawing
  "chunkier."

## Value

An `r2d3` htmlwidget.

## Details

For more flexible, free-form drawing, see
[`sketchit()`](https://alisa-krasilnikov.github.io/youdrawitR/reference/sketchit%202.html).

Currently, drawit can support `geom_scatter`, `geom_line`, and
`geom_smooth`, with a maximum of two geoms per plot.

A highlighted region indicates where drawing is permitted. Users draw
from left to right, and the interface provides visual feedback when
portions of the data range have not yet been covered.

The drawing resolution is tied to the x-values in the data. As a result,
extending the x-axis far beyond the observed data without adjusting
`draw_start` may lead to an overly granular drawing experience

## Shiny Integration

When used within a `shiny` application, the widget returns the recorded
drawing data as a structured object once the user has filled the
drawable region. Each x-value in the original data is paired with a
corresponding user-drawn y-value.

The returned data includes:

- `x`: The x-values drawn by the user, preserving the original data as
  much as possible

- `y`: The user-drawn y-values corresponding to each x

Because
[`drawit()`](https://alisa-krasilnikov.github.io/youdrawitR/reference/drawit%202.html)
enforces a single continuous line, the output represents a fully
specified function over the domain of the data.

## Examples

``` r
if (FALSE) { # \dontrun{
# Basic usage
p <- ggplot(mtcars, aes(x = wt, y = mpg)) +
  geom_point(size = 2, colour = "magenta") +
  labs(x = "Weight", y = "MPG")

drawit(p)

# Pipe-friendly usage
(ggplot(mtcars, aes(x = wt, y = mpg)) +
  geom_point(size = 2, colour = "magenta") +
  labs(x = "Weight", y = "MPG")) |>
  drawit()
} # }
```
