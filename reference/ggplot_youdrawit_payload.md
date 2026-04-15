# Extract ggplot2 data for D3 rendering

Takes a ggplot2 object and extracts the underlying data and layout
information required to re-render the plot using D3. This function
processes the output of
[`ggplot2::ggplot_build()`](https://ggplot2.tidyverse.org/reference/ggplot_build.html)
to obtain scaled data, panel information, and aesthetic mappings.

## Usage

``` r
ggplot_youdrawit_payload(p)
```

## Arguments

- p:

  A `ggplot2` object.

## Value

A data frame containing the processed data needed to render the plot in
D3, including scaled x and y values and aesthetic attributes.

## Details

This function is primarily intended for internal use within the
youdrawit workflow. It extracts post-scale data from
[`ggplot_build()`](https://ggplot2.tidyverse.org/reference/ggplot_build.html),
meaning that all transformations have already been applied.

The resulting structure is used as the input payload for downstream
rendering functions such as
[`drawit()`](https://alisa-krasilnikov.github.io/youdrawitR/reference/drawit%202.html)
and
[`sketchit()`](https://alisa-krasilnikov.github.io/youdrawitR/reference/sketchit%202.html).

## Examples

``` r
library(ggplot2)

p <- ggplot(mtcars, aes(x = wt, y = mpg)) +
  geom_point(size = 2, colour = "magenta") +
  labs(x = "Weight", y = "MPG")

ggplot_youdrawit_payload(p)
#> $layers
#> $layers[[1]]
#> $layers[[1]]$geom_type
#> [1] "point"
#> 
#> $layers[[1]]$data
#>        x    y group shape  colour fill size alpha
#> 1  2.620 21.0    -1    19 magenta   NA    2    NA
#> 2  2.875 21.0    -1    19 magenta   NA    2    NA
#> 3  2.320 22.8    -1    19 magenta   NA    2    NA
#> 4  3.215 21.4    -1    19 magenta   NA    2    NA
#> 5  3.440 18.7    -1    19 magenta   NA    2    NA
#> 6  3.460 18.1    -1    19 magenta   NA    2    NA
#> 7  3.570 14.3    -1    19 magenta   NA    2    NA
#> 8  3.190 24.4    -1    19 magenta   NA    2    NA
#> 9  3.150 22.8    -1    19 magenta   NA    2    NA
#> 10 3.440 19.2    -1    19 magenta   NA    2    NA
#> 11 3.440 17.8    -1    19 magenta   NA    2    NA
#> 12 4.070 16.4    -1    19 magenta   NA    2    NA
#> 13 3.730 17.3    -1    19 magenta   NA    2    NA
#> 14 3.780 15.2    -1    19 magenta   NA    2    NA
#> 15 5.250 10.4    -1    19 magenta   NA    2    NA
#> 16 5.424 10.4    -1    19 magenta   NA    2    NA
#> 17 5.345 14.7    -1    19 magenta   NA    2    NA
#> 18 2.200 32.4    -1    19 magenta   NA    2    NA
#> 19 1.615 30.4    -1    19 magenta   NA    2    NA
#> 20 1.835 33.9    -1    19 magenta   NA    2    NA
#> 21 2.465 21.5    -1    19 magenta   NA    2    NA
#> 22 3.520 15.5    -1    19 magenta   NA    2    NA
#> 23 3.435 15.2    -1    19 magenta   NA    2    NA
#> 24 3.840 13.3    -1    19 magenta   NA    2    NA
#> 25 3.845 19.2    -1    19 magenta   NA    2    NA
#> 26 1.935 27.3    -1    19 magenta   NA    2    NA
#> 27 2.140 26.0    -1    19 magenta   NA    2    NA
#> 28 1.513 30.4    -1    19 magenta   NA    2    NA
#> 29 3.170 15.8    -1    19 magenta   NA    2    NA
#> 30 2.770 19.7    -1    19 magenta   NA    2    NA
#> 31 3.570 15.0    -1    19 magenta   NA    2    NA
#> 32 2.780 21.4    -1    19 magenta   NA    2    NA
#> 
#> $layers[[1]]$aes_params
#> $layers[[1]]$aes_params$size
#> [1] 2
#> 
#> $layers[[1]]$aes_params$colour
#> [1] "magenta"
#> 
#> 
#> $layers[[1]]$geom_params
#> $layers[[1]]$geom_params$na.rm
#> [1] FALSE
#> 
#> 
#> 
#> 
#> $labels
#> <ggplot2::labels> List of 2
#>  $ x: chr "Weight"
#>  $ y: chr "MPG"
#> 
#> $scales
#> $scales$x_domain
#> [1] 1.513 5.424
#> 
#> $scales$y_domain
#> [1] 10.4 33.9
#> 
#> 
```
