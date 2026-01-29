#' Render a ggplot scatterplot as D3 via r2d3
#' @export

youdrawit_scatter <- function(p, ..., width = NULL, height = NULL) {
  if (!inherits(p, "ggplot")) {
    stop("youdrawit_scatter() expects a ggplot object. Did you pipe a data frame by accident?")
  }

  payload <- ggplot_youdrawit_payload(p)

  r2d3::r2d3(
    data = payload,
    script = system.file("d3/scatter.js", package = "youdrawitR"),
    dependencies = system.file("d3/drawit.js", package = "youdrawitR"),
    options = list(shiny_message_loc = "my_shiny_app"),
    width = width,
    height = height
  )
}

