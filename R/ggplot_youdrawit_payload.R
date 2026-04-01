#' Extract ggplot2 data for D3 rendering
#'
#' Takes a ggplot2 object and extracts the underlying data and layout
#' information required to re-render the plot using D3. This function
#' processes the output of \code{ggplot2::ggplot_build()} to obtain
#' scaled data, panel information, and aesthetic mappings.
#'
#' @param p A \code{ggplot2} object.
#'
#' @return A data frame containing the processed data needed to render the plot
#' in D3, including scaled x and y values and aesthetic attributes.
#'
#' @details
#' This function is primarily intended for internal use within the youdrawit
#' workflow. It extracts post-scale data from \code{ggplot_build()}, meaning
#' that all transformations have already been applied.
#'
#' The resulting structure is used as the input payload for downstream rendering
#' functions such as \code{drawit()} and \code{sketchit()}.
#'
#' @examples
#' library(ggplot2)
#'
#' p <- ggplot(mtcars, aes(x = wt, y = mpg)) +
#'   geom_point(size = 2, colour = "magenta") +
#'   labs(x = "Weight", y = "MPG")
#'
#' ggplot_youdrawit_payload(p)
#'
#' @importFrom ggplot2 ggplot_build
#' @export

ggplot_youdrawit_payload <- function(p) {
  stopifnot(inherits(p, "ggplot"))

  b <- ggplot_build(p)

  # trained scales
  x_scale <- b$layout$panel_scales_x[[1]]
  y_scale <- b$layout$panel_scales_y[[1]]

  # limits if present
  x_domain <- if (!is.null(x_scale$limits)) x_scale$limits else x_scale$range$range
  y_domain <- if (!is.null(y_scale$limits)) y_scale$limits else y_scale$range$range

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
    labels = p$labels, # title and subtitle in labels
    scales = list(
      x_domain = x_domain,
      y_domain = y_domain
    )
  )
}
