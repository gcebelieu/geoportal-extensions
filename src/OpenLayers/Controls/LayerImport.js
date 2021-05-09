// import CSS
import "../CSS/Controls/LayerImport/GPimportOpenLayers.css";
// import OpenLayers
import Control from "ol/control/Control";
import { unByKey as olObservableUnByKey } from "ol/Observable";
import Collection from "ol/Collection";
// import RenderFeature from "ol/render/Feature"; // FIXME RenderFeature n'est pas dispo dans le bundle !?
import WMTSTileGrid from "ol/tilegrid/WMTS";
import { createXYZ as olCreateXYZTileGrid } from "ol/tilegrid"; // FIXME olCreateXYZTileGrid !?
import {
    transform as olTransformProj,
    get as olGetProj,
    transformExtent as olTransformExtentProj
} from "ol/proj";
import MVT from "ol/format/MVT";
import GeoJSON from "ol/format/GeoJSON";
import GPX from "ol/format/GPX";
import WMSCapabilities from "ol/format/WMSCapabilities";
import WMTSCapabilities from "ol/format/WMTSCapabilities";
import VectorTileLayer from "ol/layer/VectorTile";
import VectorLayer from "ol/layer/Vector";
import TileLayer from "ol/layer/Tile";
import VectorTileSource from "ol/source/VectorTile";
import VectorSource from "ol/source/Vector";
import TileWMSSource from "ol/source/TileWMS";
import WMTSSource from "ol/source/WMTS";
import TileJSONSource from "ol/source/TileJSON";
import {
    Fill,
    Icon,
    Stroke,
    Style,
    Text
} from "ol/style";
// import olms : module ES6
import { applyStyle as applyStyleOlms } from "ol-mapbox-style";
// import olms : bundle
// import olms from "ol-mapbox-style";
// import geoportal library access
import Gp from "geoportal-access-lib";
// import local
import Editor from "./Editor";
import Markers from "./Utils/Markers";
import Draggable from "../../Common/Utils/Draggable";
import Utils from "../../Common/Utils";
import Logger from "../../Common/Utils/LoggerByDefault";
import SelectorID from "../../Common/Utils/SelectorID";
import ProxyUtils from "../../Common/Utils/ProxyUtils";
import LayerImportDOM from "../../Common/Controls/LayerImportDOM";
// import local with ol dependencies
import KMLExtended from "../Formats/KML";
import LayerSwitcher from "./LayerSwitcher";

var logger = Logger.getLogger("layerimport");

/**
 * @classdesc
 *
 * LayerImport Control. Allows users to add geographical data in standards formats from their own sources to the map.
 *
 * @constructor
 * @alias ol.control.LayerImport
 * @extends {ol.control.Control}
 * @param {Object} options - options for function call.
 * @param {Boolean} [options.collapsed = true] - Specify if LayerImport control should be collapsed at startup. Default is true.
 * @param {Boolean} [options.draggable = false] - Specify if widget is draggable
 * @param {Array} [options.layerTypes = ["KML", "GPX", "GeoJSON", "WMS", "WMTS", "MAPBOX"]] - data types that could be imported : "KML", "GPX", "GeoJSON", "WMS", "WMTS" and "MAPBOX". Values will be displayed in the same order in widget list.
 * @param {Object} [options.webServicesOptions = {}] - Options to import WMS or WMTS layers
 * @param {String} [options.webServicesOptions.proxyUrl] - Proxy URL to avoid cross-domain problems. Mandatory to import WMS and WMTS layer.
 * @param {Array.<String>} [options.webServicesOptions.noProxyDomains] - Proxy will not be used for this list of domain names. Only use if you know what you're doing.
 * @param {Object} [options.vectorStyleOptions] - Options for imported vector layer styling (KML, GPX, GeoJSON)
 * @param {Object} [options.vectorStyleOptions.KML] - Options for KML layer styling
 * @param {Boolean} [options.vectorStyleOptions.KML.extractStyles = true] - Extract styles from the KML. Default is true.
 * @param {Boolean} [options.vectorStyleOptions.KML.showPointNames = true] - Show names as labels for KML placemarks which contain points. Default is true.
 * @param {Object} [options.vectorStyleOptions.KML.defaultStyle] - default style to be applied to KML imports in case no style is defined. defaultStyle is an {@link http://openlayers.org/en/latest/apidoc/ol.style.Style.html ol.style.Style} object.
 * @param {Object} [options.vectorStyleOptions.GPX] - Options for GPX layer styling
 * @param {Object} [options.vectorStyleOptions.GPX.defaultStyle] - default style to be applied to GPX imports in case no style is defined. defaultStyle is an {@link http://openlayers.org/en/latest/apidoc/ol.style.Style.html ol.style.Style} object.
 * @param {Object} [options.vectorStyleOptions.GeoJSON] - Options for GeoJSON layer styling
 * @param {Object} [options.vectorStyleOptions.GeoJSON.defaultStyle] - default style to be applied to GeoJSON imports in case no style is defined. defaultStyle is an {@link http://openlayers.org/en/latest/apidoc/ol.style.Style.html ol.style.Style} object.
 * @param {Object} [options.vectorStyleOptions.MapBox] - Options for MapBox layer styling
 * @param {Object} [options.vectorStyleOptions.MapBox.defaultStyle] - default style to be applied to MapBox imports in case no style is defined. defaultStyle is an {@link http://openlayers.org/en/latest/apidoc/ol.style.Style.html ol.style.Style} object.
 * @param {Object} [options.vectorStyleOptions.MapBox.tools] - options for style editor
 * @param {Boolean} [options.vectorStyleOptions.MapBox.tools.style] - display edit style menu for every layers. By default, no display.
 * @param {Boolean} [options.vectorStyleOptions.MapBox.tools.filter] - display edit filter menu for every layers By default, no display.
 * @example
 *  var LayerImport = new ol.control.LayerImport({
 *      "collapsed" : false,
 *      "draggable" : true,
 *      "layerTypes" : ["KML", "GPX"],
 *      "webServicesOptions" : {
 *          "proxyUrl" : "http://localhost/proxy/php/proxy.php?url=",
 *          "noProxyDomains" : []
 *      },
 *      "vectorStyleOptions" : {
 *          "KML" : {
 *              extractStyles : true,
 *              defaultStyle : new ol.style.Style({
 *                  image : new ol.style.Icon({
 *                       src : "data:image/png;base64....",
 *                       size : [51, 38],
 *                  }),
 *                  stroke : new ol.style.Stroke({
 *                       color : "#ffffff",
 *                       width : 7
 *                  }),
 *                  fill : new ol.style.Fill({
 *                       color : "rgba(255, 183, 152, 0.2)"
 *                  }),
 *                  text : new ol.style.Text({
 *                      font : "16px Sans",
 *                      textAlign : "left",
 *                      fill : new ol.style.Fill({
 *                          color : "rgba(255, 255, 255, 1)"
 *                      }),
 *                      stroke : new ol.style.Stroke({
 *                          color : "rgba(0, 0, 0, 1)",
 *                          width : 2
 *                      })
 *                  })
 *              })
 *          },
 *          "GPX" : {
 *              defaultStyle : new ol.style.Style({
 *                  image : new ol.style.Icon({
 *                       src : "path/to/my/icon.png",
 *                       size : [51, 38],
 *                  }),
 *                  stroke : new ol.style.Stroke({
 *                       color : "#ffffff",
 *                       width : 7
 *                  })
 *              })
 *          }
 *      }
 *  });
 */
