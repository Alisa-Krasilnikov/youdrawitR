#' Take in a ggplot2 graph and extract data for rerendering in D3
#'
#' @param p A ggplot2 graph
#' @importFrom ggplot2 ggplot_build
#' @export
#' @return A dataframe containing information needed to render a ggplot into D3 through youdrawit functions
#' @examples
#' library(ggplot2)
#'
#' p <- ggplot(mtcars, aes(x = wt, y = mpg)) +
#'           geom_point(size = 2, colour = "magenta") +
#'           labs(x = "Weight", y = "MPG")
#'
#' ggplot_youdrawit_payload(p)

ggplot_youdrawit_payload <- function(p) {
  stopifnot(inherits(p, "ggplot"))

  if (length(p$layers) != 1) stop("Only one layer supported for now.")
  geom_name <- class(p$layers[[1]]$geom)[1]
  if (!grepl("GeomPoint", geom_name)) stop("Only geom_point() supported for now.")

  b <- ggplot_build(p)

  # trained scales
  x_scale <- b$layout$panel_scales_x[[1]]
  y_scale <- b$layout$panel_scales_y[[1]]

  # built layer data (scaled by ggplot)
  d <- b$data[[1]]

  # keep only columns D3 will use (add more as you need) * I don't know if we need this but this is to minimize payload
  keep <- intersect(
    names(d),
    c("x", "y", "colour", "alpha", "size", "shape", "stroke", "fill", "group")
  )
  d_keep <- d[, keep, drop = FALSE]

  layer <- list(
    data = d_keep,                         # keep as data frame
    aes_params = p$layers[[1]]$aes_params, # constants set in geom_point(size=2)
    geom_params = p$layers[[1]]$geom_params
  )

  list(
    layers = list(layer),
    labels = p$labels,
    scales = list(
      x_domain = x_scale$range$range,
      y_domain = y_scale$range$range
    )
  )
}
