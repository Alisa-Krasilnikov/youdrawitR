# Examples: drawit()

``` r
library(youdrawitR)
```

## Introduction

[`drawit()`](https://alisa-krasilnikov.github.io/youdrawitR/reference/drawit.md)
is designed to mimic the New York Times “You Draw It” tool, where
viewers are shown part of a graph and asked to predict the trend before
the full data is revealed. Earlier versions of the `youdrawitR` package
required users to work with JavaScript and D3. This version only
requires familiarity with ggplot2.

In this vignette, we will demonstrate the
[`drawit()`](https://alisa-krasilnikov.github.io/youdrawitR/reference/drawit.md)
tool under a variety of circumstances, using both real and simulated
data. Although this package was originally created for graphical
testing, it can be used more broadly in any setting where users want to
sketch or draw on a graph.

### How to Use `drawit()`

- First, create a `ggplot2` object using any combination of up to two of
  the following geoms:
  - geom_point
  - geom_smooth
  - geom_line
- Then, pass that plot into
  [`drawit()`](https://alisa-krasilnikov.github.io/youdrawitR/reference/drawit.md),
  either with a pipeline or by saving it as an object first
- The output will display a graph with a yellow box. Click inside the
  box and move from left to right to draw your prediction. As you move,
  a line will appear. The yellow box indicates the section of the graph
  that still needs to be completed, so make sure to draw across the full
  highlighted region.

## Examples

### Data Connection and Drawing Behavior

[`drawit()`](https://alisa-krasilnikov.github.io/youdrawitR/reference/drawit.md)
tries to match each x-value in the original data. This is especially
helpful if you want to collect the user-drawn values and merge them back
with the plotted data, as it could be potentially useful to measure the
distance from each original x-point to the user-drawn y-point. However,
in some situations it may be useful to loosen this x-y connection.

Let’s see it used with `mtcars`.

``` r
(ggplot(data = mtcars, aes(x = wt, y = mpg)) +
  geom_point()) |> 
  drawit()
```

The smoothness or chunkiness of the drawn path depends on how densely
packed the data are. Compare the `mtcars` example to the
`palmerpenguins` dataset.

``` r
penguins_adelie <- dplyr::filter(penguins, species == "Adelie")

(ggplot(data = penguins_adelie, aes(x = bill_length_mm, y = bill_depth_mm)) +
  geom_point()) |> 
  drawit()
```

In this example, the drawn path is much more jittery and requires more
precision in the mouse movement to connect smoothly. Moving your mouse
slowly across the plot often helps the function capture the movement
more accurately. If jitteriness becomes a problem, consider reducing the
density of the data or increasing the rendered height and width of the
plot.

Another option is to use the `smoother` parameter, which often makes the
interaction easier to control.

``` r
(ggplot(data = penguins_adelie, aes(x = bill_length_mm, y = bill_depth_mm)) +
  geom_point()) |> 
  drawit(smoother = 0.5)
```

Notice that the drawn line becomes smoother when the `smoother` value
increases from 0. This happens because nearby x-values are more likely
to be grouped together, which reduces small, jittery movements in the
drawing. While this can make the interaction feel easier and more
controlled, it may also reduce precision when recording user data, as
the resulting x-values will no longer align as closely with the original
data.

Alternatively, if you’d prefer more intermediate points, you could
decrease the `interpolator` value. This value acts as the minimum
spacing between points. whenever gaps are larger than this value,
additional interpolated points are inserted. This can often make the
drawing much smoother, though it may add a large amount of superfluous
rows to the resulting user-interaction datasets.

``` r
(ggplot(data = mtcars, aes(x = wt, y = mpg)) +
  geom_point()) |> 
  drawit(interpolator = 0.05)
```

This setting can also produce a jittery result, similar to the penguins
example, because it creates many “pseudo-points” between the original
observations.

Choosing appropriate `smoother` and `interpolator` values depends on
your goal. If you need point-by-point comparisons, a lower value for the
`smoother` is more appropriate. If you are more interested in the
overall trend, or want to make the drawing experience less sensitive to
small mouse movements, a higher value can be helpful. The `interpolator`
affects how many intermediate points are inserted between observed
values, which can improve visual continuity but may also increase the
size of the captured dataset.

If you need more flexibility, check out
[`sketchit()`](https://alisa-krasilnikov.github.io/youdrawitR/reference/sketchit.md).
That function is more freeform and can be especially useful when the
data are dense.

#### `ggplot2` Connection

While
[`drawit()`](https://alisa-krasilnikov.github.io/youdrawitR/reference/drawit.md)
is not a perfect replica of `ggplot2`, it does preserve much of the
styling information from the `ggplot` object you pass into it.

``` r
(ggplot(data = mtcars, aes(x = wt, y = mpg)) +
    geom_line(linewidth = 2, color = "red") +
    labs(title = "Drawit Cars Example",
         subtitle = "Hope You Enjoy!",
         x = "Weight",
         y = "Miles Per Gallon") +
   scale_y_continuous(limits = c(0, 32))+
   scale_x_continuous(limits = c(1.5, 7))
 ) |> 
  drawit(smoother = 0.2)
```

In the example above, the line color, line width, labels, and axis
limits are all reflected in the interactive version. However, when you
render your ggplot, some features may not appear exactly as expected.
`youdrawitR` is still a work in progress, so certain plot elements may
not yet be fully supported or may render differently from the original
`ggplot2` object.

### Drawing Boundaries and Reveals

[`drawit()`](https://alisa-krasilnikov.github.io/youdrawitR/reference/drawit.md)
is especially useful with simulated data and forecasting-style tasks,
since it was originally designed for graphical testing. The function
includes several arguments that let you control which parts of a plot
are shown to the user, where drawing begins, and what is revealed after
the interaction is complete.

``` r
# Here is the simulated data we will be using
data = tibble(x = seq(1, 25, .5), 
              y = exp((x-15)/30),
              ypoints = exp(((x-15)/30) + rnorm(30, 0, 0.1)))
#> Warning in ((x - 15)/30) + rnorm(30, 0, 0.1): longer object length is not a
#> multiple of shorter object length
```

Often, it is helpful to ask users to continue the trend beyond the
observed data. You can control where the drawing region begins with the
`draw_start` argument in
[`drawit()`](https://alisa-krasilnikov.github.io/youdrawitR/reference/drawit.md).

``` r
(ggplot(data, aes(x, ypoints)) +
  geom_point(data = data |>  mutate(ypoints2 = ifelse(x < 10, ypoints, NA)),
             aes(y = ypoints2),
             size = 2, 
             colour = "magenta"
             ) +
  scale_y_continuous(limits = c(0.5, 1.5)) +
  labs(x = "X-Label", y = "Y-Label")) |>
  drawit(draw_start = 10)
```

[`drawit()`](https://alisa-krasilnikov.github.io/youdrawitR/reference/drawit.md)
supports up to two geoms at a time. For example, you can include the
true line up to the starting point so the user has a guide before
continuing the pattern.

``` r
(ggplot(data, aes(x, ypoints)) +
  geom_point(data = data |>  mutate(ypoints2 = ifelse(x < 10, ypoints, NA)),
             aes(y = ypoints2),
             size = 2, 
             colour = "magenta"
             ) +
   geom_line(data = data |>  mutate(y = ifelse(x < 10, y, NA)),
            aes(y = y)) +
  scale_y_continuous(limits = c(0.5, 1.5)) +
  labs(x = "X-Label", y = "Y-Label")) |>
  drawit(draw_start = 10)
```

Alternatively, you can reveal the full line after the user finishes
drawing by using the `show_on_finish` argument. If `show_on_finish` is
set to `TRUE`,
[`drawit()`](https://alisa-krasilnikov.github.io/youdrawitR/reference/drawit.md)
will use the secondary plot as the “revealed” plot.

``` r
(ggplot(data, aes(x, ypoints)) +
  geom_point(data = data |>  mutate(ypoints2 = ifelse(x < 10, ypoints, NA)),
             aes(y = ypoints2),
             size = 2, 
             colour = "magenta"
             ) +
   geom_line(data = data,
            aes(y = y)) +
  scale_y_continuous(limits = c(0.5, 1.5)) +
  labs(x = "X-Label", y = "Y-Label")) |>
  drawit(draw_start = 10, show_on_finish = TRUE)
```

### Shiny Integration

The
[`drawit()`](https://alisa-krasilnikov.github.io/youdrawitR/reference/drawit.md)
function integrates directly with `Shiny`, enabling interactive drawing
inputs to be captured and reused within reactive workflows. When used
inside a `Shiny` application,
[`drawit()`](https://alisa-krasilnikov.github.io/youdrawitR/reference/drawit.md)
behaves differently than in static contexts. Instead of returning only
an `r2d3` widget, it returns a list, which contains:

- `youdrawit_plot`: the interactive drawing widget
- `points`: a reactive tibble containing the user’s drawn data

The `points` object is a
[`reactive()`](https://rdrr.io/pkg/shiny/man/reactive.html) expression
that resolves to a `tibble` with:

- `x`: x-values corresponding to the draw space
- `y`: corresponding user-drawn values

To enable communication between the browser and the `Shiny` server, you
must supply the `shiny_message_loc` argument when using
[`drawit()`](https://alisa-krasilnikov.github.io/youdrawitR/reference/drawit.md)
in `Shiny`. This argument defines the input name used to send drawn data
from the browser back to `Shiny`. The drawing interaction itself is
handled in `JavaScript`, while `Shiny` runs in `R` on the server, so
`shiny_message_loc` acts as the bridge between the two.

#### Example:

The following example demonstrates a minimal `Shiny` app that captures
user-drawn points and returns them as a tibble

``` r
library(shiny)

# Define the User Interface (ui)
ui <- fluidPage(
  # Placeholder for the interactive drawit widget
  uiOutput("widget_ui")
)

# Define the Server Logic
server <- function(input, output, session) {
  # Create a ggplot object as the base plot for drawing
  p <- ggplot(data = penguins, aes(x = bill_length_mm, y = bill_depth_mm)) +
    geom_point(size = 2)
  
  # This is the "bridge" between JavaScript (browser) and Shiny (R server)
  shiny_message_loc <- "scatter_points"
  
  # Initialize drawit
   res <- drawit(
    p, # the ggplot object
    smoother = 2,
    shiny_message_loc = shiny_message_loc
    )
  # res contains:
    # - youdrawit_plot: the interactive plot
    # - points(): a reactive object containing the user-drawn points as a tibble
   
  # Render the widget in the UI placeholder
  output$widget_ui <- renderUI({
    res$youdrawit_plot
  })
  
  # observeEvent() watches res$points(), the reactive object
  # Once the user completes their drawing, res$points() is populated
  observeEvent(res$points(), {
    # Because points is reactive, call res$points() inside reactive code
    stopApp(res$points())  # stops the app and outputs the tibble of points
  })
}


# runApp() launches the app and returns the user-drawn points once complete
points <- runApp(shinyApp(ui, server))
```

After the user finishes drawing (when the yellow box has been completely
filled in), `res$points()` returns a tibble with one row for each
x-value in the drawable region. It might look something like this:

``` r
# A tibble: 4 x 2
      x     y
  <dbl> <dbl>
1  10.0  15.2
2  10.5  15.4
3  11.0  15.8
4  11.5  16.1
```

The exact number of rows will depend on the x-values in the original
plot and the user’s drawing. The resulting x and y values will be on a
similar scale to the original dataset, allowing for easy merges and
comparisons.
