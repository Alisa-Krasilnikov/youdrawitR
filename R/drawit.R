#' Render a ggplot scatterplot as D3 via r2d3
#'
#' @param p A ggplot2 graph
#' @param ... Additional arguments passed to r2d3()
#' @param width The width of the desired D3 graph
#' @param height The height of the desired D3 graph
#' @param shiny_message_loc The location of your shiny message
#' @importFrom r2d3 r2d3
#' @return An r2d3 htmlwidget rendering the scatterplot
#' @examples
#' library(ggplot2)
#'
#' ## Basic usage
#' p <- ggplot(mtcars, aes(x = wt, y = mpg)) +
#'   geom_point(size = 2, colour = "magenta") +
#'   labs(x = "Weight", y = "MPG")
#'
#' drawit(p)
#'
#'## Pipe-friendly usage
#' (ggplot(mtcars, aes(x = wt, y = mpg)) +
#'   geom_point(size = 2, colour = "magenta") +
#'   labs(x = "Weight", y = "MPG")) |>
#'   drawit()
#' @export

#Testing:
  # - See if works with negative data
  # - Packagedown website with vignettes and stuff
  # - Guidebox toggle options

drawit <- function(p, ..., width = NULL, height = NULL,
                   shiny_message_loc = NULL, show_on_finish = FALSE) {

  if (!inherits(p, "ggplot")) {
    stop("drawit() expects a ggplot object. Did you pipe a data frame by accident?")
  }

  #### BEEP BEEP: Payload called here ####
  payload <- ggplot_youdrawit_payload(p)
  ########################################

  num_layers <- length(payload$layers)

  # The widget only supports up to two layers:
    # - the base (visible immediately)
    # - an optional additional layer (can be delayed, if preferred - show_on_finish = TRUE)

  if (num_layers > 2) {
    warning(
      "More than two ggplot layers detected ",
      "Only the first two layers will be used; additional layers will be ignored",
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
    shiny_message_loc = shiny_message_loc
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
