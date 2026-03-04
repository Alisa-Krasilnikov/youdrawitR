#' Render a ggplot scatterplot as D3 via r2d3
#'
#' @param p A ggplot2 graph
#' @param ... Additional arguments passed to r2d3()
#' @param width The width of the desired D3 graph
#' @param height The height of the desired D3 graph
#' @param shiny_message_loc The location of your shiny message
#' @param color_options Whether or not you want the pallette to show up with multiple options
#' @param starting_color The first color you want your user to sketch with
#' @param palette What colors you want your user to pick from
#' @param stroke_width The widths of the strokes
#' @importFrom r2d3 r2d3
#' @return An r2d3 htmlwidget rendering the plot
#' @examples
#' library(ggplot2)
#'
#' ## Basic usage
#' p <- ggplot(mtcars, aes(x = wt, y = mpg)) +
#'   geom_point(size = 2, colour = "magenta") +
#'   labs(x = "Weight", y = "MPG")
#'
#' sketchit(p)
#'
#'## Pipe-friendly usage
#' (ggplot(mtcars, aes(x = wt, y = mpg)) +
#'   geom_point(size = 2, colour = "magenta") +
#'   labs(x = "Weight", y = "MPG")) |>
#'   sketchit()
#' @export
sketchit <- function(p, ..., width = NULL, height = NULL,
                   shiny_message_loc = NULL, color_options = TRUE,
                   starting_color = NULL,
                   palette = NULL, stroke_width = 2){
  payload <- ggplot_youdrawit_payload(p)

  options <- list(
    sketchit = TRUE, # Tells MultiLayer that this is sketchit
    color_options = color_options,
    starting_color = starting_color,
    palette = palette,
    stroke_width = stroke_width,
    shiny_message_loc = shiny_message_loc
  )

  # Dynamically determine which JavaScript files to load
  # Each geom type has its own renderer file (line.js, point.js, smooth.js)
  deps <- vapply(payload$layers, function(layer) {
    system.file(paste0("d3/", layer$geom_type, ".js"), package = "youdrawitR")
  }, character(1))

  # Need sketchit
  deps <- c(deps, system.file("d3/sketchit.js", package = "youdrawitR"))

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
        y = unlist(msg$y, use.names = FALSE),
        color = unlist(msg$color, use.names = FALSE),
        order = unlist(msg$order, use.names = FALSE),
        line_id = unlist(msg$line_id, use.names = FALSE)
      )
    })

    return(list(youdrawit_plot = youdrawit_plot, points = tibble_reactive))
  }

  return(youdrawit_plot)
}
