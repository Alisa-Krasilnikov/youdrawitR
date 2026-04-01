#' Free-form drawing on ggplot2 visualizations using D3
#'
#' The sketchit function enables flexible, free-form drawing on a ggplot2
#' visualization. Unlike \code{drawit()}, which restricts users to a single
#' continuous line, \code{sketchit()} allows multiple lines, color selection,
#' and greater control over drawing behavior. This makes it suitable for
#' exploratory tasks, annotation, or situations where users may wish to sketch
#' multiple patterns or highlight different features of the data.
#'
#' @param p A \code{ggplot2} object.
#' @param ... Additional arguments passed
#' @param width Width of the output widget in **pixels**.
#' @param height Height of the output widget in **pixels**.
#' @param shiny_message_loc Name of the Shiny input/output binding used for messaging.
#' @param color_options If \code{TRUE}, enables multiple drawing colors.
#' @param starting_color Initial drawing color.
#' @param palette Set of colors available for drawing as a character vector.
#' @param stroke_width Width of the drawn lines.
#' @param button_position Position of the control interface within the plot. Note
#' that this is a numeric vector of length 2, with acceptable values from 0 to 1.
#' c(1,1) is the top right of the graph, and c(0,0) is the bottom left.
#' @param max_lines Maximum number of lines the user can draw.
#' @param min_lines Minimum number of lines required before the user can click "Done".
#'
#' @details
#' Currently, sketchit can support \code{geom_scatter}, \code{geom_line}, and
#' \code{geom_smooth}.
#'
#' When \code{color_options} = \code{TRUE}, the default color pallete is
#' "steelblue", "orange", "green", "red".
#'
#' If \code{starting_color} is updated, the \code{starting_color} value
#' will be added to the pallete, assuming it has not been turned off.
#'
#' If \code{palette} is updated, the \code{starting_color} will be the first
#' color within the palette.
#'
#' @section Shiny Integration:
#' When used within a \code{shiny} application, the widget returns the
#' recorded drawing data as a structured object once the user clicks
#' the "Done" button. The recorded user data includes:
#'
#' \itemize{
#'   \item \code{x} and \code{y}: The coordinates of each point along a drawn line
#'   \item \code{color}: The color used to draw the line
#'   \item \code{line_id}: An identifier distinguishing separate lines
#'   \item \code{order}: The chronological order in which lines were created
#' }
#'
#' The \code{line_id} variable groups observations belonging to the same
#' drawn line, while \code{order} reflects the historical sequence of drawing
#' actions. Importantly, \code{order} is not reset when lines are removed.
#'
#' For example, if a user draws a blue line, then a red line, removes the red
#' line, and finally draws a green line, the resulting identifiers may be:
#'
#' \itemize{
#'   \item Blue line: \code{line_id = 1}, \code{order = 0}
#'   \item Green line: \code{line_id = 2}, \code{order = 2}
#' }
#' This behavior preserves the full interaction history and allows downstream
#' reconstruction or analysis of user actions.
#'
#' @return An \code{r2d3} htmlwidget.
#' @examples
#' \dontrun{
#' # Basic usage
#' p <- ggplot(mtcars, aes(x = wt, y = mpg)) +
#'   geom_point()
#'
#' sketchit(p)
#'
#' # Custom colors and multiple lines
#' sketchit(
#'   p,
#'   color_options = TRUE,
#'   palette = c("red", "blue", "green"),
#'   max_lines = 3
#' )
#'
#' # Pipe-friendly usage
#' (ggplot(mtcars, aes(x = wt, y = mpg)) +
#'   geom_point()) |>
#'  sketchit(palette = c("red", "blue", "green"),
#'           max_lines = 3)
#'}
#' @importFrom r2d3 r2d3
#' @export
#'
sketchit <- function(p, ..., width = NULL, height = NULL,
                   shiny_message_loc = NULL, color_options = TRUE,
                   starting_color = NULL,
                   palette = NULL, stroke_width = 2,
                   button_position = c(1, 1),
                   max_lines = NULL,
                   min_lines = NULL){

  if (!inherits(p, "ggplot")) {
    stop("sketchit() expects a ggplot object. Did you make sure to wrap the ggplot in ",
         "parentheses before piping it in?")
  }

  #### BEEP BEEP: Payload called here ####
  payload <- ggplot_youdrawit_payload(p)
  ########################################

  options <- list(
    sketchit = TRUE, # Tells MultiLayer that this is sketchit
    color_options = color_options,
    starting_color = starting_color,
    palette = palette,
    stroke_width = stroke_width,
    shiny_message_loc = shiny_message_loc,
    button_position = button_position,
    max_lines = max_lines,
    min_lines = min_lines
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
