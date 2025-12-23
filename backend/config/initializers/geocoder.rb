Geocoder.configure(
  # Geocoding options
  timeout: 10,                 # geocoding service timeout (secs)
  lookup: :nominatim,         # name of geocoding service (symbol)
  http_headers: { "User-Agent" => "BookApp/1.0 (daniel@example.com)" },

  # Calculation options
  units: :mi,
)

