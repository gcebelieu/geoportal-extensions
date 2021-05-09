// import CSS
import "../CSS/Controls/GetFeatureInfo/GPgetFeatureInfoOpenLayers.css";
// import OpenLayers
import Control from "ol/control/Control";
// import local
import Utils from "../../Common/Utils";
import SelectorID from "../../Common/Utils/SelectorID";
import Logger from "../../Common/Utils/LoggerByDefault";
// import local with ol dependencies
import GfiUtils from "../GfiUtils";
// DOM
import GetFeatureInfoDOM from "../../Common/Controls/GetFeatureInfoDOM";

var logger = Logger.getLogger("getfeatureinfo");

/**
 * @classdesc
 * OpenLayers Control to manage getFeatureInfo capability. All queryable layers can be requested.
 * For the vector objects the information displayed are the objects properties. For the wms and wmts layers
 * this is the response of the getFeatureInfo request which is shown to the user.
 *
 * @constructor
 * @alias ol.control.GetFeatureInfo
 * @extends {ol.control.Control}
 * @param {Object} options - control options
 * @param {Array.<Object>} [options.layers] - list of layers which can be requested through the control. Each array element is an object, with following properties :
 * @param {ol.layer.Layer} options.layers.obj - {@link http://openlayers.org/en/latest/apidoc/ol.layer.Layer.html ol.layer.Layer} layer handled by the control (that has been added to map).
 * @param {String} [options.layers.event] - name of the mouse event triggering getFeatureInfo on this layer (that has been added to map). allowed values are : 'singleclick', 'dblclick' and 'contextmenu'. If not specified the triggering event is the current default event (see options.options.defaultEvent).
 * @param {String} [options.layers.infoFormat] - indicates the format mime-type of the response of GetFeatureInfo requests.
 * @param {Object} [options.options] - custom options object to configure the control, with following properties :
 * @param {Boolean} [options.options.hidden=false] - specifies if the widget should be hidden.
 * @param {Boolean} [options.options.auto=false] - specifies if the control run in automatic mode. In automatic mode all vector layers added on run time or added at map initialization can be requested through the control. The triggering event of those layers is the default event.
 * @param {Boolean} [options.options.active=true] - specifies if the control is active or inactive. In inactive mode requests are not fired and no information are displayed.
 * @param {String} [options.options.defaultEvent="singleclick"] - default triggering event chosen in the list ('singleclick', 'dblclick', 'contextmenu'). This is the triggering event of all layers added to the control without configured triggering event.
 * @param {String} [options.options.defaultInfoFormat="text/html"] - indicates the default format mime-type of the response of GetFeatureInfo requests.
 * @param {String} [options.options.cursorStyle="pointer"] - specifies the type of cursor to be displayed when pointing on vector feature of a layer previously added to the control. The value must be choosen in the possible values of the css cursor property.
 * @param {String} [options.options.proxyUrl] - Proxy URL to avoid cross-domain problems.
 * @param {Array.<String>} [options.options.noProxyDomains] - Proxy will not be used for this list of domain names. Only use if you know what you're doing.
 * @param {Boolean} [options.options.autoPan = true] - Specifies whether the map should auto-pan if the pop-up is rendered outside of the canvas. Defaults to true.
 * @param {olx.OverlayPanOptions} [options.options.autoPanAnimation] - Used to customize the auto-pan animation. See {@link https://openlayers.org/en/latest/apidoc/olx.html#.OverlayPanOptions olx.OverlayPanOptions}.
 * @param {Number} [options.options.autoPanMargin] - Margin (in pixels) between the pop-up and the border of the map when autopanning. Default is 20.
 */
