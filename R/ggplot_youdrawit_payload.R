#' Take in a ggplot2 graph and extract data for rerendering in D3
#'
#' @param p A ggplot2 graph
#' @importFrom ggplot2 ggplot_build
#' @return A dataframe containing information needed to render a ggplot into D3 through youdrawit functions
#' @examples
#' library(ggplot2)
#'
#' p <- ggplot(mtcars, aes(x = wt, y = mpg)) +
#'           geom_point(size = 2, colour = "magenta") +
#'           labs(x = "Weight", y = "MPG")
#'
#' ggplot_youdrawit_payload(p)
#' @export

ggplot_youdrawit_payload <- function(p) {
  stopifnot(inherits(p, "ggplot"))

  b <- ggplot_build(p)

  # trained scales
  x_scale <- b$layout$panel_scales_x[[1]]
  y_scale <- b$layout$panel_scales_y[[1]]

  # Can't use datetime yet
  if (
    inherits(x_scale, c("ScaleContinuousDate", "ScaleContinuousDatetime")) ||
    inherits(y_scale, c("ScaleContinuousDate", "ScaleContinuousDatetime"))
  ) {
    stop(
      "I can't use time series data yet :( ",
      "Please convert your date/datetime variable to numeric before using ggplot_youdrawit_payload().",
      call. = FALSE
    )
  }
  # process all layers (since we can use >1 now)
  layers_list <- lapply(seq_along(p$layers), function(i) {
    layer_obj <- p$layers[[i]]

    # Get the geom name (ex.GeomPoint is point so that we can use point.js)
    geom_class <- class(layer_obj$geom)[1]
    geom_type <- tolower(sub("^Geom", "", geom_class))

    # built layer data (for this layer specifically)
    d <- b$data[[i]]

    # keep only columns D3 will use (add more as you need) * I don't know if we need this but this is to minimize payload
    keep_cols <- intersect(
      names(d),
      c("x", "y", "ymin", "ymax", "colour", "alpha", "size", "linewidth", "shape", "fill", "group")
    )
    d_subset <- d[, keep_cols, drop = FALSE]

    # Return a structured list for this specific layer
    list(
      geom_type = geom_type,
      data = d_subset, # keep as data frame
      aes_params = layer_obj$aes_params, # constants set in geom_point(size=2) Note: Some issues with linewidth
      geom_params = layer_obj$geom_params
    )
  })

  list(
    layers = layers_list,
    labels = p$labels,
    scales = list(
      x_domain = x_scale$range$range,
      y_domain = y_scale$range$range
    )
  )
}
