#' Interactive drawing on \code{ggplot2} visualizations using D3
#'
#' The drawit function allows the user to draw a single, continuous, one-to-one
#' line. This is particularly useful for tasks in which the user is expected to
#' estimate trends or sketch expected relationships in the data.
#'
#'
#' @param p A \code{ggplot2} object.
#' @param ... Additional arguments passed
#' @param width Width of the output widget in **pixels**.
#' @param height Height of the output widget in **pixels**.
#' @param shiny_message_loc Name of the Shiny input/output binding used for messaging.
#' @param show_on_finish If \code{TRUE}, displays a secondary geom after the user finishes drawing. Note that this will always be the second geom layer within your \code{ggplot2} object.
#' @param draw_start Specifies where drawing interaction begins, on the scale of your data.
#' @param smoother A number greater than 0 that controls how much nearby x-values are binned together. Larger values group more points, creating a smoother but less detailed drawing (useful for dense data). Values closer to 0 keep points more separate, preserving detail (useful when the exact x-y relationship matters)
#' @param interpolator A number greater than 0 that controls how may "in between" x-values are added to gaps between data. Values closer to zero indicate that the function is looking for smaller gaps, thus filling in more points. Higher values avoid adding interpolated points, making the drawing "chunkier."
#'
#' @details
#' For more flexible, free-form drawing, see \code{sketchit()}.
#'
#' Currently, drawit can support \code{geom_scatter}, \code{geom_line}, and
#' \code{geom_smooth}, with a maximum of two geoms per plot.
#'
#' A highlighted region indicates where drawing is permitted. Users draw from
#' left to right, and the interface provides visual feedback when portions of the
#' data range have not yet been covered.
#'
#' The drawing resolution is tied to the x-values in the data. As a result,
#' extending the x-axis far beyond the observed data without adjusting
#' \code{draw_start} may lead to an overly granular drawing experience
#'
#' @section Shiny Integration:
#' When used within a \code{shiny} application, the widget returns the
#' recorded drawing data as a structured object once the user has filled
#' the drawable region. Each x-value in the original data is paired with
#' a corresponding user-drawn y-value.
#'
#' The returned data includes:
#'
#' \itemize{
#'   \item \code{x}: The x-values drawn by the user, preserving the original data as much as possible
#'   \item \code{y}: The user-drawn y-values corresponding to each x
#' }
#'
#' Because \code{drawit()} enforces a single continuous line, the output
#' represents a fully specified function over the domain of the data.
#'
#' @return An \code{r2d3} htmlwidget.
#' @examples
#' \dontrun{
#' # Basic usage
#' p <- ggplot(mtcars, aes(x = wt, y = mpg)) +
#'   geom_point(size = 2, colour = "magenta") +
#'   labs(x = "Weight", y = "MPG")
#'
#' drawit(p)
#'
#' # Pipe-friendly usage
#' (ggplot(mtcars, aes(x = wt, y = mpg)) +
#'   geom_point(size = 2, colour = "magenta") +
#'   labs(x = "Weight", y = "MPG")) |>
#'   drawit()
#'}
#' @importFrom r2d3 r2d3
#' @export

