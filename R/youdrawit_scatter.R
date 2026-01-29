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
#' youdrawit_scatter(p)
#'
#'## Pipe-friendly usage
#' (ggplot(mtcars, aes(x = wt, y = mpg)) +
#'   geom_point(size = 2, colour = "magenta") +
#'   labs(x = "Weight", y = "MPG")) |>
#'   youdrawit_scatter()
#' @export

youdrawit_scatter <- function(p, ..., width = NULL, height = NULL,
                              shiny_message_loc = NULL) {
  if (!inherits(p, "ggplot")) {
    stop("youdrawit_scatter() expects a ggplot object. Did you pipe a data frame by accident?")
  }

  # Sort by X-axis
  x_var <- rlang::as_label(p$mapping$x)
  p$data <- p$data[order(p$data[[x_var]]), ]

  payload <- ggplot_youdrawit_payload(p)
  options = list(shiny_message_loc = shiny_message_loc)

  widget <- r2d3(
    data = payload,
    script = system.file("d3/scatter.js", package = "youdrawitR"),
    dependencies = system.file("d3/drawit.js", package = "youdrawitR"),
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
       x = msg$x,
       y = msg$y
     )
   })

   return(list(widget = widget, points = tibble_reactive))
 }

 return(widget)
}

