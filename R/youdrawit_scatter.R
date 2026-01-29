#' Render a ggplot scatterplot as D3 via r2d3
#'
#' @param p A ggplot2 graph
#' @param ... Additional arguments passed to r2d3()
#' @param width The width of the desired D3 graph
#' @param height The height of the desired D3 graph
#' @importFrom r2d3 r2d3
#' @export
#' @return An r2d3 htmlwidget rendering the scatterplot
#' @examples
#' library(ggplot2)
#'
#' ## Basic usage
#' p <- ggplot(mtcars, aes(x = wt, y = mpg)) +
#'   geom_point(size = 2, colour = "magenta") +
#'   labs(x = "Weight", y = "MPG")
#'
#' youdrawit_scatter(p)
#'
#'## Pipe-friendly usage
#' (ggplot(mtcars, aes(x = wt, y = mpg)) +
#'   geom_point(size = 2, colour = "magenta") +
#'   labs(x = "Weight", y = "MPG")) |>
#'   youdrawit_scatter()

youdrawit_scatter <- function(p, ..., width = NULL, height = NULL) {
  if (!inherits(p, "ggplot")) {
    stop("youdrawit_scatter() expects a ggplot object. Did you pipe a data frame by accident?")
  }

  payload <- ggplot_youdrawit_payload(p)

  r2d3(
    data = payload,
    script = system.file("d3/scatter.js", package = "youdrawitR"),
    dependencies = system.file("d3/drawit.js", package = "youdrawitR"),
    options = list(shiny_message_loc = "my_shiny_app"),
    width = width,
    height = height
  )
}

