// import CSS
import "../CSS/Controls/Drawing/GPdrawingOpenLayers.css";
// import OpenLayers
import Control from "ol/control/Control";
import { unByKey as olObservableUnByKey } from "ol/Observable";
import Collection from "ol/Collection";
import Overlay from "ol/Overlay";
import { transform as olTransformProj } from "ol/proj";
import VectorSource from "ol/source/Vector";
import VectorLayer from "ol/layer/Vector";
import {
    Fill,
    Icon,
    Stroke,
    Style,
    Text,
    Circle
} from "ol/style";
import {
    LineString,
    Point,
    Polygon
} from "ol/geom";
// FIXME not include into ol/geom !?
import LinearRing from "ol/geom/LinearRing";
import {
    Select as SelectInteraction,
    Modify as ModifyInteraction,
    Draw as DrawInteraction
} from "ol/interaction";
import {
    singleClick as eventSingleClick,
    pointerMove as eventPointerMove
} from "ol/events/condition";
import {
    getArea as olGetAreaSphere,
    getDistance as olGetDistanceSphere
} from "ol/sphere";
// import local
import Logger from "../../Common/Utils/LoggerByDefault";
import Interactions from "./Utils/Interactions";
import Draggable from "../../Common/Utils/Draggable";
import SelectorID from "../../Common/Utils/SelectorID";
import Color from "../../Common/Utils/ColorUtils";
// DOM
import DrawingDOM from "../../Common/Controls/DrawingDOM";
// import local with ol dependencies
import KMLExtended from "../Formats/KML";
import LayerSwitcher from "./LayerSwitcher";

var logger = Logger.getLogger("Drawing");

/**
 * @classdesc
 *
 * Drawing Control.
 *
 * @constructor
 * @alias ol.control.Drawing
 * @extends {ol.control.Control}
 * @param {Object} options - options for function call.
 * @param {Boolean} [options.collapsed = true] - Specify if Drawing control should be collapsed at startup. Default is true.
 * @param {Boolean} [options.draggable = false] - Specify if widget is draggable
 * @param {Object} [options.layer = {}] - Openlayers layer that will hosts created features. If none, an empty vector layer will be created.
 * @param {Object} [options.popup = {}] - Popup informations
 * @param {Boolean} [options.popup.display = true] - Specify if popup is displayed when create a drawing
 * @param {Function} [options.popup.function] - Function to display popup informations if you want to cutomise it. You may also provide your own function with params : {geomType / feature / saveFunc(message) / closeFunc()}. This function must return the DOM object of the popup content.
 * @param {Object} [options.layerDescription = {}] - Layer informations to be displayed in LayerSwitcher widget (only if a LayerSwitcher is also added to the map)
 * @param {String} [options.layerDescription.title = "Croquis"] - Layer title to be displayed in LayerSwitcher
 * @param {String} [options.layerDescription.description = "Mon croquis"] - Layer description to be displayed in LayerSwitcher
 * @param {Object} options.tools - Tools to display in the drawing toolbox. All by default.
 * @param {Boolean} [options.tools.points = true] - Display points drawing tool
 * @param {Boolean} [options.tools.lines = true] - Display lines drawing tool
 * @param {Boolean} [options.tools.polygons = true] - Display polygons drawing tool
 * @param {Boolean} [options.tools.holes = false] - Display polygons with holes drawing tool
 * @param {Boolean} [options.tools.text = true] - Display text drawing tool
 * @param {Boolean} [options.tools.remove = true] - Display feature removing tool
 * @param {Boolean} [options.tools.display = true] - Display style editing tool
 * @param {Boolean} [options.tools.tooltip = true] - Display text editing tool
 * @param {Boolean} [options.tools.edit = true] - Display editing tool
 * @param {Boolean} [options.tools.export = true] - Display exporting tool
 * @param {Boolean} [options.tools.measure = false] - Display measure drawing into popup info
 * @param {String} [options.labels] - Labels for Control
 * @param {String} [options.labels.control] - Label for Control
 * @param {String} [options.labels.points] - Label for points drawing tool
 * @param {String} [options.labels.lines] - Label for lines drawing tool
 * @param {String} [options.labels.polygons] - Label for polygons drawing tool
 * @param {String} [options.labels.holes] - Label for polygons with holes drawing tool
 * @param {String} [options.labels.text] - Label for text drawing tool
 * @param {String} [options.labels.edit] - Label for editing tool
 * @param {String} [options.labels.display] - Label for style editing tool
 * @param {String} [options.labels.tooltip] - Label for text editing tool
 * @param {String} [options.labels.remove] - Label for feature removing tool
 * @param {String} [options.labels.export] - Label for exporting tool.
 * @param {String} [options.labels.exportTitle] - Title for exporting tool.
 * @param {String} [options.labels.applyToObject] - Label for apply to object button.
 * @param {String} [options.labels.saveDescription] - Label for save description button.
 * @param {String} [options.labels.setAsDefault] - Label for set as default style button.
 * @param {String} [options.labels.strokeColor] - Label for stroke color.
 * @param {String} [options.labels.strokeWidth] - Label for stroke width.
 * @param {String} [options.labels.fillColor] - Label for fill color.
 * @param {String} [options.labels.fillOpacity] - Label for fillOpacity.
 * @param {Array.<Object>} [options.markersList = [{"src" : "data:image/png;base64,xxxx", "anchor" : [0.5,1]}]] - List of markers src to be used for points with their anchor offsets See {@link http://openlayers.org/en/latest/apidoc/ol.style.Icon.html OpenLayers params} for anchor offset options.
 * @param {Object} options.defaultStyles - Default styles applying to geometries (labels, lines and polygons).
 * @param {String} [options.defaultStyles.textFillColor = "#000000"] - Text fill color for labels (RGB hex value).
 * @param {String} [options.defaultStyles.textStrokeColor = "#FFFFFF"] - Text surrounding color for labels (RGB hex value).
 * @param {String} [options.defaultStyles.strokeColor = "#ffcc33"] - Stroke color (RGB hex value).
 * @param {Number} [options.defaultStyles.strokeWidth = 2] - Stroke width in pixels.
 * @param {String} [options.defaultStyles.polyStrokeColor = "#ffcc33"] - Stroke color (RGB hex value) for polygons.
 * @param {Number} [options.defaultStyles.polyStrokeWidth = 2] - Stroke width in pixels for polygons.
 * @param {String} [options.defaultStyles.polyFillColor = "#ffffff"] - Polygons fill color (RGB hex value).
 * @param {Number} [options.defaultStyles.polyFillOpacity = 0.2] - Polygon fill opacity (alpha value between 0:transparent and 1:opaque).
 * @param {Object} options.cursorStyle - cursor (circle) style when drawing or editing.
 * @param {String} [options.cursorStyle.fillColor = "rgba(0, 153, 255, 1)"] - Cursor fill color.
 * @param {String} [options.cursorStyle.strokeColor = "#FFF"] - Cursor stroke color.
 * @param {String} [options.cursorStyle.strokeWidth = 1] - Cursor surrounding stroke width.
 * @param {String} [options.cursorStyle.radius = 6] - Cursor radius.
 * @example
 * var drawing = new ol.control.Drawing({
 *   collapsed : false,
 *   draggable : true,
 *   layerswitcher : {
 *      title : "Dessins",
 *      description : "Mes dessins..."
 *   },
 *   markersList : [{
 *      src : "http://api.ign.fr/api/images/api/markers/marker_01.png",
 *      anchor : [0.5, 1]
 *   }],
 *   defaultStyles : {},
 *   cursorStyle : {},
 *   tools : {
 *      points : true,
 *      lines : true,
 *      polygons :true,
 *      holes : true,
 *      text : false,
 *      remove : true,
 *      display : true,
 *      tooltip : true,
 *      export : true,
 *      measure : true
 *   },
 *   popup : {
 *      display : true,
 *      function : function (params) {
 *          var container = document.createElement("div");
 *          // - params.geomType;
 *          // - params.feature;
 *          // Les 2 fonctions ferment la popup avec ou sans sauvegarde des informations
 *          // dans les properties de la feature (key : description)
 *          // - params.saveFunc(message);
 *          // - params.closeFunc();
 *          return container;
 *      }
 * });
 */