var LayerImport = (function (Control) {
    function LayerImport (options) {
        options = options || {};

        if (!(this instanceof LayerImport)) {
            throw new TypeError("ERROR CLASS_CONSTRUCTOR");
        }

        this._initialize(options);

        // init control DOM container
        var container = this._container = this._initContainer(options);

        // call ol.control.Control constructor
        Control.call(this, {
            element : container,
            target : options.target,
            render : options.render
        });
    };

    // Inherits from ol.control.Control
    if (Control) LayerImport.__proto__ = Control;

    /**
     * Default styles applyied to KML, GPX and GeoJSON features.
     *
     * @private
     */
    LayerImport.DefaultStyles = {
        image : new Icon({
            src : Markers["lightOrange"],
            anchor : [25.5, 38],
            anchorOrigin : "top-left",
            anchorXUnits : "pixels",
            anchorYUnits : "pixels"
        }),
        stroke : new Stroke({
            color : "rgba(0,42,80,0.8)",
            width : 4
        }),
        fill : new Fill({
            color : "rgba(0, 183, 152, 0.5)"
        }),
        text : new Text({
            font : "16px Sans",
            textAlign : "left",
            fill : new Fill({
                color : "rgba(255, 255, 255, 1)"
            }),
            stroke : new Stroke({
                color : "rgba(0, 0, 0, 1)",
                width : 2
            })
        })
    };

    /**
     * @lends module:LayerImport
     */
    LayerImport.prototype = Object.create(Control.prototype, {});

    // on récupère les méthodes de la classe commune LayerImportDOM
    Utils.assign(LayerImport.prototype, LayerImportDOM);

    /**
     * Constructor (alias)
     *
     * @private
     */
    LayerImport.prototype.constructor = LayerImport;

    // ################################################################### //
    // ############## public methods (getters, setters) ################## //
    // ################################################################### //

    /**
     * Overwrite OpenLayers setMap method
     *
     * @param {ol.Map} map - Map.
     */
    LayerImport.prototype.setMap = function (map) {
        // ajout de la patience pour le chargement des tuiles
        if (map) {
            // Animation au centre de la carte ?
            // var center = this._loadingContainer = this._createLoadingElement();
            // map.getViewport().appendChild(center);

            map.getLayers().on(
                "remove",
                function (e) {
                    // import de type layerimport:MapBox ?
                    if (e.element.gpResultLayerId === "layerimport:MapBox") {
                        // layer ayant le bon ID ?
                        if (this._mapBoxLayerId && this._mapBoxLayerId === e.element.id) {
                            // le panneau des résultats existe t il ?
                            if (this._mapBoxPanel && this._mapBoxPanel.style.display) {
                                this.cleanMapBoxResultsList();
                                this._mapBoxPanel.style.display = "none";
                                this._importPanel.style.display = "";
                            }
                        }
                    }
                },
                this
            );

            // mode "draggable"
            if (this.draggable) {
                Draggable.dragElement(
                    this._importPanel,
                    this._importPanelHeader,
                    map.getTargetElement()
                );

                // panneau draggable pour les resultats ?
                Draggable.dragElement(
                    this._getCapPanel,
                    null,
                    map.getTargetElement()

                );
                Draggable.dragElement(
                    this._mapBoxPanel,
                    null,
                    map.getTargetElement()
                );
            }
        }

        // on appelle la méthode setMap originale d'OpenLayers
        Control.prototype.setMap.call(this, map);
    };

    /**
     * Returns true if widget is collapsed (minimized), false otherwise
     *
     * @returns {Boolean} collapsed - true if widget is collapsed
     */
    LayerImport.prototype.getCollapsed = function () {
        return this.collapsed;
    };

    /**
     * Collapse or display widget main container
     *
     * @param {Boolean} collapsed - True to collapse widget, False to display it
     */
    LayerImport.prototype.setCollapsed = function (collapsed) {
        if (collapsed === undefined) {
            logger.error("[ERROR] LayerImport:setCollapsed - missing collapsed parameter");
            return;
        }
        if ((collapsed && this.collapsed) || (!collapsed && !this.collapsed)) {
            return;
        }
        if (collapsed) {
            document.getElementById("GPimportPanelClose-" + this._uid).click();
        } else {
            document.getElementById("GPshowImport-" + this._uid).click();
        }
        this.collapsed = collapsed;
    };

    /**
     * Returns content of a static import (KML, GPX or GeoJSON)
     *
     * @returns {String} contentStatic  - content static
     */
    LayerImport.prototype.getStaticImportContent = function () {
        return this.contentStatic;
    };

    /**
     * Returns content of a service import (GetCapabilities)
     *
     * @returns {String} contentService  - content service
     */
    LayerImport.prototype.getServiceImportContent = function () {
        return this.contentService;
    };

    // ################################################################### //
    // ##################### init component ############################## //
    // ################################################################### //

    /**
     * Initialize LayerImport control (called by LayerImport constructor)
     *
     * @param {Object} options - constructor options
     * @private
     */
    LayerImport.prototype._initialize = function (options) {
        // ############################################################ //
        // ################### Options du composant ################### //

        // check input options format
        this._checkInputOptions(options);

        // set default options
        this.options = {
            collapsed : true,
            draggable : false,
            layerTypes : ["KML", "GPX", "GeoJSON", "WMS", "WMTS", "MAPBOX"],
            webServicesOptions : {},
            vectorStyleOptions : {
                KML : {
                    extractStyles : true,
                    showPointNames : true,
                    defaultStyle : {}
                },
                GPX : {
                    defaultStyle : {}
                },
                GeoJSON : {
                    defaultStyle : {}
                },
                MapBox : {
                    defaultStyle : {}, // TODO
                    tools : {
                        filter : false, // TODO edition des filtres de styles
                        style : false // TODO edition des styles
                    }
                }
            }
        };

        // TODO gestion du proxy

        // set extractStyles parameter
        if (options.vectorStyleOptions && options.vectorStyleOptions.KML && options.vectorStyleOptions.KML.extractStyles) {
            this.options.vectorStyleOptions.KML.extractStyles = options.vectorStyleOptions.KML.extractStyles;
        } // TODO
        // set showPointNames parameter
        if (options.vectorStyleOptions && options.vectorStyleOptions.KML && options.vectorStyleOptions.KML.showPointNames) {
            this.options.vectorStyleOptions.KML.showPointNames = options.vectorStyleOptions.KML.showPointNames;
        }

        // set vector layers default styles (KML, GPX, GeoJSON, MapBox)
        if (options.vectorStyleOptions && options.vectorStyleOptions.KML && options.vectorStyleOptions.KML.defaultStyle) {
            // get from options if specified
            this.options.vectorStyleOptions.KML.defaultStyle = options.vectorStyleOptions.KML.defaultStyle;
        } else {
            // get from control default options otherwise
            this.options.vectorStyleOptions.KML.defaultStyle = new Style({
                image : LayerImport.DefaultStyles.image,
                stroke : LayerImport.DefaultStyles.stroke,
                fill : LayerImport.DefaultStyles.fill,
                text : LayerImport.DefaultStyles.text
            });
        }
        if (options.vectorStyleOptions && options.vectorStyleOptions.GPX && options.vectorStyleOptions.GPX.defaultStyle) {
            // get from options if specified
            this.options.vectorStyleOptions.GPX.defaultStyle = options.vectorStyleOptions.GPX.defaultStyle;
        } else {
            // get from control default options otherwise
            this.options.vectorStyleOptions.GPX.defaultStyle = new Style({
                image : LayerImport.DefaultStyles.image,
                stroke : LayerImport.DefaultStyles.stroke,
                fill : LayerImport.DefaultStyles.fill
            });
        }
        if (options.vectorStyleOptions && options.vectorStyleOptions.GeoJSON && options.vectorStyleOptions.GeoJSON.defaultStyle) {
            // get from options if specified
            this.options.vectorStyleOptions.GeoJSON.defaultStyle = options.vectorStyleOptions.GeoJSON.defaultStyle;
        } else {
            // get from control default options otherwise
            this.options.vectorStyleOptions.GeoJSON.defaultStyle = new Style({
                image : LayerImport.DefaultStyles.image,
                stroke : LayerImport.DefaultStyles.stroke,
                fill : LayerImport.DefaultStyles.fill
            });
        }
        if (options.vectorStyleOptions && options.vectorStyleOptions.MapBox && options.vectorStyleOptions.MapBox.defaultStyle) {
            // get from options if specified
            this.options.vectorStyleOptions.MapBox.defaultStyle = options.vectorStyleOptions.MapBox.defaultStyle;
        } else {
            // get from control default options otherwise
            this.options.vectorStyleOptions.MapBox.defaultStyle = new Style({
                image : LayerImport.DefaultStyles.image,
                stroke : LayerImport.DefaultStyles.stroke,
                fill : LayerImport.DefaultStyles.fill,
                text : LayerImport.DefaultStyles.text
            });
        }

        // merge layer types
        if (Array.isArray(options.layerTypes)) {
            var layerTypes = [];
            for (var i = 0; i < options.layerTypes.length; i++) {
                layerTypes.push(options.layerTypes[i]);
            }
            this.options.layerTypes = layerTypes;
        }

        // merge with user options
        Utils.mergeParams(this.options, options);

        /** {Boolean} specify if LayerImport control is collapsed (true) or not (false) */
        this.collapsed = this.options.collapsed;

        /** {Boolean} specify if LayerImport control is draggable (true) or not (false) */
        this.draggable = this.options.draggable;

        // identifiant du contrôle : utile pour suffixer les identifiants CSS (pour gérer le cas où il y en a plusieurs dans la même page)
        this._uid = SelectorID.generate();

        // si une requête est en cours ou non
        this._waiting = false;
        // timer pour cacher la patience après un certain temps
        this._timer = null;

        // initialisation des types d'import
        this._initImportTypes();
        // initialisation des styles par défaut
        this._initDefaultStyles();

        // ################################################################## //
        // ################### Elements principaux du DOM ################### //

        // containers principaux (FIXME : tous utiles ?)
        this._showImportInput = null;
        this._importPanel = null;
        this._importPanelHeader = null;
        this._formContainer = null;
        this._staticLocalImportInput = null;
        this._staticUrlImportInput = null;
        this._serviceUrlImportInput = null;
        this._getCapPanel = null;
        this._getCapResultsListContainer = null;
        this._mapBoxPanel = null;
        this._mapBoxResultsListContainer = null;

        this._waitingContainer = null;
        this._loadingContainer = null;

        // ################################################################## //
        // ################ Interrogation du GetCapabilities ################ //

        this._getCapRequestUrl = null;
        this._getCapResponseWMS = null;
        this._getCapResponseWMSLayers = [];
        this._getCapResponseWMTS = null;
        this._getCapResponseWMTSLayers = [];

        // ################################################################## //
        // ########################### MapBox ############################### //
        this.editor = null;
        this._mapBoxObj = null;
        this._mapBoxLayerId = null;

        // ################################################################## //
        // ########################### file or url ########################## //
        this.contentStatic = null;
        this._url = null;
        this._file = null;
    };

    /**
     * this method is called by this.initialize()
     * and makes sure input options are correctly formated
     *
     * @param {Object} options - control input options
     * @private
     */
    LayerImport.prototype._checkInputOptions = function (options) {
        // on vérifie le tableau des types
        if (options.layerTypes) {
            var layerTypes = options.layerTypes;
            // on vérifie que la liste des types est bien un tableau
            if (!Array.isArray(layerTypes)) {
                logger.warn("[ol.control.LayerImport] 'options.layerTypes' parameter should be an array. Set default values [\"KML\", \"GPX\", \"GeoJSON\", \"WMS\", \"WMTS\"]");
                options.layerTypes = [
                    "KML",
                    "GPX",
                    "GeoJSON",
                    "WMS",
                    "WMTS",
                    "MAPBOX"
                ];
            } else {
                var typesList = [
                    "KML",
                    "GPX",
                    "GEOJSON",
                    "WMS",
                    "WMTS",
                    "WFS",
                    "MAPBOX"
                ];
                var wrongTypesIndexes = [];
                for (var i = 0; i < layerTypes.length; i++) {
                    if (typeof layerTypes[i] !== "string") {
                        // si l'élément du tableau n'est pas une chaine de caractères, on stocke l'index pour le retirer du tableau
                        wrongTypesIndexes.push(i);
                        logger.warn("[ol.control.LayerImport] 'options.layerTypes' elements should be of type string (" + layerTypes[i] + ")");
                    } else {
                        // on passe en majuscules pour comparer
                        layerTypes[i] = layerTypes[i].toUpperCase();
                        if (typesList.indexOf(layerTypes[i]) === -1) {
                            // si le type n'est pas référencé, on stocke son index pour le retirer du tableau (après avoir terminé de parcourir le tableau)
                            wrongTypesIndexes.push(i);
                            logger.log("[ol.control.LayerImport] options.layerTypes : " + layerTypes[i] + " is not a supported type");
                        }
                        // cas spécial du GeoJSON qu'on ne laisse pas en majuscules
                        if (layerTypes[i] === "GEOJSON") {
                            layerTypes[i] = "GeoJSON";
                        }
                        if (layerTypes[i] === "MAPBOX") {
                            layerTypes[i] = "MAPBOX";
                        }
                    }
                }
                // on retire les types non référencés qu'on a pu rencontrer
                if (wrongTypesIndexes.length !== 0) {
                    for (var j = wrongTypesIndexes.length - 1; j >= 0; j--) {
                        layerTypes.splice(wrongTypesIndexes[j], 1);
                    }
                }
            }
        }
    };

    /**
     * this method is called by this.initialize()
     * and initializes default styles for vector layers (KML/GPX/GeoJSON)
     *
     * @private
     */
    LayerImport.prototype._initDefaultStyles = function () {
        var kmlDefaultStyles = this.options.vectorStyleOptions.KML.defaultStyle;
        this._defaultKMLStyle = new Style({
            image : kmlDefaultStyles.image,
            stroke : kmlDefaultStyles.stroke,
            fill : kmlDefaultStyles.fill,
            text : kmlDefaultStyles.text
        });
        var gpxDefaultStyles = this.options.vectorStyleOptions.GPX.defaultStyle;
        this._defaultGPXStyle = new Style({
            image : gpxDefaultStyles.image,
            stroke : gpxDefaultStyles.stroke,
            fill : gpxDefaultStyles.fill
        });
        var geoJSONDefaultStyles = this.options.vectorStyleOptions.GeoJSON.defaultStyle;
        this._defaultGeoJSONStyle = new Style({
            image : geoJSONDefaultStyles.image,
            stroke : geoJSONDefaultStyles.stroke,
            fill : geoJSONDefaultStyles.fill
        });
        var MapBoxDefaultStyles = this.options.vectorStyleOptions.MapBox.defaultStyle;
        this._defaultMapBoxStyle = new Style({
            image : MapBoxDefaultStyles.image,
            stroke : MapBoxDefaultStyles.stroke,
            fill : MapBoxDefaultStyles.fill,
            text : MapBoxDefaultStyles.text
        });
    };

    /**
     * this method is called by this.initialize()
     * and initializes import types parameter
     *
     * @private
     */
    LayerImport.prototype._initImportTypes = function () {
        this._currentImportType = this.options.layerTypes[0] || "KML";
        if (this._currentImportType === "KML" || this._currentImportType === "GPX" || this._currentImportType === "GeoJSON" || this._currentImportType === "MAPBOX") {
            this._isCurrentImportTypeStatic = true;
        } else if (this._currentImportType === "WMS" || this._currentImportType === "WMTS" || this._currentImportType === "WFS") {
            this._isCurrentImportTypeStatic = false;
        }
        this._currentStaticImportType = "local";
    };

    /**
     * Create control main container (DOM initialize)
     *
     * @private
     * @returns {DOMElement} container - control main container
     */
    LayerImport.prototype._initContainer = function () {
        // create main container
        var container = this._createMainContainerElement();

        // create show Import element
        var inputShow = this._showImportInput = this._createShowImportElement();
        container.appendChild(inputShow);

        // mode "collapsed"
        if (!this.collapsed) {
            inputShow.checked = true;
        }

        // create Import picto
        var picto = this._createShowImportPictoElement();
        container.appendChild(picto);

        // panel
        var importPanel = this._importPanel = this._createImportPanelElement();

        // header
        var panelHeader = this._importPanelHeader = this._createImportPanelHeaderElement();
        importPanel.appendChild(panelHeader);

        // form : initialisation du formulaire d'import des couches (types d'import et saisie de l'url / du fichier)
        var importForm = this._formContainer = this._initInputFormElement();
        importPanel.appendChild(importForm);

        container.appendChild(importPanel);

        // results (dans le panel)
        var getCapPanel = this._getCapPanel = this._createImportGetCapPanelElement();
        var getCapPanelHeader = this._createImportGetCapPanelHeaderElement();
        getCapPanel.appendChild(getCapPanelHeader);
        var importGetCapResultsList = this._getCapResultsListContainer = this._createImportGetCapResultsContainer();
        getCapPanel.appendChild(importGetCapResultsList);

        container.appendChild(getCapPanel);

        // mapbox panel results
        var mapBoxPanel = this._mapBoxPanel = this._createImportMapBoxPanelElement();
        var mapBoxPanelHeader = this._createImportMapBoxPanelHeaderElement();
        mapBoxPanel.appendChild(mapBoxPanelHeader);
        var importMapBoxResultsList = this._mapBoxResultsListContainer = this._createImportMapBoxResultsContainer();
        mapBoxPanel.appendChild(importMapBoxResultsList);

        // loading element mapbox
        var loading = this._loadingContainer = this._createLoadingElement();
        mapBoxPanel.appendChild(loading);

        container.appendChild(mapBoxPanel);

        // waiting
        var waiting = this._waitingContainer = this._createImportWaitingElement();
        container.appendChild(waiting);

        return container;
    };

    /**
     * Create control main container (DOM initialize)
     *
     * @private
     * @returns {DOMElement} importForm - form main container
     */
    LayerImport.prototype._initInputFormElement = function () {
        // form main container
        var importForm = this._createImportPanelFormElement();

        // Format choice
        var importTypeChoiceDiv = this._createImportTypeLineElement(this.options.layerTypes);
        importForm.appendChild(importTypeChoiceDiv);

        // params for KML/GPX/GeoJSON

        var importStaticParamsContainer = this._createImportStaticParamsContainer(this.options.layerTypes[0]);
        // static file name
        var staticNameLabel = this._createStaticNameLabel();
        importStaticParamsContainer.appendChild(staticNameLabel);
        // static import choice (local / url)
        var staticImportChoice = this._createStaticModeChoiceDiv();
        // TODO : passer un paramètre "checked" ??
        var staticLocalImportChoice = this._createStaticLocalChoiceDiv();
        staticImportChoice.appendChild(staticLocalImportChoice);
        var staticUrlImportChoice = this._createStaticUrlChoiceDiv();
        staticImportChoice.appendChild(staticUrlImportChoice);
        importStaticParamsContainer.appendChild(staticImportChoice);

        // div for local file import
        var staticLocalInputDiv = this._createStaticLocalInputDiv();
        // label
        staticLocalInputDiv.appendChild(this._createStaticLocalInputLabel());
        // file input
        this._staticLocalImportInput = this._createStaticLocalInput();
        staticLocalInputDiv.appendChild(this._staticLocalImportInput);
        // append div to params container
        importStaticParamsContainer.appendChild(staticLocalInputDiv);

        // div for url input (info: séparation pour récupérer l'élément input)
        var staticUrlInputDiv = this._createStaticUrlInputDiv();
        // label
        staticUrlInputDiv.appendChild(this._createStaticUrlInputLabel());
        // url input
        this._staticUrlImportInput = this._createStaticUrlInput();
        staticUrlInputDiv.appendChild(this._staticUrlImportInput);
        // append div to params container
        importStaticParamsContainer.appendChild(staticUrlInputDiv);

        // append static params container to form container
        importForm.appendChild(importStaticParamsContainer);

        // params for WMS/WMTS/WFS

        var importServiceParamsContainer = this._createServiceParamsContainer(this.options.layerTypes[0]);
        // div for service url
        var importServiceUrlDiv = this._createServiceUrlDiv();
        // label
        importServiceUrlDiv.appendChild(this._createServiceUrlInputLabel());
        // input
        this._serviceUrlImportInput = this._createServiceUrlInput();
        importServiceUrlDiv.appendChild(this._serviceUrlImportInput);
        // append div to params container
        importServiceParamsContainer.appendChild(importServiceUrlDiv);
        // append service params container to form container
        importForm.appendChild(importServiceParamsContainer);

        // submit (bouton "Importer")
        var submit = this._createImportSubmitFormElement();
        importForm.appendChild(submit);

        return importForm;
    };

    // ################################################################### //
    // ######################### DOM events ############################## //
    // ################################################################### //

    /**
     * this method is called by event 'click' on 'GPshowImportPicto' picto
     * (cf. LayerImportDOM._createShowImportPictoElement),
     * and dispatch event change:collapsed (for tools listening this property)
     *
     * @private
     */
    LayerImport.prototype._onShowImportClick = function () {
        // on affiche les resultats d'une couche MapBox
        if (this._mapBoxObj) {
            this._mapBoxPanel.style.display = "block";
        }
        // info : on génère nous même l'evenement OpenLayers de changement de propriété
        // (utiliser ol.control.LayerImport.on("change:collapsed", function ) pour s'abonner à cet évènement)
        this.collapsed = this._showImportInput.checked;
        this.dispatchEvent("change:collapsed");
    };

    /**
     * this method is called by event 'change' on 'GPimportType' tag form
     * (cf. LayerImportDOM._createImportTypeLineElement),
     * and change current import type
     *
     * @param {Object} e - HTMLElement
     * @private
     */
    LayerImport.prototype._onImportTypeChange = function (e) {
        this._currentImportType = e.target.value;
        if (this._currentImportType === "KML" || this._currentImportType === "GPX" || this._currentImportType === "GeoJSON" || this._currentImportType === "MAPBOX") {
            this._isCurrentImportTypeStatic = true;
        } else if (this._currentImportType === "WMS" || this._currentImportType === "WMTS" || this._currentImportType === "WFS") {
            this._isCurrentImportTypeStatic = false;
        }
    };

    /**
     * this method is called by event 'change' on 'GPimportType' tag form
     * (cf. LayerImportDOM._createImportTypeLineElement),
     * and change current import type
     *
     * @param {Object} e - HTMLElement
     * @private
     */
    LayerImport.prototype._onStaticImportTypeChange = function (e) {
        this._currentStaticImportType = e.target.value;
    };

    /**
     * this method is called by event 'click' on 'GPimportGetCapPanelClose' tag form
     * (cf. LayerImportDOM._createImportGetCapPanelHeaderElement),
     * and reset getCapabilities information
     *
     * @private
     */
    LayerImport.prototype._onGetCapPanelClose = function () {
        // this._clearGetCapParams();
        if (this._currentImportType === "WMS" ||
        this._currentImportType === "WMTS" ||
        this._currentImportType === "WFS") {
            this.cleanGetCapResultsList();
        }
    };

    /**
     * this method is called by event 'click' on 'GPimportMapBoxPanelClose' tag form
     * (cf. LayerImportDOM._createImportMapBoxPanelHeaderElement),
     * and reset mapbox information
     *
     * @private
     */
    LayerImport.prototype._onMapBoxPanelClose = function () {
        this.cleanMapBoxResultsList();
        this._loadingContainer.className = "";
    };

    /**
     * this method is called by event 'click' on 'GPimportMapBoxPanelReturnPicto' tag form
     * (cf. LayerImportDOM._createImportMapBoxPanelHeaderElement),
     * and return to information
     *
     * @param {Object} e - HTMLElement
     * @private
     */
    LayerImport.prototype._onMapBoxReturnPictoClick = function (e) {
        // on bascule sur l'icone d'ouverture du composant
        this._mapBoxPanel.style.display = "none";
        this._showImportInput.checked = false;
        this._loadingContainer.className = "";
    };

    // ################################################################### //
    // ######################## Submit form ############################## //
    // ################################################################### //

    /**
     * this method is called by event 'submit' on 'GPimportForm' tag form
     * (cf. LayerImportDOM._createImportPanelFormElement),
     * and import static layer or call getCap service (according to import type)
     *
     * @private
     */
    LayerImport.prototype._onImportSubmit = function () {
        logger.log("import d'une couche de type : " + this._currentImportType);

        // reinitialisation du contenu d'un import de type
        // - static (KML ou GPX ou GeoJSON)
        this.contentStatic = null;
        // - service (WMS, ...)
        this.contentService = null;

        if (this._isCurrentImportTypeStatic) {
            this._importStaticLayer();
        } else {
            this._importServiceLayers();
        }
    };

    // ################################################################### //
    // ############## Import KML/GPX/GeoJSON/MapBox layers ############### //
    // ################################################################### //

    /**
     * this method is called by this_onImportSubmit method
     * and import static layer (KML/GPX/GeoJSON) from url or file
     *
     * @private
     */
    LayerImport.prototype._importStaticLayer = function () {
        var layerName;
        var staticImportNameInput = document.getElementById(this._addUID("GPimportName"));
        if (staticImportNameInput) {
            layerName = staticImportNameInput.value || "";
            logger.log("import layer name : " + layerName);
        }

        if (this._currentStaticImportType === "local") {
            logger.log("import static layer from local file");
            this._importStaticLayerFromLocalFile(layerName);
        } else if (this._currentStaticImportType === "url") {
            logger.log("import static layer from url");
            this._importStaticLayerFromUrl(layerName);
        }
    };

    /**
     * this method is called by _importStaticLayer method
     * and import static layer (KML/GPX/GeoJSON) from url
     *
     * @param {String} layerName - imported layer name
     * @private
     */
    LayerImport.prototype._importStaticLayerFromUrl = function (layerName) {
        layerName = layerName || "";

        // 1. Récupération de l'url
        var url = this._staticUrlImportInput.value;
        logger.log("url : ", url);
        if (url.length === 0) {
            logger.error("[ol.control.LayerImport] url parameter is mandatory");
            return;
        }
        // on supprime les éventuels espaces avant ou après
        if (url.trim) {
            url = url.trim();
        }

        // sauvegarde
        this._url = url;

        // 2. récupération proxy
        if (!this.options.webServicesOptions || (!this.options.webServicesOptions.proxyUrl && !this.options.webServicesOptions.noProxyDomains)) {
            logger.error("[ol.control.LayerImport] options.webServicesOptions.proxyUrl parameter is mandatory to request resources on another domain (cross-domain)");
            return;
        };

        url = ProxyUtils.proxifyUrl(url, this.options.webServicesOptions);

        // FIXME pb de surcharge en mode UMD !? ça ne marche pas...
        // this._hideWaitingContainer();
        // this._addFeaturesFromImportStaticLayerUrl(url, layerName);

        var context = this;
        Gp.Protocols.XHR.call({
            url : url,
            method : "GET",
            timeOut : 15000,
            // on success callback : display results in container
            onResponse : function (response) {
                context._hideWaitingContainer();
                context._addFeaturesFromImportStaticLayer(response, layerName);
            },
            // on error callback : log error
            onFailure : function (error) {
                // en cas d'erreur, on revient au panel initial et on cache la patience
                context._hideWaitingContainer();
                logger.error("[ol.control.LayerImport] KML/GPX/GeoJSON/MapBox request failed : ", error);
            }
        });
    };

    /**
     * this method is called by _importStaticLayer method
     * and import static layer (KML/GPX/GeoJSON) from local file
     *
     * @param {String} layerName - imported layer name
     * @private
     */
    LayerImport.prototype._importStaticLayerFromLocalFile = function (layerName) {
        var file = this._staticLocalImportInput.files[0];
        if (!file) {
            logger.warn("[ol.control.LayerImport] missing file");
            return;
        }

        // sauvegarde
        this._file = file;

        // Création d'un objet FileReader qui permet de lire le contenu du fichier chargé
        var fReader = new FileReader();

        // Définition des fonctions de callbacks associées au reader,
        // notamment la fonction onload qui affichera les entités chargées à la carte
        var context = this;
        // on readAsText error
        fReader.onerror = function (e) {
            // en cas d'erreur, on revient au panel initial et on cache la patience
            context._hideWaitingContainer();
            logger.error("error fileReader : ", e);
        };
        /** on readAsText progress */
        fReader.onprogress = function () {
            logger.log("onprogress");
        };
        /** on load start */
        fReader.onloadstart = function () {
            // affichage d'une patience le temps du chargement
            context._displayWaitingContainer();
            logger.log("onloadstart");
        };
        /** on readAsText abort */
        fReader.onabort = function () {
            // en cas d'erreur, on revient au panel initial et on cache la patience
            context._hideWaitingContainer();
            logger.log("onabort");
        };
        // on readAsText loadend
        fReader.onloadend = function (e) {
            // fReader = null ?
            // en cas d'erreur, on revient au panel initial et on cache la patience
            // context._hideWaitingContainer();
            // TODO : replier le formulaire ?
            logger.log("onloadend : ", e);
        };
        // on readAsText load
        fReader.onload = function (e) {
            logger.log("fileReader onload - file content : ", e.target.result);

            // on cache la patience
            context._hideWaitingContainer();
            context._addFeaturesFromImportStaticLayer(e.target.result, layerName);
        };

        // Lecture du fichier chargé à l'aide de fileReader
        fReader.readAsText(file);
    };

    /**
     * this method is called by _importStaticLayerFom* method
     * and add features to the map
     *
     * @param {String} fileContent - content file
     * @param {String} layerName - imported layer name
     * @private
     */
    LayerImport.prototype._addFeaturesFromImportStaticLayer = function (fileContent, layerName) {
        // récupération du contenu du fichier
        var map = this.getMap();
        if (!map || !fileContent) {
            return;
        }

        var vectorLayer = null;
        var vectorSource = null;
        var vectorFormat = null;
        var vectorStyle = null;

        // sauvegarde du content KML/GPX/GeoJSON/MapBox
        this.contentStatic = fileContent;

        if (this._currentImportType === "MAPBOX") {
            // FIXME
            // on ne nettoie pas délibérément la liste de résultats de type MapBox
            // car on souhaite pouvoir interagir sur les couches (editeur).
            // du coup, à chaque import, on empile les éditeurs.
            // this.cleanMapBoxResultsList();

            // contexte
            var self = this;

            // style mapbox
            var _glStyle = this._mapBoxObj = JSON.parse(fileContent);

            // liste des sources
            var _glSources = _glStyle.sources;

            // FIXME a t on du multi-sources ? 
            // mais comment doit on les traiter ?
            // EXPERIMENTAL !
            var _multiSources = (Object.keys(_glSources).length > 1) ? 1 : 0;

            for (var _glSourceId in _glSources) {
                if (_glSources.hasOwnProperty(_glSourceId)) {
                    var _title = "";
                    var _description = "";
                    var _quicklookUrl = null;
                    var _legends = null;
                    var _metadata = null;
                    var _originators = null;

                    // lecture des informations dans le style
                    // ex. metadata : {
                    //    geoportail:[title | description | quicklookUrl | legends | originators | metadata]
                    // }
                    if (_glStyle.metadata) {
                        for (var ns in _glStyle.metadata) {
                            if (_glStyle.metadata.hasOwnProperty(ns)) {
                                var _keys = ns.split(":");
                                if (_keys[0] === "geoportail") {
                                    var key = _keys[1];
                                    if (key === "title") {
                                        _title = _glStyle.metadata[ns];
                                        continue;
                                    }
                                    if (key === "description") {
                                        _description = _glStyle.metadata[ns];
                                        continue;
                                    }
                                    if (key === "quicklookUrl") {
                                        _quicklookUrl = _glStyle.metadata[ns];
                                        continue;
                                    }
                                    if (key === "legends") {
                                        _legends = _glStyle.metadata[ns];
                                        continue;
                                    }
                                    if (key === "metadata") {
                                        _metadata = _glStyle.metadata[ns];
                                        continue;
                                    }
                                    if (key === "originators") {
                                        _originators = _glStyle.metadata[ns];
                                        continue;
                                    }
                                }
                            }
                        }
                    }

                    // titre par defaut
                    if (!_title) {
                        _title = "Couche MapBox";
                    }
                    // description par defaut
                    if (!_description) {
                        _description = "Couche MapBox";
                    }
                    // cas des multisources
                    _title = (_multiSources) ? _title + "(" + _glSourceId + ")" : _title;

                    // source mapbox
                    var _glSource = _glSources[_glSourceId];

                    // construction de la couche en fonction du type
                    var _glType = _glSource.type;

                    if (_glType === "vector") {
                        // url du tilejson ou flux mapbox
                        var _glUrl = _glSource.url;
                        // url du service tuilé
                        var _glTiles = _glSource.tiles;
                        // sprites
                        var _glSprite = _glStyle.sprite;

                        // FIXME si on a un import par fichier local (this._file),
                        // - comment passe t on la clef / le token ?
                        // - comment remplacer un flux mapbox sur une url de service tuilé avec un import local ?
                        if (_glUrl && _glUrl.indexOf("mapbox://") === 0) {
                            var _urlService = this._url; // FIXME si fichier local !?
                            if (_urlService) {
                                _glTiles = ["a", "b", "c", "d"].map(function (host) {
                                    var path = _glUrl.replace("mapbox://", "");
                                    var accessToken = _urlService.split("?")[1];
                                    return "https://" +
                                    host + ".tiles.mapbox.com/v4/" +
                                    path + "/{z}/{x}/{y}.vector.pbf?" +
                                    accessToken;
                                });
                                // conversion des sprites sur un autre scheme que "mapbox://"
                                if (_glSprite.indexOf("mapbox://") === 0) {
                                    var s = _urlService.split("?"); // FIXME si fichier local !?
                                    _glStyle.sprite = s[0] + "/sprite" + "?" + s[1];
                                }
                            } else {
                                logger.warn("Not yet implemented, can't use the local import scheme with a 'mapbox://' in the file.!");
                            }
                        }

                        if (_glTiles) {
                            // service tuilé et/ou mapbox
                            vectorFormat = new MVT(/* { featureClass : RenderFeature } */);
                            vectorSource = new VectorTileSource({
                                attributions : _glSource.attribution,
                                format : vectorFormat,
                                tileGrid : olCreateXYZTileGrid({ // TODO scheme tms ?
                                    extent : _glSource.bounds, // [minx, miny, maxx, maxy]
                                    maxZoom : _glSource.maxzoom || 22,
                                    minZoom : _glSource.minzoom || 1,
                                    tileSize : _glSource.tileSize || 256
                                }),
                                urls : _glTiles
                            });
                            vectorSource._title = _title;
                            vectorSource._description = _description;
                            vectorSource._quicklookUrl = _quicklookUrl;
                            vectorSource._metadata = _metadata;
                            vectorSource._legends = _legends;
                            vectorSource._originators = _originators;
                            // waiting
                            vectorSource.on("tileloadstart", function (e) {
                                self._loadingContainer.className = "GPmapLoadingVisible";
                            });
                            vectorSource.on("tileloadend", function (e) {
                                self._loadingContainer.className = "";
                            });
                            vectorSource.on("tileloaderror", function (e) {
                                self._loadingContainer.className = "";
                            });
                            vectorLayer = new VectorTileLayer({
                                source : vectorSource,
                                visible : false,
                                // zIndex: 0, // FIXME gerer l'ordre sur des multisources ?
                                declutter : true // TODO utile ?
                            });
                            this._mapBoxLayerId = vectorLayer.id = _glSourceId;
                            vectorLayer.gpResultLayerId = "layerimport:" + this._currentImportType;
                        } else if (_glUrl) {
                            // service avec un tilejson
                            vectorFormat = new MVT(/* { featureClass : RenderFeature } */);
                            vectorLayer = new VectorTileLayer({
                                visible : false,
                                // zIndex : 0
                                declutter : true
                            });
                            this._mapBoxLayerId = vectorLayer.id = _glSourceId;
                            vectorLayer.gpResultLayerId = "layerimport:" + this._currentImportType;
                            var vectorTileJson = new TileJSONSource({
                                url : _glUrl
                            });
                            // lecture du tilejson avec extension IGN
                            // les extensions sont enregistrées
                            // dans les propriétés de la couche : layer.set(mapbox-extension)
                            // pour une utilisation ulterieur (ex. editeur)
                            var _key = vectorTileJson.on("change", function () {
                                if (vectorTileJson.getState() === "ready") {
                                    var _tileJSONDoc = vectorTileJson.getTileJSON();

                                    var tiles = Array.isArray(_tileJSONDoc.tiles) ? _tileJSONDoc.tiles : [_tileJSONDoc.tiles];
                                    for (var i = 0; i < tiles.length; i++) {
                                        var tile = tiles[i];
                                        if (tile.indexOf("http") !== 0) {
                                            tiles[i] = _glUrl + tile;
                                        }
                                    }
                                    vectorSource = new VectorTileSource({
                                        attributions : vectorTileJson.getAttributions() || _tileJSONDoc.attribution,
                                        format : vectorFormat,
                                        tileGrid : olCreateXYZTileGrid({
                                            extent : _glSource.bounds, // [minx, miny, maxx, maxy]
                                            maxZoom : _tileJSONDoc.maxzoom || _glSource.maxzoom || 22,
                                            minZoom : _tileJSONDoc.minzoom || _glSource.minzoom || 0,
                                            tileSize : _tileJSONDoc.tileSize || _glSource.tileSize || 256
                                        }),
                                        urls : tiles
                                    });
                                    vectorSource._title = _title;
                                    vectorSource._description = _description;
                                    vectorSource._quicklookUrl = _quicklookUrl;
                                    vectorSource._metadata = _metadata;
                                    vectorSource._legends = _legends;
                                    vectorSource._originators = _originators;
                                    // waiting
                                    vectorSource.on("tileloadstart", function (e) {
                                        self._loadingContainer.className = "GPmapLoadingVisible";
                                    });
                                    vectorSource.on("tileloadend", function (e) {
                                        self._loadingContainer.className = "";
                                    });
                                    vectorLayer.setSource(vectorSource);
                                    vectorLayer.set("mapbox-extension", _tileJSONDoc["vector_layers"]);
                                    olObservableUnByKey(_key);
                                }
                            });
                        }
                    } else if (_glType === "geojson") {
                        // FIXME
                        // - cas avec un objet de type features ?
                        // - cas avec une url relative ?
                        var _glData = _glSource.data;

                        vectorFormat = new GeoJSON();
                        vectorSource = new VectorTileSource({
                            attributions : _glSource.attribution,
                            format : vectorFormat,
                            url : _glData
                        });
                        vectorSource._title = _title;
                        vectorSource._description = _description;
                        vectorSource._quicklookUrl = _quicklookUrl;
                        vectorSource._metadata = _metadata;
                        vectorSource._legends = _legends;
                        vectorSource._originators = _originators;
                        vectorLayer = new VectorTileLayer({
                            source : vectorSource,
                            visible : false,
                            // zIndex: 0, // FIXME gerer l'ordre sur des multisources ?
                            declutter : true // TODO utile ?
                        });
                        this._mapBoxLayerId = vectorLayer.id = _glSourceId;
                        vectorLayer.gpResultLayerId = "layerimport:" + this._currentImportType;
                    } else {
                        logger.warn("Type MapBox format unknown !");
                        return;
                    }

                    // parametre à transmettre à la fonction auto-invoquée
                    var params = {
                        id : _glSourceId,
                        styles : _glStyle,
                        layer : vectorLayer,
                        options : {
                            title : layerName || _title,
                            description : _description,
                            quicklookUrl : _quicklookUrl,
                            metadata : _metadata,
                            legends : _legends,
                            originators : _originators
                        }
                    };
                    // fonction auto-invoquée
                    (function (p) {
                        // TODO ajouter le style de type background !
                        // fonction de style de la couche
                        var setStyle = function () {
                            applyStyleOlms(p.layer, p.styles, p.id)
                                .then(function () {
                                    var visibility = true;
                                    p.layer.setVisible(visibility);
                                    var opacity = 1;
                                    p.layer.setOpacity(opacity);
                                })
                                .then(function () {
                                    // gestion du centre sur la carte si center renseigné !
                                    var projCode = map.getView().getProjection().getCode();
                                    if (map.getView() && p.styles.center && p.styles.center.length) {
                                        map.getView().setCenter(olTransformProj(p.styles.center, "EPSG:4326", projCode));
                                    }

                                    // gestion du zoom sur la carte si zoom renseigné !
                                    if (map.getView() && (p.styles.zoom || p.styles.zoom === 0)) {
                                        map.getView().setZoom(p.styles.zoom);
                                    }

                                    // zoom sur l'étendue des entités récupérées (si possible)
                                    var source = p.layer.getSource();
                                    if (map.getView() && map.getSize() && source.getExtent) {
                                        var sourceExtent = source.getExtent();
                                        if (sourceExtent && sourceExtent[0] !== Infinity) {
                                            map.getView().fit(source.getExtent(), map.getSize());
                                        }
                                    }
                                })
                                .then(function () {})
                                .catch(function (e) {
                                    logger.error(e);
                                });
                        };

                        // etat des layers en cours
                        logger.warn(p.layer);

                        // ajout des styles dans la carte pour une utilisation
                        // eventuelle (ex. editeur)
                        // > map.set("mapbox-styles")
                        var _allStyles = map.get("mapbox-styles") || {};
                        _allStyles[p.id] = p.styles;
                        map.set("mapbox-styles", _allStyles);

                        // ajout des differents styles de la couche
                        // pour une utilisation eventuelle (ex. editeur)
                        // > layer.set("mapbox-styles")
                        var _styles = [];
                        var _glLayers = p.styles.layers;
                        for (var ii = 0; ii < _glLayers.length; ii++) {
                            var _glLayer = _glLayers[ii];
                            if (_glLayer.source === p.id) {
                                _styles.push(_glLayer);
                                continue;
                            }
                        }
                        p.layer.set("mapbox-styles", _styles);

                        // ajout du layer sur la carte
                        map.addLayer(p.layer);

                        // application du style
                        if (p.layer.getSource()) {
                            setStyle();
                        } else {
                            p.layer.once("change:source", setStyle);
                        }

                        // maj du gestionnaire de couche
                        map.getControls().forEach(
                            (control) => {
                                if (control instanceof LayerSwitcher) {
                                    control.addLayer(
                                        p.layer,
                                        p.options
                                    );
                                }
                            }
                        );
                    })(params);
                }
            }

            // affichage du panneau des couches accessibles à l'edition
            this._importPanel.style.display = "none";
            this._mapBoxPanel.style.display = "block";

            // editeur de styles
            this.editor = new Editor({
                target : this._mapBoxResultsListContainer,
                style : this._mapBoxObj,
                scope : this,
                events : {
                    "editor:layer:onclickvisibility" : this._onChangeVisibilitySourceMapBox,
                    "editor:style:scale:onchangemin" : this._onChangeScaleMinSourceMapBox,
                    "editor:style:scale:onchangemax" : this._onChangeScaleMaxSourceMapBox,
                    "editor:legend:onchangevalue" : this._onChangeLegendValueSourceMapBox
                },
                tools : {
                    themes : false,
                    layers : true,
                    style : this.options.vectorStyleOptions.MapBox.tools.style,
                    filter : this.options.vectorStyleOptions.MapBox.tools.filter,
                    legend : true,
                    group : false
                }
            });
            this.editor.createElement();

            // TODO style par defaut au cas où l'application du style échoue !
            // FIXME bug avec le geojson, très bizarre !?
            //      Si on desactive l'editeur, OK
            //      Sinon NOK !?
            // FIXME event sur la suppression de la couche afin de fermer le panneau !
            // TODO au niveau de la couche : minResolution et maxResolution
        } else {
            if (this._currentImportType === "KML") {
                // lecture du fichier KML : création d'un format ol.format.KML, qui possède une méthode readFeatures (et readProjection)
                vectorFormat = new KMLExtended({
                    showPointNames : this.options.vectorStyleOptions.KML.showPointNames,
                    extractStyles : this.options.vectorStyleOptions.KML.extractStyles,
                    defaultStyle : [
                        this.options.vectorStyleOptions.KML.defaultStyle
                    ]
                });
                vectorStyle = this.options.vectorStyleOptions.KML.defaultStyle;
            } else
            if (this._currentImportType === "GPX") {
                // lecture du fichier GPX : création d'un format ol.format.GPX, qui possède une méthode readFeatures (et readProjection)
                vectorFormat = new GPX();
                vectorStyle = this.options.vectorStyleOptions.GPX.defaultStyle;
            } else
            if (this._currentImportType === "GeoJSON") {
                // lecture du fichier GeoJSON : création d'un format ol.format.GeoJSON, qui possède une méthode readFeatures (et readProjection)
                vectorFormat = new GeoJSON();
                vectorStyle = this.options.vectorStyleOptions.GeoJSON.defaultStyle;
            }

            // lecture de la géométrie des entités à partir du fichier, pour éventuelle reprojection.
            var fileProj = vectorFormat.readProjection(fileContent);
            // récupération de la projection de la carte pour reprojection des géométries
            var mapProj = this._getMapProjectionCode();

            // récupération des entités avec reprojection éventuelle des géométries
            var features = null;
            features = vectorFormat.readFeatures(
                fileContent, {
                    dataProjection : fileProj,
                    featureProjection : mapProj
                }
            );

            logger.log("loaded features : ", features);

            // création d'une couche vectorielle à partir de ces features
            vectorSource = new VectorSource({
                features : new Collection()
            });
            vectorSource.addFeatures(features);

            logger.trace(vectorSource);

            // ajout des informations pour le layerSwitcher (titre, description)
            if (layerName) {
                vectorSource._title = vectorSource._description = layerName;
            } else {
                if (vectorFormat.readName && vectorFormat.readName(fileContent)) {
                    vectorSource._title = vectorSource._description = vectorFormat.readName(fileContent);
                } else {
                    vectorSource._title = vectorSource._description = "Import " + this._currentImportType;
                    logger.log("[ol.control.LayerImport] set default name \"Import " + this._currentImportType + "\"");
                }
            }

            vectorLayer = new VectorLayer({
                source : vectorSource,
                style : vectorStyle
            });

            // on rajoute le champ gpResultLayerId permettant d'identifier une couche crée par le composant. (pour layerSwitcher par ex)
            vectorLayer.gpResultLayerId = "layerimport:" + this._currentImportType;
            map.addLayer(vectorLayer);

            // TODO : appeler fonction commune
            // zoom sur l'étendue des entités récupérées (si possible)
            if (map.getView() && map.getSize() && vectorSource.getExtent) {
                var sourceExtent = vectorSource.getExtent();
                if (sourceExtent && sourceExtent[0] !== Infinity) {
                    map.getView().fit(vectorSource.getExtent(), map.getSize());
                }
            }
        }
    };

    /**
     * NOT USE : this method is called by _importStaticLayerFom* method
     * and add features to the map
     *
     * @param {String} url - url
     * @param {String} layerName - imported layer name
     * @private
     */
    LayerImport.prototype._addFeaturesFromImportStaticLayerUrl = function (url, layerName) {
        // récupération du contenu du fichier
        var map = this.getMap();
        if (!map || !url) {
            return;
        }

        var vectorSource;
        var vectorLayer;
        var vectorFormat;
        if (this._currentImportType === "MAPBOX") {
            // TODO
            logger.trace("Not yet implemented !");
        } else {
            if (this._currentImportType === "KML") {
                // lecture du fichier KML : création d'un format ol.format.KML, qui possède une méthode readFeatures (et readProjection)
                vectorFormat = new KMLExtended({
                    showPointNames : true, // FIXME option !
                    extractStyles : this.options.vectorStyleOptions.KML.extractStyles,
                    defaultStyle : [
                        this.options.vectorStyleOptions.KML.defaultStyle
                    ]
                });
            } else if (this._currentImportType === "GPX") {
                // lecture du fichier GPX : création d'un format ol.format.GPX, qui possède une méthode readFeatures (et readProjection)
                vectorFormat = new GPX();
            } else if (this._currentImportType === "GeoJSON") {
                // lecture du fichier GeoJSON : création d'un format ol.format.GeoJSON, qui possède une méthode readFeatures (et readProjection)
                vectorFormat = new GeoJSON();
            }

            // création d'une couche vectorielle à partir de ces features
            vectorSource = new VectorSource({
                url : url,
                format : vectorFormat
            });

            if (this._currentImportType === "GPX") {
                vectorSource.forEachFeature(
                    function (feature) {
                        // si aucun style n'est associé au feature
                        if (feature.getStyle() == null) {
                            logger.log("[ol.control.LayerImport] set default style for GPX feature");
                            feature.setStyle(
                                this.options.vectorStyleOptions.GPX.defaultStyle
                            );
                        }
                    }
                );
            }
            if (this._currentImportType === "GeoJSON") {
                vectorSource.forEachFeature(
                    function (feature) {
                        // si aucun style n'est associé au feature
                        if (feature.getStyle() == null) {
                            logger.log("[ol.control.LayerImport] set default style for GeoJSON feature");
                            feature.setStyle(
                                this.options.vectorStyleOptions.GeoJSON.defaultStyle
                            );
                        }
                    }
                );
            }

            // ajout des informations pour le layerSwitcher (titre, description)
            if (layerName) {
                vectorSource._title = vectorSource._description = layerName;
            } else {
                vectorSource._title = vectorSource._description = "Import " + this._currentImportType;
            }

            vectorLayer = new VectorLayer({
                source : vectorSource
            });
        }

        // on rajoute le champ gpResultLayerId permettant d'identifier une couche crée par le composant. (pour layerSwitcher par ex)
        vectorLayer.gpResultLayerId = "layerimport:" + this._currentImportType;
        map.addLayer(vectorLayer);

        // TODO : appeler fonction commune
        // zoom sur l'étendue des entités récupérées (si possible)
        if (map.getView() && map.getSize() && vectorSource.getExtent) {
            var sourceExtent = vectorSource.getExtent();
            if (sourceExtent && sourceExtent[0] !== Infinity) {
                map.getView().fit(vectorSource.getExtent(), map.getSize());
            }
        }
    };

    // Events MapBox DOM

    /**
     * this method is called on '_addImportMapBoxVisibilitySource' input click
     * and change visibility source to map
     *
     * @param {Object} e - HTMLElement
     * @private
     */
    LayerImport.prototype._onChangeVisibilitySourceMapBox = function (e) {
        var data = e.target.data.obj;
        var target = e.target.srcElement;

        var map = this.getMap();
        map.getLayers().forEach((layer) => {
            // logger.trace(layer);
            if (layer.get("mapbox-source") === data.source) {
                // reload style with new param : layout.visibility : "visible" or "none"...
                var layers = this._mapBoxObj.layers;
                for (var i = 0; i < layers.length; i++) {
                    if (layers[i].id === data.id) {
                        var layout = layers[i].layout;
                        if (layout) {
                            layout.visibility = (target.checked) ? "visible" : "none";
                        } else {
                            layers[i].layout = {
                                visibility : (target.checked) ? "visible" : "none"
                            };
                        }
                        break;
                    }
                }
                applyStyleOlms(layer, this._mapBoxObj, data.source)
                    .then(function () {})
                    .catch(function (error) {
                        logger.error(error);
                    });
            }
        });
    };

    /**
     * this method is called on '_addImportMapBoxScaleSource' input slide
     * and change zoom source to map
     *
     * @param {Object} e - HTMLElement
     * @private
     */
    LayerImport.prototype._onChangeScaleMinSourceMapBox = function (e) {
        var data = e.target.data.obj;
        var target = e.target.srcElement;

        var map = this.getMap();
        map.getLayers().forEach((layer) => {
            // logger.trace(layer);
            if (layer.get("mapbox-source") === data.source) {
                // reload style with new param : minZoom = ...
                var layers = this._mapBoxObj.layers;
                for (var i = 0; i < layers.length; i++) {
                    if (layers[i].id === data.id) {
                        layers[i].minzoom = target.value;
                        target.title = target.value;
                        break;
                    }
                }
                applyStyleOlms(layer, this._mapBoxObj, data.source)
                    .then(function () {})
                    .catch(function (error) {
                        logger.error(error);
                    });
            }
        });
    };

    /**
     * this method is called on '_addImportMapBoxScaleSource' input slide
     * and change zoom source to map
     *
     * @param {Object} e - HTMLElement
     * @private
     */
    LayerImport.prototype._onChangeScaleMaxSourceMapBox = function (e) {
        var data = e.target.data.obj;
        var target = e.target.srcElement;

        var map = this.getMap();
        map.getLayers().forEach((layer) => {
            // logger.trace(layer);
            if (layer.get("mapbox-source") === data.source) {
                // reload style with new param : minZoom = ...
                var layers = this._mapBoxObj.layers;
                for (var i = 0; i < layers.length; i++) {
                    if (layers[i].id === data.id) {
                        layers[i].maxzoom = target.value;
                        target.title = target.value;
                        break;
                    }
                }
                applyStyleOlms(layer, this._mapBoxObj, data.source)
                    .then(function () {})
                    .catch(function (error) {
                        logger.error(error);
                    });
            }
        });
    };

    /**
     * this method is called on ''
     * and change zoom source to map
     *
     * @param {Object} e - HTMLElement
     * @private
     */
    LayerImport.prototype._onChangeLegendValueSourceMapBox = function (e) {
        var data = e.target.data.obj;
        var target = e.target.srcElement;

        var map = this.getMap();
        map.getLayers().forEach((layer) => {
            // logger.trace(layer);
            if (layer.get("mapbox-source") === data.source) {
                // reload style with new param :
                var layers = this._mapBoxObj.layers;
                for (var i = 0; i < layers.length; i++) {
                    if (layers[i].id === data.id) {
                        var paint = layers[i].paint;
                        if (paint) {
                            paint[target.id] = target.value;
                        }
                        break;
                    }
                }
                applyStyleOlms(layer, this._mapBoxObj, data.source)
                    .then(function () {})
                    .catch(function (error) {
                        logger.error(error);
                    });
            }
        });
    };

    // ################################################################### //
    // #################### Import WMS/WMTS layers ####################### //
    // ################################################################### //

    /**
     * this method is called by this_onImportSubmit method
     * and call getCap service from specified url, then display layers list in new panel
     *
     * @private
     */
    LayerImport.prototype._importServiceLayers = function () {
        if (this._currentImportType === "WFS") {
            logger.warn("[ol.control.LayerImport] WFS layer import is not implemented yet");
            return;
        }

        // 0. on vide d'éventuels résultats précédents dans le panel GetCapResults
        this.cleanGetCapResultsList();

        // 1. récupération de l'url renseignée
        var url = this._getCapRequestUrl = this._serviceUrlImportInput.value;
        if (!url) {
            logger.error("[ol.control.LayerImport] url parameter is mandatory");
            return;
        }
        logger.log("url : ", url);

        // on supprime les éventuels espaces avant ou après
        if (url.trim) {
            url = url.trim();
        }
        // Info : on ajoute des paramètres uniquement si l'utilisateur n'en a pas déjà saisi (on vérifie la position du caractère "?")
        var questionMarkIndex = url.indexOf("?");
        if (questionMarkIndex < 0) {
            // dans le cas d'une url du type http://wxs.ign.fr/geoportail/wmts
            url += "?SERVICE=" + this._currentImportType + "&REQUEST=GetCapabilities";
        } else if (questionMarkIndex === (url.length - 1)) {
            // dans le cas où l'url se termine par "?"
            url += "SERVICE=" + this._currentImportType + "&REQUEST=GetCapabilities";
        }
        // si on n'est pas dans ces deux cas : l'utilisateur a déjà saisit des paramètres après "?" => on ne fait rien.

        // 2. récupération proxy
        if (!this.options.webServicesOptions || (!this.options.webServicesOptions.proxyUrl && !this.options.webServicesOptions.noProxyDomains)) {
            logger.error("[ol.control.LayerImport] options.webServicesOptions.proxyUrl parameter is mandatory to request web service layers (getcapabilities request)");
            return;
        };
        var proxyUrl = this.options.webServicesOptions.proxyUrl;
        var noProxyDomains = this.options.webServicesOptions.noProxyDomains;
        // on regarde si l'url nest pas dans les domaines sans proxy
        var bfound = false;
        if (noProxyDomains && Array.isArray(noProxyDomains) && noProxyDomains.length > 0) {
            for (var i in noProxyDomains) {
                logger.log("analyzing " + noProxyDomains[i]);
                if (url.indexOf(noProxyDomains[i]) !== -1) {
                    logger.log(url + " found in noProxyDomains list (" + noProxyDomains[i] + ").");
                    bfound = true;
                }
            }
        }
        // si on n'est pas dans un domaine sans proxy, on ajoute le proxy (+ encodage)
        if (bfound === false) {
            url = proxyUrl + encodeURIComponent(url);
        }

        // 3. affichage d'une patience le temps de la requête
        this._displayWaitingContainer();

        // 4. send getcapabilities request (XHR protocol => proxy Url is needed)
        var context = this;
        Gp.Protocols.XHR.call({
            url : url,
            method : "GET",
            timeOut : 15000,
            // on success callback : display results in container
            onResponse : function (response) {
                context._hideWaitingContainer();
                context._displayGetCapResponseLayers(response);
            },
            // on error callback : log error
            onFailure : function (error) {
                // en cas d'erreur, on revient au panel initial et on cache la patience
                context._hideWaitingContainer();
                logger.error("[ol.control.LayerImport] getCapabilities request failed : ", error);
            }
        });
    };

    /**
     * this method is called by this._importServiceLayers method
     * and display layers list from getcapabilities response
     *
     * @param {Object} xmlResponse - getCapabilities response (xml format)
     * @private
     */
    LayerImport.prototype._displayGetCapResponseLayers = function (xmlResponse) {
        var parser;
        var layers;
        var layerDescription = {
            content : null,
            title : null
        };
        var projection;
        this._getCapResponseWMSLayers = [];

        // sauvegarde du content d'un GetCapabilities
        this.contentService = xmlResponse;

        // Affichage du panel des couches accessibles
        this._importPanel.style.display = "none";
        this._getCapPanel.style.display = "block";

        // Parse GetCapabilities Response
        if (this._currentImportType === "WMS") {
            parser = new WMSCapabilities();
            var getCapResponseWMS = this._getCapResponseWMS = parser.read(xmlResponse);
            logger.log("getCapabilities response : ", getCapResponseWMS);

            if (getCapResponseWMS && getCapResponseWMS.Capability && getCapResponseWMS.Capability.Layer) {
                // info: le parser Openlayers récupère la première layer de <Capability> comme un unique objet (il écrase les précédents s'il y a pls <Layer> à la racine de <Capability>)
                // /!\ être vigilant si le parser est modifié (notamment pour récupérer les différentes layers à la racine. ex  http://geoservices.brgm.fr/geologie?SERVICE=WMS&VERSION=1.3.0&REQUEST=GetCapabilities)

                var getCapLayer = getCapResponseWMS.Capability.Layer;
                // on va lire le contenu de la (ou les) <Layer> pour l'afficher ou en afficher les couches disponibles
                if (Array.isArray(getCapLayer)) {
                    // cas où on a plusieurs <Layer> à la racine, mais non géré encore par ol.format.WMSCapabilities jusqu'à la v3.18.2.
                    for (var i = 0; i < getCapLayer.length; i++) {
                        this._displayGetCapResponseWMSLayer(getCapLayer[i]);
                    }
                } else {
                    // cas du parser ol.format.WMSCapabilities jusqu'à la v3.18.2.
                    this._displayGetCapResponseWMSLayer(getCapLayer);
                }
            }
        } else
        if (this._currentImportType === "WMTS") {
            parser = new WMTSCapabilities();
            var getCapResponseWMTS = this._getCapResponseWMTS = parser.read(xmlResponse);
            logger.log("getCapabilities response : ", getCapResponseWMTS);

            if (getCapResponseWMTS && getCapResponseWMTS.Contents && getCapResponseWMTS.Contents.Layer) {
                layers = getCapResponseWMTS.Contents.Layer;

                if (Array.isArray(layers)) {
                    // on stocke la liste des couches pour faire le lien avec le DOM
                    this._getCapResponseWMTSLayers = layers;

                    for (var j = 0; j < layers.length; j++) {
                        // on vérifie que la projection de la couche WMTS est compatible avec celle de la carte
                        // (ie elle doit être connue par ol.proj)
                        projection = this._getWMTSLayerProjection(layers[j], getCapResponseWMTS);
                        if (projection && typeof projection === "string") {
                            if (olGetProj(projection) || olGetProj(projection.toUpperCase())) {
                                // si la projection de la couche est connue par ol.proj,
                                // on ajoute chaque couche de la réponse dans la liste des couches accessibles
                                layerDescription = {
                                    content : layers[j].Title,
                                    title : layers[j].Abstract || layers[j].Title
                                };
                                if (this._getCapResultsListContainer) {
                                    this._addImportGetCapResultLayer(layerDescription, j, this._getCapResultsListContainer);
                                }
                            } else {
                                // si la projection de la couche n'est pas connue par ol.proj,
                                // on n'affiche pas la couche dans le panel des résultats
                                logger.warn("[ol.control.LayerImport] wmts layer cannot be added to map : unknown projection", layers[j]);
                                continue;
                            }
                        }
                    }
                }
            }
        }
    };

    /**
     * this method is called by this._displayGetCapResponseLayers method
     * and display WMS layer in list from getcapabilities response
     *
     * @param {Object} layerObj - object corresponding to <Layer> content in WMS GetCapabilities response
     * @param {Object} [parentLayersInfos] - object corresponding to parents <Layer> content in WMS GetCapabilities response (without children <Layer> infos)
     * @private
     */
    LayerImport.prototype._displayGetCapResponseWMSLayer = function (layerObj, parentLayersInfos) {
        if (!layerObj) {
            logger.warn("[ol.control.LayerImport] _displayGetCapResponseWMSLayer : getCapabilities layer object not found");
            return;
        }

        logger.log("[ol.control.LayerImport] _displayGetCapResponseWMSLayer - layerObj : ", layerObj);

        // récupération de la projection de la map (pour vérifier que l'on peut reprojeter les couches disponibles)
        var mapProjCode = this._getMapProjectionCode();
        var projection;
        var layerDescription = {
            content : null,
            title : null
        };

        // 1. héritage éventuels des informations de la couche parent
        if (parentLayersInfos) {
            var key;
            var i;

            // propriétés héritées à ajouter aux propriétés parent
            var addKeys = [
                "CRS",
                "Style"
                // "AuthorityURL" // TODO
            ];
            for (i = 0; i < addKeys.length; i++) {
                key = addKeys[i];
                if (Array.isArray(parentLayersInfos[key]) && parentLayersInfos[key].length !== 0) {
                    if (Array.isArray(layerObj[key]) && layerObj[key].length !== 0) {
                        // on ajoute celles de la couche parent
                        for (var n = 0; n < parentLayersInfos[key].length; n++) {
                            if (layerObj[key].indexOf(parentLayersInfos[key][n]) === -1) {
                                // si le CRS/Style parent n'est pas dans les CRS/Style de la couche, on l'ajoute
                                layerObj[key].push(parentLayersInfos[key][n]);
                            }
                        }
                    } else {
                        // si la couche n'a pas de CRS ou Style, on récupère ceux de la couche parent
                        layerObj[key] = parentLayersInfos[key];
                    }
                }
            }

            // propriétés qui remplacent les valeurs des propriétés héritées,
            // càd on récupère la propriété parent seulement si elle n'est pas définie pour l'élément enfant
            var replaceKeys = [
                "BoundingBox",
                "EX_GeographicBoundingBox",
                "MaxScaleDenominator",
                "MinScaleDenominator",
                "Attribution",
                "Dimension",
                "queryable",
                "cascaded",
                "opaque",
                "noSubsets",
                "fixedWidth",
                "fixedHeight"
            ];
            for (i = 0; i < replaceKeys.length; i++) {
                key = replaceKeys[i];
                if (parentLayersInfos[key] && !layerObj[key]) {
                    layerObj[key] = parentLayersInfos[key];
                }
            }
        } else {
            // si on n'a pas d'infos de couche parent, on est à la racine du Capability, on le note
            layerObj._isRootLayer = true;
            layerObj._container = this._getCapResultsListContainer;
            if (!layerObj.Title) {
                layerObj.Title = "Liste des couches";
            }
        }

        // 2. si on a d'autres couches <Layer> imbriquées, on descend d'un niveau, sinon on affiche la couche dans la liste des résultats
        if (layerObj.Layer) {
            if (Array.isArray(layerObj.Layer)) {
                var _container = (layerObj) ? layerObj._container : parentLayersInfos._container;
                var _title = (layerObj) ? layerObj.Title : parentLayersInfos.Title;
                layerObj._container = this._addImportGetCapResultListRubrique(_title, _container).lastChild;
                for (var j = 0; j < layerObj.Layer.length; j++) {
                    // on recommence pour chaque sous couche, avec les infos éventuellement héritées
                    var bRubriqueExist = false;
                    var lstRubrique = layerObj._container.getElementsByClassName("GPimportGetCapRubriqueTitle");
                    for (var ii = 0; ii < lstRubrique.length; ii++) {
                        if (lstRubrique[ii].title === layerObj.Title) {
                            bRubriqueExist = true;
                            layerObj.Layer[j]._container = lstRubrique[ii].parentElement;
                        }
                    }
                    if (!bRubriqueExist) {
                        layerObj.Layer[j]._container = this._addImportGetCapResultRubrique(layerObj.Title, layerObj._container).lastChild;
                    }
                    this._displayGetCapResponseWMSLayer(layerObj.Layer[j], layerObj);
                }
            }
        } else {
            // on récupère la longueur de la liste des couches déjà récupérées, pour avoir ce qui sera l'index de la couche à ajouter.
            var lastIndex = this._getCapResponseWMSLayers.length;

            // on vérifie que la couche ait une projection compatible avec celle de la carte
            // ou soit connue par proj4js, et on stocke cette projection dans les infos de la couche.
            projection = this._getWMSLayerProjection(layerObj, mapProjCode);

            if (!projection) {
                // si aucune projection n'est compatible avec celle de la carte ou connue par ol.proj,
                // on n'affiche pas la couche dans le panel des résultats
                logger.warn("[ol.control.LayerImport] wms layer cannot be added to map : unknown projection", layerObj);
            } else {
                // si on a une projection compatible : on la stocke et la couche sera éventuellement reprojetée à l'ajout
                layerObj._projection = projection;
                // on ajoute chaque couche de la réponse dans la liste des couches accessibles
                layerDescription = {
                    content : layerObj.Title,
                    title : layerObj.Abstract || layerObj.Title
                };
                // FIXME beurk !?
                var _isGoodContainer = layerObj._container;
                if (_isGoodContainer.localName === "ul") {
                    _isGoodContainer = _isGoodContainer.lastChild;
                }
                this._addImportGetCapResultLayer(layerDescription, lastIndex, _isGoodContainer);

                // puis on stoke la couche dans la liste pour faire le lien avec le DOM
                this._getCapResponseWMSLayers[lastIndex] = layerObj;
            }
        }
    };

    /**
     * this method is called on 'GPimportGetCapProposal' div click
     * and add corresponding layer to map
     *
     * @param {Object} e - HTMLElement
     * @private
     */
    LayerImport.prototype._onGetCapResponseLayerClick = function (e) {
        if (e.target && e.target.id) {
            var proposalId = parseInt(e.target.id.substr(23), 10);

            if (isNaN(proposalId)) {
                return;
            }

            var layerInfo;

            if (this._currentImportType === "WMS") {
                // récupération des informations liées à la couche
                layerInfo = this._getCapResponseWMSLayers[proposalId];
                // ajout de la couche à la carte
                this._addGetCapWMSLayer(layerInfo);
            } else if (this._currentImportType === "WMTS") {
                // récupération des informations liées à la couche
                layerInfo = this._getCapResponseWMTSLayers[proposalId];
                // ajout de la couche à la carte
                this._addGetCapWMTSLayer(layerInfo);
            }
        }
    };

    // ################################################################### //
    // ######### create WMS layer from getCapabilities response ######### //
    // ################################################################### //

    /**
     * this method is called by this._onGetCapResponseLayerClick
     * and add WMS layer to map using parameters from getCapabilities response
     *
     * @param {Object} layerInfo - layer information from getCapabilities response
     * @private
     */
    LayerImport.prototype._addGetCapWMSLayer = function (layerInfo) {
        var map = this.getMap();
        if (!map) {
            logger.warn("[ol.control.LayerImport] _addGetCapWMSLayer error : map is not defined");
            return;
        }
        if (!layerInfo) {
            logger.warn("[ol.control.LayerImport] _addGetCapWMSLayer error : layerInfo is not defined");
            return;
        }

        // récupération de la projection de la carte
        var mapProjCode = this._getMapProjectionCode();

        var wmsSourceOptions = {};

        // Récupération de l'url
        var getMapUrl = this._getWMSLayerGetMapUrl();
        // on essaie de récupérer l'url du service dans le getCapbilities
        if (getMapUrl) {
            wmsSourceOptions.url = getMapUrl;
        } else {
            // sinon, on récupère l'url du getCapabilities, à laquelle on enlève éventuellement les paramètres
            var questionMarkIndex = this._getCapRequestUrl.indexOf("?");
            if (questionMarkIndex !== -1) {
                wmsSourceOptions.url = this._getCapRequestUrl.substring(0, questionMarkIndex);
            } else {
                wmsSourceOptions.url = this._getCapRequestUrl;
            }
        }

        wmsSourceOptions.params = {};
        if (layerInfo.Name) {
            wmsSourceOptions.params["LAYERS"] = layerInfo.Name;
        } else {
            logger.warn("[ol.control.LayerImport] unable to add wms layer : mandatory layer 'name' parameter cannot be found", layerInfo);
            return;
        }
        wmsSourceOptions.params["SERVICE"] = "WMS";
        if (this._getCapResponseWMS.version) {
            wmsSourceOptions.params["VERSION"] = this._getCapResponseWMS.version;
        }

        // on a déjà vérifié que la couche peut être reprojetée,
        // on vérifie que la couche ait une projection compatible avec celle de la carte
        // ou soit connue par proj4js
        var projection = layerInfo._projection;
        if (!projection) {
            logger.warn("[ol.control.LayerImport] wms layer cannot be added to map : unknown projection");
            return;
        } else if (projection !== mapProjCode) {
            // si la projection de la carte n'est pas disponible pour cette couche,
            // on spécifie une projection (qui doit avoir été définie dans proj4js) pour reprojection par Openlayers
            wmsSourceOptions.projection = projection;
        }

        // récupération du premier style disponible (pas d'info default?)
        var legend;
        if (layerInfo.Style && Array.isArray(layerInfo.Style)) {
            var style = layerInfo.Style[0];
            wmsSourceOptions.params["STYLES"] = style.Name;
            if (style.LegendURL && Array.isArray(style.LegendURL) && style.LegendURL.length !== 0) {
                legend = style.LegendURL[0].OnlineResource;
            }
        }

        // Création de la source (tester un try catch ?)
        var wmsSource = new TileWMSSource(wmsSourceOptions);
        // ajout des informations pour le layerSwitcher (titre, description, legendes, metadata) ou originators
        this._getWMSLayerInfoForLayerSwitcher(layerInfo, legend, wmsSource);

        var layerTileOptions = {};
        layerTileOptions["source"] = wmsSource;
        // récupération des résolutions min et max de la layer à partir des dénominateurs d'échelle
        this._getWMSLayerMinMaxResolution(layerInfo, mapProjCode, layerTileOptions);
        // récupération de l'étendue (bbox)
        this._getWMSLayerExtent(layerInfo, mapProjCode, layerTileOptions);

        // création de la couche à partir de la source
        var wmsLayer = new TileLayer(layerTileOptions);
        // on rajoute le champ gpResultLayerId permettant d'identifier une couche crée par le composant. (pour layerSwitcher par ex)
        wmsLayer.gpResultLayerId = "layerimport:WMS";
        // on rajoute le champ gpGFIparams permettant d'identifier si la couche est queryable, et de transmettre les formats reconnus par GetFeatureInfo
        if (layerInfo.queryable) {
            wmsLayer.gpGFIparams = {
                queryable : true
            };
            // récupération des différents formats reconnus par le GetFeatureInfo
            if (this._getCapResponseWMS && this._getCapResponseWMS.Capability && this._getCapResponseWMS.Capability.Request && this._getCapResponseWMS.Capability.Request.GetFeatureInfo && this._getCapResponseWMS.Capability.Request.GetFeatureInfo.Format && Array.isArray(this._getCapResponseWMS.Capability.Request.GetFeatureInfo.Format)) {
                wmsLayer.gpGFIparams.formats = this._getCapResponseWMS.Capability.Request.GetFeatureInfo.Format;
            }
        }

        map.addLayer(wmsLayer);
    };

    /**
     * this method is called by this._addGetCapWMSLayer
     * and gets service getMap request url
     *
     * @return {String} getmapurl - service getMap request url
     * @private
     */
    LayerImport.prototype._getWMSLayerGetMapUrl = function () {
        var getmapurl;
        if (this._getCapResponseWMS && this._getCapResponseWMS.Capability && this._getCapResponseWMS.Capability.Request && this._getCapResponseWMS.Capability.Request.GetMap) {
            var getmap = this._getCapResponseWMS.Capability.Request.GetMap;
            if (getmap.DCPType && Array.isArray(getmap.DCPType) && getmap.DCPType.length !== 0) {
                var url = getmap.DCPType[0];
                if (url && url.HTTP && url.HTTP.Get) {
                    getmapurl = url.HTTP.Get.OnlineResource;
                }
            }
        }
        return getmapurl;
    };

    /**
     * this method is called by this._addGetCapWMSLayer
     * and gets a projection both available for a given layer and already defined in proj4js (ol.proj)
     * (openlayers raster reprojection will be then able to reproject layer in map projection)
     *
     * @param {Object} layerInfo - layer information from getCapabilities response
     * @param {String} mapProjCode - map projection code (e.g. "EPSG:4326")
     * @return {String} projection - ol.proj projection alias (e.g. "EPSG:4326")
     * @private
     */
    LayerImport.prototype._getWMSLayerProjection = function (layerInfo, mapProjCode) {
        var projection;

        if (!layerInfo || typeof layerInfo !== "object") {
            logger.warn("missing layer information (from getCapabilities)");
            return;
        }

        // on va parcourir la liste des CRS disponibles pour la couche
        // si on trouve la projection de la carte : c'est parfait
        // si on trouve une projection qui est connue par ol.proj : Openlayers gère la reprojection
        var CRSList = layerInfo.CRS;
        if (Array.isArray(CRSList)) {
            for (var i = 0; i < CRSList.length; i++) {
                var layerCRS = CRSList[i];
                if (layerCRS === mapProjCode) {
                    projection = layerCRS;
                    break;
                } else {
                    if (layerCRS && typeof layerCRS === "string") {
                        if (olGetProj(layerCRS) || olGetProj(layerCRS.toUpperCase())) {
                            projection = layerCRS;
                            break;
                        }
                    }
                }
            }
        }
        return projection;
    };

    /**
     * this method is called by this._addGetCapWMSLayer
     * and sets minResolution and maxResolution parameters for WMS layer (if available in getCapabilities response)
     *
     * @param {Object} layerInfo - layer information from getCapabilities response
     * @param {String} mapProjCode - map projection code (e.g. "EPSG:4326")
     * @param {Object} layerTileOptions - options for ol.layer.Tile (to be filled)
     * @private
     */
    LayerImport.prototype._getWMSLayerMinMaxResolution = function (layerInfo, mapProjCode, layerTileOptions) {
        // récupération des résolutions min et max à partir des dénominateurs d'échelle
        var mapUnits = olGetProj(mapProjCode).getUnits();
        if (mapUnits === "m") {
            // info : 1 pixel = 0.00028 m
            if (layerInfo.MinScaleDenominator) {
                layerTileOptions.minResolution = layerInfo.MinScaleDenominator * 0.00028;
            }
            if (layerInfo.MaxScaleDenominator) {
                layerTileOptions.maxResolution = layerInfo.MaxScaleDenominator * 0.00028;
            }
        } else if (mapUnits === "degrees") {
            // info : 6378137 * 2 * pi / 360 = rayon de la terre (ellipsoide WGS84)
            var cste = 0.00028 * 180 / (Math.PI * 6378137);
            if (layerInfo.MinScaleDenominator) {
                layerTileOptions.minResolution = layerInfo.MinScaleDenominator * cste;
            }
            if (layerInfo.MaxScaleDenominator) {
                layerTileOptions.maxResolution = layerInfo.MaxScaleDenominator * cste;
            }
        }
    };

    /**
     * this method is called by this._addGetCapWMSLayer
     * and sets extent for WMS layer in map projection (if available in getCapabilities response)
     *
     * @param {Object} layerInfo - layer information from getCapabilities response
     * @param {String} mapProjCode - map projection code (e.g. "EPSG:4326")
     * @param {Object} layerTileOptions - options for ol.layer.Tile (to be filled)
     * @private
     */
    LayerImport.prototype._getWMSLayerExtent = function (layerInfo, mapProjCode, layerTileOptions) {
        if (!layerInfo) {
            logger.warn("[ol.control.LayerImport] _getWMSLayerExtent error : layerInfo is not defined");
            return;
        }

        // récupération des 2 propriétés qui peuvent spécifier l'étendue (bbox) selon les specs OGC WMS 1.3.0 :
        // 1. layerInfo.EX_GeographicBoundingBox est un tableau de type [westBoundLongitude, southBoundLatitude, eastBoundLongitude, northBoundLatitude] en WGS84
        var exGeographicBoundingBox = layerInfo["EX_GeographicBoundingBox"];
        // 2. layerInfo.BoundingBox est un tableau dont chaque élément est un objet (balise bbox) avec les propriétés suivantes :
        // crs (String) et extent (tableau de type [minx, miny, maxx, maxy])
        var boundingBox = layerInfo.BoundingBox;

        if (exGeographicBoundingBox && Array.isArray(exGeographicBoundingBox)) {
            if (mapProjCode === "EPSG:4326") {
                // si la projection de la carte est la même que celle de l'extent (EPSG:4326), on la passe telle quelle
                layerTileOptions.extent = exGeographicBoundingBox;
            } else {
                layerTileOptions.extent = olTransformExtentProj(exGeographicBoundingBox, "EPSG:4326", mapProjCode);
            }

            // si jamais EX_GeographicBoundingBox n'est pas ou est mal renseigné, on essaie de récupérer via le paramètre BoundingBox
        } else if (boundingBox && Array.isArray(boundingBox)) {
            var crs;
            var extent;
            for (var i = 0; i < boundingBox.length; i++) { // on peut avoir plusieurs BoundingBox
                crs = boundingBox[i].crs;
                extent = boundingBox[i].extent;
                if (crs) {
                    if (crs === mapProjCode) {
                        // si la bbox est dans la projection de la carte, on la passe telle quelle
                        layerTileOptions.extent = extent;
                        break;
                    } else {
                        if (typeof crs === "string") {
                            var olProj = olGetProj(crs) ? olGetProj(crs) : olGetProj(crs.toUpperCase());
                            // if ( olGetProj(crs) || olGetProj(crs.toUpperCase()) ) {
                            if (olProj) {
                                // si la bbox est dans une projection connue, on va la reprojeter
                                // tout d'abord, on gère le cas des systèmes EPSG géographiques : inversion des axes x et y
                                if (olProj.getUnits() === "degrees" && crs.toUpperCase().indexOf("EPSG") === 0) {
                                    // le tableau extent est inversé, on a besoin de : [miny, minx, maxx, maxy]
                                    var reversedExtent = [extent[1], extent[0], extent[3], extent[2]];
                                    layerTileOptions.extent = olTransformExtentProj(reversedExtent, olProj, mapProjCode);
                                } else {
                                    // reprojection dans la projection de la carte
                                    layerTileOptions.extent = olTransformExtentProj(extent, olProj, mapProjCode);
                                }
                                break;
                            }
                        }
                    }
                }
            }
        }
    };

    /**
     * this method is called by this._addGetCapWMSLayer
     * and sets more information about layer (legends, title, description, metadata, originators) for layerSwitcher or attributions controls
     *
     * @param {Object} layerInfo - layer information from getCapabilities response
     * @param {String} legend - legend url
     * @param {Object} wmsSource - options for ol.source.TileWMS (to be filled)
     * @private
     */
    LayerImport.prototype._getWMSLayerInfoForLayerSwitcher = function (layerInfo, legend, wmsSource) {
        // ajout des informations pour le layerSwitcher (titre, description)
        if (layerInfo.Title) {
            wmsSource._title = layerInfo.Title;
            wmsSource._description = layerInfo.Abstract ? layerInfo.Abstract : layerInfo.Title;
        } else {
            wmsSource._title = layerInfo.Name;
            wmsSource._description = layerInfo.Abstract ? layerInfo.Abstract : layerInfo.Name;
        }
        // ajout de légende si on en a trouvé
        if (legend) {
            wmsSource._legends = [{
                url : legend
            }];
        }
        // ajout d'éventuelles métadonnées
        if (layerInfo.MetadataURL && Array.isArray(layerInfo.MetadataURL)) {
            wmsSource._metadata = [];
            for (var i = 0; i < layerInfo.MetadataURL.length; i++) {
                var metadata = layerInfo.MetadataURL[i].OnlineResource;
                if (metadata) {
                    wmsSource._metadata.push({
                        url : metadata
                    });
                }
            }
        }
        // ajout d'éventuelles attributions / originators
        if (layerInfo.Attribution) {
            var attribution = layerInfo.Attribution;
            wmsSource._originators = {};
            if (attribution.OnlineResource) {
                wmsSource._originators.url = attribution.OnlineResource;
            }
            if (attribution.Title) {
                wmsSource._originators.name = wmsSource._originators.attribution = attribution.Title;
            }
            if (attribution.LogoURL && attribution.LogoURL.OnlineResource) {
                wmsSource._originators.logo = attribution.LogoURL.OnlineResource;
            }
        }
    };

    // ################################################################### //
    // ######### create WMTS layer from getCapabilities response ######### //
    // ################################################################### //

    /**
     * this method is called by this._onGetCapResponseLayerClick
     * and add WMTS layer to map using parameters from getCapabilities response
     *
     * @param {Object} layerInfo - layer information from getCapabilities response
     * @private
     */
    LayerImport.prototype._addGetCapWMTSLayer = function (layerInfo) {
        if (!layerInfo || !layerInfo.Identifier) {
            logger.warn("[ol.control.LayerImport] layer information not found in getCapabilities response for layer ");
            return;
        }

        var map = this.getMap();
        if (!map) {
            return;
        }

        var wmtsSourceOptions = {};
        wmtsSourceOptions.layer = layerInfo.Identifier;
        // service version
        if (this._getCapResponseWMTS.version) {
            wmtsSourceOptions.version = this._getCapResponseWMTS.version;
        }
        // Récupération de l'url
        var getMapUrl = this._getWMTSLayerGetTileUrl();
        // on essaie de récupérer l'url du service dans le getCapbilities
        if (getMapUrl) {
            wmtsSourceOptions.url = getMapUrl;
        } else {
            // sinon, on récupère l'url du getCapabilities, à laquelle on enlève éventuellement les paramètres
            var questionMarkIndex = this._getCapRequestUrl.indexOf("?");
            if (questionMarkIndex !== -1) {
                wmtsSourceOptions.url = this._getCapRequestUrl.substring(0, questionMarkIndex);
            } else {
                wmtsSourceOptions.url = this._getCapRequestUrl;
            }
        }

        // Récupération des informations de la pyramide (tileGrid information) : matrixIds, resolutions, origin et projection
        var tmsOptions = this._getTMSParams(layerInfo);
        wmtsSourceOptions.matrixSet = tmsOptions.tms;
        wmtsSourceOptions.projection = tmsOptions.projCode;
        wmtsSourceOptions.tileGrid = new WMTSTileGrid({
            resolutions : tmsOptions.resolutions,
            matrixIds : tmsOptions.matrixIds,
            origin : tmsOptions.origin
        });

        // Récupération du style par défaut
        var defaultStyle;
        var legend;
        if (layerInfo.Style && Array.isArray(layerInfo.Style)) {
            var style;
            for (var s = 0; s < layerInfo.Style.length; s++) {
                style = layerInfo.Style[s];
                // on récupère le style
                defaultStyle = style.Identifier;
                if (style.isDefault) {
                    // si c'est celui par défaut, on le garde (on ne boucle plus sur les autres styles)
                    break;
                }
                // et une éventuelle légende
                if (style.LegendURL && Array.isArray(style.LegendURL) && style.LegendURL.length !== 0) {
                    legend = style.LegendURL[0].href;
                }
            }
        }
        if (defaultStyle == null) {
            logger.warn("[ol.control.LayerImport] style information not found in getCapabilities response for layer " + layerInfo.Identifier);
        }
        wmtsSourceOptions.style = defaultStyle;

        // Récupération du format (le premier trouvé)
        var format;
        if (layerInfo.Format && Array.isArray(layerInfo.Format)) {
            format = layerInfo.Format[0];
        }
        if (format == null) {
            logger.warn("[ol.control.LayerImport] format information not found in getCapabilities response for layer " + layerInfo.Identifier);
        }
        wmtsSourceOptions.format = format;

        // Création de la source (tester un try catch ?)
        var wmtsSource = new WMTSSource(wmtsSourceOptions);

        // ajout des informations pour le layerSwitcher (titre, description)
        if (layerInfo.Title) {
            wmtsSource._title = layerInfo.Title;
            wmtsSource._description = layerInfo.Abstract ? layerInfo.Abstract : layerInfo.Title;
        } else {
            wmtsSource._title = layerInfo.Identifier;
            wmtsSource._description = layerInfo.Abstract ? layerInfo.Abstract : layerInfo.Identifier;
        }
        // ajout d'une éventuelle légende
        if (legend) {
            wmtsSource._legends = [{
                url : legend
            }];
        }

        var layerTileOptions = {};
        layerTileOptions.source = wmtsSource;
        // récupération de l'étendue (bbox)
        layerTileOptions.extent = this._getWMTSLayerExtent(layerInfo);
        var wmtsLayer;
        try {
            wmtsLayer = new TileLayer(layerTileOptions);
        } catch (e) {
            logger.warn("[ol.control.LayerImport] an error occured while trying to create ol.layer.Tile from getCapabilities information. error : ", e);
            return;
        }
        // on rajoute le champ gpResultLayerId permettant d'identifier une couche crée par le composant. (pour layerSwitcher par ex)
        wmtsLayer.gpResultLayerId = "layerimport:WMTS";

        map.addLayer(wmtsLayer);
    };

    /**
     * this method is called by this._addGetCapWMTSLayer
     * and gets service getTile request url
     *
     * @return {String} gettileurl - service getTile request url
     * @private
     */
    LayerImport.prototype._getWMTSLayerGetTileUrl = function () {
        var gettileurl;
        if (this._getCapResponseWMTS && this._getCapResponseWMTS.OperationsMetadata && this._getCapResponseWMTS.OperationsMetadata.GetTile) {
            var gettile = this._getCapResponseWMTS.OperationsMetadata.GetTile;
            if (gettile.DCP && gettile.DCP.HTTP && gettile.DCP.HTTP.Get && Array.isArray(gettile.DCP.HTTP.Get) && gettile.DCP.HTTP.Get.length !== 0) {
                gettileurl = gettile.DCP.HTTP.Get[0].href;
            }
        }
        return gettileurl;
    };

    /**
     * this method is called by this._displayGetCapResponseLayers
     * and gets layer TileMatrixSet projection if defined in proj4js
     *
     * @param {Object} layerInfo - layer information from getCapabilities response
     * @param {Object} getCapResponseWMTS - whole getCapabilities response
     * @return {String} projection - ol.proj projection alias (e.g. "EPSG:4326")
     * @private
     */
    LayerImport.prototype._getWMTSLayerProjection = function (layerInfo, getCapResponseWMTS) {
        var projection;

        if (!layerInfo || typeof layerInfo !== "object") {
            logger.warn("missing layer information (from getCapabilities)");
            return;
        }

        if (!getCapResponseWMTS || typeof getCapResponseWMTS !== "object") {
            logger.warn("missing getCapabilities response");
            return;
        }

        if (layerInfo.TileMatrixSetLink && Array.isArray(layerInfo.TileMatrixSetLink)) {
            var tms = layerInfo.TileMatrixSetLink[0].TileMatrixSet;
            var crs;
            if (getCapResponseWMTS.Contents && Array.isArray(getCapResponseWMTS.Contents.TileMatrixSet)) {
                var tileMatrixSets = getCapResponseWMTS.Contents.TileMatrixSet;
                for (var i = 0; i < tileMatrixSets.length; i++) {
                    if (tileMatrixSets[i].Identifier === tms && tileMatrixSets[i].TileMatrix) {
                        // on a trouvé le TMS correspondant
                        var tileMatrixSet = tileMatrixSets[i];
                        crs = tileMatrixSet.SupportedCRS;
                        if (crs && typeof crs === "string") {
                            if (olGetProj(crs) || olGetProj(crs.toUpperCase())) {
                                projection = crs;
                            }
                        }
                        break;
                    }
                }
            }
        };

        return projection;
    };

    /**
     * this method is called by this._addGetCapWMTSLayer
     * and get ol.tileGrid.WMTS parameters using getCapabilities response
     *
     * @param {Object} layerInfo - layer information from getCapabilities response
     * @return {Object} tmsOptions - ol.tileGrid.WMTS options
     * @private
     */
    LayerImport.prototype._getTMSParams = function (layerInfo) {
        var tmsOptions = {};

        var matrixIds = [];
        var resolutions = [];
        var origin = [];
        var tms;
        var projCode;
        var projection;

        // TODO : recup TOUS les autres params d'un tileGrid ! (tileSize, width...)

        var map = this.getMap();
        if (!map) {
            return;
        }

        // Récupération des informations de la pyramide (tileGrid information) : matrixIds, resolutions, origin
        if (layerInfo.TileMatrixSetLink && Array.isArray(layerInfo.TileMatrixSetLink)) {
            tms = layerInfo.TileMatrixSetLink[0].TileMatrixSet;

            if (this._getCapResponseWMTS.Contents && Array.isArray(this._getCapResponseWMTS.Contents.TileMatrixSet)) {
                var tileMatrixSets = this._getCapResponseWMTS.Contents.TileMatrixSet;
                for (var i = 0; i < tileMatrixSets.length; i++) {
                    if (tileMatrixSets[i].Identifier === tms && tileMatrixSets[i].TileMatrix) {
                        // on a trouvé le TMS correspondant
                        var tileMatrixSet = tileMatrixSets[i];

                        var tilematrix;
                        var id;
                        var scaledenominator;
                        var resolution;
                        var units;

                        if (tileMatrixSet.SupportedCRS) {
                            projCode = tileMatrixSet.SupportedCRS;
                            projection = olGetProj(projCode);
                        }
                        if (projection && projection.getUnits) {
                            units = projection.getUnits();
                        }

                        if (Array.isArray(tileMatrixSet.TileMatrix)) {
                            for (var j = 0; j < tileMatrixSet.TileMatrix.length; j++) {
                                // construction du tableau des matrixIds
                                tilematrix = tileMatrixSet.TileMatrix[j];
                                if (tilematrix.Identifier != null) {
                                    id = parseInt(tilematrix.Identifier, 10);
                                    matrixIds.push(id);
                                }

                                // construction du tableau des résolutions, calculées à partir des dénominateurs d'échelle (scaledenominator)
                                scaledenominator = tilematrix.ScaleDenominator;
                                // calcul des résolutions selon la projection du TMS : selon si on a des coordonnées planes ou géographiques
                                if (units === "degrees") {
                                    // info : 6378137 * 2 * pi / 360 = rayon de la terre (ellipsoide WGS84)
                                    resolution = scaledenominator * 0.00028 * 180 / (Math.PI * 6378137);
                                } else {
                                    // info : 1 pixel = 0.00028 m
                                    resolution = scaledenominator * 0.00028;
                                }
                                resolutions.push(resolution);

                                origin = tilematrix.TopLeftCorner;
                            }
                        }

                        // tri des résolutions par ordre décroissant
                        if (resolutions.sort !== undefined) {
                            resolutions.sort(
                                function (x, y) {
                                    return y - x;
                                }
                            );
                        }
                        // tri des identifiants des niveaux de pyramide (matrixIds) par ordre croissant
                        if (matrixIds.sort !== undefined) {
                            matrixIds.sort(
                                function (x, y) {
                                    return x - y;
                                }
                            );
                        }
                    }
                }
            } else {
                logger.warn("[ol.control.LayerImport] TileMatrixSet data not found in getCapabilities response for layer " + layerInfo.Identifier);
            }
        } else {
            return;
        }

        tmsOptions.tms = tms;
        tmsOptions.projCode = projCode;
        tmsOptions.matrixIds = matrixIds;
        tmsOptions.resolutions = resolutions;
        tmsOptions.origin = origin;

        return tmsOptions;
    };

    /**
     * this method is called by this._addGetCapWMTSLayer
     * and sets extent for WMTS layer in map projection (if available in getCapabilities response)
     *
     * @param {Object} layerInfo - layer information from getCapabilities response
     * @return {Array} extent - layer extent
     * @private
     */
    LayerImport.prototype._getWMTSLayerExtent = function (layerInfo) {
        var extent;
        var mapProjCode = this._getMapProjectionCode();

        // récupération de l'étendue (bbox)
        if (layerInfo.WGS84BoundingBox && Array.isArray(layerInfo.WGS84BoundingBox)) {
            extent = olTransformExtentProj(layerInfo.WGS84BoundingBox, "EPSG:4326", mapProjCode);
        }

        return extent;
    };

    // ################################################################### //
    // ################################ utils ############################ //
    // ################################################################### //

    /**
     * gets control map projection code
     *
     * @return {String} mapProjCode - control map projection code (e.g. "EPSG:3857")
     * @private
     */
    LayerImport.prototype._getMapProjectionCode = function () {
        var map = this.getMap();
        if (!map || !map.getView || !map.getView().getProjection) {
            logger.warn("unable to get layerimport's map");
            return;
        }
        var mapProjCode = map.getView().getProjection().getCode();
        return mapProjCode;
    };

    // ################################################################### //
    // ################################ clean ############################ //
    // ################################################################### //

    /**
     * this method displays waiting container and sets a timeout
     *
     * @private
     */
    LayerImport.prototype._displayWaitingContainer = function () {
        this._waitingContainer.className = "GPimportWaitingContainerVisible";
        this._waiting = true;

        // mise en place d'un timeout pour réinitialiser le panel (cacher la patience)
        // si on est toujours en attente (si la requête est bloquée par exemple)
        if (this._timer) {
            clearTimeout(this._timer);
            this._timer = null;
        }
        var context = this;
        this._timer = setTimeout(function () {
            if (context._waiting === true) {
                context._hideWaitingContainer();
            } else {
                if (context._timer) {
                    clearTimeout(context._timer);
                }
            }
        }, 16000);
    };

    /**
     * this method hides waiting container and clears timeout
     *
     * @private
     */
    LayerImport.prototype._hideWaitingContainer = function () {
        if (this._waiting) {
            this._waitingContainer.className = "GPimportWaitingContainerHidden";
            this._waiting = false;
            clearTimeout(this._timer);
            this._timer = null;
        }
    };

    /**
     * this method empties getCap results list (DOM element)
     *
     * @private
     */
    LayerImport.prototype.cleanGetCapResultsList = function () {
        this._getCapRequestUrl = null;
        this._getCapResponseWMS = null;
        this._getCapResponseWMTS = null;
        this._getCapResponseWMSLayers = null;
        this._getCapResponseWMTSLayers = null;
        if (this._getCapResultsListContainer) {
            while (this._getCapResultsListContainer.firstChild) {
                this._getCapResultsListContainer.removeChild(this._getCapResultsListContainer.firstChild);
            }
        }
    };

    /**
     * this method empties MapBox results list (DOM element)
     *
     * @private
     */
    LayerImport.prototype.cleanMapBoxResultsList = function () {
        this.editor = null;
        this._mapBoxObj = null;
        if (this._mapBoxResultsListContainer) {
            while (this._mapBoxResultsListContainer.firstChild) {
                this._mapBoxResultsListContainer.removeChild(this._mapBoxResultsListContainer.firstChild);
            }
        }
    };

    return LayerImport;
}(Control));

export default LayerImport;

// Expose LayerImport as ol.control.LayerImport (for a build bundle)
if (window.ol && window.ol.control) {
    window.ol.control.LayerImport = LayerImport;
}
