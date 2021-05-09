// import OpenLayers
import Overlay from "ol/Overlay";
import VectorTileSource from "ol/source/VectorTile";
import VectorSource from "ol/source/Vector";
import TileWMSSource from "ol/source/TileWMS";
import WMTSSource from "ol/source/WMTS";
import ImageWMSSource from "ol/source/ImageWMS";
import {
    Select as SelectInteraction,
    Modify as ModifyInteraction,
    Draw as DrawInteraction
} from "ol/interaction";
// import geoportal library access
import Gp from "geoportal-access-lib";
// import local
import Logger from "../Common/Utils/LoggerByDefault";
import ProxyUtils from "../Common/Utils/ProxyUtils";
// import $__xmldom from "xmldom";

var logger = Logger.getLogger("GfiUtils");

var GfiUtils = {

    /**
     * Return layer format
     *
     * @param {ol.layer.Layer} l - layer openlayers
     *
     * @return {String} format - layer format can be wms, wmts, vector or unknown
     *
     */
    getLayerFormat : function (l) {
        // la fonction 'getType' existe uniquement en mode source es6.
        // le bundle ol ne fournit pas cette fonction !?
        var type = (typeof l.getType === "function") ? l.getType() : null;
        var source = l.getSource();
        if (type) {
            if (type === "VECTOR" || type === "VECTOR_TILE") {
                return "vector";
            }
            if (type === "TILE") {
                if (source.tileGrid) {
                    return "wmts";
                } else {
                    return "wms";
                }
            }
            if (type === "IMAGE") {
                return "wms";
            }
        } else {
            if (source instanceof TileWMSSource || source instanceof ImageWMSSource) {
                return "wms";
            }
            if (source instanceof WMTSSource) {
                return "wmts";
            }
            if (source instanceof VectorSource || source instanceof VectorTileSource) {
                return "vector";
            }
        }
        return "unknown";
    },

    /**
     * Info Popup creation and display
     *
     * @param {ol.Map} map - map openlayers
     * @param {ol.Coordinate} coords - coordinates where to anchor popup.
     * @param {String} content - content to display
     * @param {String} [contentType='text/html'] - content mime-type
     * @param {Object} autoPanOptions - Auto-pan pop-up options
     * @param {Boolean} [autoPanOptions.autoPan] - Specifies whether the map should auto-pan if the pop-up is rendered outside of the canvas
     * @param {olx.OverlayPanOptions} [autoPanOptions.autoPanAnimation] - Used to customize the auto-pan animation. See {@link https://openlayers.org/en/latest/apidoc/olx.html#.OverlayPanOptions olx.OverlayPanOptions}.
     * @param {Number} [autoPanOptions.autoPanMargin] - Margin (in pixels) between the pop-up and the border of the map when autopanning. Default is 20.
     * @return {Boolean} displayed - indicates if something has been displayed
     */
    displayInfo : function (map, coords, content, contentType, autoPanOptions) {
        logger.trace("[GfiUtils] : displayInfo...");

        if (!contentType) {
            contentType = "text/html";
        }

        if (content === null) {
            return;
        }

        var _htmlDoc = null;
        var _parser = null;

        var _content = content;
        _content = _content.replace(/\n/g, "");
        _content = _content.replace(/(>)\s*(<)/g, "$1$2");

        var scope = typeof window !== "undefined" ? window : null;

        if (typeof exports === "object" && window === null) {
            // code for nodejs
            var DOMParser = require("xmldom").DOMParser;
            _parser = new DOMParser();
            _htmlDoc = _parser.parseFromString(_content, contentType);
        } else if (scope.DOMParser) {
            // code for modern browsers
            _parser = new scope.DOMParser();
            _htmlDoc = _parser.parseFromString(_content, contentType);
        } else if (scope.ActiveXObject) {
            // code for old IE browsers
            _htmlDoc = new scope.ActiveXObject("Microsoft.XMLDOM");
            _htmlDoc.async = false;
            _htmlDoc.loadXML(_content);
        } else {
            logger.log("Incompatible environment for DOM Parser !");
            return false;
        }

        var body = _htmlDoc.getElementsByTagName("body");
        if (body && body.length === 1) {
            if (!body[0].hasChildNodes()) {
                return false;
            }
        }

        // Affichage des features.
        var element = document.createElement("div");
        element.className = "gp-feature-info-div";

        var closer = document.createElement("input");
        closer.type = "button";
        closer.className = "gp-styling-button closer";

        // fait disparaître la popup au clic sur x
        closer.onclick = function () {
            if (map.featuresOverlay) {
                map.removeOverlay(map.featuresOverlay);
                map.featuresOverlay = null;
            }
            return false;
        };

        var contentDiv = document.createElement("div");
        contentDiv.className = "gp-features-content-div";
        contentDiv.innerHTML = content;
        /*
        if (content instanceof HTMLElement) {
            this.logger.trace("[Openlayers] : _displayInfo : pure HTMLElement") ;
            contentDiv.appendChild(content) ;
        } else {
            var parser = new DOMParser() ;
            var doc = null ;
            try {
                doc = parser.parseFromString(content,contentType) ;
                this.logger.trace("[Openlayers] : _displayInfo : HTMLElement from parser") ;
                // FIXME : avec cette methode, on a une balise html + body qui s'insère...
                contentDiv.appendChild(doc.documentElement) ;
            } catch (e) {
                console.log(e) ;
                this.logger.trace("[Openlayers] : _displayInfo : parsing content failed (not HTML)") ;
                // en cas d'erreur : on se contente de recopier le contenu.
                contentDiv.innerHTML = content ;
            }
        }
        */
        element.appendChild(contentDiv);
        element.appendChild(closer);

        if (map.featuresOverlay) {
            // fermeture d'une éventuelle popup déjà ouverte.
            map.removeOverlay(map.featuresOverlay);
            map.featuresOverlay = null;
        }
        map.featuresOverlay = new Overlay({
            // id : id,
            element : element,
            autoPan : autoPanOptions.autoPan,
            autoPanAnimation : autoPanOptions.autoPanAnimation,
            autoPanMargin : autoPanOptions.autoPanMargin,
            positioning : "bottom-center",
            insertFirst : false, // popup appears on top of other overlays if any
            stopEvent : true
        });
        map.addOverlay(map.featuresOverlay);
        map.featuresOverlay.setPosition(coords);
        map.featuresOverlay.render();

        return true;
    },

    /**
     * Gets HTML content from features array
     *
     * @param {ol.Map} map - map openlayers
     * @param {Array.<ol.Features>} features - openlayers features Array
     * @returns {HTMLElement} HTML content.
     */
    features2html : function (map, features) {
        var content = document.createElement("div");
        features.forEach(function (f) {
            var props = f.getProperties();
            if (props.hasOwnProperty("name")) {
                var nameDiv = document.createElement("div");
                nameDiv.className = "gp-att-name-div";
                // nameDiv.appendChild(document.createTextNode(props["name"])) ;
                nameDiv.insertAdjacentHTML("afterbegin", props["name"]);
                content.appendChild(nameDiv);
            }
            if (props.hasOwnProperty("description")) {
                var descDiv = document.createElement("div");
                descDiv.className = "gp-att-description-div";
                // descDiv.appendChild(document.createTextNode(props["description"])) ;
                descDiv.insertAdjacentHTML("afterbegin", props["description"]);
                content.appendChild(descDiv);
            }
            var p = null;
            var others = false;
            var oDiv = null;
            var ul = null;
            var li = null;
            for (p in props) {
                if (p === "geometry" || p === "value" || p === "name" || p === "description" || p === "styleUrl") {
                    continue;
                }
                // FIXME La lecture des extensions GPX n'est pas gérée !
                if (p === "extensionsNode_" && props[p] === undefined) {
                    continue;
                }
                if (!others) {
                    oDiv = document.createElement("div");
                    oDiv.className = "gp-att-others-div";
                    ul = document.createElement("ul");
                    others = true;
                }
                li = document.createElement("li");
                var span = document.createElement("span");
                span.className = "gp-attname-others-span";
                span.appendChild(document.createTextNode(p + " : "));
                li.appendChild(span);
                li.appendChild(document.createTextNode(props[p]));
                ul.appendChild(li);
            }
            if (ul) {
                oDiv.appendChild(ul);
                content.appendChild(oDiv);
            }
        }, map);

        // pas de contenu !
        if (!content.hasChildNodes()) {
            content = null;
        }

        return content;
    },

    /**
     * Indicates if there is a feature at the given coordinates for the given layer
     *
     * @param {ol.Map} map - map openlayers
     * @param {ol.layer.Layer} olLayer - vector layer openlayers
     * @param {ol.Coordinate} olCoordinate - coordinates pointed by user
     *
     * @return {Boolean} has feature
     *
     */
    layerGetFeatureAtCoordinates : function (map, olLayer, olCoordinate) {
        var pixel = map.getPixelFromCoordinate(olCoordinate);
        return map.hasFeatureAtPixel(pixel, function (layer) {
            if (layer === olLayer) {
                return true;
            }
            return false;
        });
    },

    /**
     * Get information from all the features located at the specified coordinates
     * and belonging to the layers list argument. Those information are gathered
     * and displayed in an info popup.
     *
     * @param {ol.Map} map - map openlayers
     * @param {ol.Coordinate} olCoordinate - coordinates pointed by user
     * @param {Array.<ol.layer.Layer>} olLayers - layers requested
     * @param {Object} autoPanOptions - autopan options
     *
     * @returns {Boolean} something is displayed
     *
     */
    displayVectorFeatureInfo : function (map, olCoordinate, olLayers, autoPanOptions) {
        var pixel = map.getPixelFromCoordinate(olCoordinate);

        // couches vecteur : on remplit un tableau avec les features à proximité.
        var features = [];
        map.forEachFeatureAtPixel(pixel, function (feature, layer) {
            if (!olLayers || olLayers.indexOf(layer) > -1) {
                features.push(feature);
            }
        });
        if (features.length === 0) {
            // no features
            return false;
        }
        var content = this.features2html(map, features);
        // pas de contenu !
        if (content === null) {
            return false;
        }
        // Affichage des features.
        this.displayInfo(map, olCoordinate, content.innerHTML, "text/html", autoPanOptions);
        // this._displayInfo(evt.coordinate,content,"text/html") ;
        return true;
    },

    /**
     * Method to manage the request of information from a list of layers already added to the map.
     * Among the given list of layers only the visible ones are requested.
     * The priority is given to the upper layer having a feature at the pointed coordinates.
     * If the first (upper) feature encountered is from a vector layer the info popup will
     * display the information of the features from all visible vector layers and located at
     * the specified coordinates.
     *
     * @param {ol.Map} map - map openlayers
     * @param {ol.Coordinate} olCoordinate - coordinates pointed by user
     * @param {Array.<Object>} gfiLayers - list of layers which can be requested through the control. Each array element is an object, with following properties :
     * @param {ol.layer.Layer} gfiLayers.obj - ol.layer.Layer layer handled by the control (that has been added to map).
     * @param {String} [gfiLayers.event] - name of the mouse event triggering getFeatureInfo on this layer (that has been added to map). allowed values are : 'singleclick', 'dblclick' and 'contextmenu'
     * @param {String} [gfiLayers.infoFormat] - indicates the format mime-type of the response of GetFeatureInfo requests.
     * @param {Object} [proxyOptions] - options for poxy configuration :
     * @param {String} [proxyOptions.proxyUrl] - Proxy URL to avoid cross-domain problems, if not already set in mapOptions. Mandatory to import WMS and WMTS layer.
     * @param {Array.<String>} [proxyOptions.noProxyDomains] - Proxy will not be used for this list of domain names. Only use if you know what you're doing (if not already set in mapOptions).
     * @param {Object} [autoPanOptions] - Auto-pan pop-up options
     * @param {Boolean} [autoPanOptions.autoPan = true] - Specifies whether the map should auto-pan if the pop-up is rendered outside of the canvas. Defaults to true.
     * @param {olx.OverlayPanOptions} [autoPanOptions.autoPanAnimation] - Used to customize the auto-pan animation. See {@link https://openlayers.org/en/latest/apidoc/olx.html#.OverlayPanOptions olx.OverlayPanOptions}.
     * @param {Number} [autoPanOptions.autoPanMargin] - Margin (in pixels) between the pop-up and the border of the map when autopanning. Default is 20.
     *
     */
    displayFeatureInfo : function (map, olCoordinate, gfiLayers, proxyOptions, autoPanOptions) {
        // Layers orders
        var layersOrdered = {};
        for (var j = 0; j < gfiLayers.length; j++) {
            var layer = gfiLayers[j];
            var position = layer.obj.getZIndex();
            if (!layersOrdered[position]) {
                layersOrdered[position] = [];
            }
            layersOrdered[position].push(layer);
        }

        // affichage de la première popup d'informations en partant du dessus...
        var requests = [];
        // inversion de l'ordre des layers
        var positions = Object.keys(layersOrdered);
        positions.sort(function (a, b) {
            return b - a;
        });

        // si la 1ere couche affichable est de type vecteur on affiche les infos de toutes
        // les couches vecteur qui suivent. Par consequent, une seule requete vecteur suffit
        // (celle correspondant au premier objet vecteur rencontre)
        var foundFeature = false;

        for (var k = 0; k < positions.length; k++) {
            var p = positions[k];
            for (var h = 0; h < layersOrdered[p].length; ++h) {
                var l = layersOrdered[p][h].obj;
                var infoFormat = layersOrdered[p][h].infoFormat || "text/html";
                var minMaxResolutionOk = true;
                if (l.minResolution &&
                    l.minResolution > map.getResolution()) {
                    minMaxResolutionOk = false;
                }
                if (minMaxResolutionOk &&
                    l.maxResolution &&
                    l.maxResolution < map.getResolution()) {
                    minMaxResolutionOk = false;
                }

                if (l.getVisible() && minMaxResolutionOk) {
                    var format = this.getLayerFormat(l);
                    if (format === "vector") {
                        if (!foundFeature && this.layerGetFeatureAtCoordinates(map, l, olCoordinate)) {
                            requests.push({
                                format : format,
                                scope : this,
                                coordinate : olCoordinate
                            });
                        }
                        continue;
                    } else if (format !== "wms" && format !== "wmts") {
                        logger.log("[ERROR] DisplayFeatureInfo - layer format '" + format + "' not allowed");
                        continue;
                    }

                    var _res = map.getView().getResolution();
                    var _url = null;
                    // INFO
                    // en fonction de la version d'openlayers, la méthode est differente :
                    // - getGetFeatureInfoUrl en v5
                    // - getFeatureInfoUrl en v6
                    if (format === "wmts") {
                        _url = l.getSource().getFeatureInfoUrl.call(l.getSource(),
                            olCoordinate,
                            _res,
                            map.getView().getProjection(), {
                                INFOFORMAT : infoFormat
                            }
                        );
                    } else {
                        _url = l.getSource().getFeatureInfoUrl.call(l.getSource(),
                            olCoordinate,
                            _res,
                            map.getView().getProjection(), {
                                INFO_FORMAT : infoFormat
                            }
                        );
                    }

                    requests.push({
                        // id : _id,
                        format : infoFormat,
                        url : ProxyUtils.proxifyUrl(_url, proxyOptions),
                        scope : this,
                        coordinate : olCoordinate
                    });
                }
            }
        }

        // on recupere les couches vecteur ordonnees (a utiliser dans le cas de l'affichage de donnees vecteur)
        var vectorLayersOrdered = null;

        // call request sync
        function requestsSync (list, iterator, callback) {
            if (list.length === 0) {
                return;
            }
            var nextItemIndex = 0;
            // function report next request
            function report (displayed) {
                nextItemIndex++;
                if (displayed || nextItemIndex === list.length) {
                    callback();
                } else {
                    iterator(list[nextItemIndex], report);
                }
            }
            // instead of starting all the iterations, we only start the 1st one
            iterator(list[0], report);
        };

        var context = this;

        requestsSync(requests,
            function (data, report) {
                if (data.format === "vector") {
                    if (!vectorLayersOrdered) {
                        vectorLayersOrdered = [];
                        for (var m = 0; m < positions.length; m++) {
                            var p = positions[m];
                            for (var n = 0; n < layersOrdered[p].length; ++n) {
                                vectorLayersOrdered.push(layersOrdered[p][n].obj);
                            }
                        }
                    }
                    report(data.scope.displayVectorFeatureInfo(map, data.coordinate, vectorLayersOrdered, autoPanOptions));
                } else {
                    // var self = data.scope;
                    Gp.Protocols.XHR.call({
                        url : data.url,
                        method : "GET",
                        scope : data.scope,
                        // Handles GFI response
                        onResponse : function (resp) {
                            var exception = false;

                            // a t on une exception ?
                            if (resp.trim().length === 0 ||
                                resp.indexOf("java.lang.NullPointerException") !== -1 ||
                                resp.indexOf("not queryable") !== -1) {
                                // rien à afficher
                                exception = true;
                            }

                            // on affiche la popup GFI !
                            var displayed = !exception && context.displayInfo(map, data.coordinate, resp, "text/html", autoPanOptions);
                            // on reporte sur la prochaine requête...
                            report(displayed);
                        },
                        // Handles GFI response error
                        onFailure : function (error) {
                            logger.log(error);
                            report(false);
                        }
                    });
                }
            },
            function () {
                logger.trace("Finish sync to GFI !");
            }
        );
    },

    // Function returning the clicked position of an event
    getPosition : function (e, map) {
        if (e.coordinate) {
            return e.coordinate;
        }

        var pixel = [0, 0];

        if (e.offsetX || e.offsetY) {
            pixel[0] = e.offsetX; // + document.body.scrollLeft + document.documentElement.scrollLeft;
            pixel[1] = e.offsetY; // + document.body.scrollTop + document.documentElement.scrollTop;
        } else if (e.pointerType === "touch") {
            // a implementer !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!

            // Safari iOS / iPhone en mode Touch (cf. hammer)
            var p = e.pointers[0];
            pixel[0] = p.pageX;
            pixel[1] = p.pageY;
        }

        var coordinate = map.getCoordinateFromPixel(pixel);
        return coordinate;
    },

    // onDisplayFeatureInfo
    onDisplayFeatureInfo : function (e, gfiObj) {
        if (!gfiObj.isActive()) {
            return;
        }

        logger.trace(e);

        var map = gfiObj.getMap();

        if (e.type === "contextmenu" || e.type === "dblclick") {
            e.preventDefault();
        } else if (e.type === "singleclick") {
            var interactions = map.getInteractions().getArray();
            for (var i = 0; i < interactions.length; i++) {
                if (interactions[i].getActive() &&
                    (interactions[i] instanceof SelectInteraction ||
                        interactions[i] instanceof ModifyInteraction ||
                        interactions[i] instanceof DrawInteraction)
                ) {
                    // si on a une interaction de dessin ou de sélection en cours, on ne fait rien.
                    return;
                }
            }
        }

        var proxyOptions = {};
        if (gfiObj._proxyUrl) {
            proxyOptions.proxyUrl = gfiObj._proxyUrl;
        }
        if (gfiObj._noProxyDomains) {
            proxyOptions.noProxyDomains = gfiObj._noProxyDomains;
        }

        var autoPanOptions = {};
        if (gfiObj._autoPan) {
            autoPanOptions.autoPan = gfiObj._autoPan;
        }
        if (gfiObj._autoPanAnimation) {
            autoPanOptions.autoPanAnimation = gfiObj._autoPanAnimation;
        }
        if (gfiObj._autoPanMargin) {
            autoPanOptions.autoPanMargin = gfiObj._autoPanMargin;
        }

        var eventLayers = [];
        for (var j = 0; j < gfiObj._layers.length; ++j) {
            var event = (gfiObj._layers[j].event) ? gfiObj._layers[j].event : gfiObj._defaultEvent;
            if (event === e.type) {
                var ind = eventLayers.push(gfiObj._layers[j]) - 1;
                if (!eventLayers[ind].infoFormat) {
                    eventLayers[ind].infoFormat = gfiObj._defaultInfoFormat;
                }
            }
        }

        var coords = this.getPosition(e, map);

        this.displayFeatureInfo(map, coords, eventLayers, proxyOptions, autoPanOptions);
    }
};

export default GfiUtils;

// Expose GfiUtils as ol.gp.GfiUtils (for a build bundle)
if (window.ol) {
    if (window.ol.gp) {
        window.ol.gp.GfiUtils = GfiUtils;
    } else {
        window.ol.gp = {
            GfiUtils : GfiUtils
        };
    }
}
