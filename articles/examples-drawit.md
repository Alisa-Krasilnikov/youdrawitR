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

### Real Data Examples

Because `youdrawitR` builds on `ggplot2`, it works naturally with real
datasets. This makes it useful when you want users to estimate or
continue a trend they see between variables.

Note:
[`drawit()`](https://alisa-krasilnikov.github.io/youdrawitR/reference/drawit.md)works
best with smaller datasets because it tries to match each x-value in the
original data. This is especially helpful if you want to collect the
user-drawn values and merge them back with the plotted data. If you need
more flexibility, see
[`sketchit()`](https://alisa-krasilnikov.github.io/youdrawitR/reference/sketchit.md).

Let’s see it used with `mtcars`.

``` r
(ggplot(data = mtcars, aes(x = wt, y = mpg)) +
  geom_point()) |> 
  drawit()
```

The smoothness, or jitteriness, of the drawn path depends on how densely
packed the data are. Compare the `mtcars` example to the
`palmerpenguins` dataset.

``` r
penguins_adelie <- dplyr::filter(penguins, species == "Adelie")

(ggplot(data = penguins_adelie, aes(x = bill_length_mm, y = bill_depth_mm)) +
  geom_point()) |> 
  drawit()
```

In this example, the drawn path is much more jittery and requires more
careful mouse movement to connect smoothly. Moving your mouse slowly
across the plot often helps the function capture the movement more
accurately. If jitteriness becomes a problem, consider reducing the
density of the data or increasing the height and width when rendering.
This often makes the interaction easier to control.

If you need more flexibility, check out
[`sketchit()`](https://alisa-krasilnikov.github.io/youdrawitR/reference/sketchit.md).
That function is more freeform and can be especially useful when the
data are dense.

While
[`drawit()`](https://alisa-krasilnikov.github.io/youdrawitR/reference/drawit.md)
is not a perfect replica of `ggplot2`, it does preserve much of the
styling information from the `ggplot` object you pass into it.

``` r
(ggplot(data = mtcars, aes(x = wt, y = mpg)) +
    geom_point(size = 2, color = "red") +
    labs(title = "Drawit Cars Example",
         subtitle = "Hope You Enjoy!",
         x = "Weight",
         y = "Miles Per Gallon")
    ) |> 
  drawit()
```

### Simulated Data Examples

[`drawit()`](https://alisa-krasilnikov.github.io/youdrawitR/reference/drawit.md)
is especially useful with simulated data, since it was originally
designed for graphical testing. The function includes several options
that allow you to adjust the graph to fit your use case.

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
drawing by using the `show_on_finish` argument.

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
