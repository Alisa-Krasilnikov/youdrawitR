# Examples: sketchit()

``` r
library(youdrawitR)
```

## Introduction

[`sketchit()`](https://alisa-krasilnikov.github.io/youdrawitR/reference/sketchit%202.html)
is designed to give users a more freeform drawing experience. Unlike
[`drawit()`](https://alisa-krasilnikov.github.io/youdrawitR/reference/drawit%202.html),
it does not require a one-to-one match between the drawing and the
underlying data. Users can draw multiple lines, and the number of lines
can be controlled within the function.

In this vignette, we demonstrate
[`sketchit()`](https://alisa-krasilnikov.github.io/youdrawitR/reference/sketchit%202.html)
in a variety of settings and highlight several options for customizing
the user experience.

### How to Use `sketchit()`

- First, create a `ggplot2` object using any combination of the
  following geoms:
  - geom_point
  - geom_smooth
  - geom_line
- Then, pass that plot into
  [`sketchit()`](https://alisa-krasilnikov.github.io/youdrawitR/reference/sketchit%202.html),
  either with a pipeline or by saving it as an object first
- The output will display a graph with drawing controls. Click and drag
  inside the plot area to draw a line. Release your mouse to finish that
  line, then click again to begin a new one
  - The **Reset** button clears all drawings
  - The **Undo** button removes the most recently drawn line
  - The **Done** button locks the drawing so it can no longer be edited
  - The **color** buttons allow users to switch between drawing colors

## Examples

[`sketchit()`](https://alisa-krasilnikov.github.io/youdrawitR/reference/sketchit%202.html)
does not have the same data-matching requirements as
[`drawit()`](https://alisa-krasilnikov.github.io/youdrawitR/reference/drawit%202.html),
so it works well with a wide range of datasets.

Let’s start with a high-density dataset such as `palmerpenguins`.

``` r
(ggplot(data = penguins, aes(x = bill_length_mm, y = bill_depth_mm)) +
  geom_point()) |> 
  sketchit()
```

Now compare that to a lower-density dataset such as `mtcars`.

``` r
(ggplot(data = mtcars, aes(x = wt, y = mpg)) +
  geom_point()) |> 
  sketchit()
```

One advantage of
[`sketchit()`](https://alisa-krasilnikov.github.io/youdrawitR/reference/sketchit%202.html)
is that the drawing experience remains largely the same regardless of
how dense the original data are. In contrast to
[`drawit()`](https://alisa-krasilnikov.github.io/youdrawitR/reference/drawit%202.html),
the user is sketching freely rather than drawing a value for each
x-position. This also means that the output does not necessarily contain
a user-drawn y-value for every x-value in the data.

Like
[`drawit()`](https://alisa-krasilnikov.github.io/youdrawitR/reference/drawit%202.html),
[`sketchit()`](https://alisa-krasilnikov.github.io/youdrawitR/reference/sketchit%202.html)
is not a perfect replica of `ggplot2`. However, it does preserve much of
the styling information from the `ggplot` object passed into it.

``` r
(ggplot(data = penguins, aes(x = bill_length_mm, y = bill_depth_mm)) +
  geom_point(color = "forestgreen") +
   labs(title = "Sketchit Penguins Example",
         subtitle = "Hope You Enjoy!",
         x = "Bill Length (mm)",
         y = "Bill Depth (mm)")
    ) |> 
  sketchit()
```

### Aesthetic Customization

One of the strengths of
[`sketchit()`](https://alisa-krasilnikov.github.io/youdrawitR/reference/sketchit%202.html)
is that it allows for a variety of visual customizations that can change
the overall drawing experience.

#### Color Options

By default,
[`sketchit()`](https://alisa-krasilnikov.github.io/youdrawitR/reference/sketchit%202.html)
includes a palette of “steelblue”, “orange”, “green”, and “red”. You can
replace this palette by supplying your own values to the palette
argument.

Note that the first color in the palette will be used as the initial
drawing color.

``` r
(ggplot(data = mtcars, aes(x = wt, y = mpg)) +
    geom_line(size = 2) +
    labs(title = "Sketchit Cars Example",
         subtitle = "Hope You Enjoy!",
         x = "Weight",
         y = "Miles Per Gallon")
    ) |>
  sketchit(palette = c("red", 
                       "orange", 
                       "yellow", 
                       "green", 
                       "blue", 
                       "purple", 
                       "pink", 
                       "black"))
#> Warning: Using `size` aesthetic for lines was deprecated in ggplot2 3.4.0.
#> ℹ Please use `linewidth` instead.
#> This warning is displayed once per session.
#> Call `lifecycle::last_lifecycle_warnings()` to see where this warning was
#> generated.
```

You can also change the initial drawing color with the `starting_color`
argument. If that color is not already included in the `palette`, it
will be added automatically.

``` r
(ggplot(data = mtcars, aes(x = wt, y = mpg)) +
    geom_smooth(method = "loess") +
    labs(title = "Sketchit Cars Example",
         subtitle = "Hope You Enjoy!",
         x = "Weight",
         y = "Miles Per Gallon")
    ) |>
  sketchit(starting_color = "violet")
#> `geom_smooth()` using formula = 'y ~ x'
```

If you prefer users to draw with only one color, you can turn off the
color controls entirely with `color_options = FALSE`. This works
especially well in combination with `starting_color`.

``` r
(ggplot(data = penguins, aes(x = bill_length_mm, y = bill_depth_mm)) +
  geom_point(color = "forestgreen") +
   labs(title = "Sketchit Penguins Example",
         subtitle = "Hope You Enjoy!",
         x = "Bill Length (mm)",
         y = "Bill Depth (mm)")
    ) |> 
  sketchit(starting_color = "violet", color_options = FALSE)
```

### Multiple Geoms

Unlike
[`drawit()`](https://alisa-krasilnikov.github.io/youdrawitR/reference/drawit%202.html),
[`sketchit()`](https://alisa-krasilnikov.github.io/youdrawitR/reference/sketchit%202.html)
is not limited to two geoms. Any combination of the supported geoms can
be included in the same plot. However, all layers are displayed
immediately. There is currently no way to delay the rendering of
individual layers.

``` r
(ggplot(mtcars, aes(wt, mpg)) +
  geom_point(colour = "darkgreen") +
   geom_smooth(method = "lm", color = "blue") +
   geom_line(color = "orange")+
   ggtitle("This is a Title") +
  labs(title = "Sketchit Cars Example",
         subtitle = "Hope You Enjoy!",
         x = "Weight",
         y = "Miles Per Gallon")) |> 
  sketchit()
```

### Stroke Width

It is also possible to increase the width of the lines the user draws
with the `stroke_width` argument.

Changing the stroke width can noticeably affect the drawing experience.
Thicker lines can make sketches feel bolder and easier to see, while
thinner lines may feel more precise.

``` r
(ggplot(mtcars, aes(wt, mpg)) +
  geom_point(colour = "darkgreen") +
   geom_smooth(method = "lm", color = "blue") +
   ggtitle("This is a Title") +
  labs(title = "Sketchit Cars Example",
         subtitle = "Hope You Enjoy!",
         x = "Weight",
         y = "Miles Per Gallon")) |> 
  sketchit(stroke_width = 5)
#> `geom_smooth()` using formula = 'y ~ x'
```

### Layout Controls

In some cases, the drawing controls may overlap with the plotted data.
You can reposition the control buttons with the `button_position`
argument.

This argument accepts a numeric vector of length 2 with values between 0
and 1. The default is `c(1, 1)`, which places the buttons in the
top-right corner of the graph. By contrast,`c(0, 0)` places them in the
bottom-left corner.

For example, `c(0.5, 0.5)` places the controls in the center of the
plot.

``` r
(ggplot(mtcars, aes(wt, mpg)) +
  geom_point(colour = "darkgreen") +
   ggtitle("This is a Title") +
  labs(title = "Sketchit Cars Example",
         subtitle = "Hope You Enjoy!",
         x = "Weight",
         y = "Miles Per Gallon")) |> 
  sketchit(button_position = c(0.5, 0.5))
```

#### Controlling the Number of Lines

When using
[`sketchit()`](https://alisa-krasilnikov.github.io/youdrawitR/reference/sketchit%202.html)
for graphical testing or structured input tasks, it may be useful to
limit the number of lines a user can draw. In other cases, you may want
to require a minimum number of lines before the user is allowed to click
Done.

These behaviors can be controlled with the `max_lines` and `min_lines`
arguments.

``` r
(ggplot(mtcars, aes(wt, mpg)) +
  geom_point(colour = "darkgreen") +
   ggtitle("This is a Title") +
  labs(title = "Sketchit Cars Example",
         subtitle = "Hope You Enjoy!",
         x = "Weight",
         y = "Miles Per Gallon")) |> 
  sketchit(max_lines = 3, min_lines = 2)
```

In this example, the user must draw at least two lines before clicking
Done, and cannot draw more than three lines total.

This can be particularly useful in `Shiny` applications or testing
settings where the number of submitted sketches matters.

### Shiny Integration

The
[`sketchit()`](https://alisa-krasilnikov.github.io/youdrawitR/reference/sketchit%202.html)
function integrates directly with `Shiny`, enabling interactive drawing
inputs to be captured and reused within reactive workflows. When used
inside a `Shiny` application,
[`sketchit()`](https://alisa-krasilnikov.github.io/youdrawitR/reference/sketchit%202.html)
behaves differently than in static contexts. Instead of returning only
an `r2d3` widget, it returns a list, which contains:

- `youdrawit_plot`: the interactive drawing widget
- `points`: a reactive tibble containing the user’s drawn data

The `points` object is a
[`reactive()`](https://rdrr.io/pkg/shiny/man/reactive.html) expression
that resolves to a `tibble` with:

- `x`: user-drawn x-values
- `y`: user-drawn y-values
- `color`: the color of each user-drawn line
- `order`: The chronological order in which lines were created (not
  accounting for undoes)
- `line_id`: An identifier distinguishing separate lines

To enable communication between the browser and the `Shiny` server, you
must supply the `shiny_message_loc` argument when using
[`sketchit()`](https://alisa-krasilnikov.github.io/youdrawitR/reference/sketchit%202.html)
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
  
  # Initialize sketchit
   res <- sketchit(
    p, # the ggplot object
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

After the user finishes drawing (by clicking `Done`), `res$points()`
returns a tibble containing the recorded points from the user’s drawing.
Each row corresponds to one captured point, along with information about
which line it belongs to, the order in which it was drawn (including
undoes), and the selected color. It might look something like this:

``` r
# A tibble: 4 x 5
      x     y color   order line_id
  <dbl> <dbl> <chr>   <int>   <int>
1  10.0  15.2 steelblue   0       1
2  10.5  15.4 steelblue   0       1
3  11.0  15.8 red         4       2
4  11.5  16.1 red         4       2
```

The exact number of rows will depend on the user’s drawing. The
resulting x and y values will be on a similar scale to the original
dataset, allowing for easy merges and comparisons.