var Drawing = (function (Control) {
    function Drawing (options) {
        options = options || {};

        if (!(this instanceof Drawing)) {
            throw new TypeError("ERROR CLASS_CONSTRUCTOR");
        }

        this._initialize(options);

        // init control DOM container
        var container = this._container = this._initContainer();

        // call ol.control.Control constructor
        Control.call(this, {
            element : container,
            target : options.target,
            render : options.render
        });
    };

    // Inherits from ol.control.Control
    // olInherits(Drawing, Control);
    if (Control) Drawing.__proto__ = Control;

    /**
     * Default tools to display for widget
     *
     * @private
     */
    Drawing.DefaultTools = {
        points : true,
        lines : true,
        polygons : true,
        holes : false,
        text : true,
        remove : true,
        display : true,
        tooltip : true,
        edit : true,
        export : true,
        measure : false
    };

    /**
     * Default labels for widget
     *
     * @private
     */
    Drawing.DefaultLabels = {
        control : "Annoter la carte",
        creatingTools : "Outils de création",
        points : "Placer des points",
        lines : "Dessiner des lignes",
        polygons : "Dessiner des polygones",
        holes : "Créer des trous sur un polygone",
        text : "Ecrire sur la carte",
        editingTools : "Outils d'édition",
        edit : "Editer les tracés",
        display : "Modifier l'apparence des objets",
        tooltip : "Modifier les textes / infos-bulles",
        remove : "Supprimer des objets",
        export : "Exporter",
        exportTitle : "Exporter en KML",
        applyToObject : "Appliquer à l'objet",
        saveDescription : "Enregistrer",
        setAsDefault : "Définir par défaut",
        strokeColor : "Couleur du trait : ",
        strokeWidth : "Epaisseur du trait : ",
        fillColor : "Couleur de remplissage : ",
        fillOpacity : "Opacité du remplissage : "
    };

    /**
     * Default styles applyied to drawn features.
     *
     * @private
     */
    Drawing.DefaultStyles = {
        textFillColor : "#000000",
        textStrokeColor : "#FFFFFF",
        // INFO : cette option n'est pas surchargeable via les options du constructeur !
        textIcon1x1 : {
            src : "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR4nGNiYAAAAAkAAxkR2eQAAAAASUVORK5CYII=",
            anchor : [0, 0]
        },
        polyFillColor : "#ffffff",
        polyFillOpacity : 0.4,
        polyStrokeColor : "#ffcc33",
        polyStrokeWidth : 4,
        strokeColor : "#ffcc33",
        strokeWidth : 4
    };

    /**
     * Default styles when drawing
     *
     * @private
     */
    Drawing.DefaultCursorStyle = {
        radius : 6,
        strokeColor : "#FFF",
        strokeWidth : 1,
        fillColor : "rgba(0, 153, 255, 1)"
    };

    /**
     * @lends module:Drawing
     */
    Drawing.prototype = Object.create(Control.prototype, {});

    /**
     * Copies all source object members to Drawing prototype
     *
     * @param {Object} source - source object whose properties will be copied.
     * @private
     */
    Drawing.prototype.assign = function (source) {
        for (var prop in source) {
            if (source.hasOwnProperty(prop)) {
                this[prop] = source[prop];
            }
        }
    };

    Drawing.prototype.assign(DrawingDOM);

    /**
     * Constructor (alias)
     *
     * @private
     */
    Drawing.prototype.constructor = Drawing;

    /**
     * Overload of {@link http://openlayers.org/en/latest/apidoc/ol.control.Control.html#setMap ol.control.Control.setMap()} method, called when control is added to or removed from map.
     *
     * @param {Object} map - {@link http://openlayers.org/en/latest/apidoc/ol.Map.html ol.Map} object.
     */
    Drawing.prototype.setMap = function (map) {
        // call original setMap method
        Control.prototype.setMap.call(this, map);

        if (this.getMap() && this.eventKey) {
            olObservableUnByKey(this.eventKey);
        }

        // nothing else to do if map == null
        if (map == null) {
            return;
        }

        // mode "draggable"
        if (this.draggable) {
            Draggable.dragElement(
                this._drawingPanel,
                this._drawingPanelHeader,
                map.getTargetElement()
            );
        }

        // mode "collapsed"
        if (!this.collapsed) {
            var inputShow = document.getElementById(this._addUID("GPshowDrawing"));
            inputShow.checked = "checked";
        }

        if (this.layer) {
            // ajout du layer de dessin à la carte s'il n'y est pas déjà
            this.setLayer(this.layer);
        }

        // gestion des suppressions "externes" de la couche de dessin.
        this.eventKey = this.getMap().getLayers().on("remove", (evtRm) => {
            if (evtRm.element === this.layer) { // FIXME object comparison
                // found layer removed.
                this.layer = null;
                // on supprime l'interaction en cours si besoin
                if (this.interactionCurrent) {
                    this.getMap().removeInteraction(this.interactionCurrent);
                    this.interactionCurrent = null;
                }
            }
        });
    };

    /**
     * Export features of current drawing layer in KML.
     *
     * @returns {String} a KML representation of drawn features or null if not possible.
     */
    Drawing.prototype.exportFeatures = function () {
        var result = null;
        if (Control.prototype.getMap.call(this) == null) {
            logger.log("Impossible to export : control isn't attached to any map.");
            return result;
        }
        if (!this.layer) {
            logger.log("Impossible to export : no layer is hosting features.");
            return result;
        }
        if (!this.layer.getSource() ||
            !this.layer.getSource().getFeatures() ||
            !this.layer.getSource().getFeatures().length) {
            logger.log("Impossible to export : no features found.");
            return result;
        }
        var featProj = this.layer.getSource().getProjection();
        featProj = featProj || this.getMap().getView().getProjection();

        var kmlFormat = new KMLExtended({
            writeStyles : true
        });

        result = kmlFormat.writeFeatures(this.layer.getSource().getFeatures(), {
            dataProjection : "EPSG:4326",
            featureProjection : featProj
        });

        return result;
    };

    // ################################################################### //
    // #################### user interface methods ####################### //
    // ################################################################### //

    /**
     * Collapse or display control main container
     *
     * @param {Boolean} collapsed - True to collapse control, False to display it
     */
    Drawing.prototype.setCollapsed = function (collapsed) {
        if (collapsed === undefined) {
            logger.error("[ERROR] Drawing:setCollapsed - missing collapsed parameter");
            return;
        }
        if ((collapsed && this.collapsed) || (!collapsed && !this.collapsed)) {
            return;
        }
        // on simule l'ouverture du panneau après un click
        this.onShowDrawingClick();
        this._showDrawingContainer.checked = !collapsed;
    };

    /**
     * Setter for Export Name.
     *
     * @param {String} name - Export Name. By default, "Croquis".
     */
    Drawing.prototype.setExportName = function (name) {
        this._exportName = name;
    };

    /**
     * getter for Export Name.
     *
     * @returns {String} export name
     */
    Drawing.prototype.getExportName = function () {
        return this._exportName;
    };

    // ################################################################### //
    // ######################## initialize control ####################### //
    // ################################################################### //

    /**
     * Gets marker options in options.markersList given its src.
     *
     * @param {String} src - marker image URI,
     * @returns {Object} markers options
     * @private
     */
    Drawing.prototype._getsMarkersOptionsFromSrc = function (src) {
        var markerOptions = null;
        for (var i = 0; i < this.options.markersList.length; i++) {
            if (this.options.markersList[i].src === src) {
                markerOptions = this.options.markersList[i];
                return markerOptions;
            }
        }
        return markerOptions;
    };

    /**
     * Converts markerElement options into Openlayers IconStyles options.
     *
     * @param {Object} markerElement - marker element
     * @returns {Object} ol.Style.Icon constructor options.
     * @private
     */
    Drawing.prototype._getIconStyleOptions = function (markerElement) {
        var iconOptions = {};
        Object.keys(markerElement).forEach((key) => {
            switch (key) {
                case "src":
                case "size":
                case "anchor":
                case "anchorOrigin":
                case "anchorXUnits":
                case "anchorYUnits":
                    iconOptions[key] = markerElement[key];
                    break;
            }
        });

        return iconOptions;
    };

    /**
     * Initialize control (called by Drawing constructor)
     *
     * @method _initialize
     * @param {Object} options - control options (set by user)
     * @private
     */
    Drawing.prototype._initialize = function (options) {
        // determination d'un uid
        this._uid = SelectorID.generate();

        // export name / format / ...
        this._exportName = "Croquis";
        this._exportFormat = ".kml";

        options = options || {};
        // Set default options
        this.options = options;

        if (!this.options.layerDescription) {
            this.options.layerDescription = {
                title : "Croquis",
                description : "Mon croquis"
            };
        }

        // applying default tools
        if (!this.options.tools) {
            this.options.tools = {};
        }
        Object.keys(Drawing.DefaultTools).forEach((key) => {
            if (!this.options.tools.hasOwnProperty(key)) {
                this.options.tools[key] = Drawing.DefaultTools[key];
            }
        });
        // styles par defaut lors du dessin
        if (!this.options.cursorStyle) {
            this.options.cursorStyle = {};
        }
        Object.keys(Drawing.DefaultCursorStyle).forEach((key) => {
            if (!this.options.cursorStyle.hasOwnProperty(key)) {
                this.options.cursorStyle[key] = Drawing.DefaultCursorStyle[key];
            }
        });

        this.options.collapsed = (options.collapsed !== undefined) ? options.collapsed : true;
        /** {Boolean} specify if Drawing control is collapsed (true) or not (false) */
        this.collapsed = this.options.collapsed;

        this.options.draggable = (options.draggable !== undefined) ? options.draggable : false;
        /** {Boolean} specify if Drawing control is draggable (true) or not (false) */
        this.draggable = this.options.draggable;

        this.options.markersList = options.markersList || [{
            src : "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADMAAAAmCAYAAABpuqMCAAAABHNCSVQICAgIfAhkiAAAAAlwSFlzAAAN1wAADdcBQiibeAAAABl0RVh0U29mdHdhcmUAd3d3Lmlua3NjYXBlLm9yZ5vuPBoAAARfSURBVFiF3ZhfbBRVGMV/d2Z3212tbSkCbuNaqzaRiL6QyAMPjSFoYqgx4oOiRmMFUzQG479o2lQ0QXk1EhYFgmlD2mIRkYhRwqLEaA2GiKWV7rZLQ0sLwbZId7t/Zq4PFK1125m5s/vCedz7nXO+M9/N3jsD1xFEvgXlTkrI8hBQBywFbgEqgEvAMHAayZcYHBYbuZJP77yFkdsoR+ct4GXAb4OSQPARXj4QzzGejx7yEkZuZy2CMLBAgf4nkhfEi3S67UNzQ5YSIXfQhKAdtSAACxDsk2EapXT3cF2FYQdNSN7F/YQFsJkw77gVUcL01mp3o5EDJoK1Yj37VchKjcjdlJEmhvrWmg9jGNwhGhhzSlTbZmnepjBBAMrReF2F6Hgy0+fIKPb+flWRIMtip+eQ88lcPRCtg3gCCVZ3RqhPDbJepqlPDbJ6XwSvP2nDJYCXB522prLN6iwrPIEETw33U/VoLZovBPjQfCGqHqtl3XDUZiBrn1lQCXO3ZcUDLV34Su/JueYrW0btnp8tNSRLnTamEiZoWRF6uHre9dseuT0vPrOgEqbCWtW3xNX6VSy02c+/sk4JwF+WFWZ6xGL9vA2fyzb7+QcqYUYtKwYP9s+7PrA/bsNn/geSA87DSLosa44+fT/p8VM511Jjp4g8u8KGk7XPLKhM5qhlRSbppzV4JwMdEcz0WSCNmT5LrC1CS/AujKliSw1BxGljzm8AH3MjHs4BpU65DjCBn0rxDJNOSI4nM33F2O2U58yEnU6DgOpF02AzcEGJa40LZHlfhagUZvp6vkmFawObVK7/4PLFSoZpBZ50ozEThsne6i2hjZqmFRVJ6U8JUeSVUmQNzQvg0c1MVtNMIUTSl0pNLhsaGu8A4xrfbZhS4CRQ5SoFcCWtja/5NBg+N+GZsu0vhSEkcY8mf+iNx+OuX3llmJVABNCVNUA2fl3xWdvJkriqRBb2uPugAYgNHEey1Y3Gt3/ccNxFEAChm2al6zAAjNAEWF/rc1Ev6+ffOLTwmBt7E0xD02J5CSOayQLrsHMJnYGMITJvHrr588mUMKyr54CUaaHrnfF4fCQ/kwHEBmLAa044rb+WHP4xXnxJ0VJK6CkyjO2xWOx3KMSH8zDtwONWdb2jvt41u4JtChZJKeVveDwnYrHYfw5uj4KYFRpSWbGqyCPL5ypIpMTkKwcWfWVXUEqRRcio1LTuUCjUE4lEsrnq8j4ZgKEP9bpgmfHFHPpyy3fle3f9Uto3n4aUIqNhDghN6zZ1vTcajaasfAsSBmBwq7f11tLM/24Hx2L+n+rbF38zBy2JEP0anPEGAj3d3d1pJ56F2GYAGInM82M+bWW53wxd++3ipH7x1QMLj8ysk5BAyj6Ppp2+d/nyaEdHh/I/W8EmA3Ci2b/iviVT3+tCerMmxkudiz450hcYBSYQIqrDmScGBvqawSxkH3lDV2Pxe6ltItnWcFNLTXX1qpqamkoK/BCvC/wNB+l5MdQKNHsAAAAASUVORK5CYII=",
            anchor : [0.5, 1]
            // FIXME l'impl. sur le KML connait qq souci dont la gestion de
            // la balise hotspot du format KML
            // size : [51, 38],
            // anchor : [25.5 , 38],
            // anchorOrigin : "top-left",
            // anchorXUnits : "pixels",
            // anchorYUnits : "pixels"
        }, {
            src : "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADMAAAAmCAYAAABpuqMCAAAABHNCSVQICAgIfAhkiAAAAAlwSFlzAAAN1wAADdcBQiibeAAAABl0RVh0U29mdHdhcmUAd3d3Lmlua3NjYXBlLm9yZ5vuPBoAAAS7SURBVFiF3VhNTFxVFP7OfTNvOjMtM9AoJSSYEEVMCv6kJi5NoCa1TRqNxDTaFhcWNSmxaaxNQ0w3mqgLdGeRhKFYXVC7qDU2BhVt/YdqEQRhRgYTKD8VZqAMzM+7xwVCcIR58+6b2fRb3nO+853v3fvuu+8CtxEo1wX5pTu2IpasBfEeSFSCUAygCMAsgEkAQyD6DClXF3VMLeZSO2dmuN7vB+MYiBsAbDEn8BIIZ6BrzdQyF81FDzkxw8/594P5HQCFCvQ5QDRSYO4Tu30IO2QGiA/5XgVzAGpGsMKTZ/mw7wTbfLi2yFzvOwngpJ0aaXidAtG3VcnKZv5dWgE7Nf5fFBJCHqK2hUsqdKVG+EihDwn5K9SXViZEAHqAApGIVaLaO5Pg48iPEQDwg2WjCtHyzKx8RxJBZLP9qoJ5CdJ9t9XvkPWZiSVrkY0R3b2MxnM9aJ2Ooi3iRut0FEc/6IHuiZtyidwQ8RqrrVk3Q7zHNEd3L6N5eAYP7q2BppcB0KHpZXhoXw2aB6eyM8SPW23NuhnGvaY5L7T2w7Nt54Yxj68KDS19WSiZ66RBZQPYYZpRvfuejPH7H8scX0FJlv2sQcVMkWmGpmc2bBbPVicNKsvslmmOkZg0id/IQmkhy47WoLABYNo05/rnIxnjv1wOmtbgLHTSoDIz10xzzhypQiz624axWLQPLQ3V5kLUa7U1la35G9OcRMyFY/cV49qlLhiJMQAJGIkx9FzswsuVO5BccpnryKuWW7NK4IPFXmjLgwAKrHItYB66t5JaJmJWSJZnhjqmFiFxzirPIjqsGgFUD5qC3gRjRolrBsYMQEr/NEpmKBCJgHBKhWteHKdUjv8rVBvgw773QaizU2M9DMb58q98rwghXC5md5zI5WSmlCGcAODQZDIlhCSiJT0eX6waH490AsYq356ZZ4oK4DSuAihT4UuGYIaQILGQ4vknen2BibhYzlqfySBG2CH4ylA4HLb9y8v1BY8A9CkAzVwcZDA0BgkG0+oFBjP49Ij3o48n9b9U20gB7bZuZwCAAvM/gPndTDmSIZKS9CRDNwCHBIv1NzFdfzu/t2EEAEiTstS2GQDA2PwbAHrSh9ebSDewihtxMdn0h/dbO/ISkIYQoZyYoW6kYOD59YdQg8mRYjgleFONpKRk07D34qJBxmY5pmBOkKZdCIfDk7mZGQDUER0FUROwaoQdZpd6H07oXT/OOWYVJZmBQZdhvBcKhfqBfFyc1xcEEpKeNjMytOgYfqp32wUFiSVm7oPD0RsKhf5zsnYoFMsMyccTUtvtFHL7ZimxFC2eGPJezrYkM6VAHGQhBsrKyga7u7tTG+XlfGYAIFxXuLfEzZ288fvCb4U858+Ou0KZajBTUkCOkhADUtOGgsGg6SVIXswAQKiuqK3UbRxIH78yq//8Yr/3i01oSyD6UwDDTo9ncGBgIGFFM29mRh/FFm+J/3qBk+9aHbsZFzf39WwN3DK0tWXCQAzMIw4hfq/etSvY2dmpvLPlzQwA/PTk9od3eowvhWCnZEodHfC2fz3rnAEQBVFQA4YPjI6OnAZkPvvIGb7bX/Ta/LP+SEftne0V5eW1FRUVpcjzQ7wt8A+9at5zXMB2DQAAAABJRU5ErkJggg==",
            anchor : [0.5, 1]
        }, {
            src : "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADMAAAAmCAYAAABpuqMCAAAABHNCSVQICAgIfAhkiAAAAAlwSFlzAAAN1wAADdcBQiibeAAAABl0RVh0U29mdHdhcmUAd3d3Lmlua3NjYXBlLm9yZ5vuPBoAAAP0SURBVFiF3ZnLbxtVFIe/e8eOPU5DapI2whEWyiILJGDTBQuWSGTTSkVlQRGs2MGSh4RoQWLB4x/gpVIViNokJUV0U4RQXKgQr0ookCYkdjONSJtQJTGltjO2Zw6LJlEbkszLTgQ/6Ww859xzPt97556Zgf+RVKMHFGgD+oADwP3APUAHsABcBS4BXwDnFNxsdP6GSCAt8LZAWUB8WEngLYHdO137HRI4JLDgE2K9LQg8vtMMCCiBowJuSJBVcwWOSBOWfRCY1yJCrLdXdwrkUANmZL05Age3G2R3hD3iZYsC6TB16ZA8rwB3h4z1Uhp4MUxg4A23co7MA2aYhD5VBrqCnkNhZqYPPyCpVJnh4Ry2PYNIFdue4fTpHKZZ8ZEjBTwWorZgEvjEc92nUiUpFn+VjbS0NCqm6edgPbEdMD97FjI8PLIhyKoGB0d8wPy0HTBXPQux7Stbwti25QNmNmhtYW4ANtCytZNUPXxslEp4pKoq8PK5Q2FuAH97elSrcx7Xr/nIc8NnPWsKAzPv6XH27OUtr585Y/nIs/Uf0ggJHPdc76ZZlqWl0Q33y+LiqCSTFR975th2wDzjqy0xzbIMDo6IbVsiYottW3Lq1IhPEBF4ejtgdgkUm9SXrVpRoDVobYH3zEqLcTxoXEAdU1Bqco5bkluPyPNNmpV5Cdk1RwE63CSYw2FrivSYKtBPhOTr5cDJnmz2Oa11IiFi2kol4iKq7ug4QMxwa3WtXaVUpcW2Sw/MzhaHwFmNjwrTDvwC3BeJAripdXF/JvP+H7HYsu/8ohwlWDEt305YlhX5BYLAI0AOMCKMIUc6Oj4eaGuzwg5RhxNhnzTXpOAC8E6UMb5qbb0QAQRAGa7bHRlmRUeBH8IEzhnGtZc6O89HSe6C62hdaAiMgjrwFH6a0NtUU6r28p49n5WUcry9N5FIVRnGsGVZc42aGRQUgBeCxPS3tZ37LplcCJlSBMYTjvNeoVD4baWGxkpgEHjCy2+ipWVifyYzECJFRURGicUuFgqFP2+/0AyYTlupyYTIpqd4WanSwe7udy/HYr5aFhFVR0letB7LZrPjuVyuvpFfU97tzhrGgYzjfL7J+PJmOn3yo/b2qa3GEFE1jTuttB5zDWMin8/bXnmb9qJ6Jh7vv7dW+1d3cN40v3+2q+vLTcIqKHVZw2Q8lRofGxurBsnZNJhpSLZr/XvadbOrv103jOt9mcwHNwxjbZkIlBGZiml96cF9+/JDQ0Oh72xN/YRw0TQffmh5+RtDJF4H5/m9ez/8OpWaB/5CqbwBk09OT0+9Dm4z62iYfkwm37CVqgzsuuvT3p6eR3t7e7vZye8w/xX9A0ynxee2hlfFAAAAAElFTkSuQmCC",
            anchor : [0.5, 1]
        }, {
            src : "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADMAAAAmCAYAAABpuqMCAAAABHNCSVQICAgIfAhkiAAAAAlwSFlzAAAN1wAADdcBQiibeAAAABl0RVh0U29mdHdhcmUAd3d3Lmlua3NjYXBlLm9yZ5vuPBoAAASKSURBVFiF3ZhdbBRVHMV/9+5uPwikFExEiCtWbSKCCEsCiU1EJIEXeMIHxZgYPzBUYzB+RUPlwwTl1UhYFIiGhrQVFCMRAoQFidGaEgIuVLrbLgSkhWBb2N3uzs7M3weBILadnZndF87j3P8553/m3ty5c+Eugiq1oDy5dRw5czGKpQjTgPuAicBV4C+E02j5gSFrn4o3pkvpXbIwMmNTLaHAByjeBKqLoGRBfY4V+lSdeGmgFD2UJIzM2bwMUVFgggf634i8qo6/vttvH9oPWRAlkS1NiGrFWxCACSj1rUSiqwXx9XJ9hWH2liaQtfifYQWsIxL9yK+IJ9xYWq1+NIaBjahl6vhr33khe2pEntg+noCRxPvSGg39GNZD6tTKfrdEb8ssaHxIeYIA1FKh3/VCdD0zN74jfRS3/XpFlpx5r9vvUNC1Tc5cTDFBqoJZ1i9opyFcR0hPomD3cvR8N02H55IvOPHHUB1aBOxy05r7ZaZY6lhTFcyy74Vunp46n5AOAxWEdJhnps5n//IElaEhRw0pwucOuA8jPOpYs35BO2Mrpg87NrZiBmvn/+aooWSa29a8bACTHSsawnWjjj/1wIOOGlKEzx3wEmaiY0VIT/I1/i/uKbKfW/AS5rpjRcHudRi/VITPtSL7uQUvYfocK46e7x51PNaTKsJn9BcyDDyEkXbHkqbDc0kbp4Ydu54/xcexec42OPvcAS9b82HHmnyhmkXND3OwJ0bBPgcYFOxzHEjGWLTjEQyryrkzFXPfmkvIY1+MpSp4Aahxy3WBQQrVU9TJFzNuSK5nRsUb0yi2u+W5dNnqNgh4PWjmrXXAZU9cZ1zGMD/xQvQU5sbxfJUXbhFY5eX4Dz5/rCQSbQae96NxOyzsnXVXNjRqrSsrRarzSlWGRJRp6RBAMGAXTK1tpdRQRT6fmXHx4kAbWDf5fsPUACeAqb5SAGkxBpYMfBW9YA/mivYXZSkhFdTyc2cqlfL9yyuRaAMQAwKeNUBWZ376piV3IuVVwoSv/V1oAKpjxTGQjX40Dhh/HvMRBEAFbHuK7zAAjOttApyP9cOg17526b303iN+7G2wLa2TJQmjYmtMYDnFHEJvQwGr8H5m766M5C3n6hEgYqhAYHcqleotzcwAqmNFEuEdN5zm3PF9vxipqx4tReBMpWVtTiaTf0A5Ls4j0VbgWae6TrOvc8ngthYPFkMicpJgsCOZTP7nw+3+QsMZK/NiLqxUwdqRCrJ2PvNWes+PxQqKKBMlCdE6Hg6Hz8RiMXO4upLPDMDFWZ8tnazHfz+CvmzIHNy5Lfd712gaIqqgsXuU1nE7EOhMJBJ5J9+yhAE4P2tj8/265n+ngyNG8tdXrrfuH4E2hFLdGs6Gxow5E4/HDTee5VhmAFj92Zf7J1Q01Krq8M1nV+zMlbfTew7dXieQRaQrqPXpx+fMSbS1tXne2co2MwAds9fMm6kmHQ2gQia29ca13V8eKnT1AYMolQjA2ed6errWgF3OPkqG9pmr1+cjm4ZapjfuqK+rW1hfXz+FMr/EuwL/AGOdsbn1H7gQAAAAAElFTkSuQmCC",
            anchor : [0.5, 1]
        }, {
            src : "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADMAAAAmCAYAAABpuqMCAAAABHNCSVQICAgIfAhkiAAAAAlwSFlzAAAN1wAADdcBQiibeAAAABl0RVh0U29mdHdhcmUAd3d3Lmlua3NjYXBlLm9yZ5vuPBoAAATNSURBVFiF3VhZTFxlFP7Of+8Mi12Eot2Sia36IIJCIWmT0lhSK30wfaoaNcampBhrfGhSl5hIW9HE5VFTpWilNpUI0hrTh1YwjJSkthFEcABhBoZ0YekCFGa72/FBSLAF7jY86Pc453znO9/9//nvuT/wPwIlu2DLns1Lo3J8hwDtZHA2gNUAVgC4SYRrzNxFJH6UpNjZ4iOBqWRqJ83MmVdzM7y6520CvQ4gzQIlSoxPJVX/sLi6fTwZPSTFTOMrhbuYuRJApgP6LRDv3V7ZdsptH8INmQH6aW9BOTPXwpkRAMgE0/eNZQXvssuHK7khF5VtOEhEh+F+hQlAcX/hGu1E61CzmyKOML21at3UmAMGM+96qqrttBOyo0aadufdq3mlEJxvrXlBwFhcUh58+vPOMbtcR/8ZzSu/g0UwAgAMZHgN7xtOuLZXpmXP5qUxOT4Ca8evU0RlOb7S7ntItq8S30EWjEje1GhOacWlrNyi9SR5VrGuDo92NPd3HSvfqCsJM366pqaVAKi305vtbSZAO81yJG9qdMsnZ/vvyyveSpLHB8BLkse3Mn/b1i0fnQtK3pSYuRKb6tzdm10QP2KWklNacUlOXZIzV0xOX5KbvfvwRXMdyrbbmm0zzFhjlpOVW7R+ofj9eU+ss6BkqnMnnJxmK8wSSPKschOfRpbljqbhxMykWQLr6rBJfMiCzm3LHU3DiZkRs4TRjub+BeO/+8MWdBZ8IHPBthkiXDLL6TpWvlGLTnXOFVOjk52B6oObzJXYVOdO2D8AQE1mObqSSDv/VslDI62NftbVQQAK6+rgyG8N/vNvljxsqEqqqQ4Lv93ebE8ATfseXaJpqVcALLfLtYEJI6auLTnREbFDsr0y/4wY9LVdnh0w4yu7RgCHg2ZCSrwHYNQJ1wJGFVl53wnRkZnp8Xy/E64F7Hcy/gMuP6waygpOAnjBTY3Z0Bk1ZeeuvyaESElhTksQpXiYSdOFBwBkyVA1IQwiinkTiUju1avjdYA+w3drZjkB7Qw84NIH4hqPV1wYr7wVM+JWOcykEyMsCz7fEw6HXX/yNpQVFAHww819AoNP9kS+abkcDzutoAHHXd3OAMD2o60tTPjYTY3260qLCyMAQJJhrHVtBgA8q5eWAzAf6+fAeNwYqu6c+sWNvgEYuhChpJgpPuTXBPAiLAyhs6Ez1ONdkfqEzrp59jxgVkiSToXD4eGkmAGAbUdbQ0R8wA7Hfzl+tueGctOhJDPQnaLrX4RCoT+BRbg4bywrqGXgGbO8K5NazwcXJr5zIBFj5g7IcmsoFPrXi9v2hYYZJGBfzOAnPYIy5stJaEbky86pM1ZrMpMG4iALEfD5fN1+v1+bKy/pKwMAtS/n78xIET/MU5/r/4rUNA7G+xaqwUyqgDFAQgQMSeoJBoMJM91FMQMANS/ln8xKE3dNB4Ebyq+ftU2em4cWA1G/AHo96endgUBAsaOZ9G02g7g0VhpRMovu8ZJv5rcJxbh+rHPq59l5DETB3CcL0fVYYWGwrq7O8cm2aCsDAFXPbdjkW0bNguDRDehV7ber/rihjgCYAFFQAnqfHxjoOwQYydBbVDMAcOTZxyvWLZMPXBxS6r/tjlRDlrt7e3uvAeDF1v5P42/pFun0pc2xBwAAAABJRU5ErkJggg==",
            anchor : [0.5, 1]
        }, {
            src : "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADMAAAAmCAYAAABpuqMCAAAABHNCSVQICAgIfAhkiAAAAAlwSFlzAAAN1wAADdcBQiibeAAAABl0RVh0U29mdHdhcmUAd3d3Lmlua3NjYXBlLm9yZ5vuPBoAAARrSURBVFiF3ZhNbFRVFMd/985H26m1VEoL0zj0Ayqi6IZElpiQ2MSgIeJCDZGFuEEXJH4bG9QN6spoImiMIaExbREEYoIxhgEb1CZNjFg6lHnTacNHW8QW7Mx0pjPvuKDVprR9X1MX/Jfvnv/5n/89N++d++AOgip2QolRQZAWhCeA9cAqYDlwHbiCcB7NcTKcVA8wUUztopmRQarI8wbwMlBmg5IGPkGzTzUwXowaimJGEmxHOADc44L+F7BLNXHEax3aC1kEJQatCB24M8I077DEeUfE2+Z6MkOCVuBdvHdYoXgPg7e9JXGJ6aPV4SXHPDARtqs1HHVDdlWIDLAMEwP3R2sxjOGnSa1mzCnR3TET3mJpjABUkedVN0THnZEYFQQYwd7r1y3STFLr9DvkvDNBWrBjRIfS1B6J0pAdolFyNGSHqD0cRZVlbKiEKOUxp6U5N3Pry26RNZRm9ZUE5ds2o4IRIIgKRih/ajOrr8RtGVI2dObKOiUA91tGrDjUjap8cH7FZRuoOfirZQ5hvdPC3JgJW0aEHm9cfP3JBsscYkNnDtyYWW4ZoYIrPa0DKKptVzQN52YUf1vGSG548YDcVRtKN+0V9B/cvABGLGPSJxKLrqeOJm0oWWzI7XBzzLotI0Z3PII5fm7eNXPsHKM7NxVFZw7cdOaUdUymjMHwGlKdUSQ3COSQ3CCp9iiD4bXIZKllDkXUaWnOJ4Be7qKUS0ClU64D3KCcOrWSlBOS485MjxhfOeU5xJdOjYDbqfnWFTkG1LjhW2AUP+v+t6l5WmiPG64N7HFjBDxerMSgDXjWS47ZKBT4unFLZLfWuqREpCyrVElAROULOgDg95lTea1NpVQmmM2mNly+PN4JhRm+VzOVwG9AvScXwERaj2/dFT5wadg/aVtfVEEJSb+Wn2LJZNLTPwDVxA1gB7N2xw1EkH37q445MQKglPjQ0pSH5+vr6+u9/dAAVBNdwIdecvzQVd7V/l1F0ksZPtOs82wGgCFaAeuxfh4MX/Ndfe2D6tNe5E0wC1obRTGjHiWPyXNgYwidhakpNfX6Ryu+SWWU+2MqklM+35FkMjlcnM4Aai0GwitOOG0nKk6e7Sm97lJSBPpKCoX9hmH8AUvx49ygA3jaKi5mBGNbXwy3u5DIiMjv+P09hmGMzl4ovpkLVGcLqr+kRKoWikmnVWrb7rrPEkN+WyOLiMqjJC5a90Yikb5oNJqfL87vtuiFoO7jz8s/653hmsK3zL9Z8vHBZcesjIioKY05oLTuNf2+WDwezwIkEgtflYremRkMdQXa7l01ddt0cLq77JcX3qz9fgFaBqUSGvoDoVBfb29vzonmkpkZOEVpZaW+UFVpRmaeXRvzXWvZGf785oTv32MikEbkol/r8w9t3Bjv7Ox0/WZbMjMAPcfLNj28bvKMzyeBfIHCS3trvvjxbGgEuIFScR/0PzMwcHEvmEtZR9HQfaz0/WxMZdo/vftQc2Pjlubm5jqWeBPvCPwD/KOH+jnO5aMAAAAASUVORK5CYII=",
            anchor : [0.5, 1]
        }, {
            src : "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADMAAAAmCAYAAABpuqMCAAAABHNCSVQICAgIfAhkiAAAAAlwSFlzAAAN1wAADdcBQiibeAAAABl0RVh0U29mdHdhcmUAd3d3Lmlua3NjYXBlLm9yZ5vuPBoAAASxSURBVFiF3ZhdbBRVGIafc2Z2210hbeWnpcQVUC8kwBUJXJBIgwkgBEPEC1GMxhgE4gUJJsYERMWI3orYaiqgrYSWH/mvMaQLciE1RAKUkrLbbhMobQ20/LT7N3OOF0CC0O7szGwv9L3c73u/93vnnD3zzYH/EUTBKx6sHUvQWgR6GTAdmASMA26A6AYuofUhQnYTVevuFlK6cGaObC9DGh8i9PtAKA/GEIKvSRZtZfnbA4VooTBmjlWvQFADPOmBfRN4l8Xv7ffbhvTF1lpwrHoTgga8GeE+by9NNRvR2tfDNfyQmVv5MYJP8L/CAqgidtai/sgpP0W84d7WavBV43Eo0CtYvOaAF7K3Rg7sKKU4Hcf71sqFfmz1DEvX9rslevvPFKc/YnSMAJRhyA+8EN2vzMHasQSzveR3/HrFEMV2udv3kOlaJmgtIg8jYcMcqpu1oGXJhMi0oJQVGaV6Dvd1day62DwnaWWd+GHSciGwz01rHraZXuaUETbMoe6qVR3Ly6fMD0oZAYJBKSOvVEyd3z3/jVjIDCSddYSjzqPwYEY875RRN2tBS4kZnDFcrNQMztw144UzjjKa6W4787IylU4ZSyZEpuWKv1w+dWohdB6Fl9NsnFNCUMqKnHGRO34PYnz+Ld2DFzN3nBIySvXkjGt1PQ+d23l3dB9ezPQ6JRzu6+rIFT/Q25lwVNHkfCDDwYuZFqeEVReb5wxYmQvDxfqz6QtvnW+e69yZcNR5jOKWgKbZKSVpZUOV0bpnG3vi0YxWXUAmo1XXnp54tLL5p+dSyi52FlJRt625nwCavxlDyrgKlLjm5o9byPBkFr456IbkfmWq1t1FsMM1zx1q3RoBr4OmpT4F+jxxndGHrbZ4IXozs3RtP0Ks98R1ghDrvYz/4PfD6ti39Qix0leNh6H07siaL9ZJKYuKtA6lhSgKaC0sWwYATENlLSmVECIZTKcHZ167NtAI9gO6PzO/1ZRg6XPAFF91AJnKDES21NaYN26l8uVoLWyhSZhS/345kUj4/+Q9XjMPdBR/9wl6Qn3TjyWnzyW88i3Y5e92BmDx6tPAV35KjDnXftqHEQBhKDXZvxmA4p5NCJzH+mFg3rxzvXzn0ZN+5BUoW8p4YcxUbbZQ4nXyGEIfhrDt7MS6o/tEOm07Z48ArTPCMPYnEomewpgBeGl1HMQGN5SSk381hdsSNzwqag1tRbZdHY/HL8JoXJwfr24AXnVKK7rae/mpz3fs8aCQ1FqfxzTPxuPxf7243V9oOMESa4XOvqgDZtlIKTKVHpz4w6Ej+ZbUWlgIHdNStkYikbZoNGoNl1f4lQGM3V8us0tLfhmhvh6/98Tu0hN/XslVQ2uRlahOIWWrMozLsVgs7aQ7KmYAAnVb67PjSh+bDsKtHX9Ubmv4dQRaEiE6JLQHwuG21tbWjBvNwm+z+8hmU+/Iu8l5akwo8uA34/bg3+W1B088nKdhCK2vmFJemjV7dqyxsdHzyTZqKwMQ2r55bmpK+SktRABb2ZO+2//9E+djvcAthIgZ0P5aZ+eVzaAKoTeqZgCKt238LP10xYaxZy7tq/j5+E5Ms629vb0b0KOt/Z/GP4jqqfL5oxVsAAAAAElFTkSuQmCC",
            anchor : [0.5, 1]
        }, {
            src : "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADMAAAAmCAYAAABpuqMCAAAABHNCSVQICAgIfAhkiAAAAAlwSFlzAAAN1wAADdcBQiibeAAAABl0RVh0U29mdHdhcmUAd3d3Lmlua3NjYXBlLm9yZ5vuPBoAAAS8SURBVFiF3VhdTBxVGD3f3Rl2oRAstZXaBGxpoxaxhSVpE0ha0ib0qU/1QX009UHjQ5Oa+BO3pdTEn0QffNDGGH+SprGUqlUTSGtcKfGHBELALYTuwGJsSyEVKLuz87Mzny80sQjMzp3lQc/j3O+c8525N3fuXOB/BCq0YNNoU5lRZBwipsMM3glgM4ANAO4AuMnM14QQl7LZbFeiNpEupHfBwtRN1q1Xc+orBHoJQHEeFB3AB45w3hrcOjhXiB4KEqZxvPEIM58BUCFB/4vBRwdqBi4G7UMEYjMoqkVjzHweckEAoIJAF6LJ6BvgYC83UJiG8YYYgDYEn2EC4VRUi74eTEQSi0vrfBCNZeAy85GB7QNfyZClGtk9sfuBkBvSIL+0VsOspVg1w9XDs36JUstMYeU1rE0QAFhflCt6WYboe2aaRpvKDNW4jfy2X1nohmE85Pc7pPh1MYqMQ2DvIBER0ds3tvc1lzRvU0mttNme6tF7xmPTsT0mm178kuJIcSuATj+9+V5mxHTYqyYiInpXddd4y7qW/SqpVQCKVFKrDqw7sL+7ujsZpnDWS4OJPX2WwncYBj/uVdO+sb2vlEqfWG6sVJTWtW1q+81Lg5h2+u1NZgN42KuguaR522rj+0r2bfXSYGZPn6WQCbPBq0AltTLIOACA8KCPngDIhCEseJXYbE+tOg77Vh5Od/PuaRH+wzBue5X06D3jq43HM/FUHk6rvpDlILPM+rwKYtOxPWk3Pbzc2IK7MHxi+sReLw0Ge/oshczW/KNXjclmcetk6/YrmStxm+1JAJbN9uTlzOV462TrDoutiGdjJOK+e/NLqE3UlkYikT8BlPvl+sC8vc7eMlQ5lPFD8j0zidpEmkCf+uX5xCd+gwCSB01TMU8BmJbh5oFpS7FOyxClwiwez4/JcPPAMZnjPxDwxyqqRc8CeCaIxn1wcG7m4MyLQohwmLnYJAqrzJRzhAoASsi1c0K4RJQtMs1M3Y0bcx2Ac48eNEw5gEEAjwQKAYB1nksfnTvjTrlG3hwmhxgpRfDV0VQqFfiXN6pFmwHEAYSkRRisv5/5wv7eSMkq5IDPg93OAOiv6e8F8E4QDbvX6g0QBAAo5LpbAocBgLI/ymIAPI/1y4Fn3FvZt9M/BfF3AdcRQitImHhLPAcXzwLeh9D7YMPW3810cpYd7+IVwGxRKHQxlUpNFSQMAPTv6NeY+bgfjvmt0ZXrt+5IWjIDI2HH+UjTtN+BNbg4j2rR8wCe8qpztdzowvPzX0pYZJl5CIrSr2nafR9u3xcansjhBXb4IIVp/UolrLuZ9On0d/lKMlMOxEkWIlFVVTUSj8dzy9UVfGYAoP6X+sNik/h6BX02PsycMy8Y11fTYCZbwJ0gIRJuKDSaTCZNL981CQMA9b31Z8Vm8a/Tgd1n/aq/utC9Ai0LonEBjKklJSOJRMLy41n4ZbaIWXv2uYr5imYqp6p7z9xZdyb7ZvqHf9YxoIP5uiLEtScbG5MdHR3SO9uazQwANFxq2EuPUQ9CUOHA0U/e/dj+2b4NYB5EyRAw9vTExPWTgFsIvzUNAwC7vtnVrjyqHLeuWJ3me5nPoCgjY2NjNwHwWnv/p/E3iQfm3w9KV7kAAAAASUVORK5CYII=",
            anchor : [0.5, 1]
        }, {
            src : "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADMAAAAmCAYAAABpuqMCAAAABHNCSVQICAgIfAhkiAAAAAlwSFlzAAAN1wAADdcBQiibeAAAABl0RVh0U29mdHdhcmUAd3d3Lmlua3NjYXBlLm9yZ5vuPBoAAATaSURBVFiF3VhbbBRVGP7+M9NddtmyvcYKSbGoAYn4REJNIGmRpMREfMEH5YEYY6ptfCCBxEgEvMR4eeCBtBYa1EIIsbVAFAIIsis0og1GpJbWdrdsiUBLuXQp3e3MzpzfB23Cpe3pzGwf9Huc83/f939z5nLOAf5HoGwL7m4ryjWssdVgWkPEi5npURAKwbgJ4CoYF5n4WyBwrLZy6G42vbMWpv5MOJ9s+TYz3gIQUDtzCkw7DGgfb6gcHs5GD1kJUxcJrSWinWAUuOjgFkt+vXbl3QNe+xBeyMyg+lOhLQRqdhUEABgFRPTN59HQu8zebq7mhVxSEdoKovfgfYYJoMpzCZ91pMk87UHEHeoiobUEavai8RAYkgTWvlkxctAN3VUj2yN5eX6y464fralxG7p4vGZF8rZToqt3xs/2OzMUBADykZGb3BAdz8zutqJcI2MMYjqfX7cgTjEHHnH6H9Kd+hjW2GqAlEF0PZhataixfX5h1QJBvhLJ5kD/jaN9J7url1l2amo+U1BwugpAq5PenD9mTGtUJboeTK0v7+0rK3qhQpCvFIBPkK+0rPjFivXP/hnTtWBaaSPUPg/CzTvzlKpg1aLGdp+e+/REYz49vGTlooZfVBrMWOy0MTdh5qoK5hdWLZhqvKzo+TKVBpHa50E4D0MoVIqSr8TL+L8omnZP47pOCWCMqEokmwOK8WvT8LnjoCsA7mZmUFXSf+No31TjfTeOJKbhNOUNmQiOwxCjXVVzsrt6mWklOyYaMzLDHae63ihXaTCpfR6E4zCSKaKqsexUoOnswifiQ4eiks1+AKZksz82dDDadHbhk7ZMz1I3RlGnvTleAdRFikOEsb8AhJ1yHSA5agbnbaoaHHVCcjwz/ywx+EunPEcg7HYaBHC7OdO190G47oqrAuE6NPGhG6qrMDUrkrchaYMbrhKSNrhZ/gMeN1b10dA+ML3iReNe2JL3f/ZqQa0Qwu9nDhhE/hxmsmyRAwC6JjOWEJKI0j7DGF1y5cpwC2CP8z2F2XkiP2zr1nkAj3mLAZhpMbx3a3hnckiMTZfDTDYxErrgM92JRMLzlrcukrucgCi8nCcw+MSe2Xs6orMSbhUsoMnT6QwA1FaOtIHxqReN2G/+Ng9BAIA0Ked5DgMA12lkCwDlsn4ijNyia8d3zf7Ri78EpC1EPCthtlXC0qRYB6gXofc1YSNz/Is5rYZBtrp6EjCbpGkHEonEQFbCAED1c8k4GBudcM6fmnXscqd+06UlM9Dlt+2GeDz+BzADB+f1kTnNAL+kqhu6rHfv3Rr+2oVFmpkvQNd/jcfj9/24HR9oqKCBawyTVuk+zp+sxhyj0cMNocPT1WQmC8QxFqKztLS0KxqNWhPVZX1mAOCT1rw1uQX2oUn0+fT+4P5z3wd6p9JgpoyAvERCdEpN647FYobKd0bCAMBHzeF9ecXyodVB4kLOzwe2zzk+CS0Noj4B9OQEg12dnZ2mE8+sP2bjMEeTr6UD4eWBkCwdvzZ6Rwwd2TX7h3vrGEiBuVcX4uIzS5fGWlpaXH/ZZmxmAGBzY0H53AXWaRKcI23Y3+0INcZ/9w8CSIIopgE9L1+61LsNkNnwm9EwALB5V8EHJWWZjV0/BVpPNoW+gq539fT0XAXAM+39n8bfE7XcWzV66JYAAAAASUVORK5CYII=",
            anchor : [0.5, 1]
        }, {
            src : "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADMAAAAmCAYAAABpuqMCAAAABHNCSVQICAgIfAhkiAAAAAlwSFlzAAAN1wAADdcBQiibeAAAABl0RVh0U29mdHdhcmUAd3d3Lmlua3NjYXBlLm9yZ5vuPBoAAAR4SURBVFiF3ZhbbBRVGMd/58x2u7vQbmtvssSNAjaRiE8k8oAPBowkVTAGTVAJJMYXiTGYNFxisHiJ7ZMPQiIxxhRLCG1tjSBRubiAJEhiNDaFSlu6baRQELsI7e7sZY4PlKT2sjNzZvvC/3HO9//+33++M2e+GbiPIAqesYkSLNYgWAssBRYAFcBNYBjFBSTfkuR7GrhTSOnCmfmYcgTbgbeAoAPGOIJP8dPIVhKFKKEwZppYj2If8IAG+x8Eb7CNDq9lGJ7YCkGQXcBeIKSZJQi8zDNYHOMMu/XL8WYmxHvAbrx3WABPc5YsxzntJYke7m6tVk85psNCsZ4ddOqQ9Qr5hDJM+tF7RuwwimIxOxh1S5Racml2MjdGAMqBeh2i+840UYJiBGfHry7GSVHj9j3kvjMWa3BgJOQPjXe82BEz680htU2lzXpzqP2F9ljQF0w6UAlRzLNuS3PfmUa+Al7LW4k/ND68Zfhy2B9+fOpawkx0RfZEliSzSbsbsp/tbHJTms4z85hdQMtzLednMgJQVly2rLmu+RcHOkvdFqZjJmIXULe4blG+9XW16x4phM5U6JipsAvwS/+DXtYnUOm4ognomLltF5C20tds1q860PnXcUUT0DEzYhdwuPfw5XzrnZc647Yqgrw3ZCbomDlvF7DxyMYnE2aia6a10dRo1+bvNq+wVVH2OlOhY+Ynu4BkNhmM7Iksaetpi6Wt9CCQTlvpwUM9h2KRvZFHU9lUwFZFEHNbmPv3TAPzCfAXEHbNdY5bGCyknjE3JPeduTtifOma5w5fuDUCuoOm4n3guhbXHtdRfKhD1DNzdzzfqsW1x1ad8R+8flg1cgB4xVOOybA4GP0sukVKWVysVNAUorhIKZHNySIAn2FlslJaQoik3zTHll25kmiD3D26VzNh4HfgYU95AJmRiWhrZJ/vti/llKOUyAlF3CfVmZ54PO79k7eRlUAMb/8TVNWpiv3hiyVxXX4Wmr390AA4zhCrCCB4SjfF/IF5P1eeK//NQxVCWNYNvQNgKkx2AU7G+mnw3TGu1pysPOVF3gIrJ2V/Ycw0kEXyKg6G0MkQlshUn6r6WmREzj56FiiVFobREY/Hr3nfZvdwjFFWcRPB804pZV2lR8PdJXmH0jxQCnoCuVzrn4ODgzA3P85bUbxkF1b8t7/nofbIIQ2FpFLqD3y+X/v7+//34vZpJMsPgzeFKVYrQ5XPFiIzYqz6ZPURpymVElmE6lNSdkej0YuxWCw7U1zhOwMY7xprc/Nz38ySX1WeLT9Y1hXuzZdDKZGRWANCym7LMHr6+vpMO905MQNQtLPoQKY0M206CA0Fz0WO1vwwCy2JEJclXCoKhS52d3en3WgWfptNIOPPvC5TcqUVsKL3rhnjxo2aE5UnJscpGEepXp+UF55Yvryvra1N+2Sbs84ABN8JrkhVpU4roYqwyC34sfrzefHQCHALIfoMuLRhYKC3Aay5rKNgCLwd+EB8JJKlm0pbahctWl1bW7uQOb6J9wX+A8zucxGCTS9IAAAAAElFTkSuQmCC",
            anchor : [0.5, 1]
        }, {
            src : "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADMAAAAmCAYAAABpuqMCAAAABHNCSVQICAgIfAhkiAAAAAlwSFlzAAAN1wAADdcBQiibeAAAABl0RVh0U29mdHdhcmUAd3d3Lmlua3NjYXBlLm9yZ5vuPBoAAARZSURBVFiF3ZhbbFRVFIa/vedSZkTbClJow1irNpGIvpDIAw+NIYghqTHig6JGIoLSGEK8xEhoKpKovBoJg1aCaVNpsYhIRINh1D5oDYaIvUhn2qGhNwi2RabtXM7ZPrQk0Ns5Z5+ZF/7Hs9e//vXvtXP2OgduI4isZ1S1d0JmPVAJrACWAYuAq0A/0A7qWzBOIaquZ1M6e2bU/kLwvAu8AQRsMMZAfAK+jxCbR7JRQnbMqAMbQYSBuzXY/4J6FfFas9sypCu2UgJ1sBpEI3pGmOSJo6jwbpRytbnuzHCwGtT7uO+wAPZAeJfbJHqYPFqNrnLMhAliI2LrMR2yXiHqUAGkYugfrfkwDMb9iO3DTomaxyz1HrkxAlAI8m0dovPOTN4jQ9h7/epiDDJFTu8hjc5k1mPDSBDvWDPrIkm29Cq2ppJs6T3KukgA37gNkSD4nnBamc4xq7SuxDvWzwvdT1Na4UeGAL8fGXqG0op+NkVtGrLUmQ4dMw9ZBdTxeGs+/odnWyvAv/IwFb9by6gVTgvTMVNsFbCBUNl8609x733Z0JkOHTOLrAL8yKVu1qew2HZFU9Ax859VQApz0GJ9wIbONdsVTUHHzJBVwAl6u+dbP0ZP3IbOvBsyGzTMqFariBc589gIqfOzrQ2TPP8ykdU2hCx1pkOnM2esAsZJB4qpf6CJnkgK8yKQSmFePEIsUkzdgxMYC6xlRMRpYRoTwKcLwXsJyHfMtY9RCJQgXko4ITnvzOSIccgxz5lIrVMjoD1oGnuAy3pcS1yGzF4dop6ZyfF8pxbXGjt1xn9w+2GlwvXA865y3AzDbAiVfVglpczLUyqQFCLPp5TIGNIH4PWY6YyUphBi3J9MJlb29Y00gXGD7tZMPnAOKHWVB5DXUyOhJz8Pey+NTtiWV8IQirhXql874/G4+09eFV4DRACPfg7UPbu+/zK/4VxcN0MGDrv8oQGIbS2g9rlJsfDHf1pcGAEQHtMscW8GgMFqwMZYPxPegWsDRW+e/NmNugmmIWUsO2ZETQbYhI0h9BZa2kgveefk1yKRNKyj54BSKeHxNMfj8cEsdQYQ22LAW04o+XV/ngq2xK9qKioFHXmGcSAWi/0NOflxHm4EnrUKy2sf6ly+4YsjGgrjSqm/8HrPxmKxWy5ur0YyK2wXycxalectnCtAJpKJJTuOf2c3oVIig1BRJWVbKBTqiEQimdnist8ZwNP3caVRXPDNHPnV4r2nGwpq/+iaL4dSIi0xe4SUbabH0xmNRpNWujkxA+Dr3VefXp4/YzoIRmK/FW9u/GEO2jhCdEu44AsGO9ra2lJONHNxzABIG2OvyGH/GrMwELrxzHMlcaVox/Gfbo5TMIZSXV4p2x9ZtSra1NSk/WbLWWcAAmdrVk88uvQX5RE+Mqax7PXmz+443TUEjCJE1AMXnuvp6aoBM5d1ZA0LWnd/IJL7x+/6qqquvKxsbXl5eQk53sTbAv8DzFJ5Mvw8/r8AAAAASUVORK5CYII=",
            anchor : [0.5, 1]
        }, {
            src : "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADMAAAAmCAYAAABpuqMCAAAABHNCSVQICAgIfAhkiAAAAAlwSFlzAAAN1wAADdcBQiibeAAAABl0RVh0U29mdHdhcmUAd3d3Lmlua3NjYXBlLm9yZ5vuPBoAAAQLSURBVFiF3ZnPT1xVHMU/983QYcbqlNZoCmEkqCxMtJsm+gfQ2KaJqaYurDHaZeO2dmH8lZg06qZLtYY0RhqkKFrd1KYJE2VhqiQG5YftDAwEShFpARmGN8y84wIxhQLvx8xA0pPczbzv955z7u97B+4hmLLXKN0PHASeA54A9gJ7gGngBtAPfAdcwpj5svOXBVIN0odIC0jyULJIHyDt2m7pqyEdRZr2aGJtmUZ6YbstgGSQ3kFyAhpZKQ7S20jlH/Y+zLxboom15a3tMnK0DD2ythSRnt9qI7tKmCNu5RZSTRBZVkA7bwK7A+a6oQZ4I0ii/wm3vI9MAtEghB6xADzsdx8K0jMH8WAkBgudkLRhVJC3YfQrSEYh54EjBjwbQJtPSF+4jfuYlJ2Rftc6uC31Rr1trJ9vhZlf3YR0Sl3rGVnBBanLg5lftsLMDTchtjSymRlbyngwM+5XWpAFwAZ2bBoCeZcY20DEhSmPMW4xqxBkAfjHLSAPN12+T3jgmfOs6D8EMTPpFvA9DG32/RvIeODZtEHKA+mc23iPSgu3pd715sstqbdaynmYMy1+pQXpmS63gBxEa+GxDkjmYQTI52GkHZK18PgiVHvgSfoVFmQB2AmMAXHfud4xC9RhTNZPkv+eWT5inPOd5w8tfo0Ex/IVebJCp+bJoKfmUgwdq5CZY0EllXZNlc4DgcnvQrHYlmhsfN2yrEhEitrGRKokUyhaVQDhkLNUsCzHGJPbYdvZJ8fHZzqguJJeqpk48BvQUFI9gDU/P5M4dOjT8NjYond6UzQiE7b002Amkwl6OVuGMbPAK9zROoEgac/p0xf9GFmmVwhLjxbg1YaGhobSzCzX2A18VEoVOy9f7o63tWVKURFynLryPO1IYaAbeNpvanhiYuKRAwdaTDYbuHcdcBw4W3rPABhTAF7GwyF0VdrS0tJDp059XYoRpLwJhTozmczN8pgBMCYNnPSTEm9tvRTr7p4OyCjBQKRY/CSdTv8BlXk4vwC86BYW6e8frD98uD0AQ05SL+FwTzqd/uvOD5Uw86Cx7WuKRDbcxa1sNlt35MjHkVTK05FFMgWMUrKsvkQiMZBMJgvrxYWDat4QxvxtjY+/Vqyt/Zb1G0u7z5y56GZEMksWzrCxrD4nHBpMpVI2wNDQxlelij1UV42Onl+qr7/rdBBLJn+uPX78hw3SchgzZMG1qlhsoK+vL++Hs3Kv7sPD1VY8/qdTU5NY+Sk0NTWVaG4+G5qb+3+YCBaQroctq/+p/ftTHR0dgVe2iv6FEO3peWZx374fFQpVUSgU95448dl9V65MArMYkwrBtZeGh6+/B04ldZQN1Vevvm9sO/fAl+2tTY2NzU1NTXVUuBHvCfwLna16k1MlopgAAAAASUVORK5CYII=",
            anchor : [0.5, 1]
        }, {
            src : "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADMAAAAmCAYAAABpuqMCAAAABHNCSVQICAgIfAhkiAAAAAlwSFlzAAAN1wAADdcBQiibeAAAABl0RVh0U29mdHdhcmUAd3d3Lmlua3NjYXBlLm9yZ5vuPBoAAATaSURBVFiF3VhdbBRVFP7Ondlddvqz/aERARtFMUos4YFIH3iAxESICfCABtqkCRiJtjGRBBODivhH1PigEovFGKhJXWktpdgQfDCugEFrCEhbitvdditSKIhtge52d3bu8YE2AWx7d2a2D/o97jnf+c43996Zsxf4H4GyXXD25ta8MSOxiiWvAWERCPeCUQzCNYAGwHyOGIf90I5erX3mZja1s2Ym8EJDYZq0V0D8IgB/BpQ4gN0ez9h7wx9tGs5GD1kxk1sdXM+EOgBFDuh/E9NzN2s3HHTbh3BHZzJqvt7BhEY4MwIARUz8jVEdfB1gVw9Xc0M2qh95gwhvwv0KExFWeh7vTJu/Nh9zXMQpcXxrNbqpMQmkBNYnPt3Y4oTsqJGCl/YVmOasKJxvrekwpEv54MieyiG7REdnxjR92zEzRgCgMC3Ey06Itldm9ubWvIQ/PojMXr9OETdYu8fud0i3qzJmJFaB1UZyvHp8b1V5++qyuQu8mpiTsuTlIx0DvVvqTy6Lm5aKbyRE+kkAzXZ6s73NWPIaVU6OV4+Hd63tXbtk/gqvJkoBeL2aKF23ZP6K8LvrIoZHSyh1AKXO3bB/ZgQ9qkrZW1XeHpjleWyyWIHhKaurKv9FqcO0yHZrdgkAz1VlrC6bu2C6+FOL5z2QgZBS527YN8MoVqV4NTHHTXwcszPuaRxOXs03VAkpS15WxC9loHM9447G4WSbDaoyjnQM9E4X//bMhZhShjDtA5kMDsxQuypjS/3JZcNxs2Oy2HA81fF8Q3u5Uoah1LkbDs4M/aBKiZuW/+FXDz3UcvpCKGXJfgCplCX7m0/1hxa+1rowkbJmZaAUstua7QmgpLoxN07WnwACdrk2MDLqN+fhw6pROyTbK3NrxKB9dnn2wF/YNQI4HDR1ab0F4IoTbga4okt+xwnRkZmRPZVDIGx1wlWCsNXJ+H+L6gI5NcEGABVuatwBtoLFbdtrhBA+H7M/SeTzMFPaEh4A0DVppoWQRJTwJpOjZRcvDjcB1gTdlZnCLY2BlMc6A+B+dy4AkU4Olxz7uE4khsYy5TCTRYyYLvj4+Vgs5vovb171V8slUQhu7hMYHOhs+dL4oz3mtEIaqHd5OwPcqK04AeADNzX8g10nXBgBANKknOfaDACMlszZAUA91k8CbWzkUuBs049u9CUgLSGiWTGDnSvTuqBKgJVD6O0gaZmB35qbyUxa6uwpwJwiTTsYi8UuZ8cMgJHdG6JMYpsdjr//5FHfXz3XHEoyA90+y/osGo12AjNwcZ5TE2wE8LQqz3v90vni458ccCCRYOaz0PVT0Wj0jg+37QsNFYTJ1axZT7DQC6fOSY7mnw62ZVqTmdIgjrAQXaWlpd2hUCg9WV7WVwYA8jbXrpH+wkNT1Of8c23BnL6feqarwUymgOwjIbqkpp2PRCJJle6MmAGA/E21DZZR+K/pwHf195+L2vd/NwUtAaJeAYQ9htHd1dWVsqOZ9W02gevsfzY3NbqcvTmlE7+J5M2rgdMHvr89j4E4mHt0Ic4tXro00tTU5PjNNmMrAwBFle+XpwLzjzEJD6RlFZ1q+Nx3pXsQwAiIIhoQ3tjX17MTkNnQm1EzAFBQsettM3DfNv/FM81FnS37oevd4XB4AADPtPZ/Gv8AkvXQkIP4nXQAAAAASUVORK5CYII=",
            anchor : [0.5, 1]
        }, {
            src : "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADMAAAAmCAYAAABpuqMCAAAABHNCSVQICAgIfAhkiAAAAAlwSFlzAAAN1wAADdcBQiibeAAAABl0RVh0U29mdHdhcmUAd3d3Lmlua3NjYXBlLm9yZ5vuPBoAAASpSURBVFiF3ZhbbBRlFMd/3ze7bXdp0yKlQI2NIqZlK8YHjDxgFEIikVhKAibeooH4otFIosFLgvdEn9QQHojxAkoIFChRMWBCXC5GxRgb6sJSWrrlDgXbUrrbndmZ44Mlwdru7MxsH/T/ON/5n//5z5n55swH/yOoomesb6rAMBaDNAExYAYwBbiC4hxwFORrKNlDouVaMaWLZ2bOksk44VeA5xEiBTDSiFpHqbxP267+YpRQHDONS5cjagNwkw/2n2j1DH+07gxahhGQr2hcthZhPRD1mSOC8Ag1DQ69yYNBiglmJtb8BvAWwTusgAVUN+S4nDzgN4l/M41Ll4NaTzHfO8UDVNe3c/l40h/dD+5ursKkC3/viBv6MKzbad/d55WofclZ8hoTYwRgMnb4ZT9E752pb6ogpC8WuP36RRoVnub1O+S9M4axuBAj0bLS9M6P18SzbdtPSaLVzLZtP7X9ozXxSKQkU4BKFKwHvZbmvTOx5i+BJ/JWUlaaPrf/s5OV5dE7R6/1Dw611y5YOSuTMfPfEKU2kWh9yktp3jujmO0W8tUHLx4eywhAVcWkORvfe+EXVx1HYl5L825GqHULWXL/PTPzrS9dOO82Vx3lrjMafnazKW4BJWFjepD1EVQXXNEI/JgZdAswLfuCy/r5AnSuFlzRCPyYuegW8E3815P51lv3/ZQqQCfvDRkLfswcdgt48tUP7+0fHGofa61v4Fr706+vm1cMndHwsQHID24hmYwZqV2wclbL3h/jpmX3AKZp2T1b9xyK1y5cdcfwsFnmrkPca2nevzONK8rBOoNQ6ZlbKBQDGOmbOfL9kBea9878PWJ87pnnBcKnXo2A30FTW28Dl3xx3XEJw3rXD9GfmfbdfShZ7YvrBiWr/Yz/EPTHKta8GXgsUI4bIc6WuqG257TWpaUikaxSpWERlbN1GCBkOFZOa0cplSnJZofmnD3b3wL2dXowMzNXVFJmtQG3BsoDaJz+uuHkhpBjDhfKEVG2ElIhLQeTqVQq+C9v47L5IHEkyHmCyFTrzKZK60rKb4IcbAx6OgO9yVNMbSgD7vObotweOFRtnv89QBVKOU6vvw1gNGr61wLuY/0YCIl5fpp5en8QeQccW+uu4piJx3NoHqeAIfRGKLBqzNM7lNi2e/Q4EDGVYexMpVIXgj9m13Ep2UdNwxXg4UIpVVbvd5W5y3mH0jwQgWSZbW873tPTAxNxcB5r3gascAsrdTLJW4aPb/WhkBGRI4RCv3V1df3jwx3ykSw/cvazKqQWCXryeCFa7KEaq+fbQlOKqBxKOkXrRF1d3bF4PJ4bK674nQGM+iVNthHeNU5+qTbPbqnK9Z7Il0NEWRqnW2mdcAwj2dnZmXXTnRAzAOHYQ5stSv41HURzgz/Xml17x6FlUOqkho5wNHoskUiYXjSL/5iNwEqnV+mInu+oUN31a4bkeqdlU/tuvIUCaUROhLQ+etfcuZ0tLS2+d7YJ6wxAZPaiecO6/IAIYUTsGWb3J5PsqxeBAZTqNKDj0e7uE2+CUwy9CTUDUFa/6J2sEX2pwurfMd0+8wWh0LGOjo5zgEy09n8afwEcs7T5cvn0GwAAAABJRU5ErkJggg==",
            anchor : [0.5, 1]
        }, {
            src : "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADMAAAAmCAYAAABpuqMCAAAABHNCSVQICAgIfAhkiAAAAAlwSFlzAAAN1wAADdcBQiibeAAAABl0RVh0U29mdHdhcmUAd3d3Lmlua3NjYXBlLm9yZ5vuPBoAAAS2SURBVFiF3VhbTBxVGP7+szPscmkq1FZqE2pvUYvYwpK0SUla0ib0iaf6oD6a+qDxoUlNvMTthZp4ifHBB22M8ZI0jVCqVk0gbeOKxAsJpAG3ENiBxdiWSypQdmd3Znbm9wGaCAKzc2b3Qb/HOf/3ff835+TMmQP8j0D5FjxwYGhdJlN0lIibmbEbwGYAGwDcBXCbmW8KIa6k0+mOWKw6mU/vvIWpqRkvV9XsK0R4CUBxDhQdwAe2Ld66cWPbbD56yEuY+vrRY8x8HkCFBP0vZhzv69tx2W8fwh+dKRzWIszcCrkgAFBBhEvhcPwNgH29XF9h6upGIwDOwP8ME0Bnw2HtdZ8iclhcWq1+NFaAw8zH+vp2fiVDlmpk796xBwIBR4P80loLM6ap7BgY2DrjlSi1zBSFX0NhggBAeVFR9mUZoueZWfiOqJPIbfuVhZ7JZB7y+h1SvLpkMkVHAXYNEgoJvaVlY09DQ8l2VaVKy+KJri59NBKZ2mcYrvyS4uJQE4B2L715XmZE3OxWEwoJvaNj62hjY+khVaUqAEWqSlWHD5ce6uzcGg8GKe2mwUyuPsvhOQwzHneraWnZ2FNWRk+sNFZWJmrOnNn0m5sGEe/22pvMBvCwW0FDQ8n2tcYPHizZ5qbBzK4+yyETZoNbgapSpZ/xBdCDube0AIkwNO9WYVk8sfY47uRgdC/nlhYhEYYn3Sq6uvTRtcaj0VQiB6M1X8hKkFlmPW4FkcjUvmTSGVhpbH7eGTh1amq/mwazu89yyGzNP7jVGAYXNzWN77x2LRW1LB4HYFoWj1+9moo2NY3vMk0OuTYmKOq5N6+E6upYWSgU+hPAeq9cD5izrNIt/f2VKS8kzzMTi1UnifCpV55HfOI1CCB50DQM5SyAKRluDpgyTeWcDFEqzOLx/IQMNweckDn+Az5/rMJh7QKAZ/xoLIV9cXr6yItCiGCQudggCqrMlLWFCgBKwLGyQjhElC4yjFTNrVuzbYB9n+03zHoANwA84isDAGZ9Njl7/LzjTGRy55BNjIQi+KehRCLh+5c3HNYaAEQBBORVmPXU+19Yme8TsgJZ4HOftzNAb++ObgDv+NGwzO5uH0EAgAKOs8V3GABYt+6PCADXY/1KYGf6Tjr59o9+/B3AsYXQ8hImGm3MAs6zAFwPoUthWXrq3XbmtO1euwqYTQoELicSiYm8hAGA3t5dGjOf9MIxMt92ZM3eu5KWzMBg0LY/0jTtd6AAF+fhsNYK4Cm3OierDc3PPf+lhEWamfuhKL2api35cHu+0HBH9gVm+whRsHy1Cnb0VDJ57rtcFZkpC+I4CxGrqqoajEaj2ZXq8j4zAFBb+0uzEJu+XkWfM6kPLxqZSyNraTCTJeCMkRAxJxAYisfjhptvQcIAQG1t9wUhNv/rdGCZPb/q8692rkJLg2hUAMNqSclgLBYzvXgWYJktYGbGeq6iYq6BaH3V/WeOMzOdTr55/Z91DOhgHlGEuPlkfX28ra1Nemcr2MwAQF3dlf1Ej3UBARWwbf3e6Y8t6+dJAHMgigeA4afHxkZOA04+/AoaBgD27PmmRVEePWka19sN/b3PoCiDw8PDtwFwob3/0/gbh/Lm30zcQi4AAAAASUVORK5CYII=",
            anchor : [0.5, 1]
        }, {
            src : "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADMAAAAmCAYAAABpuqMCAAAABHNCSVQICAgIfAhkiAAAAAlwSFlzAAAN1wAADdcBQiibeAAAABl0RVh0U29mdHdhcmUAd3d3Lmlua3NjYXBlLm9yZ5vuPBoAAASdSURBVFiF3ZhbbBRVHMZ/58xeSgNCqRegsamt1EhEXwjw4AMmJGpAEhNoVOItxgdFQ1C5qqQiKiVRHtQIGuKDXNItFJGSoFFYpIltExIj9EK7WxbTUi7BFqHbTndm/r60CWDp7MxsX/ge9/y/7/t/55ydOXPgDoLKtWDVQZnkDPGUgiUIs4DpQCFwBTgv0KLhpwE4UlmhrufSO2dhPtstBSrEOhRvAxOyoKSV4stIiC2rnlV9ueghJ2GqYrJUYAcw1Qf9H6V4fe0yVRu0Dx2ELCJqS0w2CsTwFwRgqgj7qqrlQxEJNLmBwmzdx0bgI4KvsBLFpqp9vB9IxC9xeGvFgmiMAkdg6foKdcAP2Vcj2w7IFDNDEv9bayz0Soay9ctVr1eir202lGED4xMEoIAQq/0QPa9M1UGZJCYXye7x6xfpQbjP63so5NVl+IXoGiQSIr14Lk1l0ynVmmmOw4WOHjrrGpln2a78/KjwJLDfS2+et5mCJW41kRDpFYvpnFnEAq0pBiJaU/xQEQveeoZEyGAgFz63wvt/RnjYrWTxXJoiYR4ZbSwaZvaiuTS6+ihmeW3NzwNghltB2XRKxxovn8EDufC5FX7CFLqKaqYFGR/G3Vl3NKLrlQBccytwHC6MOS70ZOHzb9YdDcNPmItuBR09dI413t5Nyk1DMfaEjAY/YZrcCuoamWdmODXa2OAQpw43Md9NQ5S7z63wHkZxzK3Espnw1SEebOsi7jicA4Ych3NtXcS/rmOmZZPnaiPEvbfmEZUxmZgHXcBkr1wPuGoMUrT6JdXvheR5ZSor1HWE773yPGKn1yDg86ApFpuAS364WeCSZNjsh+grzPDxfJUfbhZY5ef4DwE/rLbEZDfwQhCNG+HY9t7ta0tXaK2jUZEJplLRsIiybB0GCBlOxtLaUUoNREyzf3Z3d18N2CP8oGEmA38CJYFSABnzel/tF0/vuNbbNZgtR0TZSkiFtJxoS6VSge4A1lWoq8CL3DA7/iDScPjTg16CACglBlrKLHi5pKSkJFAYgHUVql6ErUE0Uqd/qT/TsDcVQEIZjlMUOAyAeS8bIYtj/Sjo7+vpOV797vEg/g44ttbJnISpfEJZ2mE5WRxCb2rCzmSO16zZnzH7/W9TkSFlGLWpVOpCTsIArHlOJQXe88Jp+WPXkfMd9Vd8WopAa9S2tyeTydMwHhfnMYkJLHOru9LT0nZg26JqHxYDIvIXodDJZDJ504vb84WGGwyLN00xFxrhaMHtaiyzv//onpV12WqKKAslCdG6ubi4uDUej1uj1eV8ZQA++LZ7ycQpM368jb40HNq89/SJnR1jaYiojMY5q7RudgyjLZFImG6+4xIGYMM3f+++q/D+/50Ous7EG47sfPXn29AGUKpTQ3s4P7+1ubl5yItnzrfZCCJ59muD6d7H8/ILikd+S1+7fPnYnpW/3VgnkEakI6R1y6Nz5iRqamp8P9nGbWUA3vn85Px7ih77XWkj7NiWffSHN75Ltfx6EbiKUgkD2p8/e7ajEpzx7CNnWLm16eNP9pgDr6yu3lVeWrqwvLy8iHGexDsC/wHqq7fSQTg4DwAAAABJRU5ErkJggg==",
            anchor : [0.5, 1]
        }, {
            src : "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADMAAAAmCAYAAABpuqMCAAAABHNCSVQICAgIfAhkiAAAAAlwSFlzAAAN1wAADdcBQiibeAAAABl0RVh0U29mdHdhcmUAd3d3Lmlua3NjYXBlLm9yZ5vuPBoAAARmSURBVFiF3ZhfbBRVFMZ/d2Z3y1aatoCAbVyxahON6AuJPPDQGIIakhojPihqJCIoxBDinxgJTUUSlVcjYTENYNo0UCiKRKrRdFUetJGEWAuE7rZLA+VPg22Fbdk/M8cHtkmtbWfmzu4L3+Pc833nfPfczD0zcAdBFVqwCSnLwdNAPfAIcA8wH7gODAJnBI5Z0LEZdbOQuQtmZjdSacIHwNtA2AVlTMHnQfh0HWqkEDUUxMweZI2CKDBPg/63wBtvotr91mH4IQui9iINCg6hZwRgnoLDUWS7IL4215eZvdAg8BH+O6yAHVHY5ldEC/mjdciPxjSwFazZgDqqQ9YqZB9SkYEE+kdrNgxb8MAm1LBXotYxy8CHFMcIQKUB7+kQPXcmf49cxd3rVxdjOVjk9R7y3Jn8hehoJFDK2Kp2YuvTDGwQMuvTDKw6TCwYZtxFmtIgPOW1Np1jVu8UEChl7OVB+pY8R50RIgKEjBCRJc9Tt3aQuEtDjnmmQsfMw04BTzbTFSrn0enWQhUsrTvA704acnsU8gQdM1VOAZHV1My2ft+z3F+IPFOhY2a+o2iIxX7W81jguqIJXa8E4IZTgJ3hisP6ZRd5/nFdUR46Zq46BQx8S99s6/1HSbrIM+uGTAfPZgS6nGI6X+GJzAjd062lh+mOvcZyF6kc80yFTmc6nQKy44Rbqniwv42YneECkLEzXEgcJNZcxUPWLeY4aSiIeS3M8wTwBTI3ABeBcq9cDxgNQ/WrqJQXkufO5EeMfV55XqCgyasR0Bw0LdgBXNPhusC1HOzUIWqZyY/nW3W4LrBVZ/wHnx9WUaQFeMmPxmTYWK2fRGo2G4ZRUiISTitVEhRROcsIAgRMO5szDFspNR5Kp1NLL10aaQNrgu/XTDlwGljiywWQMW6O7K96JjoauHjLLUdEWUpIBgz59VwymfT9yRtFVnD7NWrqq4h0zN/2VXdZa1JXIAcHfP3QANiIOimwy49G710/nPRhBECZtl3t2wzAFWgA57F+OtwwL18+seCdn/3kt8G2DCNREDONqBywFhdD6GRYKpv97u73j6RVynKOngEiGWWa7clk8kpBzABsRCWAd71wTpc1dwzMOXldM6UInC2xrD2JROIvKMKP8yhyCHjBKW4odObc/qrVBzVSjIvInwQCpxKJxH8u7oCGmBM25VR6ZUBKKmcKyKhU6puFW467FRRROZTExTB6IpHI2VgslpsuruCdAfjMvFRfYVV9PYO+dFbubP2jvKl3Ng0RlTWw+5Vh9NimeS4ej6ed8hbFDMCu4EBLefbe/00HfeHYb0cWrft+Bto4SvUZcD5YWnq2p6cn4yVnMY4ZAGNZ6/WQMbwibFdGJp6lzKGh4wu2/DQ5TmAMkd6AYZx5bNmyeFtbm/abrWidAWgMn1q++NbjvygxgzY569jCt77sLf3xKjCKUnETzr/Y39/bCHYx6ygYts/p+ni3So9vnnuwubamZmVtbW01Rd7EOwL/Ai1BeTIkgAbWAAAAAElFTkSuQmCC",
            anchor : [0.5, 1]
        }, {
            src : "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADMAAAAmCAYAAABpuqMCAAAABHNCSVQICAgIfAhkiAAAAAlwSFlzAAAN1wAADdcBQiibeAAAABl0RVh0U29mdHdhcmUAd3d3Lmlua3NjYXBlLm9yZ5vuPBoAAAQMSURBVFiF3ZnLT1xlGIef78zAMFgCeGscLCGoLEy0myb6B9SIMTXW1IU1Rk3cGF16SYy3xMRUN8aVWkMaY0lDUbS6qbcwKjGmSmKwXKQzMBAoINICMgxnLufnoqWhCJzLzEDSX/Ju5rzved/nu39n4BqSKfULhWqAVuAh4E7gFuAGYA44DwwAXwGnDWap1PlLIqF6oXeEloXkwdJCR4Tqdrr2qyR0SGjOI8R6mxN6ZKcZEDJCrws5AUFWzRF6Tajkw94PzBtFQqy3V3cK5FAJemS9FYQObjdIXRFzxM0uCNUHqcsKyPMKcH3AWDfVAy8GCfQ94S7vIzNANEhCj1oGdvvdh4L0TCteQKpZpos4NuOILDbjfEacKBkPOaqB+wPU5k9Cn7qO+2qlNa8/tZEuqk9RTxvrJ9sB87trIV3q3hBkVSfV7QHmt+2AOe9aiK2xLWFspTzATPqtLcgCYAOVLk5ZFx8bQ8QlVdZg3HyuUpAF4F9XjyzTLs+nPORZ9FjPFQWBmXH1+JqRLZ9/QcpDnq0bpBQSOuY63qNa1kX1bThfLqhPVcp4mDNtfmsL0jPdrh4ZosS4nU7iZBkDsmQZo4M4Me5ghSoPeeJ+CwuyAOwCJoBav7E+tAA0GEzaT5Dvnrl8xDjmN86n2vyCBJYuXZFnynRqngl6ai4G6HCZYA4Hramoa6pQOxA4+XoVKJxobmx+zrKsSESK2sZEKiSTL1gVAOGQk8tblmOMyVTadvquycn5TiisxhcLUwv8ATQVRQEsWUvzB2IPfDQRnljxnF+mYEQqbOnnoVQqFfRyBoDBLABPsKZ1gkhIR+rfPuUHBMAYhbB0Wx6ebGpqaioKBsBgeoB3i3nHd9d929NRcyJVTBkhx2koyacdoTDQA9zjN3Y6NDXVeut9bWmTDty7DjgOHC26ZwAMJg88jpdD6BrlTC738k0vfV4MCFLWhEJdqVRquiQwAAaTBF7wE9Nec/z0L1U9cwFTSjAYKRQ+TCaTZy/VUGIJnQQedfMbqhwYOhB7sCNAioykPsLh3mQy+ffaB+WAudE29nBEkU138WWTTh9sePiDkXDC05FFMnmMErKs/sbGxsF4PJ7fyC8ctOjNZDD/TFqTT8UKsS/ZuLH0ft17p9xAJJOzcEaNZfU74dBQIpGwAUZGNr8qle1D9XjFePue3J7/nQ5+jMZ/fWb3099sEpbBmBELhiuqqwf7+/uzfnKWDWaU0apaq/aveqe+cfW32dDsbGts/9HF0OKVYSJYRjoXtqyBu/ftS3R2dgZe2cr6F0JvtPfevSt7fwopVJEnX3j+5mc//qH6+xlgAWMSIRh+bHT03JvglLOOkulM1Zm3bGNnOnZ1HG9pbt7f0tLSQJkb8ZrQf5kyepAtajIBAAAAAElFTkSuQmCC",
            anchor : [0.5, 1]
        }, {
            src : "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADMAAAAmCAYAAABpuqMCAAAABHNCSVQICAgIfAhkiAAAAAlwSFlzAAAN1wAADdcBQiibeAAAABl0RVh0U29mdHdhcmUAd3d3Lmlua3NjYXBlLm9yZ5vuPBoAAASoSURBVFiF3VhNbFRVFP7OffMY6EjnvYGMrW2atmijRNyUBJcsTGRFQkJTKwpuXBliSDQxGolVEo0rjAuBhLCRGFuL4AoXTauWaBtNTHHoD/NHImXoOH2vY9+Uzvs5blpSoO37m7rgW777feec794zb867wGMEqnXAYrG4XQhxgIgOAtgNoBHADgAlADMAbjDzD7ZtX00mkwu1zF0zM7quq47jvAfgOIBtHiQVAF8S0Weqquq1qKEmZkql0mEiOgsgEUA+R0Rvqqp6KWwdIoyYmUnTtJNE1IdgRgAgwczfaZr2ITOH2txQZnRdP8nMvQh/wsTMH+u6/kGoIEGFy63VFybGGnCI6LCqqt8HEQcqRNM0hZkzCN5aG4YXQuxSFEXzKwzUZsz8PjbHCACojuO8G0To+2SKxeJ2SZLuwtvrNygqlmU96fd/KOI3ixDiADwYIaJKLBYbk2W5HUADgIJpmlnDMPYxs5u+TpKklwEM+KrND3m5yIMeOJV4PJ6VZXk/gBYAWwC0yLK8Px6Pp4losRZ5HkaQ38xzboRYLDZGRM+vtUZEe2Kx2KhbDGbe7bewIGaeciMst9ZG621uMYjINc/DCGJmhwdOQ8h1ANjpgfMAgpj51wOn4LJ+x0OMsgfOAwhi5q4bwTTNrMt63kMetw15BL7NMPOYG2f59Xt9Hf31SqXyolsMInLN8zB8mxFCDLlxmHnb/Pz806ZpDgO4BaAK4JZpmsPlcvkZx3G2ekg17Lc23xPA7OzsE5FI5G8Acb9aH5ivVqtNDQ0Nhh+R75NJJpMLzHzBr84PiOi8XyNAwKlZ13XVtu1JIkoG0W8EZp6VJOnZ/21qVhRFI6ITQbRuIKITQYwAIT+s5ubmLgJ4NUyM1bBt+5vOzs63hBDRKPO2JaKozEyWLWQAiEiOaQnhENHilqUlY8/t23o/YK/ow5qJA/gTQGsoFwAMw9CPdHefnZmZuedVw0w2MfIRwb9M5vP5UHcAiURiHsDrWLU7QcDM/MXp01f8GAEAIpYgeJcFHGttbW0NZQYAEonECIDPw8T4aWho5PLAQD5ECJIcp6kmlxHMHNE0bQTAPr/au4XCnVe6us4bhhH4dB3AcYBzoU8GAIjIEkIcgbch9D4syzJ7e3sHwhgBc5Uk6VI+ny/UxAwAKIqSAfCOH01/X9/V30dHSwFTMgMTUds+k8lk/gI24eJc07Q+Zu5y401PTU2+1tPzbYAUi8w8jkjkj0wmM7t6oeZmyuXyTsMwpqPRqLpuNZWKcezo0a/y2aynkYWZLBCnWYhUS0vLxPDwsLUWz/ftjBvq6+v/SaVSbzQ2Nl7G2pvF586cueJmhJlMASdHQqSciDSZTqeXACCbXf9TqeYns4Lx8fGLzc3Nj0wHv1679tvbx4//uI5sEURZAUzLdXUTqVSq6ifnppnJ5XJbmXlKUZSWlWelUqnYdejQuYWFhfttwkAFzDcjQtx4Ye/edH9/f+A3W83bbAVtbW33hoaGuuvr638WQsiWZdmfnjo1sGxkHkRpCZjuyeVufgQ4ADCVy21WObXB4ODgJ4VCYfHC+Qtfd7S3v9TR0dGETeyIxwb/Abxf6DIUZxAeAAAAAElFTkSuQmCC",
            anchor : [0.5, 1]
        }, {
            src : "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADMAAAAmCAYAAABpuqMCAAAABHNCSVQICAgIfAhkiAAAAAlwSFlzAAAN1wAADdcBQiibeAAAABl0RVh0U29mdHdhcmUAd3d3Lmlua3NjYXBlLm9yZ5vuPBoAAAS9SURBVFiF3VhNbFRVFP7Ond9OlBnApihJM1N0EqltQzoJLFxAQiKrruhCjXFh3GhcEGowGomiJEhYUJtUiTFCGEJsBX9CU2pQqzZB6WtLOgw0MNN5TUSggtNp6Tw6fe8dNyWp0Pa9d9/Mhm8593zfOd+9J/educAjBCq34MDAwOPBYHAHM7cQ0UYATwJYC+AOgL+J6LJpmj+EQqGz9fX1d8uZu2xmRkdHV8/Pz7/DzG8BqLJBKQLo8Hg8BzZt2jRVjhrKYmZwcHAnER0BsEaC/i8Rvd7c3HzabR3CDZmZSVGUvUTUBTkjALCGmb9RFOV9Zna1ua7MDA8P7wXwIdyfMAHYNzQ09J5bESkstFaXG40lYBLRzubm5m9lyFKFjIyMRAzDyEK+tVZC3u/3b2hsbMw7JUq1ma7r76IyRgBgdalUeluG6PhkFr4jt2Dv+pVFsaqqqsbpd8jrNEswGNwBG0aEEMVYLHYhHA7XEdE6Zr5ZKBTGc7ncZtM0rfihYrH4AoBTTmpz3GbM3GIpKkSxqalpPBKJbCWiWgB+IqqNRCJbGxoaMkIIzUqDiCzzPJTXKYGInrWKicViF4QQzy215vV6G6LR6J9WGsy80WltMhfAU1YB4XC4bqX1SCQSs9IgIss8D0LGzFobhaxzs76AJ2xXtAAZMzNWAcx802L9ho0807YrWoCMmVtWAYVCYXyl9ampKdVGnhU3ZCnImLlgFZDL5Tbrup5aak3X9ZSqqlusNIjIMs+DkLmaf7GKMU2zKpVKPZ3P5/uZeQJAiZkn8vl8fyqVesY0zaANjX6ntTmeANLp9GOapv0FIOyU6wAFn8+3vqmpadYJyfHJ1NfX32Xmr5zyHOJLp0YAyUEzEAjsAzApw7WBSb/f/7EMUcrMwni+S4ZrA7tkxn/A5R8rRVFOAHjJjcZiGIZxsrW19U0hRCDAXDVHFPAxk24IHwB4Pea8LoRJRJp/bm624fr1qW7AuM93ayYM4CKAqCsXADRNm9qze/eRycnJe3Y5zGQQQ/UK/n1MVVVXbwCJRKIA4BUs2h0ZMDMfP3bseydGAICIPRC8QQdejUajUVdmACCRSAwAOOhGQxkcHPj53DnVhQR5THO9azMAMDMzsxeA5Vi/FO7cvn2js6PjVzf5TcA0hMiWxcy2bdt0AC/DxhC6GLquz3/W2XlK0zT5NmUukcdzWlXVm2UxAwCJRCJLRG1OOD/29Z29NDp6RzIlM3AlYBifZ7PZS0AFHs4VRekC0GoVN6GqY3va2r6WSKEx8yi83qFsNvu/D7fjBw0beKNUKm33+/2rlwu4p2mz7e3tZ+wKMpMO4gwLka6trb3S39+vLxVX9pMBgN7e3pbq6urvltHn40ePnuw5c+baShrMNC9g5kiItOnxjGUymTmrvBUxAwA9PT0nampqHpoOLo6M/HFg//6+ZWgaiMYFcNUXCl1Jp9MlJzkr0WYAgFAo9Nr09PTzq1atqr3/W6FQ+OfTw4d/WhzHQBHM17xCXG5MJDLd3d3SN1vFTgYAksnklng8/psQwqfrunH40KEvFEW5BaAAoowHuPpiLnftA8CsZB1lQzKZ/Oj8+fPawU8OJuN1ddvj8fh6VHgTHwn8B/S71Ufd4vUbAAAAAElFTkSuQmCC",
            anchor : [0.5, 1]
        }, {
            src : "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADMAAAAmCAYAAABpuqMCAAAABHNCSVQICAgIfAhkiAAAAAlwSFlzAAAN1wAADdcBQiibeAAAABl0RVh0U29mdHdhcmUAd3d3Lmlua3NjYXBlLm9yZ5vuPBoAAATTSURBVFiF3VhPTBRXHP7e2xmBTYwgDXVdQ6m2hxrsyaweeoCkSXtQExOZ0JLSQ9NLmx5MbGya1P49NCRoQg9UG1MTA5RZEbegsYemVE1gMU1JBRZhF9dkccHGAkUXZmfe/HooJJTCzs6b5dB+yV7m/b7v9/veezvvNw/4H4EVWjASiWzNZrOvAjhCRHsBBACUA3gE4AGAUQDfA7iuadrjQuYumJm2trYyRVE+YIy9B6AkD0qGMfaVoihfHj16dK4QNRTEjK7rxwCcBbBdgv4HY+zturq6y17r4F7IRMR0XT8FQIecEQDYTkSXOjs7PyIiT5Pr80Kurq7+GMCn8L7CjDFWG4vFrHA4fENaRJa4vLV0LxrrwAZwTNO0bhmyVCHd3d2lpmkmIL+1cmHWNM09DQ0Ns26JUv8Z0zQ/xOYYAYAyRVHelyG6XplIJLLVMIwZ5Pf6lUUGwNNuzyHFbZblA9HRiKIomVAoNBgIBHZzznfYtj2dTqcno9HoASGEE99PRK8A6HJTm8w2O+IUoChK5tChQ5PBYLCGc14JYAvnvDIYDNYcPnw47vP5FguRZy1cmyGiF5xiQqHQoKqq1euNqaq6LxQKRZ00GGN73dYmszI7nQICgcDunAI7dz5biDxrIWOm3FGU8x1expfxVN4Vrei6JQBYcAqwbXs61zgRpfPI82feFS1DxsyMU0A6nZ7MNT41NZXMI0/OCVkPMmYGnQKi0egB0zTvrDeWzWbvDA4OHnTSYIw55lkL12YYYz85xQghSnp6ep5LpVJ9tm3fB5C1bft+KpXq6+3tfV4IUeykQUR9bmtzfWgS0WUALQC25YoTQpT09/fXrHr0zPIvH8wvLS25/r5xvTKapj0mom/d8lzifGNj4xO3JKlG07KszwA8lOHmgYemaX4hQ5Qys9yeH5fh5oHjMu0/4PHDStf1NgCve9FYDSFEx8mTJ9/lnBcVEZUYjBWpRMwSXAUAxWebFuc2Y2xxi2E82Tc1NRcGxArfq5ltAIYAVHlyAcAwjLmW06fPzs7OLuXLIWKCEZIKp5tjyWTS04WGpmnzAN7AqtmRBF27ejXixggAMEY+cNpjAW9WVVVVeTIDAJqm3SKiJi8ao8PDt24PDCQ9SDCfbQc9mwGAioqKUwAc2/r1MD83lw53dv7sJb8N2ILzREHM1NbWWrZtNyCPJnQ1hBDmpXC4yzAM+W1KlGU+3+VkMjldEDMAUF9fnwBwwg0n2t9/PTEx8UgyJREQKxLi60QiMQxswsW5rus6gDqnuOl0eqzlzJlOiRSLRPQbFOWXRCLxj4PbdW/mBMuy3iGil1VVLdsoJmsYTzra23vz1SRiFhjFifORysrKWF9fn7VeXMFXBgDOnTt3pLS09MoG+nStp6fj1s2bE7k0iJjJYd9jnI/YPt9YPB43nPJuihkAaG1tbSsvL/9XdzB+9+7AhfPnf9iAtgjGJjkwrvr9sZGRkaybnAXfZisoLi5+K5PJvOT3+ytXni0sLPz+XXv7j6vjCMiAaELhfPTF/fvj4XBY+s22aSsDAM3NzQeDweANzrkqhBAdFy9+Mzo6OgNgHozFfcD4a/fuTXzy94W5Z2yqGQBoamr6fNeuXSeGfh3qutJ16QIUJTY+Pv4AAG127v80/gIGr+iWe+FGsAAAAABJRU5ErkJggg==",
            anchor : [0.5, 1]
        }, {
            src : "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADMAAAAmCAYAAABpuqMCAAAABHNCSVQICAgIfAhkiAAAAAlwSFlzAAAN1wAADdcBQiibeAAAABl0RVh0U29mdHdhcmUAd3d3Lmlua3NjYXBlLm9yZ5vuPBoAAAToSURBVFiF3VhdbFNlGH7ec05/F6IUE9GLIYgXXYpXJBBZE0xM9EausIl6ObzBGSHRdnEJ1p+RhnBBNF4YY/xJFigNaIwxLpFYB2WwMWCW0bG1W7eEdUBwQ0fb7fy83nQJjK3nnO90F/okvTnf+7zP+/Q75/ve7wP+R6BGJ4xGo+skSXqFmfcAaAHwFIANAO4CmCai64Zh/OT3+3+Nx+PzjdRumJmOjo71zNwB4B0APguUMjN/vri4mDh27NhcI2poiJloNLqXiL4EEBCg/8XMbx05cuS00zpkh3yKxWKHiOgLAH7BHD4iiuzatcvIZDJnnRTjyEw0Gv2QiD6C8xkmInqxtbVVy2QyvcJJRIm1V+ukkxwrwCCivYlE4gcRslAhBw4ceNzj8RQg9o2YYZaInk0kErN2iZKImtvt/gBrYwQA1gN4X4Roe2ai0eg6IroFa8uvKMo+n+9Ju/uQYleltiGaGnG73eVIJNIfDAa3yLK8Udf1mVwuN55MJneoqmrG91er1ZcBnLJVm51gAKjt7HXhdrvLnZ2d46FQaLcsy80A3LIsN4dCod2dnZ15l8tVaYTOcoh8M0GzgEgk0u/xeEIrjXm93m2RSOSiBZ0Wu4WJmHnaLCAYDG6pN97S0rK5ETrLIWJmg1mALMsbnYzX8ITlimoQMfOPWYCu6zMm4yULOn9brqgGETO3zAJyudx4vfFr164VzXIwc90/ZCWImOk3C0gmkzuq1Wp2pbFyuZxNpVI7zXIQkanOcoiY+d0sQFVVX1dX19ZsNpvWdX0SwKKu65NDQ0Ppw4cPP6dpmtcsBzOn7RZme9P0+XynK5XKZwAeqxenqqqvu7t79wOPNtV+VnDPMAzb5xvbM1NrMb6xy7OJr48ePXrfLkmo0SSijwHcFuFawG0i+lSEKGSm1p4fFOFawEGR9h9weLCKxWLdAN5wkuNBMPPxEydOvC1JksfD7Fsg8riYSdMlFwAosqFqkmQQUcW9sHB/282bcylAX+LbXgCWYT+AFwA84zAPVFWdO9PTM+WWpHcBQCeCAoCJICsMAGAQZGaAGZrLhcubNutbGUVF4rMjxWLR8ZE3Fou1AkjDwX0CM/OVwcHvJwqFomgKDfjO6e0MMpnMVDgc9gIIi+YoTU+fyw4NXXFQBpFh3BFaAJbD6/UeAmClrX8ElXK5dOnixT+c6BuAoUtSoSFm4vG4ZhjGm7DQhD5UhGGoAwMDp1RV1c2jVwHzIsny6WKxOOP4NVvC+fPnZ8Ph8F0Ar1rlFPL5X8bHxuo2pXXADIx4df3kjcnJSWANLs5jsdhJAK+Zxd2bmxv5racnKSBRYeY/oSiDhULhoY3b6dL8CDRN209EL8myvH7VGFW9f6Gv72erOZlJA3GeJWm4ubk5l06ntZXiGj4zANDe3r6nqanpx1Xyc/bq1eOjN26M1cvBTKoEY4IkadiQ5ZF8Pr9gprsmZgCgvb29u6mp6ZHuYKZUupDp7e1ZhVYB0bgEjLr8/tzw8PCiHc2Gv2ZLmJ+fb1MUpdXj8TQvPatWq3f6+/rOPBjHQBnMY4okXX9++/Z8KpUSXtnWbGYAYN++fTsDgUAvEbkMw9AvnDv3ValUugXgHojyMjD6+sTEWBwwGqG3pmYAoK2t7ZNAIPDe1OTUqSuXBr6FouRGR0enAfBaa/+n8S8PPeWMetb8+wAAAABJRU5ErkJggg==",
            anchor : [0.5, 1]
        }, {
            src : "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADMAAAAmCAYAAABpuqMCAAAABHNCSVQICAgIfAhkiAAAAAlwSFlzAAAN1wAADdcBQiibeAAAABl0RVh0U29mdHdhcmUAd3d3Lmlua3NjYXBlLm9yZ5vuPBoAAATISURBVFiF3VhNbBtFGH0z3vXGbqpSikQBKSIOHKgop0quYtMadSsqVfRCoQo9IjiAuAXJ4lB+D0Q5Ig4VQvxIVZREKQhRRNoiNi2VcBECUaUNjmM7VRPHcdP81HGc/ZmPSyKVNMnuzjoHeEfPe9/73s54dnaA/xFYowsmEont0Wj0iBDiGGNsD4BHAOwCMANgEsB1IvrOcZwfDcOoNtK7YWGOHj260zTNNBG9BSDiQVID8Ilt2x8bhjHXiB4aEubQoUPHGWOnATwoIb8D4LWLFy+eDdpHKKCeHT58+BSATwFEJWtEALzc2toqCoXC5SDNBAqj6/q7AN5H8BlmjLHnYrGYnc/nL0kXkRWuLK2+IDXWgWCMHb9w4cI3MmKpRlKp1AOKooxB7j/ihllN09rOnTs361fIZdwURXkHWxMEAHaapvm2jND3zCQSie2RSKQMb9uvLGq2bT/s9z2k+HWJRqNHiMg1iKZptXQ6fTUej8dUVd1tWdZUJpPJd3V1xev1ups+qijK8wAG/PTme5kJIY65cTRNq/X29uaTyWRKVdUWAGFVVVuSyWSqp6cn19TUtOTBytVnLXyHYYw95cZJp9NXt23b9vR6Y83NzXs7OzszHqz2+O1NZgN41I0Qj8djm423t7e3NsJnLWTC7HIjqKq6O8j4Ch7y3NEKZMLcdSNYljXlMl7y4LPguaMVyIQpuxEymUx+s/ErV64UPfhs+kDWg+8wRHTVjdPV1RWvVqvX1hurVqvXuru793uwcvVZC5nd7Gc3Tr1ej3R0dDwxNDRkWJY1DsC0LGvcMAzjxIkTT5qm2eTBx/Ddm19BKpVqVhTlFoAdfrU+MM85f+z8+fOLfkS+Z2bliPGFX50fMMY+9xsEkDxoapr2AYBpGa0HTIfD4Y9khFIfZ6Ojo/VYLDYJ4EUZvQteHxwc/E1GGOjDStf1MwBeCVJjDXqy2eybnHNNI4osM6apRMx2uAoASkhYNueCMbYUXl5e3DsxMdcPOKvioGF2ENGfjLHHg2UAhBBzpVu3TlumWfeqIWIOIxQVTpdHisVi4E9eXdeTAAwEuE8gIpqpVL6uLiwUZUvYwFdBb2eQz+dvtrW1NQF4VrbGUq32y+zMzB8B2mBMiIrUbrYWlmWdAuDlWH8fbMsqzUxPDwXxF4BwOB9rSBjDMGwhxEl4OITeCyKyKpXKgOM4jjt7wyImC4XOFovFqcDLbBWFQmE2FovNAHjBq+buwsIP1fn5TQ+lm4AIGGlynL6/x8fHgS24ONd1vQ/AS248yzRHJm7e7JWwWCKiv6Aov4+Njf3rxe37QsMNtm2/wTnXOec7N+KQEIvlcvl7rzWJmA1GOeJ8uKWl5YZhGPZ6vIbPDAAcOHDgWDgc/naD+jR7+3bP/Nzc6GY1iJjFIQqM82ERCo3kcrllN98tCQMABw8ePKOq6n2ng6Va7dfy5OTgBrIlMJbnQFaNRm8MDw+bfjwbvsxWwRh71XGcZCgUaln9zXGcynSp9NO9PAJqIBpVOL/+zL59uf7+fumdbctmBgASicT+SCRyCYBKRE6lVPqsVquVAcyDsVwIyHYUCqPvAaIRflsaBgCSyeSHmqZ1Lt5dHLhze/pLKMqNbDY7CYC22vs/jX8A/Nff8x41WYEAAAAASUVORK5CYII=",
            anchor : [0.5, 1]
        }, {
            src : "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADMAAAAmCAYAAABpuqMCAAAABHNCSVQICAgIfAhkiAAAAAlwSFlzAAAN1wAADdcBQiibeAAAABl0RVh0U29mdHdhcmUAd3d3Lmlua3NjYXBlLm9yZ5vuPBoAAAPjSURBVFiF3ZlNbxtVFIafe2cceyZxEitfqiMs1EUWSLDqggXskOiGSqCyoAj+AH8BChISAv5ABahCBaoGJziISAhWMR8LECBQUNo0cZpJpLQNVWMDTZxre+ayMIGQOp7J2DMFXuls5p57zvver7lzBv5HEBHETAMngVPAA8AxYAi4DVwHLgOfAJ8BdyLI3xVkgDeAHUAHsG3gdWDwXpBth9M0Rz6IiIN2G3gqfsp3QwBnAY9wQvbMA14immUfGC/TmYiD9mK89P/GaTqfkYPmAk/GKQKamzbsHvGzLZqHSWx4MwIR++21uISkCX78hrVtoO+oxGQIMScBy8/Jtu2dQqFQVEqta61rSqn16enpomVZ1QA5bODxENyOjPfxGVnbtrcrlcrPugXK5fK8ZVlBZvZCHGK+9yNSKBTmWgnZQz6fnwsg5rs4xFz3I6KUWmsnRinlBBCzcVRiYd64Cuhp56C1rvn4KCFE0idPDfDz+QfCHAC/+znUarWbPu03AuT5LTCjPxFGzKafw+zs7LV27TMzM06APG0HpFt4F5/1blnWTrlcnm+1X7a2tuZTqVTVLwZwPg4xzwcgoi3L2snn83NKKae555UzOTk5F1CIBp6LQ0wfUAlIKKxVgN6jEguzZ+7QXGpR4jzNK00syNA8CKKYlU1ivjUDnOkC8VZ2JiyhTj9TL3aSvAUu5XK5F6SUyaTWlhIimdBaNFyZADANr96Q0hNCVHuU2n5wY6My1fygAzoXMwD8BNzfYRyklJVcNvuWaZq7QftoLVyhcUypv1p0HKcbBYRHgCJgdBBDjwwNvTeQTjth+zfgQicE9rAOpIBHwwbo6+39ejiT+bEDDkJ43q0wR3MrnAW+DdPRNIwbY8PDX3SS3APPlXKlW2IawLMEuITuhxCiPjoy8pEQwvX3PgRa14RhFBzHudmNZbaHMs2KzRNBOwz29386kE63vZS2gdawmHLd/NW1tTWIpoKYB572c0r29Czel81+GCJ+VWs9j2n+sLKy8sv+hijEDAshlrTWh77FpRDb4+Pj55KmGejKorVoIHRJS7mQy+WuFIvFRiu/SGq7hmGccl3340Pi6+FM5tLgwMByuxhai7rEWxVSLniGsVgqlZRf3sgK1YlE4mK9Xr/rdmBb1jfZsbHPD+lWRYhrEpYStn1lYWGhdpScUVbdU1LKq57n5fYeGIZxK5fNvm0Yxl/LRMMOWi+bUl5+6MSJ0tTUVOiTLdJfCJZlPby7u/ul1joBuMdGR9/pte1N4FeEKBmw9Mzq6vIrzQL8vx+pVOpVIUS1v6//g4njxx+bmJgY5x7/h/lP4A+AJ7grnrOyCgAAAABJRU5ErkJggg==",
            anchor : [0.5, 1]
        }];

        // applying default labels
        if (!this.options.labels) {
            this.options.labels = {};
        }
        Object.keys(Drawing.DefaultLabels).forEach((key) => {
            if (!this.options.labels.hasOwnProperty(key)) {
                this.options.labels[key] = Drawing.DefaultLabels[key];
            }
        });

        // applying default styles
        if (!this.options.defaultStyles) {
            this.options.defaultStyles = {};
        }
        Object.keys(Drawing.DefaultStyles).forEach((key) => {
            if (!options.defaultStyles.hasOwnProperty(key)) {
                this.options.defaultStyles[key] = Drawing.DefaultStyles[key];
                return;
            }
            if (key === "polyFillOpacity" &&
                (options.defaultStyles[key] < 0 ||
                    options.defaultStyles[key] > 1)) {
                logger.log("Wrong value (" + options.defaultStyles[key] + ") for defaultStyles.polyFillOpactity. Must be between 0 and 1");
                this.options.defaultStyles[key] = Drawing.DefaultStyles[key];
                return;
            }
            if (key === "strokeWidth" || key === "polyStrokeWidth") {
                var intValue = parseInt(options.defaultStyles[key], 10);
                if (isNaN(intValue) || intValue < 0) {
                    logger.log("Wrong value (" + options.defaultStyles[key] + ") for defaultStyles.strokeWidth. Must be a positive interger value.");
                    this.options.defaultStyles[key] = Drawing.DefaultStyles[key];
                    return;
                }
                this.options.defaultStyles[key] = intValue;
            }
        });

        this.interactionCurrent = null;
        this.interactionSelectEdit = null;

        this.stylingOvl = null;
        this.popupOvl = null;

        this.layer = null;
        if (this.options.layer && this.options.layer instanceof VectorLayer) {
            this.layer = this.options.layer;
        }

        // detection du support : desktop ou tactile
        // FIXME : utile ?
        this._isDesktop = this._detectSupport();

        // applying default popup
        if (!this.options.popup) {
            this.options.popup = {
                display : true,
                apply : null
            };
        }
    };

    /**
     * Creates empty layer to host features
     *
     * @private
     */
    Drawing.prototype._createEmptyLayer = function () {
        var features = new Collection();
        var layer = new VectorLayer({
            source : new VectorSource({
                features : features
            })
        });
        // on rajoute le champ gpResultLayerId permettant d'identifier une couche crée par le composant.
        layer.gpResultLayerId = "drawing";
        // on le rajoute au controle (et à la carte)
        this.setLayer(layer);
    };

    /**
     * Sets vector layer to hosts feature.
     *
     * @param {ol.layer.Vector} vlayer - vector layer
     */
    Drawing.prototype.setLayer = function (vlayer) {
        if (!vlayer) {
            this.layer = null;
            return;
        }

        if (!(vlayer instanceof VectorLayer)) {
            logger.log("no valid layer given for hosting drawn features.");
            return;
        }

        // ajout du layer de dessin à la carte s'il n'y est pas déjà
        var layers = this.getMap().getLayers();
        if (layers) {
            var found = false;
            layers.forEach((mapLayer) => {
                if (mapLayer === vlayer) { // FIXME object comparison
                    logger.trace("layer already in map. Not adding.");
                    found = true;
                }
            });
            // si le layer n'est pas sur la carte, on l'ajoute.
            if (!found) {
                this.getMap().addLayer(vlayer);
            }
            // TODO style par defaut du geoportail !
            // application des styles ainsi que ceux par defaut de ol sur le layer
            vlayer.getSource().getFeatures().forEach((feature) => {
                var featureStyleFunction = feature.getStyleFunction();
                if (featureStyleFunction) {
                    var styles = featureStyleFunction(feature, 0);
                    // var styles = featureStyleFunction.call(feature, 0);
                    if (styles && styles.length !== 0) {
                        feature.setStyle(styles[0]);
                    }
                }
            });
            this.layer = vlayer;

            // Si un layer switcher est présent dans la carte, on lui affecte des informations pour cette couche
            this.getMap().getControls().forEach(
                (control) => {
                    if (control instanceof LayerSwitcher) {
                        // un layer switcher est présent dans la carte
                        var layerId = this.layer.gpLayerId;
                        // on n'ajoute des informations que s'il n'y en a pas déjà (si le titre est le numéro par défaut)
                        if (control._layers[layerId].title === layerId) {
                            control.addLayer(
                                this.layer, {
                                    title : this.options.layerDescription.title,
                                    description : this.options.layerDescription.description
                                }
                            );
                        }
                    }
                }
            );
        }
    };

    /**
     * this method is called by the constructor.
     * this information is useful to switch to touch mode.
     * Detection : test for desktop or tactile
     *
     * @method _detectSupport
     *
     * @returns {Boolean} is desktop
     * @private
     */
    Drawing.prototype._detectSupport = function () {
        // TODO
        // Choix de gérer la détection dans le code du composant au lieu du DOM car :
        // Utilisation de l'implémentation Leaflet
        // http://leafletjs.com/reference.html#browser

        var isDesktop = true;
        var userAgent = window.navigator.userAgent.toLowerCase();

        if (userAgent.indexOf("iphone") !== -1 ||
            userAgent.indexOf("ipod") !== -1 ||
            userAgent.indexOf("ipad") !== -1 ||
            userAgent.indexOf("android") !== -1 ||
            userAgent.indexOf("mobile") !== -1 ||
            userAgent.indexOf("blackberry") !== -1 ||
            userAgent.indexOf("tablet") !== -1 ||
            userAgent.indexOf("phone") !== -1 ||
            userAgent.indexOf("touch") !== -1) {
            isDesktop = false;
        }

        if (userAgent.indexOf("msie") !== -1 ||
            userAgent.indexOf("trident") !== -1) {
            isDesktop = true;
        }

        return isDesktop;
    };

    // ################################################################### //
    // ######################## methods handle dom ####################### //
    // ################################################################### //

    /**
     * Create control main container (called by Drawing constructor)
     *
     * @method _initContainer
     *
     * @returns {DOMElement} DOM element
     * @private
     */
    Drawing.prototype._initContainer = function () {
        // creation du container principal
        var container = this._createMainContainerElement();

        var inputShow = this._showDrawingContainer = this._createShowDrawingElement();
        container.appendChild(inputShow);

        var picto = this._createShowDrawingPictoElement();
        container.appendChild(picto);

        var panel = this._drawingPanel = this._createDrawingPanelElement();
        var header = this._drawingPanelHeader = this._createDrawingPanelHeaderElement();
        panel.appendChild(header);

        var tools = this._createDrawingToolsSections();
        for (var i = 0; i < tools.length; i++) {
            panel.appendChild(tools[i]);
        }

        container.appendChild(panel);

        return container;
    };

    // ################################################################### //
    // ##################### handlers events to control ################## //
    // ################################################################### //

    /**
     * Callback de fin de dessin de geometrie
     * @param {Object} feature - ol feature
     * @param {String} geomType - geometry type
     * @param {Boolean} clean - clean last feature
     *
     * @private
     */
    Drawing.prototype._drawEndFeature = function (feature, geomType) {
        // application des styles par defaut.
        var style = null;

        switch (geomType) {
            case "Point":
                style = new Style({
                    image : new Icon(this._getIconStyleOptions(this.options.markersList[0]))
                });
                break;
            case "LineString":
                style = new Style({
                    stroke : new Stroke({
                        color : this.options.defaultStyles.strokeColor,
                        width : this.options.defaultStyles.strokeWidth
                    })
                });
                break;
            case "Polygon":
                style = new Style({
                    fill : new Fill({
                        color : Color.hexToRgba(
                            this.options.defaultStyles.polyFillColor,
                            this.options.defaultStyles.polyFillOpacity
                        )
                    }),
                    stroke : new Stroke({
                        color : this.options.defaultStyles.polyStrokeColor,
                        width : this.options.defaultStyles.polyStrokeWidth
                    })
                });
                break;
        }
        feature.setStyle(style);

        // gestion des mesures
        this._updateMeasure(feature, geomType);

        if (this.options.popup.display) {
            // creation overlay pour saisie du label
            // contexte
            var context = this;

            /**
            * Enregistrement de la valeur saisie dans l'input.
            *
            * @param {String} value - valeur de l'attribut.
            * @param {Boolean} save - true si on garde le label.
            */
            var setAttValue = function (value, save) {
                context.getMap().removeOverlay(context.popupOvl);
                context.popupOvl = null;
                if (save && value && value.trim().length > 0) {
                    var formated = value.replace(/\n/g, "<br>");
                    feature.setProperties({
                        description : formated
                    });
                }
            };

            var popup = null;
            var popupByDefault = true;

            var displayFunction = this.options.popup.function;
            if (displayFunction && typeof displayFunction === "function") {
                // la sauvegarde et la fermeture sont des actions à implementer par l'utilisateur
                // par contre, la destruction est à gerer en interne
                popup = displayFunction.call(context, {
                    feature : feature,
                    geomType : geomType,
                    closeFunc : function () {
                        setAttValue(null, false);
                    },
                    saveFunc : function (message) {
                        setAttValue(message, true);
                    }
                });
                if (popup) {
                    // on est sûr que la popup customisée existe,
                    // donc on n'utilise pas celle par defaut...
                    popupByDefault = false;
                    // FIXME comment forcer le focus sur une div ?
                    popup.tabIndex = -1; // hack sur le focus sur une div ?
                    popup.onblur = function () {
                        context.getMap().removeOverlay(context.popupOvl);
                        context.popupOvl = null;
                    };
                }
            }
            // use popup by default
            if (popupByDefault) {
                // function by default
                popup = this._createLabelDiv({
                    applyFunc : setAttValue,
                    inputId : this._addUID("att-input"),
                    placeholder : "Saisir une description...",
                    measure : (this.options.tools.measure) ? feature.getProperties().measure : null,
                    geomType : geomType
                });
            }
            // un peu de menage...
            if (this.popupOvl) {
                this.getMap().removeOverlay(this.popupOvl);
                this.popupOvl = null;
            }
            // creation de l'overlay
            this.popupOvl = new Overlay({
                element : popup,
                // FIXME : autres valeurs.
                positioning : "top-center"
                // stopEvent : false
            });
            this.getMap().addOverlay(this.popupOvl);
            var geomExtent = feature.getGeometry().getExtent();
            this.popupOvl.setPosition([
                (geomExtent[0] + geomExtent[2]) / 2, (geomExtent[1] + geomExtent[3]) / 2
            ]);
            if (document.getElementById(this._addUID("att-input"))) {
                document.getElementById(this._addUID("att-input")).focus();
            }
        }
    };

    /**
     * Creates Interaction for features removal.
     *
     * @returns {SelectInteraction} created interaction.
     * @private
     */
    Drawing.prototype._createRemoveInteraction = function () {
        var interaction = new SelectInteraction({
            // features : this.layer.getSource().getFeaturesCollection(),
            layers : [this.layer],
            style : false
        });
        interaction.on("select", (seEv) => {
            if (!seEv || !seEv.selected || seEv.selected.length === 0) {
                return;
            }
            this.layer.getSource().removeFeature(seEv.selected[0]);
            // suppression puis rajout de l'interaction pour appliquer le changement tout de suite...
            this.getMap().removeInteraction(this.interactionCurrent);
            this.interactionCurrent = this._createRemoveInteraction();
            this.getMap().addInteraction(this.interactionCurrent);
        });
        return interaction;
    };

    /**
     * Creates Interaction for features style definition.
     *
     * @returns {ol.interaction.Select} created interaction.
     * @private
     */
    Drawing.prototype._createStylingInteraction = function () {
        var interaction = new SelectInteraction({
            layers : [this.layer],
            style : false
        });
        interaction.on("select", (seEv) => {
            // suppression de toute popup existante
            if (this.stylingOvl) {
                this.getMap().removeOverlay(this.stylingOvl);
            }
            if (!seEv || !seEv.selected || seEv.selected.length === 0) {
                return;
            }

            var valuesColor = null;
            var hexColor = null;
            var popupOvl = null;
            var geomType = null;
            var initValues = {};
            if (seEv.selected[0].getGeometry() instanceof Point) {
                // on determine si c'est un marker ou un label.
                var _label = seEv.selected[0].getProperties().name;
                if (seEv.selected[0].getStyle().getText() && _label) {
                    geomType = "Text";
                    if (seEv.selected[0].getStyle().getText().getStroke() &&
                            seEv.selected[0].getStyle().getText().getStroke().getColor()) {
                        valuesColor = seEv.selected[0].getStyle().getText().getStroke().getColor();
                        if (Array.isArray(valuesColor)) {
                            valuesColor = "rgba(" + valuesColor.join() + ")";
                            hexColor = Color.rgbaToHex(valuesColor);
                            initValues.strokeColor = hexColor.hex;
                            initValues.strokeOpacity = hexColor.opacity;
                        } else {
                            initValues.strokeColor = valuesColor;
                        }
                    }
                    if (seEv.selected[0].getStyle().getText().getFill() &&
                            seEv.selected[0].getStyle().getText().getFill().getColor()) {
                        valuesColor = seEv.selected[0].getStyle().getText().getFill().getColor();
                        if (Array.isArray(valuesColor)) {
                            valuesColor = "rgba(" + valuesColor.join() + ")";
                            hexColor = Color.rgbaToHex(valuesColor);
                            initValues.fillColor = hexColor.hex;
                            initValues.fillOpacity = hexColor.opacity;
                        } else {
                            initValues.fillColor = valuesColor;
                        }
                    }
                    initValues.strokeColor = initValues.hasOwnProperty("strokeColor") ? initValues.strokeColor : this.options.defaultStyles.textStrokeColor;
                    initValues.fillColor = initValues.hasOwnProperty("fillColor") ? initValues.fillColor : this.options.defaultStyles.textFillColor;
                } else if (seEv.selected[0].getStyle() &&
                        seEv.selected[0].getStyle().getImage()) {
                    geomType = "Point";
                    if (seEv.selected[0].getStyle().getImage().getSrc()) {
                        initValues.markerSrc = seEv.selected[0].getStyle().getImage().getSrc();
                    } else {
                        initValues.markerSrc = this.options.markersList[0].src;
                    }
                }
            } else if (seEv.selected[0].getGeometry() instanceof LineString) {
                geomType = "Line";
                if (seEv.selected[0].getStyle() &&
                        seEv.selected[0].getStyle().getStroke()) {
                    if (seEv.selected[0].getStyle().getStroke().getWidth()) {
                        initValues.strokeWidth = seEv.selected[0].getStyle().getStroke().getWidth();
                    }
                    if (seEv.selected[0].getStyle().getStroke().getColor()) {
                        valuesColor = seEv.selected[0].getStyle().getStroke().getColor();
                        if (Array.isArray(valuesColor)) {
                            valuesColor = "rgba(" + valuesColor.join() + ")";
                            hexColor = Color.rgbaToHex(valuesColor);
                            initValues.strokeColor = hexColor.hex;
                            initValues.fillOpacity = hexColor.opacity;
                        } else {
                            initValues.strokeColor = valuesColor;
                        }
                    }
                }
                initValues.strokeWidth = initValues.hasOwnProperty("strokeWidth") ? initValues.strokeWidth : this.options.defaultStyles.strokeWidth;
                initValues.strokeColor = initValues.hasOwnProperty("strokeColor") ? initValues.strokeColor : this.options.defaultStyles.strokeColor;
            } else if (seEv.selected[0].getGeometry() instanceof Polygon) {
                geomType = "Polygon";
                if (seEv.selected[0].getStyle() &&
                        seEv.selected[0].getStyle().getStroke()) {
                    if (seEv.selected[0].getStyle().getStroke().getWidth()) {
                        initValues.strokeWidth = seEv.selected[0].getStyle().getStroke().getWidth();
                    }
                    if (seEv.selected[0].getStyle().getStroke().getColor()) {
                        valuesColor = seEv.selected[0].getStyle().getStroke().getColor();
                        if (Array.isArray(valuesColor)) {
                            valuesColor = "rgba(" + valuesColor.join() + ")";
                            hexColor = Color.rgbaToHex(valuesColor);
                            initValues.strokeColor = hexColor.hex;
                            initValues.strokeOpacity = hexColor.opacity;
                        } else {
                            initValues.strokeColor = valuesColor;
                        }
                    }
                }
                if (seEv.selected[0].getStyle() &&
                        seEv.selected[0].getStyle().getFill()) {
                    if (seEv.selected[0].getStyle().getFill().getColor()) {
                        valuesColor = seEv.selected[0].getStyle().getFill().getColor();
                        if (Array.isArray(valuesColor)) {
                            valuesColor = "rgba(" + valuesColor.join() + ")";
                        }
                        hexColor = Color.rgbaToHex(valuesColor);
                        initValues.fillColor = hexColor.hex;
                        initValues.fillOpacity = hexColor.opacity;
                    }
                }
                initValues.strokeWidth = initValues.hasOwnProperty("strokeWidth") ? initValues.strokeWidth : this.options.defaultStyles.polyStrokeWidth;
                initValues.strokeColor = initValues.hasOwnProperty("strokeColor") ? initValues.strokeColor : this.options.defaultStyles.polyStrokeColor;
                initValues.fillColor = initValues.hasOwnProperty("fillColor") ? initValues.fillColor : this.options.defaultStyles.polyFillColor;
                initValues.fillOpacity = initValues.hasOwnProperty("fillOpacity") ? initValues.fillOpacity : this.options.defaultStyles.polyFillOpacity;
            }
            if (!geomType) {
                logger.log("Unhandled geometry type for styling.");
                return;
            }
            var dtObj = this;
            /**
            * function called when apply button is pressed.
            *
            * @param {String} action - "apply" (to selected object), "default" (set as default), "cancel" (do nothing).
            */
            var applyStyle = function (action) {
                if (action === "cancel") {
                    dtObj.getMap().removeOverlay(popupOvl);
                    return;
                }
                var setDefault = action !== "apply";

                var fillColorElem = document.getElementById(dtObj._addUID("fillColor"));
                var fillOpacityElem = document.getElementById(dtObj._addUID("fillOpacity"));
                var strokeColorElem = document.getElementById(dtObj._addUID("strokeColor"));
                var strokeWidthElem = document.getElementById(dtObj._addUID("strokeWidth"));
                switch (geomType.toLowerCase()) {
                    case "text":
                        if (setDefault) {
                            dtObj.options.defaultStyles.textStrokeColor = strokeColorElem.value;
                            dtObj.options.defaultStyles.textFillColor = fillColorElem.value;
                        } else {
                            seEv.selected[0].setStyle(new Style({
                                text : new Text({
                                    font : "16px sans",
                                    textAlign : "left",
                                    text : seEv.selected[0].getStyle().getText().getText(),
                                    fill : new Fill({
                                        color : fillColorElem.value
                                    }),
                                    stroke : new Stroke({
                                        color : strokeColorElem.value,
                                        width : 3
                                    })
                                })
                            }));
                        }
                        break;
                    case "point":
                        var markerSelected = dtObj._getsMarkersOptionsFromSrc(document.querySelector("input[name='marker']:checked").value);
                        if (setDefault) {
                            if (dtObj.options.markersList.length > 1) {
                                // index du marker dans la liste des markers
                                var idxMarker = dtObj.options.markersList.findIndex(function (mrk) {
                                    if (mrk === markerSelected) { // FIXME object comparison
                                        return true;
                                    }
                                    return false;
                                });
                                if (idxMarker > 0) {
                                    // on enleve le marker de son ancienne position
                                    dtObj.options.markersList.splice(idxMarker, 1);
                                    // on le place en tête de liste
                                    dtObj.options.markersList.splice(0, 0, markerSelected);
                                }
                            }
                        } else {
                            seEv.selected[0].setStyle(new Style({
                                image : new Icon(dtObj._getIconStyleOptions(markerSelected))
                            }));
                        }
                        break;
                    case "line":
                        if (setDefault) {
                            dtObj.options.defaultStyles.strokeColor = strokeColorElem.value;
                            dtObj.options.defaultStyles.strokeWidth = parseInt(strokeWidthElem.value, 10);
                        } else {
                            seEv.selected[0].setStyle(new Style({
                                stroke : new Stroke({
                                    width : parseInt(strokeWidthElem.value, 10),
                                    color : strokeColorElem.value
                                })
                            }));
                        }
                        break;
                    case "polygon":
                        var opacity = parseInt(fillOpacityElem.value, 10) / 10;
                        if (setDefault) {
                            dtObj.options.defaultStyles.polyStrokeColor = strokeColorElem.value;
                            dtObj.options.defaultStyles.polyFillColor = fillColorElem.value;
                            dtObj.options.defaultStyles.polyFillOpacity = opacity;
                            dtObj.options.defaultStyles.polyStrokeWidth = parseInt(strokeWidthElem.value, 10);
                        } else {
                            seEv.selected[0].setStyle(new Style({
                                stroke : new Stroke({
                                    width : parseInt(strokeWidthElem.value, 10),
                                    color : strokeColorElem.value
                                }),
                                fill : new Fill({
                                    // color : fillColorElem.value
                                    color : Color.hexToRgba(fillColorElem.value, opacity)
                                })
                            }));
                        }
                        break;
                }
                if (!setDefault) {
                    // application des styles par defaut
                    // fermeture de la popup (si on applique le style à l'objet)
                    dtObj.getMap().removeOverlay(popupOvl);
                }
            };

            var popupDiv = this._createStylingDiv({
                geomType : geomType,
                initValues : initValues,
                applyFunc : applyStyle
            });
            popupOvl = new Overlay({
                element : popupDiv,
                // FIXME : autres valeurs.
                positioning : "top-center"
                // stopEvent : false
            });
            this.getMap().addOverlay(popupOvl);
            popupOvl.setPosition(seEv.mapBrowserEvent.coordinate);
            this.stylingOvl = popupOvl;
            // suppression puis rajout de l'interaction pour appliquer le changement tout de suite...
            this.getMap().removeInteraction(this.interactionCurrent);
            this.interactionCurrent = this._createStylingInteraction();
            this.getMap().addInteraction(this.interactionCurrent);
        });
        return interaction;
    };

    /**
     * Creates Interaction for text definition.
     *
     * @returns {SelectInteraction} created interaction.
     * @private
     */
    Drawing.prototype._createLabelInteraction = function () {
        var interaction = new SelectInteraction({
            layers : [this.layer],
            style : false
        });
        interaction.on("select", (seEv) => {
            // suppression de toute popup existante
            if (this.labelOvl) {
                this.getMap().removeOverlay(this.labelOvl);
            }
            if (!seEv || !seEv.selected || seEv.selected.length === 0) {
                return;
            }
            var popupOvl = null;
            var geomType = null;
            var _textValue = null;
            var _measure = null;
            if (seEv.selected[0].getGeometry() instanceof Point) {
                // on determine si c'est un marker ou un label.
                var _label = seEv.selected[0].getProperties().name;
                if (seEv.selected[0].getStyle() &&
                        seEv.selected[0].getStyle().getText() && _label) {
                    geomType = "Text";
                } else if (seEv.selected[0].getStyle() &&
                        seEv.selected[0].getStyle().getImage()) {
                    geomType = "Point";
                }
            } else if (seEv.selected[0].getGeometry() instanceof LineString) {
                geomType = "Line";
            } else if (seEv.selected[0].getGeometry() instanceof Polygon) {
                geomType = "Polygon";
            }
            if (!geomType) {
                logger.log("Unhandled geometry type for styling.");
                return;
            }
            if (geomType === "Text") {
                // pour les labels on récupère la valeur dans le style
                _textValue = seEv.selected[0].getStyle().getText().getText();
            } else {
                // pour les autres, c'est un attribut du feature
                var featProps = seEv.selected[0].getProperties();
                if (featProps && featProps.hasOwnProperty("description")) {
                    _textValue = featProps["description"];
                }
                if (featProps && featProps.hasOwnProperty("measure")) {
                    _measure = featProps["measure"];
                }
            }
            var context = this;
            /**
                 * Enregistrement de la valeur saisie dans l'input.
                 *
                 * @param {String} value - valeur de l'attribut.
                 * @param {Boolean} save - true si on garde le label.
                 */
            var setTextValue = function (value, save) {
                context.getMap().removeOverlay(popupOvl);
                if (!save) {
                    return;
                }
                var feature = seEv.selected[0];
                if (geomType === "Text") {
                    var style = feature.getStyle();
                    style.getText().setText(value);
                    feature.setProperties({
                        name : value
                    });
                    feature.setStyle(style);
                    return;
                }
                var _formated = value.replace(/\n/g, "<br>");
                feature.setProperties({
                    description : _formated
                });
            };
            var popupDiv = this._createLabelDiv({
                applyFunc : setTextValue,
                inputId : this._addUID("label-input"),
                placeholder : (geomType === "Text" ? "Saisir un label..." : "Saisir une description..."),
                text : _textValue,
                measure : (this.options.tools.measure) ? _measure : null,
                geomType : geomType
            });
            popupOvl = new Overlay({
                element : popupDiv,
                // FIXME : autres valeurs.
                positioning : "top-center"
                // stopEvent : false
            });
            this.getMap().addOverlay(popupOvl);
            popupOvl.setPosition(seEv.mapBrowserEvent.coordinate);
            document.getElementById(this._addUID("label-input")).focus();
            this.labelOvl = popupOvl;
            // suppression puis rajout de l'interaction pour appliquer le changement tout de suite...
            this.getMap().removeInteraction(this.interactionCurrent);
            this.interactionCurrent = this._createLabelInteraction();
            this.getMap().addInteraction(this.interactionCurrent);
        });
        return interaction;
    };

    /**
     * Callback de fin de modification du dessin afin de mettre à jour la mesure
     * TODO
     * @param {Object} feature - ol feature
     * @param {String} geomType - geometry type
     *
     * @private
     */
    Drawing.prototype._updateMeasure = function (feature, geomType) {
        logger.log(feature);

        var measure = null;

        var projection = this.getMap().getView().getProjection();

        // arrondi
        function __roundDecimal (nombre, precision) {
            precision = precision || 2;
            var factor = Math.pow(10, precision);
            return Math.round(nombre * factor) / factor;
        }

        var type = (geomType) || feature.getProperties().type;
        switch (type) {
            case "Point":
                var coordinatesPoint = (feature.getGeometry()).getCoordinates();
                var c = olTransformProj(coordinatesPoint, projection, "EPSG:4326");
                measure = "lon : ";
                measure += __roundDecimal(c[0], 4) + "°";
                measure += " / ";
                measure += "lat : ";
                measure += __roundDecimal(c[1], 4) + "°";

                break;
            case "LineString":
                var measureLength = 0;
                var coordinatesLine = (feature.getGeometry()).getCoordinates();
                for (var i = 0, ii = coordinatesLine.length - 1; i < ii; ++i) {
                    var c1 = olTransformProj(coordinatesLine[i], projection, "EPSG:4326");
                    var c2 = olTransformProj(coordinatesLine[i + 1], projection, "EPSG:4326");
                    measureLength += olGetDistanceSphere(c1, c2);
                }
                measure = (measureLength > 1000)
                    ? __roundDecimal(measureLength / 1000, 3) + " km"
                    : __roundDecimal(measureLength, 3) + " m";

                break;
            case "Polygon":
                var measureArea = 0;
                var geom = (feature.getGeometry()).clone();
                var coordinatesAera = geom.getLinearRing(0).getCoordinates();
                measureArea = Math.abs(olGetAreaSphere(new Polygon([coordinatesAera])));

                // FIXME on se limite à des trous uniquement !
                // cad les polygones sont strictement contenus dans le 1er !
                var rings = geom.getLinearRings();
                if (rings.length > 1) {
                    for (var ij = 1; ij < rings.length; ij++) {
                        var coordinatesRings = rings[ij].getCoordinates();
                        measureArea -= Math.abs(olGetAreaSphere(new Polygon([coordinatesRings])));
                    }
                }

                measure = (measureArea > 1000000)
                    ? __roundDecimal(measureArea / 1000000, 3) + " km^2"
                    : __roundDecimal(measureArea, 2) + " m^2";

                break;
        }

        // enregistrement de la mesure dans la feature
        feature.setProperties({
            measure : measure,
            type : type
        });
    };

    /**
     * Handles click on drawing tools icons
     *
     * @param {Event} clickEvent - click event
     * @param {String} toolId - selected tool Id
     * @param {Drawing} context - Drawing control.
     * @private
     */
    Drawing.prototype._handleToolClick = function (clickEvent, toolId, context) {
        var map = context.getMap();
        if (!map) {
            logger.trace("Drawing control not attached to any map.");
            return;
        }
        // on supprime  les interactions des autres extensions
        Interactions.unset(map, {
            current : "Drawing"
        });

        // on supprime l'interaction courante s'il y en a une.
        if (context.interactionCurrent) {
            map.removeInteraction(context.interactionCurrent);
            context.interactionCurrent = null;
        }

        // on supprime l'interaction de selection courante s'il y en a une.
        if (context.interactionSelectEdit) {
            map.removeInteraction(context.interactionSelectEdit);
            context.interactionSelectEdit = null;
        }

        // on supprime la popup courante s'il y en a une.
        if (context.popupOvl) {
            context.getMap().removeOverlay(context.popupOvl);
            context.popupOvl = null;
        }

        // si aucune couche de dessin, on en crée une vide.
        if (!this.layer) {
            this._createEmptyLayer();
        }
        switch (toolId) {
            case this._addUID("drawing-tool-point"):
                if (context.dtOptions["points"].active) {
                    context.interactionCurrent = new DrawInteraction({
                        stopClick : true,
                        features : context.layer.getSource().getFeaturesCollection(),
                        style : new Style({
                            image : new Icon(this._getIconStyleOptions(this.options.markersList[0]))
                        }),
                        type : ("Point")
                    });
                    context.interactionCurrent.on("drawend", function (deEv) {
                        // ajout eventuel d'un attribut description sur le feature
                        context._drawEndFeature(deEv.feature, "Point");
                    },
                    context);
                }
                break;
            case this._addUID("drawing-tool-line"):
                if (context.dtOptions["lines"].active) {
                    context.interactionCurrent = new DrawInteraction({
                        stopClick : true,
                        features : context.layer.getSource().getFeaturesCollection(),
                        style : new Style({
                            image : new Circle({
                                radius : this.options.cursorStyle.radius,
                                stroke : new Stroke({
                                    color : this.options.cursorStyle.strokeColor,
                                    width : this.options.cursorStyle.strokeWidth
                                }),
                                fill : new Fill({
                                    color : this.options.cursorStyle.fillColor
                                })
                            }),
                            stroke : new Stroke({
                                color : this.options.defaultStyles.strokeColor,
                                width : this.options.defaultStyles.strokeWidth
                            })
                        }),
                        type : ("LineString")
                    });
                    context.interactionCurrent.on("drawend", function (deEv) {
                        // ajout eventuel d'un attribut description sur le feature
                        context._drawEndFeature(deEv.feature, "LineString");
                    },
                    context);
                }
                break;
            case this._addUID("drawing-tool-polygon"):
                if (context.dtOptions["polygons"].active) {
                    context.interactionCurrent = new DrawInteraction({
                        stopClick : true,
                        features : context.layer.getSource().getFeaturesCollection(),
                        style : new Style({
                            image : new Circle({
                                radius : this.options.cursorStyle.radius,
                                stroke : new Stroke({
                                    color : this.options.cursorStyle.strokeColor,
                                    width : this.options.cursorStyle.strokeWidth
                                }),
                                fill : new Fill({
                                    color : this.options.cursorStyle.fillColor
                                })
                            }),
                            stroke : new Stroke({
                                color : this.options.defaultStyles.polyStrokeColor,
                                width : this.options.defaultStyles.polyStrokeWidth
                            }),
                            fill : new Fill({
                                color : Color.hexToRgba(
                                    this.options.defaultStyles.polyFillColor,
                                    this.options.defaultStyles.polyFillOpacity
                                )
                            })
                        }),
                        type : ("Polygon")
                    });
                    context.interactionCurrent.on("drawend", function (deEv) {
                        // ajout eventuel d'un attribut description sur le feature
                        context._drawEndFeature(deEv.feature, "Polygon");
                    },
                    context);
                }
                break;
            case this._addUID("drawing-tool-holes"):
                if (context.dtOptions["holes"].active) {
                    // selection du polygone à modifier
                    context.interactionSelectEdit = new SelectInteraction({
                        stopClick : true,
                        condition : eventPointerMove,
                        layers : [this.layer]
                    });
                    context.interactionSelectEdit.setProperties({
                        name : "Drawing",
                        source : context
                    });
                    map.addInteraction(context.interactionSelectEdit);

                    // saisie
                    context.interactionCurrent = new DrawInteraction({
                        stopClick : true,
                        features : this.interactionSelectEdit.getFeatures(),
                        style : new Style({
                            image : new Circle({
                                radius : this.options.cursorStyle.radius,
                                stroke : new Stroke({
                                    color : this.options.cursorStyle.strokeColor,
                                    width : this.options.cursorStyle.strokeWidth
                                }),
                                fill : new Fill({
                                    color : this.options.cursorStyle.fillColor
                                })
                            }),
                            stroke : new Stroke({
                                color : this.options.defaultStyles.polyStrokeColor,
                                width : this.options.defaultStyles.polyStrokeWidth
                            }),
                            fill : new Fill({
                                color : Color.hexToRgba(
                                    this.options.defaultStyles.polyFillColor,
                                    this.options.defaultStyles.polyFillOpacity
                                )
                            })
                        }),
                        type : ("Polygon")
                    });

                    context.interactionCurrent.on("drawstart", function (deEv) {}, context);

                    context.interactionCurrent.on("drawend", function (deEv) {
                        // recuperation du feature selectionné
                        var features = context.interactionSelectEdit.getFeatures();
                        if (features.getLength()) {
                            // choix sur le 1er feature de la liste
                            var feature = features.item(0);
                            var hole = deEv.feature.getGeometry().getCoordinates()[0];
                            // test pour savoir si le polygone est entièrement
                            // inclu dans l'autre afin de faciliter les calculs d'aire !
                            var bHoleIsIncluded = true;
                            for (var i = 0; i < hole.length; i++) {
                                if (!feature.getGeometry().intersectsCoordinate(hole[i])) {
                                    bHoleIsIncluded = false;
                                    break;
                                }
                            }
                            if (!bHoleIsIncluded) {
                                return;
                            }
                            // ajout du rings
                            feature.getGeometry().appendLinearRing(new LinearRing(hole));
                            // enregistrement !
                            deEv.feature = feature;
                            // finalisation du dessin...
                            context._drawEndFeature(deEv.feature, "Polygon");
                        }
                    },
                    context);
                }
                break;
            case this._addUID("drawing-tool-text"):
                // text : creation de points invisibles avec un label.
                if (context.dtOptions["text"].active) {
                    context.interactionCurrent = new DrawInteraction({
                        stopClick : true,
                        features : context.layer.getSource().getFeaturesCollection(),
                        style : new Style({
                            image : new Circle({
                                radius : this.options.cursorStyle.radius,
                                stroke : new Stroke({
                                    color : this.options.cursorStyle.strokeColor,
                                    width : this.options.cursorStyle.strokeWidth
                                }),
                                fill : new Fill({
                                    color : this.options.cursorStyle.fillColor
                                })
                            })
                        }),
                        type : ("Point")
                    });
                    context.interactionCurrent.on("drawend", (deEv) => {
                        // creation overlay pour saisie du label
                        var popupOvl = null;
                        /**
                        * Enregistrement de la valeur saisie dans l'input.
                        *
                        * @param {String} value - valeur du label
                        * @param {Boolean} save - true si on garde le label.
                        */
                        var setTextValue = function (/* context,feature, */ value, save) {
                            context.getMap().removeOverlay(popupOvl);
                            if (!save) {
                                // removes feature from overlay.
                                context.layer.getSource().removeFeature(deEv.feature);
                                return;
                            }

                            deEv.feature.setProperties({
                                name : value
                            });

                            deEv.feature.setStyle(new Style({
                                image : new Icon(context._getIconStyleOptions(context.options.defaultStyles.textIcon1x1)),
                                text : new Text({
                                    textAlign : "left",
                                    font : "16px sans",
                                    text : value,
                                    fill : new Fill({
                                        color : context.options.defaultStyles.textFillColor
                                    }),
                                    stroke : new Stroke({
                                        color : context.options.defaultStyles.textStrokeColor,
                                        width : 3
                                    })
                                })
                            }));
                        };
                        var popup = this._createLabelDiv({
                            applyFunc : setTextValue,
                            inputId : context._addUID("label-input"),
                            geomType : "Text",
                            placeholder : "Saisir un label..."
                        });
                        popupOvl = new Overlay({
                            element : popup,
                            // FIXME : autres valeurs.
                            positioning : "top-center" // par defaut, top-left...
                            // stopEvent : false
                        });
                        context.getMap().addOverlay(popupOvl);
                        popupOvl.setPosition(deEv.feature.getGeometry().getCoordinates());
                        document.getElementById(this._addUID("label-input")).focus();
                    });
                }
                break;
            case this._addUID("drawing-tool-edit"):
                if (context.dtOptions["edit"].active) {
                    context.interactionSelectEdit = new SelectInteraction({
                        condition : eventSingleClick,
                        layers : [this.layer]
                    });

                    context.interactionSelectEdit.setProperties({
                        name : "Drawing",
                        source : context
                    });
                    map.addInteraction(context.interactionSelectEdit);

                    context.interactionCurrent = new ModifyInteraction({
                        stopClick : true,
                        // features : context.layer.getSource().getFeaturesCollection(),
                        features : this.interactionSelectEdit.getFeatures(),
                        style : new Style({
                            image : new Circle({
                                radius : this.options.cursorStyle.radius,
                                stroke : new Stroke({
                                    color : this.options.cursorStyle.strokeColor,
                                    width : this.options.cursorStyle.strokeWidth
                                }),
                                fill : new Fill({
                                    color : this.options.cursorStyle.fillColor
                                })
                            })
                        })
                        // deleteCondition : function (/* event */) { return false },
                        // insertVertexCondition : function (/* event */) { return false }
                    });
                    context.interactionCurrent.on("modifyend", (deEv) => {
                        var feature = deEv.features.item(0);
                        context._updateMeasure(feature);
                    });
                }
                break;
            case this._addUID("drawing-tool-display"):
                if (context.dtOptions["display"].active) {
                    context.interactionCurrent = this._createStylingInteraction();
                }
                break;
            case this._addUID("drawing-tool-tooltip"):

                if (context.dtOptions["tooltip"].active) {
                    context.interactionCurrent = this._createLabelInteraction();
                }
                break;
            case this._addUID("drawing-tool-remove"):
                if (context.dtOptions["remove"].active) {
                    context.interactionCurrent = context._createRemoveInteraction();
                }
                break;
            default:
                logger.trace("unhandled tool type");
        }
        if (context.interactionCurrent) {
            context.interactionCurrent.setProperties({
                name : "Drawing",
                source : this
            });
            map.addInteraction(context.interactionCurrent);
        }
        logger.log("interactions", map.getInteractions());
    };

    // ################################################################### //
    // ####################### handlers events to dom #################### //
    // ################################################################### //

    /**
     * this method is called by event 'click' on 'GPshowDrawingPicto' tag label
     * (cf. this._createShowDrawingPictoElement),
     * and toggles event 'mousemove' on map.
     *
     * @method onShowDrawingClick
     * @private
     */
    Drawing.prototype.onShowDrawingClick = function () {
        var map = this.getMap();
        // on supprime toutes les interactions
        Interactions.unset(map);

        // checked : true - panel close
        // checked : false - panel open
        this.collapsed = this._showDrawingContainer.checked;
        // on génère nous même l'evenement OpenLayers de changement de propriété
        // (utiliser mousePosition.on("change:collapsed", function(e) ) pour s'abonner à cet évènement)
        this.dispatchEvent("change:collapsed");

        // on deselectionne les Tools
        for (var toolsType in this.dtOptions) {
            if (this.dtOptions.hasOwnProperty(toolsType)) {
                if (this.dtOptions[toolsType].active) {
                    var toolsId = this._addUID("drawing-tool-" + this.dtOptions[toolsType].id);
                    document.getElementById(toolsId).className = "drawing-tool";
                    this.dtOptions[toolsType].active = false;
                }
            }
        }
    };

    /**
     * this method is called by event 'click' on 'drawing-export' tag button.
     *
     * @method onExportFeatureClick
     * @private
     */
    Drawing.prototype.onExportFeatureClick = function () {
        // TODO
        var content = this.exportFeatures();
        if (!content) {
            return;
        }
        var link = document.createElement("a");
        // FIXME : determiner le bon charset !
        var charset = "utf-8";
        link.setAttribute("href", "data:application/vnd.google-earth.kml+xml;charset=" + charset + "," + encodeURIComponent(content));
        link.setAttribute("download", this.getExportName() + ".kml");
        if (document.createEvent) {
            var event = document.createEvent("MouseEvents");
            event.initEvent("click", true, true);
            link.dispatchEvent(event);
        } else {
            link.click();
        }
    };
    return Drawing;
}(Control));

export default Drawing;

// Expose Drawing as ol.control.Drawing (for a build bundle)
if (window.ol && window.ol.control) {
    window.ol.control.Drawing = Drawing;
}
