import Gp from "geoportal-access-lib";
import L from "leaflet";
import "leaflet-draw";
import Logger from "../../Common/Utils/LoggerByDefault";
import RightManagement from "../../Common/Utils/CheckRightManagement";
import ID from "../../Common/Utils/SelectorID";
import IconDefault from "./Utils/IconDefault";
import ReverseGeocodingDOM from "../../Common/Controls/ReverseGeocodingDOM";

var logger = Logger.getLogger("reversegeocoding");

/**
 * @classdesc
 *
 * Leaflet Control Class to find locations by clicking on a map using <a href="https://geoservices.ign.fr/documentation/geoservices/geocodage-inverse.html" target="_blank">reverse geocoding service</a> of the Geoportal platform.
 *
 * Use {@link module :Controls.ReverseGeocode L.geoportalControl.ReverseGeocode()} factory to create instances of that class.
 *
 * **Extends** Leaflet <a href="http://leafletjs.com/reference.html#control" target="_blank">L.Control</a> native class.
 *
 * @namespace
 * @alias L.geoportalControl.ReverseGeocode
 */
var ReverseGeocoding = L.Control.extend(/** @lends L.geoportalControl.ReverseGeocode.prototype */ {

    includes : ReverseGeocodingDOM,

    /**
     * options by default
     *
     * @private
     */
    options : {
        position : "bottomleft",
        collapsed : true,
        resources : ["StreetAddress", "PositionOfInterest", "CadastralParcel"],
        delimitations : ["Point", "Circle", "Extent"],
        reverseGeocodeOptions : {}
    },

    /**
     * @constructor ReverseGeocode
     * @param {Object} options - ReverseGeocoding control options
     * @param {String}  [options.apiKey] - API key for services call (reverse geocode service), mandatory if autoconf service has not been charged in advance
     * @param {Boolean} [options.ssl = true] - use of ssl or not (default true, service requested using https protocol)
     * @param {String}  [options.position] - position of component into the map, 'topleft' by default
     * @param {Boolean} [options.collapsed] - Specify if widget has to be collapsed (true) or not (false) on map loading. Default is true.
     * @param {Array}  [options.resources] - resources for geocoding, by default : ["StreetAddress", "PositionOfInterest","CadastralParcel"]
     * @param {Array}  [options.delimitations] - delimitations for reverse geocoding, by default : ["Point", "Circle", "Extent"]
     * @param {Object}  [options.reverseGeocodeOptions] - reverse geocode service options. see {@link http://ignf.github.io/geoportal-access-lib/latest/jsdoc/module-Services.html#~ReverseGeocode Gp.Services.reverseGeocode()} to know all reverse geocode options.
     * @example
     *  var iso = L.geoportalControl.ReverseGeocode({
     *      collapsed : false,
     *      position : "topright",
     *      resources : ["StreetAddress", "PositionOfInterest","CadastralParcel"],
     *      delimitations : ["Point", "Circle"],
     *      reverseGeocodeOptions : {}
     *  });
     * @private
     */
    initialize : function (options) {
        // on merge les options avec celles par defaut
        L.Util.extend(this.options, options);

        /**
         * Droit sur la ressource.
         * Par defaut, on n'en s'occupe pas
         * sauf si l'autoconfiguration est chargée !
         */
        this._noRightManagement = false;

        // ressources des services d'autocompletion et de geocodage
        this._servicesRightManagement = {};

        // gestion des droits sur les ressources/services
        this._checkRightsManagement();

        // check input options format (resources and delimitations arrays)
        this._checkInputOptions();

        /** uuid */
        this._uid = ID.generate();

        // Type de géocodage sélectionné (StreetAddress, PositionOfInterest, ...)
        this._currentGeocodingType = null;
        this._initGeocodingType();

        // Type de délimitation à utiliser pour la requête + pour sélection sur la containerDistance
        this._currentGeocodingDelimitation = null;
        this._initGeocodingDelimitation();

        // ################################################################## //
        // ################### Elements principaux du DOM ################### //

        // containers principaux
        this._showReverseGeocodingContainer = null;
        // header panel
        this._panelHeaderContainer = null;
        this._panelTitleContainer = null;
        this._returnPictoContainer = null;
        // form
        this._formContainer = null;
        // results
        this._resultsContainer = null;
        this._resultsListContainer = null;
        // waiting
        this._waitingContainer = null;

        // ###################################################################### //
        // ################### informations des points saisis ################### //

        // couche vectorielle dans laquelle seront saisis les points (features ci-dessus)
        this._inputFeaturesLayer = null;
        this._inputResultsLayer = null;
        this._lastIdLayer = 0;
        this._currentIdLayer = 0;
        // interaction avec la carte (de type "Point", "Circle" ou "Polygon")
        this._currentFeature = null;

        // #################################################################### //
        // ################### informations pour la requête ################### //

        // geometrie de recherche du géocodage inverse qui sera envoyée dans la requête
        this._requestGeom = null;

        // pour savoir si un calcul est en cours ou non
        this._waiting = false;
        // timer pour cacher la patience après un certain temps
        this._timer = null;

        // #################################################################### //
        // #################### informations des résultats #################### //

        this._reverseGeocodingLocations = [];
    },

    /**
     * this method is called by this.addTo(map) when the control is added on the map
     * and fills variable 'this._container = this.onAdd(map)',
     * and create events on map.
     *
     * @param {Object} map - the map
     *
     * @returns {DOMElement} DOM element
     *
     * @private
     */
    onAdd : function (map) {
        // initialisation du DOM du composant
        var container = this._container = this._initLayout();

        // deactivate of events that may interfere with the map
        L.DomEvent
            .disableClickPropagation(container)
            .disableScrollPropagation(container);

        if (map) {
            // lors de l'ajout à la map, on active la saisie du point,
            // mais seulement si le widget est ouvert
            if (!this.options.collapsed) {
                this._activateMapInteraction(map);
            }
        }

        return container;
    },

    /**
     * this method is called when the control is removed from the map
     * and removes events on map.
     *
     * @param {Object} map - the map
     *
     * @private
     */
    onRemove : function (map) {
        this._clearLocations();
        this._clearLocationsFeature(map);
        this._clearInputRequest();

        // on supprime l'éventuelle précédente interaction
        this._removeMapInteraction(map);
    },

    // ################################################################### //
    // ##################### init component ############################## //
    // ################################################################### //

    /**
     * this method is called by constructor
     * and check the rights to resources
     *
     * @private
     */
    _checkRightsManagement : function () {
        var _key = this.options.reverseGeocodeOptions.apiKey;
        // on récupère les éventuelles ressources passées en option, soit dans reverseGeocodeOptions :
        var _resources = (this.options.reverseGeocodeOptions.index) ? this.options.reverseGeocodeOptions.index : "";
        // soit directement dans options.resources :
        if (!_resources || _resources.length === 0) {
            _resources = this.options.resources;
        }
        // ou celles par défaut sinon.
        if (!_resources || _resources === "") {
            _resources = "location";
        }

        if (_resources === "location") {
            _resources = [
                "StreetAddress",
                "PositionOfInterest",
                "CadastralParcel"
            ];
        } else {
            if (!Array.isArray(_resources)) _resources = [_resources];
        }

        var rightManagementGeocode = RightManagement.check({
            key : _key || this.options.apiKey,
            resources : _resources,
            services : ["Geocode"]
        });
        logger.log("rightManagementGeocode", rightManagementGeocode);

        // aucun droit !
        if (!rightManagementGeocode) {
            this._noRightManagement = true;
            return;
        }

        // on recupère les informations utiles
        // Ex. la clef API issue de l'autoconfiguration si elle n'a pas
        // été renseignée.
        if (!this.options.apiKey) {
            this.options.apiKey = rightManagementGeocode.key;
        }

        if (rightManagementGeocode) {
            this._servicesRightManagement["Geocode"] = rightManagementGeocode["Geocode"];
        }
    },

    /**
     * this method is called by this.initialize()
     * and makes sure input options are correctly formated
     *
     * @private
     */
    _checkInputOptions : function () {
        var i;
        // on vérifie le tableau des resources
        if (this.options.resources) {
            var resources = this.options.resources;
            // on vérifie que la liste des ressources de geocodage est bien un tableau
            if (!Array.isArray(resources)) {
                logger.log("[ReverseGeocoding] 'options.resources' parameter should be an array");
                resources = null;
            }
            var resourcesList = ["StreetAddress", "PositionOfInterest", "CadastralParcel"];
            for (i = 0; i < resources.length; i++) {
                if (resourcesList.indexOf(resources[i]) === -1) {
                    // si la resource n'est pas référencée, on l'enlève
                    // resources.splice(i, 1);
                    logger.log("[ReverseGeocoding] options.resources : " + resources[i] + " is not a resource for reverse geocode");
                }
            }
        }
        // et le tableau des délimitations
        if (this.options.delimitations) {
            var delimitations = this.options.delimitations;
            // on vérifie que la liste des delimitations est bien un tableau
            if (!Array.isArray(delimitations)) {
                logger.log("[ReverseGeocoding] 'options.delimitations' parameter should be an array");
                delimitations = null;
            }
            var delimitationsList = ["Circle", "Point", "Extent"];
            for (i = 0; i < delimitations.length; i++) {
                if (delimitationsList.indexOf(delimitations[i]) === -1) {
                    // si la delimitations n'est pas référencée, on l'enlève
                    // resources.splice(i, 1);
                    logger.log("[ReverseGeocoding] options.delimitations : " + delimitations[i] + " is not a delimitation for reverse geocode");
                }
            }
        }
    },

    /**
     * this method is called by this.initialize() and initialize geocoding type (=resource)
     * ("StreetAddress", "PositionOfInterest", "CadastralParcel")
     *
     * @private
     */
    _initGeocodingType : function () {
        // Type de géocodage selectionné
        this._currentGeocodingType = "StreetAddress"; // par defaut

        // par defaut
        var resources = this.options.resources;
        if (!resources || resources.length === 0) {
            this.options.resources = ["StreetAddress", "PositionOfInterest", "CadastralParcel"];
        }

        // options utilisateur
        if (Array.isArray(resources) && resources.length) {
            // vérification des droits
            var noRightsIndexes = [];
            for (var i = 0; i < resources.length; i++) {
                if (this._servicesRightManagement["Geocode"].indexOf(resources[i]) < 0) {
                    // si on n'a pas les droits sur la ressource, on va la supprimer : on stocke son index
                    noRightsIndexes.push(i);
                    logger.log("[ReverseGeocode] no rights for options.resources : " + resources[i]);
                }
            }
            // on retire les ressoures non autorisées qu'on a pu rencontrer
            if (noRightsIndexes.length !== 0) {
                for (var j = 0; j < noRightsIndexes.length; j++) {
                    resources.splice(noRightsIndexes[j], 1);
                }
            }

            // récupération du type par défaut
            if (resources[0] === "StreetAddress" || resources[0] === "PositionOfInterest" || resources[0] === "CadastralParcel") {
                this._currentGeocodingType = resources[0];
            }
        }

        // si l'utilisateur a spécifié au moins une ressource dans le service, on surcharge les options du widget
        var serviceOptions = this.options.reverseGeocodeOptions;
        if (serviceOptions.filterOptions && Array.isArray(serviceOptions.filterOptions.type) && serviceOptions.filterOptions.type.length !== 0) {
            this._currentGeocodingType = serviceOptions.filterOptions.type[0];
        }
    },

    /**
     * this method is called by this.initialize() and initialize geocoding delimitation
     * ("Point", "Circle", "Extent")
     *
     * @private
     */
    _initGeocodingDelimitation : function () {
        // Type de délimitation selectionné
        this._currentGeocodingDelimitation = "Point"; // par defaut

        // par defaut
        var delimitations = this.options.delimitations;
        if (!delimitations || delimitations.length === 0) {
            this.options.delimitations = ["Point", "Circle", "Extent"];
        }

        // options utilisateur
        if (Array.isArray(delimitations) && delimitations.length) {
            var d = delimitations[0].toLowerCase();
            if (d === "point" || d === "circle" || d === "extent") {
                this._currentGeocodingDelimitation = delimitations[0];
            }
        }
    },

    // ################################################################### //
    // ######################## methods handle dom ####################### //
    // ################################################################### //

    /**
     * this method is called by this.onAdd(map)
     * and initialize the container HTMLElement
     *
     * @returns {DOMElement} DOM element
     *
     * @private
     */
    _initLayout : function () {
        // create main container
        var container = this._createMainContainerElement();

        // create show ReverseGeocoding element
        var inputShow = this._showReverseGeocodingContainer = this._createShowReverseGeocodingElement();
        container.appendChild(inputShow);

        // mode "collapsed"
        if (!this.options.collapsed) {
            inputShow.checked = true;
        }

        // create ReverseGeocoding picto
        var picto = this._createShowReverseGeocodingPictoElement();
        container.appendChild(picto);

        // panel
        var reverseGeocodingPanel = this._createReverseGeocodingPanelElement();

        // header
        var panelHeader = this._panelHeaderContainer = this._createReverseGeocodingPanelHeaderElement();
        // return picto (hidden at start)
        var returnPicto = this._returnPictoContainer = this._createReverseGeocodingPanelReturnPictoElement();
        panelHeader.appendChild(returnPicto);
        // pane title
        var panelTitle = this._panelTitleContainer = this._createReverseGeocodingPanelTitleElement();
        panelHeader.appendChild(panelTitle);
        // close picto
        var closeDiv = this._createReverseGeocodingPanelCloseElement();
        panelHeader.appendChild(closeDiv);
        reverseGeocodingPanel.appendChild(panelHeader);

        // form
        var reverseGeocodingForm = this._formContainer = this._createReverseGeocodingPanelFormElement();
        // choices element
        reverseGeocodingForm.appendChild(this._createReverseGeocodingFormModeChoiceGeocodingTypeElement(this.options.resources));
        reverseGeocodingForm.appendChild(this._createReverseGeocodingFormModeChoiceGeocodingDelimitationElement(this.options.delimitations));

        // submit (bouton "Chercher")
        var submit = this._createReverseGeocodingSubmitFormElement();
        reverseGeocodingForm.appendChild(submit);

        reverseGeocodingPanel.appendChild(reverseGeocodingForm);

        // waiting
        var waiting = this._waitingContainer = this._createReverseGeocodingWaitingElement();
        reverseGeocodingPanel.appendChild(waiting);

        // results (dans le panel)
        var resultsPanel = this._resultsContainer = this._createReverseGeocodingResultsPanelElement();
        var reverseGeocodingResultsList = this._resultsListContainer = this._createReverseGeocodingResultsListElement();
        resultsPanel.appendChild(reverseGeocodingResultsList);
        reverseGeocodingPanel.appendChild(resultsPanel);

        container.appendChild(reverseGeocodingPanel);

        logger.log(container);

        return container;
    },

    // ################################################################### //
    // ################### Map interactions management ################### //
    // ################################################################### //

    /**
     * this method is called by this.onAdd,
     * or by this.onShowReverseGeocodingClick,
     * and calls method corresponding to current delimitation, if widget is not collapsed.
     *
     * @param {Object} map - control map.
     * @private
     */
    _activateMapInteraction : function (map) {
        logger.info("_activateMapInteraction()");

        // Creation de la couche vectorielle sur laquelle on va dessiner
        if (this._inputFeaturesLayer === null) {
            this._inputFeaturesLayer = new L.FeatureGroup();
            map.addLayer(this._inputFeaturesLayer);

            var self = this;
            /* evenement sur la carte lors d'une saisie,
            on y ajoute le layer, et on y stocke les coordonnées */
            map.on("draw:created", function (e) {
                var layer = e.layer;
                var type = e.layerType;
                logger.trace("draw:created");

                // TODO
                // comment mettre en place un icone dynamiquement ?
                // if (type === "marker") {}

                self._setFeaturePosition(layer, type);

                self._currentIdLayer = L.Util.stamp(layer);
                self._setFeatureLayer(layer);
            });

            /* evenements */
            map.on("draw:drawstart", function () {
                logger.trace("draw:drawstart");
                self._removeFeatureLayer(self._lastIdLayer);
                self._lastIdLayer = self._currentIdLayer;
            });

            /* evenements */
            map.on("draw:drawstop", function () {
                logger.trace("draw:drawstop");
            });
        }

        // Création de l'interaction de dessin, selon le type de délimitation sélectionné
        var delimitation = this._currentGeocodingDelimitation.toLowerCase();

        switch (delimitation) {
            case "point":
                this._activatePointInteraction(map);
                break;
            case "circle":
                this._activateCircleInteraction(map);
                break;
            case "extent":
                this._activateBoxInteraction(map);
                break;
            default :
                break;
        }
    },

    /**
     * remove draw interaction from map (if exists)
     *
     * @param {Object} map - control map.
     * @private
     */
    _removeMapInteraction : function (map) {
        if (!map) {
            return;
        }

        if (this._inputFeaturesLayer !== null) {
            map.off("draw:created");
            map.off("draw:drawstart");
            map.off("draw:drawstop");
            map.removeLayer(this._inputFeaturesLayer);
            this._inputFeaturesLayer = null;
        }

        this._lastIdLayer = this._currentIdLayer = 0;

        // FIXME delete this._currentFeature ?
        if (this._currentFeature) {
            this._currentFeature.disable();
        }
    },

    /**
     * TODO this method is called by this._activateMapInteraction,
     * and creates map point drawing interaction.
     *
     * @param {Object} map - control map.
     * @private
     */
    _activatePointInteraction : function (map) {
        logger.info("_activatePointInteraction()");

        if (this._currentFeature) {
            this._currentFeature.disable();
        }

        // on modifie le tooltip du marker
        L.drawLocal.draw.handlers.marker.tooltip.start = "click map to place search point";

        // TODO styles des icones
        var markerOptions = {
            // icon : par defaut...
            repeatMode : true
        };

        this._currentFeature = new L.Draw.Marker(map, markerOptions);
        this._currentFeature.enable();
    },

    /**
     * TODO this method is called by this._activateMapInteraction,
     * and creates map circle drawing interaction.
     *
     * @param {Object} map - control map.
     * @private
     */
    _activateCircleInteraction : function (map) {
        logger.info("_activateCircleInteraction()");

        if (this._currentFeature) {
            this._currentFeature.disable();
        }

        var circleOptions = {
            repeatMode : true
        }; // TODO styles

        this._currentFeature = new L.Draw.Circle(map, circleOptions);
        this._currentFeature.enable();
    },

    /**
     * TODO this method is called by this._activateMapInteraction,
     * and creates map box drawing interaction.
     *
     * @param {Object} map - control map.
     * @private
     */
    _activateBoxInteraction : function (map) {
        logger.info("_activateBoxInteraction()");

        if (this._currentFeature) {
            this._currentFeature.disable();
        }

        var rectangleOptions = {
            repeatMode : true
        }; // TODO styles

        this._currentFeature = new L.Draw.Rectangle(map, rectangleOptions);
        this._currentFeature.enable();
    },

    /**
     * set current position of feature
     *
     * @param {Object} layer - layer
     * @param {String} type - type
     *
     * @private
     */
    _setFeaturePosition : function (layer, type) {
        // on transmet toujours des coordonnées au service en EPSG:4326
        var oLatLng = null;
        if (type === "marker") {
            oLatLng = layer.getLatLng();
            this._requestGeom = {
                type : "Point",
                coordinates : [oLatLng.lng, oLatLng.lat]
            };
        } else if (type === "circle") {
            oLatLng = layer.getLatLng();
            this._requestGeom = {
                type : "Circle",
                coordinates : [oLatLng.lng, oLatLng.lat],
                radius : layer.getRadius()
            };
        } else if (type === "rectangle") {
            oLatLng = layer.getBounds();
            this._requestGeom = {
                type : "Polygon",
                coordinates : [[
                    [oLatLng.getNorthWest().lng, oLatLng.getNorthWest().lat],
                    [oLatLng.getNorthEast().lng, oLatLng.getNorthEast().lat],
                    [oLatLng.getSouthEast().lng, oLatLng.getSouthEast().lat],
                    [oLatLng.getSouthWest().lng, oLatLng.getSouthWest().lat],
                    [oLatLng.getNorthWest().lng, oLatLng.getNorthWest().lat]
                ]]
            };
        } else {
            logger.warn("type geometric not defined !?");
        }

        logger.log(oLatLng);
    },

    /**
     * set current layer of feature
     *
     * @param {Object} layer - layer
     *
     * @private
     */
    _setFeatureLayer : function (layer) {
        if (!this._inputFeaturesLayer) {
            return;
        }
        this._inputFeaturesLayer.addLayer(layer);
    },

    /**
     * remove layer feature from group
     * @param {Integer} id - id
     *
     * @private
     */
    _removeFeatureLayer : function (id) {
        if (!this._inputFeaturesLayer) {
            return;
        }

        if (id === 0) {
            return;
        }

        if (!id) {
            this._inputFeaturesLayer.clearLayers();
        } else {
            this._inputFeaturesLayer.removeLayer(id);
        }
    },

    // ################################################################### //
    // ##################### Reverse Geocoding request ################### //
    // ################################################################### //

    /**
     * this methode is called by this.onReverseGeocodingSubmit method,
     * it generates and sends reverse geocode request, then displays results
     * @param {Object} settings - settings
     *
     * @private
     */
    _reverseGeocodingRequest : function (settings) {
        // retrait de l'interaction sur la map pendant l'attente (et l'affichage des résultats)
        var map = this._map;
        this._removeMapInteraction(map);

        // on construit les options pour la requête
        var options = {};
        // on surcharge avec les options utilisateur
        L.Util.extend(options, this.options.reverseGeocodeOptions);
        // la recherche et les callbacks
        L.Util.extend(options, settings);
        // options par defaut
        L.Util.extend(options, {
            apiKey : this.options.apiKey,
            // maximumResponses : 25, // on peut la surcharger !
            timeOut : 30000,
            protocol : "XHR"

        });

        // on récupère d'éventuels filtres
        if (this._requestGeom.type.toLowerCase() === "circle") {
            // FIXME : a confirmer !
            if (this._requestGeom.radius > 1000) {
                logger.log("INFO : initial circle radius (" + this._requestGeom.radius + ") limited to 1000m.");
                this._requestGeom.radius = 1000;
            }
            options.searchGeometry = this._requestGeom;
        } else if (this._requestGeom.type.toLowerCase() === "polygon") {
            options.searchGeometry = this._requestGeom;
        } else if (this._requestGeom.type.toLowerCase() === "point") {
            if (this._currentGeocodingType === "StreetAddress") {
                options.searchGeometry = {
                    type : "Circle",
                    radius : 50,
                    coordinates : this._requestGeom.coordinates
                };
                options.maximumResponses = 1;
            } else {
                options.searchGeometry = this._requestGeom;
            }
        }

        logger.log("reverseGeocode request options : ", options);

        // affichage d'une patience pendant l'attente
        this._displayWaitingContainer();

        // envoi de la requête
        Gp.Services.reverseGeocode(options);
    },

    // ################################################################### //
    // ############################# results list ######################## //
    // ################################################################### //

    /**
     * this method is called by this._reverseGeocodingRequest() (in case of reverse geocode success)
     * and display results : in both container list and map
     *
     * @param {Array} locations - array of geocoded locations (reverse geocode results)
     * @private
     */
    _displayGeocodedLocations : function (locations) {
        var map = this._map;

        // 1. on vide les résultats précédents
        this._clearLocations();
        this._clearLocationsFeature(map);

        this._reverseGeocodingLocations = locations;

        if (!locations || locations.length === 0) {
            this._clearInputRequest(); // FIXME pas sûr que se soit le bon endroit...
            return;
        }

        // 2. cache de la patience et du formulaire
        this._formContainer.className = "GPreverseGeocodingComponentHidden";
        this._hideWaitingContainer();

        // affichage de la div des résultats (et changement du titre)
        this._panelTitleContainer.innerHTML = "Résultats de la recherche";
        this._returnPictoContainer.className = "";
        this._resultsContainer.className = "GPpanel";

        // 3. ajout de la liste des résultats dans le container des resultats
        this._fillGeocodedLocationListContainer(locations);

        // 4. affichage des résultats sur la carte (+ zoom ?)
        this._displayGeocodedLocationsOnMap(locations);

        // on zoom sur l'emprise des markers
        map.fitBounds(this._inputResultsLayer.getBounds());
    },

    /**
     * this method is called by this._displayGeocodedLocations()
     * and fills the container with results list
     *
     * @param {Array} locations - array of geocoded locations (reverse geocode results)
     * @private
     */
    _fillGeocodedLocationListContainer : function (locations) {
        //  ajout de la liste des résultats dans le container des resultats
        for (var i = 0; i < locations.length; i++) {
            var location = locations[i];
            logger.log(location);
            // on récupère la description à afficher dans la liste
            var locationDescription = this._fillGeocodedLocationDescription(location);
            // on ajoute chaque résutat à la liste
            if (locationDescription.length !== 0) {
                this._createReverseGeocodingResultElement(locationDescription, i);
            }
        }
    },

    /**
     * this method is called by this._fillGeocodedLocationListContainer()
     * and fills location description (String), depending on matchType
     *
     * @param {Object} location - geocoded location (from reverse geocode results)
     * @returns {String} locationDescription - geocoded location description to be displayed
     * @private
     */
    _fillGeocodedLocationDescription : function (location) {
        if (!location || !location.placeAttributes) {
            return;
        }
        var attr = location.placeAttributes;

        var locationDescription = "";
        // on sélectionne les infos à afficher selon le type
        switch (location.type) {
            case "StreetAddress":
                if (attr.street) {
                    locationDescription += attr.number ? attr.number + " " : "";
                    locationDescription += attr.street + ", ";
                }
                locationDescription += attr.postalCode + " " + attr.city;
                break;

            case "PositionOfInterest":
                locationDescription += attr.toponyme;
                if (attr.postalCode.length === 1) {
                    locationDescription += ", " + attr.postalCode[0];
                }
                locationDescription += " (" + attr.type.join(",") + ")";
                break;

            case "CadastralParcel":
                locationDescription += attr.identifiant;
                locationDescription += attr.nomCommune ? " (" + attr.nomCommune + ")" : "";
                break;

            default:
                locationDescription += attr.municipality ? attr.municipality : "";
                break;
        };

        return locationDescription;
    },

    // ################################################################### //
    // ######################## map results (markers) #################### //
    // ################################################################### //

    /**
     * this method is called by this._displayGeocodedLocations()
     * and display locations in map (markers)
     *
     * @param {Object} locations - geocoded locations (reverse geocode result)
     * @private
     */
    _displayGeocodedLocationsOnMap : function (locations) {
        var map = this._map;
        var self = this;

        // function set style Highlight for results
        function _setHighLight (e) {
            var layer = e.target;

            layer.setIcon(new IconDefault("red"));

            var div = L.DomUtil.get("ReverseGeocodedLocation_" + layer.options.id + "-" + self._uid);
            L.DomUtil.addClass(div, "GPreverseGeocodedLocationHighlight");
            div.scrollIntoView(false);
        }

        // function reset style Highlight for results
        function _resetHighLight (e) {
            var layer = e.target;

            layer.setIcon(new IconDefault("green"));

            var div = L.DomUtil.get("ReverseGeocodedLocation_" + layer.options.id + "-" + self._uid);
            L.DomUtil.removeClass(div, "GPreverseGeocodedLocationHighlight");
        }

        // création de la couche où seront ajoutés les résultats
        this._inputResultsLayer = new L.FeatureGroup();
        map.addLayer(this._inputResultsLayer);

        // ajout de chaque résultat à la couche (marker)
        for (var i = 0; i < locations.length; i++) {
            var location = locations[i];

            if (!location) {
                continue;
            }

            var options = {
                id : i,
                icon : new IconDefault("green"),
                riseOnHover : true,
                draggable : false,
                clickable : true,
                zIndexOffset : 1000
            };

            var _marker = L.marker(L.latLng(location.position), options);

            // creation du contenu de la popup
            var popupContent = "<ul>";
            var attributes = location.placeAttributes;
            for (var attr in attributes) {
                if (attributes.hasOwnProperty(attr)) {
                    if (attr !== "trueGeometry" && attr !== "extraFields" && attr !== "houseNumberInfos" && attr !== "_count") {
                        popupContent += "<li>";
                        popupContent += "<span class=\"gp-attname-others-span\">" + attr.toUpperCase() + " : </span>";
                        popupContent += attributes[attr];
                        popupContent += " </li>";
                    }
                }
            }
            popupContent += " </ul>";

            _marker.bindPopup(popupContent);

            /** evenement mouseover sur le marker */
            _marker.on("mouseover", _setHighLight);

            /** evenement mouseout sur le marker */
            _marker.on("mouseout", _resetHighLight);

            this._inputResultsLayer.addLayer(_marker);
        }
    },

    // ################################################################### //
    // ####################### handlers events to dom #################### //
    // ################################################################### //

    /**
     * this method is called by event 'click' on 'GPshowReverseGeocodingPicto' tag label
     * (cf. ReverseGeocodingDOM._createShowReverseGeocodingPictoElement), and it cleans the component
     * when it's closed.
     *
     * @private
     */
    onShowReverseGeocodingClick : function () {
        var map = this._map;

        // interactions declenchées à l'ouverture/fermeture du panneau
        if (this._showReverseGeocodingContainer.checked) {
            this._removeMapInteraction(map);
        } else {
            if (!this._waiting && !this._reverseGeocodingLocations.length) {
                this._activateMapInteraction(map);
            }
        }
    },

    /**
     * this method is called by event 'change' on 'GPreverseGeocodingCode' tag select
     * (cf. ReverseGeocodingDOM._createReverseGeocodingFormModeChoiceGeocodingTypeElement).
     * this value is saved as a parameter for reverseGeocode service.
     *
     * @param {Object} e - HTMLElement
     * @private
     */
    onReverseGeocodingTypeChange : function (e) {
        var idx = e.target.selectedIndex;
        var value = e.target.options[idx].value;

        if (!value) {
            return;
        }
        logger.log(value);
        this._currentGeocodingType = value;
    },

    /**
     * this method is called by event 'change' on 'GPreverseGeocodingCode' tag select
     * (cf. ReverseGeocodingDOM._createReverseGeocodingFormModeChoiceGeocodingDelimitationElement).
     * this value is saved as a parameter for reverseGeocode service.
     *
     * @param {Object} e - HTMLElement
     * @private
     */
    onReverseGeocodingDelimitationChange : function (e) {
        var idx = e.target.selectedIndex;
        var value = e.target.options[idx].value;

        if (!value) {
            return;
        }

        logger.log(value);
        this._currentGeocodingDelimitation = value;

        // on supprime l'interaction précédente,
        // ainsi que les géométries et valeurs stockées (filtres, position)
        this._clearInputRequest();

        // on met à jour l'interaction de la map en fonction de la nouvelle délimitation
        var map = this._map;

        // on supprime l'éventuelle précédente interaction
        this._removeMapInteraction(map);
        // on crée une nouvelle interaction
        this._activateMapInteraction(map);
    },

    /**
     * TODO this method is called by event 'click' on 'GPreverseGeocodingReturnPicto' div
     * (cf. ReverseGeocodingDOM._createReverseGeocodingPanelReturnPictoElement),
     * and clear geocoded location (from both list container and map)
     *
     * @private
     */
    onGPreverseGeocodingReturnPictoClick : function () {
        var map = this._map;

        // suppression des résultats précédents
        this._clearLocations();
        this._clearLocationsFeature(map);

        // on efface les points qui ont pu être saisis précédemment
        this._clearInputRequest();

        // et on réactive l'interaction sur la map
        this._activateMapInteraction(map);
    },

    /**
     * TODO this methode is called by event 'submit' on reverseGeocoding form ('GPreverseGeocodingForm')
     * (cf. ReverseGeocodingDOM._createReverseGeocodingPanelFormElement),
     * it checks reverse geocode mandatory parameters,
     * then call this._reverseGeocodingRequest() to generate and send request
     *
     * @private
     */
    onReverseGeocodingSubmit : function () {
        // le paramètre position est obligatoire
        if (!this._requestGeom) {
            logger.log("missing search geometry");
            return;
        }

        // si on n'a trouvé aucun droit, on evite une requête inutile ...
        if (this._noRightManagement) {
            return;
        }

        var map = this._map;
        var self = this;
        this._reverseGeocodingRequest({
            index : self._currentGeocodingType,
            // callback onSuccess
            onSuccess : function (results) {
                logger.log(results);
                if (results) {
                    var locations = results.locations;
                    self._displayGeocodedLocations(locations);
                    self._hideWaitingContainer();

                    // et on réactive l'interaction sur la map
                    if (locations.length === 0) self._activateMapInteraction(map);
                }
            },
            // callback onFailure
            onFailure : function (error) {
                self._hideWaitingContainer();

                // suppression d'éventuels résultats précédents
                self._clearLocations();
                self._clearLocationsFeature(map);

                // on efface les points qui ont été saisis précédemment
                self._clearInputRequest();

                // et on réactive l'interaction sur la map
                self._activateMapInteraction(map);

                logger.log(error.message);
            }
        });
    },

    /**
     * TODO this method is called by event 'click' on 'ReverseGeocodedLocation_' div
     * (cf. ReverseGeocodingDOM._createReverseGeocodingResultElement),
     * and zoom to location ?
     * TODO
     *
     * @param {Object} e - HTMLElement
     * @private
     */
    onReverseGeocodingResultClick : function (e) {
        logger.log("onReverseGeocodingResultClick", e);
    },

    /**
     * TODO this method is called by event 'mouseover' on 'ReverseGeocodedLocation_' div
     * (cf. ReverseGeocodingDOM._createReverseGeocodingResultElement),
     * and changes style of matching marker on map (selected)
     *
     * @param {Object} e - HTMLElement
     * @private
     */
    onReverseGeocodingResultMouseOver : function (e) {
        // récupération de l'id du résultat survolé
        var idx = ID.index(e.target.id);

        // on passe le texte en gras
        if (e.target.classList) {
            e.target.classList.add("GPreverseGeocodedLocationHighlight");
        }

        if (!this._inputResultsLayer) {
            return;
        }

        this._inputResultsLayer.eachLayer(function (layer) {
            if (layer.options.id === parseInt(idx, 10)) {
                layer.fire("mouseover");
            }
        });
    },

    /**
     * TODO this method is called by event 'mouseout' on 'ReverseGeocodedLocation_' div
     * (cf. ReverseGeocodingDOM._createReverseGeocodingResultElement),
     * and changes style of matching marker on map (default)
     *
     * @param {Object} e - HTMLElement
     * @private
     */
    onReverseGeocodingResultMouseOut : function (e) {
        // récupération de l'id du résultat survolé
        var idx = ID.index(e.target.id);

        // on repasse le texte en style normal
        if (e.target.classList) {
            e.target.classList.remove("GPreverseGeocodedLocationHighlight");
        }

        if (!this._inputResultsLayer) {
            return;
        }

        this._inputResultsLayer.eachLayer(function (layer) {
            if (layer.options.id === parseInt(idx, 10)) {
                layer.fire("mouseout");
            }
        });
    },

    // ################################################################### //
    // ################################ clean ############################ //
    // ################################################################### //

    /**
     * TODO this method clears previous location results
     *
     * @private
     */
    _clearLocations : function () {
        this._reverseGeocodingLocations = [];
        // on vide le container avec la liste des résultats
        if (this._resultsListContainer) {
            while (this._resultsListContainer.firstChild) {
                this._resultsListContainer.removeChild(this._resultsListContainer.firstChild);
            }
        }
    },

    /**
     * TODO this method clears previous location results marker
     * @param {Object} map - the map
     *
     * @private
     */
    _clearLocationsFeature : function (map) {
        // suppression des anciens resultats
        if (this._inputResultsLayer !== null) {
            map.removeLayer(this._inputResultsLayer);
            this._inputResultsLayer = null;
        }
    },

    /**
     * TODO this method clears previous input features (features, position and filters)
     *
     * @private
     */
    _clearInputRequest : function () {
        // on supprime les valeurs stockées (filtres, position)
        this._requestPosition = null;
        this._requestCircleFilter = null;
        this._requestBboxFilter = null;
    },

    // ################################################################### //
    // ############################ Patience ############################# //
    // ################################################################### //

    /**
     * this method displays waiting container and sets a timeout
     *
     * @private
     */
    _displayWaitingContainer : function () {
        this._waitingContainer.className = "GPreverseGeocodingCalcWaitingContainerVisible";
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
    },

    /**
     * this method hides waiting container and clears timeout
     *
     * @private
     */
    _hideWaitingContainer : function () {
        if (this._waiting) {
            this._waitingContainer.className = "GPreverseGeocodingCalcWaitingContainerHidden";
            this._waiting = false;
            clearTimeout(this._timer);
            this._timer = null;
        }
    }

});

export default ReverseGeocoding;