drawit <- function(p, ..., width = NULL, height = NULL,
                   shiny_message_loc = NULL, show_on_finish = FALSE,
                   draw_start = NULL, smoother = 0.001, interpolator = NULL) {

  if (!inherits(p, "ggplot")) {
    stop("drawit() expects a ggplot2 object. Did you make sure to wrap the ggplot in ",
         "parentheses before piping it in?",
         call. = FALSE)
  }

  #### BEEP BEEP: Payload called here ####
  payload <- ggplot_youdrawit_payload(p)
  ########################################

  ## Variable Checks --------------------------------------
  if (!is.null(width)) {
    if (!is.numeric(width) || length(width) != 1 || is.na(width) || width <= 0) {
      warning("`width` must be a single positive numeric value or NULL. Input ignored.",
              call. = FALSE)
      width <- NULL
    }
  }

  if (!is.null(height)) {
    if (!is.numeric(height) || length(height) != 1 || is.na(height) || height <= 0) {
      warning("`height` must be a single positive numeric value or NULL. Input ignored.",
              call. = FALSE)
      height <- NULL
    }
  }

  if (!is.numeric(smoother) || length(smoother) != 1 || is.na(smoother) || smoother <= 0) {
    warning("`smoother` must a value greater than 0. Defaulting to 1",
            call. = FALSE)
    smoother <- 1
  }

  if (!is.null(interpolator)) {
    if (!is.numeric(interpolator) || length(interpolator) != 1 || is.na(interpolator) || interpolator <= 0) {
      warning("`interpolator` must a value greater than 0 or NULL. Input ignored.",
              call. = FALSE)
      interpolator <- NULL
    }
  }

  if (!is.logical(show_on_finish) || length(show_on_finish) != 1 || is.na(show_on_finish)) {
    warning("`show_on_finish` must be TRUE or FALSE. Defaulting to FALSE.",
            call. = FALSE)
    show_on_finish <- FALSE
  }

  if (!is.null(draw_start)) {
    if (!is.numeric(draw_start) || length(draw_start) != 1 || is.na(draw_start)) {
      warning("`draw_start` must be a single numeric value or NULL. Input ignored.",
              call. = FALSE)
      draw_start <- NULL
    } else {
      # Get x range from payload
      x_range <- payload$scales$x_domain

      if (draw_start < x_range[1] || draw_start > x_range[2]) {
        warning("`draw_start` is outside the x range of the data. Input ignored.",
                call. = FALSE)
        draw_start <- NULL
      }
    }
  }
  ## --------------------------------------

  num_layers <- length(payload$layers)

  # The widget only supports up to two layers:
    # - the base (visible immediately)
    # - an optional additional layer (can be delayed, if preferred - show_on_finish = TRUE)

  if (num_layers > 2) {
    warning(
      "More than two ggplot layers detected. ",
      "Only the first two layers will be used; additional layers will be ignored",
      call. = FALSE
    )
  }

  if (num_layers < 2 && show_on_finish) {
    warning(
      "No secondary plot detected. ",
      "show_on_finish argument ignored",
      call. = FALSE
    )
  }

  # Only keep first two layers (Even if more were supplied)
  payload$layers <- payload$layers[1:min(2, length(payload$layers))]

  # Sort data by X-axis
  x_var <- rlang::as_label(p$mapping$x)
  p$data <- p$data[order(p$data[[x_var]]), ]

  # If show_on_finish = TRUE and we have more than one layer mark all layers after the first to be delayed
  if (show_on_finish && length(payload$layers) > 1) {
    for (i in 2:length(payload$layers)) {
      payload$layers[[i]]$show_on_finish <- TRUE
    }
  }

  options <- list(
    drawit = TRUE, # Tells MultiLayer that this is drawit
    shiny_message_loc = shiny_message_loc,
    draw_start = draw_start,
    smoother = smoother
  )

  # Dynamically determine which JavaScript files to load
  # Each geom type has its own renderer file (line.js, point.js, smooth.js)
  deps <- vapply(payload$layers, function(layer) {
    system.file(paste0("d3/", layer$geom_type, ".js"), package = "youdrawitR")
    }, character(1))

  # Need drawit
  deps <- c(deps, system.file("d3/drawit.js", package = "youdrawitR"))

  # Create the r2d3 widget
  youdrawit_plot <- r2d3(
    data = payload,
    script = system.file("d3/multiLayer.js", package = "youdrawitR"),
    dependencies = deps,
    options = options,
    width = width,
    height = height
  )

  # If in Shiny, return a reactive tibble along with the widget
  domain <- shiny::getDefaultReactiveDomain()

  if (!is.null(domain)) {

    if (is.null(shiny_message_loc) || !nzchar(shiny_message_loc)) {
      stop(
        "In Shiny, `shiny_message_loc` must be a non-empty string matching the input id ",
        "used by the widget to send messages back to Shiny."
      )
    }

    tibble_reactive <- shiny::reactive({
      msg <- domain$input[[shiny_message_loc]]
      shiny::req(msg)

      tibble::tibble(
        x = unlist(msg$x, use.names = FALSE),
        y = unlist(msg$y, use.names = FALSE)
      )
    })

    return(list(youdrawit_plot = youdrawit_plot, points = tibble_reactive))
  }

  return(youdrawit_plot)
}
