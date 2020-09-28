import LayerSwitcher from "./LayerSwitcher";
import Isocurve from "./Isocurve";
import MousePosition from "./MousePosition";
import ReverseGeocoding from "./ReverseGeocoding";
import Route from "./Route";
import SearchEngine from "./SearchEngine";
import ElevationPath from "./ElevationPath";
import Logo from "./Logo";

/**
 * Geoportal Controls Factory to be used together with Leaflet Maps.
 *
 * @module Controls
 * @alias L.geoportalControl
 * @example
 * var layerSwitcher = L.geoportalControl.LayerSwitcher(options);
 */
var Controls = {

    /**
     * Factory function for LayerSwitcher Control creation.
     *
     * @method LayerSwitcher
     * @static
     * @alias L.geoportalControl.LayerSwitcher
     * @param {Object} options - options for function call.
     * @param {String}  [options.position] - position of component into the map, 'topleft' by default. See {@link http://leafletjs.com/reference-1.0.2.html#control-option L.Control options} for available values.
     * @param {Boolean} [options.collapsed] - collapse mode, false by default
     * @param {Array}   [options.layers] - list of layers to be configured. Each array element is an object, with following properties :
     * @param {Object}  [options.layers.layer] - layer object
     * @param {Boolean} [options.layers.display] - display layer in widget layer list
     * @param {Object}  [options.layers.config] - layer display config
     * @param {String}  [options.layers.config.visibility] - layer visibility on map
     * @param {String}  [options.layers.config.title] - layer alias, to be displayed in widget layer list. E.g. : "Cartes IGN"
     * @param {String}  [options.layers.config.description] - layer description, to be displayed on title hover, or in layer information panel.
     * @param {String}  [options.layers.config.quicklookUrl] - link to a quick look image for this layer.
     * @param {Array}   [options.layers.config.legends] - array of layer legends. Each array element is an object, with following properties :
     *      - url (String, mandatory) : link to a legend
     *      - minScaleDenominator (Number, optional) : min scale denominator for legend validity.
     * @param {Array} [options.layers.config.metadata] - array of layer metadata. Each array element is an object, with property url (String, mandatory) : link to a metadata
     * @returns {L.geoportalControl.LayerSwitcher} - LayerSwitcher Object
     * @example
     *  layers = [
     *      {
     *          layer : wms1,
     *          display : false,
     *          config : {
     *              title : "test layer name 1",
     *              description : "test layer desc 1",
     *          }
     *      }
     *  ];
     *
     *  options = {
     *      position : "topright",
     *      collapsed : true,
     *      layers : layers
     *  };
     *
     *  var layerSwitcher = L.geoportalControl.LayerSwitcher(options);
     */
    LayerSwitcher : function (options) {
        return new LayerSwitcher(options);
    },

    /**
     * Factory function for Isocurve Control creation.
     *
     * @method Isocurve
     * @static
     * @alias L.geoportalControl.Isocurve
     * @param {Object} options - Isocurve control options
     * @param {Sting}   [options.apiKey] - API key for services call (isocurve and autocomplete services), mandatory if autoconf service has not been charged in advance
     * @param {String}  [options.position] - position of component into the map, 'topleft' by default. See {@link http://leafletjs.com/reference-1.0.2.html#control-option L.Control options} for available values.
     * @param {Boolean} [options.collapsed] - Specify if widget has to be collapsed (true) or not (false) on map loading. Default is true.
     * @param {Boolean} [options.ssl = true] - use of ssl or not (default true, service requested using https protocol)
     * @param {Object}  [options.exclusions] - list of exclusions with status (true = checked), by default : ["toll":false, "tunnel":false, "bridge":false].
     * @param {Array}   [options.graphs] - list of graph resources to be used for isocurve calculation, by default : ["Voiture", "Pieton"]. The first element is selected.
     * @param {Array}   [options.methods] - list of methods, by default : ["time", "distance"]. The first element is selected by default.
     * @param {Array}   [options.directions] - list of directions to be displayed, by default : ["departure", "arrival"]. The first element is selected by default.
     *      Directions enable to specify if input location point will be used as a departure point ("departure") or as an arrival point ("arrival")
     * @param {Boolean} [options.disableReverse = false] - whether to enable/disable the reverse geocoding
     * @param {Object} [options.isocurveOptions] - isocurve service options. see {@link http://ignf.github.io/geoportal-access-lib/latest/jsdoc/module-Services.html#~isoCurve Gp.Services.isoCurve}
     * @param {Object} [options.autocompleteOptions] - autocomplete service options. see {@link http://ignf.github.io/geoportal-access-lib/latest/jsdoc/module-Services.html#~autoComplete Gp.Services.autoComplete}
     * @returns {L.geoportalControl.Isocurve} - Isocurve Object
     * @example
     *  var iso = L.geoportalControl.Isocurve({
     *      collapsed : false
     *      methods : ["time", "distance"],
     *      exclusions : {
     *         toll : true,
     *         bridge : false,
     *         tunnel : true
     *      },
     *      graphs : ["Pieton", "Voiture"],
     *      isocurveOptions : {},
     *      autocompleteOptions : {}
     *  });
     */
    Isocurve : function (options) {
        return new Isocurve(options);
    },

    /**
     * Factory function for Geoportal MousePosition Control creation.
     *
     * @method MousePosition
     * @static
     * @alias L.geoportalControl.MousePosition
     * @param {Object} options - options for function call.
     * @param {Sting}   [options.apiKey] - API key, mandatory if autoconf service has not been charged in advance
     * @param {String}  [options.position] - position of component into the map, 'bottomleft' by default. See {@link http://leafletjs.com/reference-1.0.2.html#control-option L.Control options} for available values.
     * @param {Boolean} [options.collapsed] - collapse mode, false by default
     * @param {Boolean} [options.ssl = true] - use of ssl or not (default true, service requested using https protocol)
     * @param {Array}   [options.systems] - list of projection systems, GEOGRAPHIC, MERCATOR, LAMB93 and LAMB2E by default
     *      Each array element (=system) is an object with following properties :
     * @param {String}  options.systems.crs - Proj4 crs alias (from proj4 defs). e.g. : "EPSG:4326". Required
     * @param {String}  [options.systems.label] - CRS label to be displayed in control. Default is crs code (e.g. "EPSG:4326")
     * @param {String}  [options.systems.type] - CRS units type for coordinates conversion : "Geographical" or "Metric". Default: "Metric"
     * @param {Object}  [options.systems.geoBBox] - Aera covered by the system (WGS84 coordinates).
     * @param {Number}  options.systems.geoBBox.right - Right bound.
     * @param {Number}  options.systems.geoBBox.left - Left bound.
     * @param {Number}  options.systems.geoBBox.top - Top bound.
     * @param {Number}  options.systems.geoBBox.bottom - Bottom bound.
     * @param {Array}   [options.units] - list of units by system, Geographical and Metric by default
     *      Values may be "DEC" (decimal degrees), "DMS" (sexagecimal), "RAD" (radians) and "GON" (grades) for geographical coordinates,
     *      and "M" or "KM" for metric coordinates
     * @param {Boolean} [options.displayAltitude] - active/desactivate the altitude panel, if desactivate, have just the coordinate panel, true by default
     * @param {Boolean} [options.displayCoordinates] - active/desactivate the coordinate panel, if desactivate, have just the altitude panel, true by default
     * @param {Boolean} [options.editCoordinates = false] - If true, coordinates from the MousePosition control can be edited by users to re-center the view. False by default.
     * @param {Object}  [options.altitude] - elevation configuration
     * @param {Object}  [options.altitude.serviceOptions] - options of elevation service. see {@link http://ignf.github.io/geoportal-access-lib/latest/jsdoc/module-Services.html#~getAltitude Gp.Services.getAltitude}
     * @param {Number}  [options.altitude.responseDelay] - latency for altitude request, 500 ms by default
     * @param {Number}  [options.altitude.triggerDelay] - immobilisation time of movement on the map to trigger the elevation calculation, 200 ms by default
     * @param {Number}  [options.altitude.noDataValue] - value used for altitude service no data (default is -99999). In this case, "---m" will be displayed instead of "-99999m"
     * @param {Number}  [options.altitude.noDataValueTolerance] - tolerance for no data value :
     *                  values in [noDataValue - noDataValueTolerance ; noDataValue + noDataValueTolerance] interval will not be displayed, but "---m" will be displayed instead.
     *                  Default is 90000
     * @returns {L.geoportalControl.MousePosition} - MousePosition Object
     * @example
     *  var MousePosition = L.geoportalControl.MousePosition({
     *      position : 'bottomleft',
     *      collapsed : false,
     *      displayAltitude : true,
     *      editCoordinates : false,
     *      altitude : {
     *           triggerDelay : 100,
     *           responseDelay : 500,
     *           noDataValue : -99999,
     *           noDataValueTolerance : 90000,
     *           serviceOptions : {}
     *      },
     *      systems : [
     *       {
     *          crs : L.CRS.EPSG4326,
     *          label : "Lon,Lat",
     *          type : "Geographical"
     *        },
     *       {
     *          crs : L.geoportalCRS.EPSG2154,
     *          label : "Lambert 93",
     *          type : "Metric"
     *        }
     *      ],
     *      units : ["DEC", "DMS"]
     *  });
     */
    MousePosition : function (options) {
        return new MousePosition(options);
    },

    /**
     * Factory function for Geoportal ReverseGeocode Control creation.
     *
     * @method ReverseGeocode
     * @static
     * @alias L.geoportalControl.ReverseGeocode
     * @extends {L.Control}
     * @param {Object} options - ReverseGeocoding control options
     * @param {String}  [options.apiKey] - API key for services call (reverse geocode service), mandatory if autoconf service has not been charged in advance
     * @param {String}  [options.position] - position of component into the map, 'topleft' by default. See {@link http://leafletjs.com/reference-1.0.2.html#control-option L.Control options} for available values.
     * @param {Boolean} [options.collapsed] - Specify if widget has to be collapsed (true) or not (false) on map loading. Default is true.
     * @param {Boolean} [options.ssl = true] - use of ssl or not (default true, service requested using https protocol)
     * @param {Array}  [options.resources] - resources for geocoding, by default : ["StreetAddress", "PositionOfInterest"]
     * @param {Array}  [options.delimitations] - delimitations for reverse geocoding, by default : ["Point", "Circle", "Extent"]
     * @param {Object}  [options.ReverseGeocodeOptions] - reverse geocode service options. see {@link http://ignf.github.io/geoportal-access-lib/latest/jsdoc/module-Services.html#~reverseGeocode Gp.Services.reverseGeocode} to know all reverse geocode options.
     * @returns {L.geoportalControl.ReverseGeocode} - ReverseGeocode Object
     * @example
     *  var iso = L.geoportalControl.ReverseGeocode({
     *      collapsed : false,
     *      position : "topright",
     *      resources : ["StreetAddress", "PositionOfInterest"],
     *      delimitations : ["Point", "Circle"],
     *      reverseGeocodeOptions : {}
     *  });
     */
    ReverseGeocode : function (options) {
        return new ReverseGeocoding(options);
    },

    /**
     * Factory function for Geoportal Route Control creation.
     *
     * @method Route
     * @static
     * @alias L.geoportalControl.Route
     * @extends {L.Control}
     * @param {Object} options - options for function call.
     * @param {Sting}   [options.apiKey] - API key, mandatory if autoconf service has not been charged in advance
     * @param {String}  [options.position = "topleft"] - position of component into the map, 'topleft' by default. See {@link http://leafletjs.com/reference-1.0.2.html#control-option L.Control options} for available values.
     * @param {Boolean} [options.collapsed = false] - collapse mode, false by default
     * @param {Boolean} [options.ssl = true] - use of ssl or not (default true, service requested using https protocol)
     * @param {Boolean} [options.disableReverse = false] - whether to enable/disable the reverse geocoding when entering points.
     *   Active by default. But, you can disable it when entering with the "ctrl" key on the keyboard
     * @param {Object}  [options.exclusions] - list of exclusions with status
     * @param {Array}   [options.graphs] - list of resources, by default : ["Voiture", "Pieton"], and the first element is selected.
     * @param {Object}  [options.autocompleteOptions] - options of autocomplete service. see {@link http://ignf.github.io/geoportal-access-lib/latest/jsdoc/module-Services.html#~autoComplete Gp.Services.autoComplete}
     * @param {Object}  [options.routeOptions] - options of route service. see {@link http://ignf.github.io/geoportal-access-lib/latest/jsdoc/module-Services.html#~route Gp.Services.route}
     * @returns {L.geoportalControl.Route} - Route Object
     * @example
     *  var route = L.geoportalControl.Route({
     *      position : "topright",
     *      collapsed : true,
     *      exclusions : {
     *         "toll" : true,
     *         "bridge" : false,
     *         "tunnel" : true
     *      },
     *      graphs : ['Pieton', 'Voiture'],
     *      autocompleteOptions : {},
     *      routeOptions : {}
     *  });
     */
    Route : function (options) {
        return new Route(options);
    },

    /**
     * Factory function for Geoportal SearchEngine Control creation.
     *
     * @method SearchEngine
     * @static
     * @alias L.geoportalControl.SearchEngine
     * @extends {L.Control}
     * @param {Object}  options - control options
     * @param {String}  [options.apiKey] - API key, mandatory if autoconf service has not been charged in advance
     * @param {Boolean} [options.collapsed = false] - collapse mode
     * @param {Boolean} [options.ssl = true] - use of ssl or not (default true, service requested using https protocol)
     * @param {String}  [options.position = "topleft"] - position of component into the map. See {@link http://leafletjs.com/reference-1.0.2.html#control-option L.Control options} for available values.
     * @param {String}  [options.placeholder = "Rechercher un lieu, une adresse"] - set placeholder in search bar
     * @param {Boolean} [options.displayMarker = true] - set a marker on search result
     * @param {String|Object}  [options.markerStyle = "blue"] - set a marker style. Currently possible values are "blue" (default value), "orange", "red" and "green". But you can use an L.Icon object (see {@link http://leafletjs.com/reference-1.2.0.html#icon L.Icon })
     * @param {Boolean} [options.displayInfo = true] - get informations on popup marker
     * @param {Sting|Numeric|Function} [options.zoomTo] - zoom to results, by default, current zoom.
     *       possible values : "auto", any fixed zoom level or a function retruning a zoom :
     *
     *       ```
     *       zoomTo : function (info) {
     *           // do some stuff...
     *           return zoom; // required : return the zoom level !
     *       }
     *
     *       With parameter 'info' : {
     *           type : "PositionOfInterest" | "StreetAddress" | ...
     *           service : "SuggestedLocation" | "GeocodedLocation"
     *           fields : { // fields of service response }
     *       }
     *       ```
     * @param {Sting}   [options.apiKey] - API key, mandatory if autoconf service has not been charged in advance
     * @param {Object}  [options.resources] - resources to be used by geocode and autocompletion services, by default : ["StreetAddress", "PositionOfInterest"]
     * @param {Boolean} [options.displayAdvancedSearch] - False to disable advanced search tools (it will not be displayed). Default is true (displayed)
     * @param {Object}  [options.advancedSearch] - advanced search for geocoding (filters)
     * @param {Object}  [options.geocodeOptions] - options of geocode service. see {@link http://ignf.github.io/geoportal-access-lib/latest/jsdoc/module-Services.html#~geocode Gp.Services.geocode}
     * @param {Object}  [options.autocompleteOptions] - options of autocomplete service. see {@link http://ignf.github.io/geoportal-access-lib/latest/jsdoc/module-Services.html#~autoComplete Gp.Services.autoComplete}
     * @param {Object}  [options.autocompleteOptions.serviceOptions] - options of autocomplete service
     * @param {Boolean} [options.autocompleteOptions.triggerGeocode = false] - trigger a geocoding request if the autocompletion does not return any suggestions, false by default
     * @param {Number}  [options.autocompleteOptions.triggerDelay = 1000] - waiting time before sending the geocoding request, 1000ms by default
     * @returns {L.geoportalControl.SearchEngine} - SearchEngine Object
     * @example
     *  var SearchEngine = L.geoportalControl.SearchEngine({
     *      position : "topright",
     *      collapsed : true,
     *      zoomTo : "auto",
     *      displayInfo : true,
     *      displayAdvancedSearch : true,
     *      resources : ["PositionOfInterest", "StreetAddress"],
     *      advancedSearch : {
     *          PositionOfInterest : [{name : "municipality", title : "Ville"}],
     *          StreetAddress : [{...}],
     *          CadastralParcel : null,
     *      },
     *      apiKey : "zfgzrgffg57rfg8ar7gr4g5r4",
     *      geocodeOptions : {},
     *      autocompleteOptions : {}
     *  });
     */
    SearchEngine : function (options) {
        return new SearchEngine(options);
    },

    /**
     * Factory function for ElevationPath Control creation.
     *
     * @method ElevationPath
     * @static
     * @alias L.geoportalControl.ElevationPath
     * @param {Object} options - options for function call.
     * @param {Sting}   [options.apiKey] - API key for elevation service call, mandatory if configuration service has not been loaded in advance. See {@link https://github.com/IGNF/geoportal-extensions/blob/master/README-leaflet.md#user-content-config "Configuration de l'accès à la plateforme Géoportail" documentation chapter} for more information.
     * @param {String}  [options.position] - position of component into the map, 'topleft' by default. See {@link http://leafletjs.com/reference-1.0.2.html#control-option L.Control options} for available values.
     * @param {Boolean} [options.ssl = true] - use of ssl or not (default true, service requested using https protocol)
     * @param {Boolean} [options.active = false] - specify if control should be actived at startup. Default is false.
     * @param {Object} [options.stylesOptions = DEFAULT_STYLES] - Styles to use when drawing. see [leaflet options](http://leafletjs.com/reference.html#path-options) for available properties.
     * @param {Object} [options.elevationPathOptions = {}] - elevation path service options. See {@link http://ignf.github.io/geoportal-access-lib/latest/jsdoc/module-Services.html#~getAltitude options} for available options
     * @param {Object} [options.displayProfileOptions = {}] - profile options.
     * @param {Function} [options.displayProfileOptions.apply] - function to display profile if you want to cutomise it. By default, [DISPLAY_PROFILE_BY_DEFAULT()](./L.geoportalControl.ElevationPath.html#.DISPLAY_PROFILE_BY_DEFAULT) is used. Helper functions to use with D3 [DISPLAY_PROFILE_LIB_D3()](./L.geoportalControl.ElevationPath.html#.DISPLAY_PROFILE_LIB_D3) or AmCharts [DISPLAY_PROFILE_LIB_AMCHARTS()](./L.geoportalControl.ElevationPath.html#.DISPLAY_PROFILE_LIB_AMCHARTS) frameworks are also provided. You may also provide your own function.
     * @param {Object} [options.displayProfileOptions.target] - DOM container to use to display the profile.
     * @param {Boolean} [options.displayProfileOptions.greaterSlope = true] - display the greater slope into the graph
     * @param {Boolean} [options.displayProfileOptions.meanSlope = true] -  display the mean slope into the graph
     * @param {Boolean} [options.displayProfileOptions.ascendingElevation = true] -  display the ascending elevation into the graph
     * @param {Boolean} [options.displayProfileOptions.descendingElevation = true] -  display the descending elevation into the graph
     * @param {Boolean} [options.displayProfileOptions.currentSlope = true] -  display current slope value on profile mouseover
     *
     * @returns {L.geoportalControl.ElevationPath} - ElevationPath Object
     * @example
     *  var e = L.geoportalControl.ElevationPath({
     *      active : false
     *      position : "topleft"
     *      stylesOptions : {},
     *      elevationPathOptions : {},
     *      displayProfileOptions  : {
     *          apply : L.geoportalControl.DISPLAY_PROFILE_LIB_AMCHARTS
     *          target : null, // by default
     *          meanSlope : true, // by default
     *          greaterSlope : true, // by default
     *          ascendingElevation : false,
     *          descendingElevation : false,
     *          currentSlope : false
     *      }
     *  });
     */
    ElevationPath : function (options) {
        return new ElevationPath(options);
    },

    /**
     * Control Logo
     *
     * @private
     * @method Logo
     * @extends {L.Control}
     * @alias L.geoportalControl.Logo
     * @param {Object} options - options for function call.
     * @param {String} options.position - 'topright' by default. See {@link http://leafletjs.com/reference-1.0.2.html#control-option L.Control options} for available values.
     * @param {String} options.url - URL
     * @param {String} options.text - text
     * @param {String} options.picto - picto
     * @param {String|Object} options.size - picto size
     * @returns {Logo} - Logo Object
     * @example
     * var map  = L.map('map').setView([48, 2], 4);
     * var logo = L.geoportalControl.Logo({
     *   position : "topright",
     *   picto : "http://www.ign.fr/logo-ign.jpg",
     *   url : "http://www.ign.fr",
     *   text : "© IGN"
     *   size : {width : '50px', height : '30px'}
     * });
     * logo.addTo(map);
     */
    Logo : function (options) {
        return new Logo(options);
    }
};

export default Controls;