var GetFeatureInfo = (function (Control) {
    function GetFeatureInfo (options) {
        options = options || {};
        var _options = options.options || {};
        var _layers = options.layers || [];

        if (!(this instanceof GetFeatureInfo)) {
            throw new TypeError("ERROR CLASS_CONSTRUCTOR");
        }

        if (!Array.isArray(_layers)) {
            throw new Error("ERROR WRONG_TYPE : layers should be an array");
        }

        if (typeof _options !== "object") {
            throw new Error("ERROR WRONG_TYPE : options should be an object");
        }

        this._initialize(_options, _layers);

        // init control DOM container
        var container = this._container = this._initContainer(_options);

        // call ol.control.Control constructor
        Control.call(this, {
            element : container,
            target : _options.target,
            render : _options.render
        });
    };

    // Inherits from ol.control.Control
    if (Control) GetFeatureInfo.__proto__ = Control;

    /**
     * @lends module:GetFeatureInfo
     */
    GetFeatureInfo.prototype = Object.create(Control.prototype, {});

    // on récupère les méthodes de la classe commune GetFeatureInfoDOM
    Utils.assign(GetFeatureInfo.prototype, GetFeatureInfoDOM);

    /**
     * Constructor (alias)
     *
     * @private
     */
    GetFeatureInfo.prototype.constructor = GetFeatureInfo;

    // ################################################################### //
    // ######################## initialize control ####################### //
    // ################################################################### //

    /**
     * Initializes GetFeatureInfo control (called by constructor)
     *
     * @param {Object} options - General options of the control set by user.
     * @param {Array.<Object>} layers - Array of ol layers with their configuration options (obj, event, infoFormat)
     * @private
     */
    GetFeatureInfo.prototype._initialize = function (options, layers) {
        // identifiant du contrôle : utile pour suffixer les identifiants CSS (pour gérer le cas où il y en a plusieurs dans la même page)
        this._uid = SelectorID.generate();

        // List of triggering events associated to a boolean indicating if the event is listened (there must be
        // almost one layer having this triggering event configured)
        this._events = {
            dblclick : false,
            singleclick : false,
            contextmenu : false
        };

        // Object associating a event (key) to his handler (value) in order to unlisten events which have
        // no more layers related to.
        this._eventsHandler = {};

        if (typeof options.auto !== "undefined" && typeof options.auto !== "boolean") {
            logger.log("[ERROR] GetFeatureInfo:_initialize - auto parameter should be a boolean");
            return;
        }
        this._auto = options.auto || false;

        if (typeof options.active !== "undefined" && typeof options.active !== "boolean") {
            logger.log("[ERROR] GetFeatureInfo:_initialize - active parameter should be a boolean");
            return;
        }
        this._active = (typeof options.active === "undefined") ? true : options.active;

        if (options.defaultEvent && typeof options.defaultEvent !== "string") {
            logger.log("[ERROR] GetFeatureInfo:_initialize - defaultEvent parameter should be a string");
            return;
        }
        this._defaultEvent = options.defaultEvent || "singleclick";
        if (!this._isValidEvent(this._defaultEvent)) {
            logger.log("[ERROR] GetFeatureInfo:_initialize - _defaultEvent '" + this._defaultEvent + "' is not a valid event");
            return;
        }

        if (options.defaultInfoFormat && typeof options.defaultInfoFormat !== "string") {
            logger.log("[ERROR] GetFeatureInfo:_initialize - defaultInfoFormat parameter should be a string");
            return;
        }
        this._defaultInfoFormat = options.defaultInfoFormat || "text/html";

        if (options.cursorStyle && typeof options.cursorStyle !== "string") {
            logger.log("[ERROR] GetFeatureInfo:_initialize - cursorStyle parameter should be a string");
            return;
        }
        this._cursorStyle = options.cursorStyle || "pointer";

        if (options.proxyUrl) {
            if (typeof options.proxyUrl !== "string") {
                logger.log("[ERROR] GetFeatureInfo:_initialize - proxyUrl parameter should be a string");
                return;
            }
            this._proxyUrl = options.proxyUrl;
        }

        if (options.noProxyDomains) {
            if (!Array.isArray(options.noProxyDomains)) {
                logger.log("[ERROR] GetFeatureInfo:_initialize - noProxyDomains parameter should be a array");
                return;
            }
            this._noProxyDomains = options.noProxyDomains;
        }

        if (typeof options.autoPan !== "undefined" && typeof options.autoPan !== "boolean") {
            logger.log("[ERROR] GetFeatureInfo:_initialize - autoPan parameter should be a boolean");
            return;
        }
        this._autoPan = (typeof options.autoPan === "undefined") ? true : options.autoPan;

        if (options.autoPanAnimation) {
            if (options.autoPanAnimation.duration) {
                if (typeof options.autoPanAnimation.duration !== "number") {
                    logger.log("[ERROR] GetFeatureInfo:_initialize - autoPanAnimation parameter is invalid : duration should be a number.");
                    return;
                }
            }

            if (options.autoPanAnimation.easing) {
                if (typeof options.autoPanAnimation.easing !== "function") {
                    logger.log("[ERROR] GetFeatureInfo:_initialize - autoPanAnimation parameter is invalid : easing should be a ol.easing function or a custom function.");
                    return;
                }
            }
            this._autoPanAnimation = options.autoPanAnimation;
        }

        if (options.autoPanMargin) {
            if (typeof options.autoPanMargin !== "number") {
                logger.log("[ERROR] GetFeatureInfo:_initialize - autoPanMargin parameter should be a number");
                return;
            }
            this._autoPanMargin = options.autoPanMargin;
        }

        // {Object} control layers list.
        if (!Array.isArray(layers)) {
            logger.log("[ERROR] GetFeatureInfo:_initialize - layers parameter should be an array");
            return;
        }
        this._setLayers(layers);

        // {Object} control panel container (DOM Element)
        this._activateGetFeatureInfoContainer = null;
    };

    /**
     * Binds map to control.
     *
     * @param {ol.Map} map - Map.
     */
    GetFeatureInfo.prototype.setMap = function (map) {
        if (map) {
            // on active les evenements (si des couches sont configurees)
            this._updateEvents(map);

            if (this._cursorStyle && this._active) {
                this._activateCursor(true, map);
            }

            map.getLayers().on(
                "remove",
                (evt) => {
                    for (var i = 0; i < this._layers.length; ++i) {
                        if (this._layers[i].obj === evt.element) {
                            this._layers.splice(i, 1);
                            break;
                        }
                    }
                    this._updateEvents(map);
                }
            );

            if (this._auto) {
                // ajout des couches vecteur deja dans la carte
                var updated = false;
                map.getLayers().forEach((olLayer) => {
                    var layerFormat = GfiUtils.getLayerFormat(olLayer);
                    if (!this._hasLayer(olLayer) && layerFormat === "vector") {
                        this._layers.push({
                            obj : olLayer
                        });
                        updated = true;
                    }
                });

                if (updated) {
                    this._updateEvents(map);
                }

                map.getLayers().on(
                    "add",
                    (evt) => {
                        var layerFormat = GfiUtils.getLayerFormat(evt.element);
                        if (layerFormat === "vector") {
                            this._layers.push({
                                obj : evt.element
                            });
                        }
                        this._updateEvents(map);
                    }
                );
            }
        } else {
            this._clearEvents();
            this._activateCursor(false);
        }

        // call original setMap method
        Control.prototype.setMap.call(this, map);
    };

    // ################################################################### //
    // #################### user interface methods ####################### //
    // ################################################################### //

    /**
     * Gets the list of layers already added to the map and attached to the control.
     *
     * @returns {Array.<Object>} gfiLayers List of layers.
     * @returns {ol.layer.Layer} gfiLayers.obj {@link http://openlayers.org/en/latest/apidoc/ol.layer.Layer.html ol.layer.Layer} layer handled by the control (that has been added to map).
     * @returns {String} gfiLayers.event Optional. Name of the mouse event triggering getFeatureInfo on this layer (that has been added to map). allowed values are : 'singleclick', 'dblclick' and 'contextmenu'.
     * @returns {String} gfiLayers.infoFormat Optional. Indicates the format mime-type of the response of GetFeatureInfo requests.
     */
    GetFeatureInfo.prototype.getLayers = function () {
        return this._layers;
    };

    /**
     * Sets the default event applied to layer with no triggering event configured.
     * This can be set on run time.
     *
     * @param {String} eventName - name of the mouse event chosen in the list : 'singleclick', 'dblclick', 'contextmenu'.
     */
    GetFeatureInfo.prototype.setDefaultEvent = function (eventName) {
        if (typeof eventName !== "string") {
            logger.log("[ERROR] GetFeatureInfo:setDefaultEvent - eventName parameter should be a string");
            return;
        }
        if (!eventName || !this._isValidEvent(eventName)) {
            logger.log("[ERROR] GetFeatureInfo:setDefaultEvent - event '" + eventName + "' is not allowed.");
            return;
        }

        this._defaultEvent = eventName;
        this._updateEvents();
    };

    /**
     * Sets the cursor style when hovering vector layers features.
     *
     * @param {String} cursorStyle - cursor style. The value must be choosen in the possible values of the css cursor property.
     */
    GetFeatureInfo.prototype.setCursorStyle = function (cursorStyle) {
        if (typeof cursorStyle !== "string") {
            logger.log("[ERROR] GetFeatureInfo:setCursorStyle - cursorStyle parameter should be a string");
            return;
        }
        if (this._active) {
            if (!this._cursorStyle && cursorStyle) {
                this._activateCursor(true);
            } else if (this._cursorStyle && !cursorStyle) {
                this._activateCursor(false);
            }
        }
        this._cursorStyle = cursorStyle;
    };

    /**
     * Sets active control property
     *
     * @param {Boolean} active - specify the value the active property must be set to.
     */
    GetFeatureInfo.prototype.setActive = function (active) {
        this._setActive(active);
        var element = document.getElementById(this._addUID("GPactivateGetFeatureInfo"));
        if (element) {
            element.checked = active;
        }
    };

    /**
     * Sets active control property
     *
     * @param {Boolean} active - specify the value the active property must be set to.
     *
     * @private
     */
    GetFeatureInfo.prototype._setActive = function (active) {
        if (typeof active !== "boolean") {
            logger.log("[ERROR] GetFeatureInfo:_setActive - active parameter should be a boolean");
            return;
        }
        if (this._active === active) {
            return;
        }
        this._active = active;
        if (this._cursorStyle) {
            this._activateCursor(active);
        }
    };

    /**
     * Gets active control property
     *
     * @return {Boolean} active
     */
    GetFeatureInfo.prototype.isActive = function () {
        return this._active;
    };

    /**
     * Hides/displays widget
     *
     * @param {Boolean} hidden - specify if the widget must be hidden
     */
    GetFeatureInfo.prototype.setHidden = function (hidden) {
        this.element.style.visibility = (hidden) ? "hidden" : "";
    };

    /**
     * Indicates if the widget is hidden
     *
     * @return {Boolean} is hidden
     */
    GetFeatureInfo.prototype.isHidden = function () {
        return this.element.style.visibility === "hidden";
    };

    /**
     * Set the layers list the control is attached to. Listened events are updated according to this list.
     *
     * @param {Array.<Object>} gfiLayers - list of layers which can be requested through the control.
     * @param {ol.layer.Layer} gfiLayers.obj - {@link http://openlayers.org/en/latest/apidoc/ol.layer.Layer.html ol.layer.Layer} layer handled by the control (that has been added to map).
     * @param {String} [gfiLayers.event] - Name of the mouse event triggering getFeatureInfo on this layer (that has been added to map). allowed values are : 'singleclick', 'dblclick' and 'contextmenu'.
     * @param {String} [gfiLayers.infoFormat] - Indicates the format mime-type of the response of GetFeatureInfo requests.
     */
    GetFeatureInfo.prototype.setLayers = function (gfiLayers) {
        this._setLayers(gfiLayers);
        this._updateEvents();
    };

    /**
     * Indicates if an event is allowed
     *
     * @param {String} eventName - name of the mouse event chosen in the list : 'singleclick', 'dblclick', 'contextmenu'.
     *
     * @returns {Boolean} is valid event
     *
     * @private
     */
    GetFeatureInfo.prototype._isValidEvent = function (eventName) {
        return Object.keys(this._events).indexOf(eventName) > -1;
    };

    /**
     * Adds an event listener to the specified event.
     *
     * @param {String} eventName - name of the mouse event chosen in the list : 'singleclick', 'dblclick', 'contextmenu'.
     * @param {Object} map - map on wich event are attached.
     *
     * @private
     */
    GetFeatureInfo.prototype._activateEvent = function (eventName, map) {
        var gfiObj = this;

        var getFeatureInfoHandler = function (e) {
            GfiUtils.onDisplayFeatureInfo(e, gfiObj);
        };

        if (eventName === "contextmenu") {
            map.getViewport().addEventListener(
                eventName,
                getFeatureInfoHandler
            );
        } else {
            map.on(
                eventName,
                getFeatureInfoHandler
            );
        }

        this._eventsHandler[eventName] = getFeatureInfoHandler;

        this._events[eventName] = true;
    };

    /**
     * Unlistens the specified event.
     * @param {String} eventName - name of the mouse event chosen in the list : 'singleclick', 'dblclick', 'contextmenu'.
     * @param {Object} map - map on wich event are attached.
     *
     * @private
     */
    GetFeatureInfo.prototype._deactivateEvent = function (eventName, map) {
        if (eventName === "contextmenu") {
            map.getViewport().removeEventListener(
                eventName,
                this._eventsHandler[eventName]
            );
        } else {
            map.un(
                eventName,
                this._eventsHandler[eventName]
            );
        }

        delete this._eventsHandler[eventName];

        this._events[eventName] = false;
    };

    /**
     * Updates the listener (listen/unlisten) in accordance with the layers attached to the control and their triggering events.
     *
     * @param {Object} map - map on wich event are attached.
     *
     * @private
     */
    GetFeatureInfo.prototype._updateEvents = function (map) {
        if (!map) {
            map = this.getMap();
        }
        var sEvent = [];
        for (var i = 0; i < this._layers.length; ++i) {
            var event = (this._layers[i].event) ? this._layers[i].event : this._defaultEvent;
            if (sEvent.indexOf(event) < 0) {
                sEvent.push(event);
            }
        }

        for (var eventName in this._events) {
            if (!this._events[eventName] && sEvent.indexOf(eventName) >= 0) {
                this._activateEvent(eventName, map);
            } else if (this._events[eventName] && sEvent.indexOf(eventName) < 0) {
                this._deactivateEvent(eventName, map);
            }
        }
    };

    /**
     * Clears all the listeners.
     *
     * @private
     */
    GetFeatureInfo.prototype._clearEvents = function () {
        var map = this.getMap();
        for (var eventName in this._events) {
            if (this._events[eventName]) {
                this._deactivateEvent(eventName, map);
            }
        }
    };

    /**
     * Indicates if the control has the specified layer attached
     *
     * @param {ol.layer.Layer} olLayer - layer openlayers
     *
     * @returns {Boolean} has layer
     *
     * @private
     */
    GetFeatureInfo.prototype._hasLayer = function (olLayer) {
        for (var i = 0; i < this._layers.length; ++i) {
            if (this._layers[i].obj === olLayer) {
                return true;
            }
        }
        return false;
    };

    /**
     * Listens/unlistens 'pointermove' event displaying specific cursor style when hovering vector features
     *
     * @param {Boolean} activate - specify if the control must be activated or deactivated
     * @param {Object} map - map on wich cursor is attached.
     *
     * @private
     */
    GetFeatureInfo.prototype._activateCursor = function (activate, map) {
        if (!map) {
            map = this.getMap();
        }

        if (activate) {
            if (this._eventsHandler.hasOwnProperty("pointermove")) {
                logger.log("[ERROR] _activateCursor - inconsistent state: pointermove event handler already registered");
                return;
            }
            var gfiObj = this;

            var displayCursor = function (evt) {
                var hit = map.forEachFeatureAtPixel(evt.pixel, (feature, layer) => {
                    // on ne prend en compte que les couches vecteurs connues du controle
                    var gfiLayers = gfiObj.getLayers();
                    for (var m = 0; m < gfiLayers.length; ++m) {
                        if (gfiLayers[m].obj === layer) {
                            return true;
                        }
                    }
                });
                if (hit) {
                    map.getTargetElement().style.cursor = gfiObj._cursorStyle;
                } else {
                    map.getTargetElement().style.cursor = "";
                }
            };

            this._eventsHandler["pointermove"] = displayCursor;
            map.on("pointermove", displayCursor);
        } else {
            if (this._eventsHandler.hasOwnProperty("pointermove")) { // si le widget n'a jamais ete active l'evenement pointermove n'existe pas
                map.un("pointermove", this._eventsHandler["pointermove"]);
                delete this._eventsHandler["pointermove"];
            }
            map.getTargetElement().style.cursor = "";
        }
    };

    /**
     * Sets the layers list the control is attached to.
     * @param {Array.<Object>} gfiLayers - list of layers which can be requested through the control.
     *
     * @private
     */
    GetFeatureInfo.prototype._setLayers = function (gfiLayers) {
        if (!gfiLayers || !Array.isArray(gfiLayers)) {
            logger.log("[ERROR] GetFeatureInfo:setLayers - gfiLayers parameter should be a array");
            return;
        }
        this._layers = [];

        for (var i = 0; i < gfiLayers.length; ++i) {
            var ind = this._layers.push({}) - 1;

            if (gfiLayers[i].event) {
                if (!this._isValidEvent(gfiLayers[i].event)) {
                    logger.log("[ERROR] GetFeatureInfo:setLayers - layer event '" + this._layers[i].event + "' is not allowed.");
                } else {
                    this._layers[ind].event = gfiLayers[i].event;
                }
            }

            if (gfiLayers[i].infoFormat) {
                this._layers[ind].infoFormat = gfiLayers[i].infoFormat;
            }

            this._layers[ind].obj = gfiLayers[i].obj;
        }
    };

    // ################################################################### //
    // ######################## methods handle dom ####################### //
    // ################################################################### //

    /**
     * This method is called by event 'change' on 'GPactivateGetFeatureInfo'
     * tag select (cf. this._createActivateGetFeatureInfoElement).
     *
     * @method onActivateGetFeatureInfoElementChange
     * @param {Object} e - HTMLElement
     *
     * @private
     */
    GetFeatureInfo.prototype.onActivateGetFeatureInfoElementChange = function (e) {
        this._setActive(e.target.checked);
    };

    /**
     * Creates control main container (called by GetFeatureInfo constructor)
     * @param {Object} [options] - options object to configure the widget :
     * @param {Boolean} [options.hidden] - specifies if the widget should be hidden.
     *
     * @return {DOMElement} DOM element
     *
     * @method _initContainer
     *
     * @private
     */
    GetFeatureInfo.prototype._initContainer = function (options) {
        // creation du container principal
        var container = this._createMainContainerElement();

        var inputActivate = this._activateGetFeatureInfoContainer = this._createActivateGetFeatureInfoElement(this.isActive());
        container.appendChild(inputActivate);

        // ajout dans le container principal du picto du controle
        var picto = this._createMainPictoElement();
        container.appendChild(picto);

        if (typeof options.hidden !== "undefined") {
            if (typeof options.hidden !== "boolean") {
                logger.log("[ERROR] GetFeatureInfo:_initContainer - hidden parameter should be a boolean");
                return;
            }
            if (options.hidden) {
                container.style.visibility = "hidden";
            }
        }

        return container;
    };

    return GetFeatureInfo;
}(Control));

export default GetFeatureInfo;

// Expose GetFeatureInfo as ol.control.GetFeatureInfo (for a build bundle)
if (window.ol && window.ol.control) {
    window.ol.control.GetFeatureInfo = GetFeatureInfo;
}
