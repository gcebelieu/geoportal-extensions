import Gp from "geoportal-access-lib";
import L from "leaflet";
import Logger from "../../Common/Utils/LoggerByDefault";
import RightManagement from "../../Common/Utils/CheckRightManagement";
import ID from "../../Common/Utils/SelectorID";
import LocationSelectorDOM from "../../Common/Controls/LocationSelectorDOM";
import PositionFormater from "./Utils/PositionFormater";
import IconDefault from "./Utils/IconDefault";
import GeocodeUtils from "../../Common/Utils/GeocodeUtils";

var logger = Logger.getLogger("locationselector");

/**
* @classdesc
*
* LocationSelector Control.
*
* @private
* @constructor LocationSelector
* @alias LocationSelector
* @extends {L.Control}
* LocationSelector component. Enables to select a location, using autocompletion or picking location on the map
* @param {Object} [options] - component options
* @param {Boolean} [options.displayInfo = true] - whether to display info in a popup or not (not implemented yet) Default is true
* @param {Boolean} [options.disableReverse = false] - whether to enable/disable the reverse geocoding.
* @param {Object} [options.tag] - tag options
* @param {Number} [options.tag.id = 0] - order id number in a locations group, in case several LocationSelector are used. For instance in route case : departure tag id should be 0, arrival tag id should be 1, and other ones : 2, 3, ...
* @param {Number} [options.tag.unique = null] - locationSelector global component id (in case locationSelector is called by another graphic component, e.g. route control)
* @param {String} [options.tag.label = ">"] - text to display in component (e.g. "Departure"). Default is ">"
* @param {String} [options.tag.color = blue] - color of marker (blue, green, orange and red)
* @param {Boolean} [options.tag.display = true] - whether to display or hide component. Default is true
* @param {Boolean} [options.tag.addOption = false] - whether to display picto to add another LocationSelector (in case of route control)
* @param {Boolean} [options.tag.removeOption = false] - whether to display picto to remove a LocationSelector (in case of route control)
* @param {Object} [options.autocompleteOptions] - autocomplete service options
* @param {Object} [options.reverseGeocodeOptions] - reverse geocoding service options

* @example
*  var point = L.geoportalControl.LocationSelector({
*  });
*/
var LocationSelector = L.Control.extend(/** @lends LocationSelector.prototype */ {

    includes : LocationSelectorDOM,

    /**
     * options by default
     *
     * @private
     */
    options : {
        position : "topleft",
        tag : {
            id : 0, // numero d'ordre sur un groupe de locations !
            unique : null, // numero unique pour tous les locations d'un groupe !
            label : ">",
            color : "blue",
            display : true,
            addOption : false,
            removeOption : false
        },
        disableReverse : false, // on l'active par defaut !
        displayInfo : true,
        autocompleteOptions : {},
        reverseGeocodeOptions : {}
    },

    /**
     * constructor
     * (extend to L.Control)
     *
     * @param {Object} options - options of component
     * @param {String}  [options.position] - position of component into a map.
     * @param {Object}  [options.tag] - options ...
     * @param {Object}  [options.autocompleteOptions] - autocomplete service options
     * @param {Object}  [options.reverseGeocodeOptions] - reverse geocoding service options
     *
     * @private
     */
    initialize : function (options) {
        // FIXME pb de merge sur tag:{} !?
        // on transmet les options au controle
        L.Util.setOptions(this, options);

        /** uuid */
        this._uid = this.options.tag.unique || null;

        /** mode drag&drop */
        this._activeDragAndDrop = false;
        this._pressedKeyOnDragAndDrop = false;

        /** container map */
        this._map = null;

        /** container principal des entrées  */
        this._inputsContainer = null;

        /** container du label du point */
        this._inputLabelContainer = null;

        /** container de la saisi de l'autocompletion */
        this._inputAutoCompleteContainer = null;

        /** container du pointer de saisi sur la carte */
        this._inputShowPointerContainer = null;

        /** container des coordonnées */
        this._inputCoordinateContainer = null;

        /**
         * coordonnées du point selectionné
         * Ces dernieres sont envoyées à l'API service IGN,
         */
        this._coordinate = null;

        /** container des reponses de l'autocompletion */
        this._suggestedContainer = null;

        /** listes des reponses de l'autocompletion */
        this._suggestedLocations = [];

        /** localisant */
        this._currentLocation = null;

        /** marker */
        this._marker = null;

        /** ressources du services d'autocompletion et geocodage inverse (ayant droit!) */
        this._resources = {};

        /** a t on des droits sur les ressources du service ? */
        this._noRightManagement = false;

        // gestion des droits sur les ressources/services
        this._checkRightsManagement();

        // creation du DOM dans le constructeur uniquement si ce composant
        // est appelé par un autre composant graphique
        this._container = (this._uid) ? this._initLayout() : null;
    },

    // ################################################################### //
    // ################## handlers for display graphic ################### //
    // ################################################################### //

    /**
     * this method is called by this.addTo(map)
     * and fills variable : this._container = this.onAdd(map)
     *
     * @returns {DOMElement} DOM element
     * @private
     */
    onAdd : function (/* map */) {
        // si on ajout ce composant à la carte en tant que objet graphique,
        // un uuid doit être generé automatiquement !
        this._uid = ID.generate();

        // DOM du composant
        var container = this._initLayout();

        // deactivate of events that may interfere with the map
        L.DomEvent
            .disableClickPropagation(container)
            .disableScrollPropagation(container);

        return container;
    },

    /**
     * this method is called when the control is removed from the map
     * and removes events on map.
     *
     * @private
     */
    onRemove : function (/* map */) {},

    // ################################################################### //
    // ########################## publics methods ######################## //
    // ################################################################### //

    /**
     * get coordinate
     * @returns {Object} Coordinate
     */
    getCoordinate : function () {
        return this._coordinate;
    },

    /**
     * set coordinate : {lon,lat || x,y || N,E}
     * @param {Object} coordinate - Coordinate
     */
    setCoordinate : function (coordinate) {
        this._displayResultOfCoordinate(coordinate);
    },

    /**
     * set map
     *
     * @param {Object} map - the map
     */
    setMap : function (map) {
        if (!this._map) {
            this._map = map;
        }
    },

    /**
     * clean
     */
    clear : function () {
        this._setCursor();
        this._setMarker();
        this._clearResults();
        this._inputLabelContainer.click();
    },

    /**
     * disable/enable the drag&drop mode
     *
     * @param {Boolean} active - true:enable | false:disable
     */
    dragging : function (active) {
        if (this._marker) {
            if (active) {
                this._marker.dragging.enable();
            } else {
                this._marker.dragging.disable();
            }
        }
    },

    // ################################################################### //
    // ########################## pivates methods ######################## //
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
        var id = this.options.tag.id;

        // create main container
        var container = this._createMainContainerElement();

        var inputs = this._inputsContainer = this._createLocationPointElement(id, this.options.tag.display);
        container.appendChild(inputs);

        var _inputLabel = this._inputLabelContainer = this._createLocationPointLabelElement(id, this.options.tag.label);
        inputs.appendChild(_inputLabel);
        var _inputAutoComplete = this._inputAutoCompleteContainer = this._createLocationAutoCompleteteInputElement(id);
        inputs.appendChild(_inputAutoComplete);
        var _inputCoordinate = this._inputCoordinateContainer = this._createLocationCoordinateInputElement(id);
        inputs.appendChild(_inputCoordinate);
        var _inputShowPointer = this._inputShowPointerContainer = this._createLocationPointerShowInputElement(id);
        inputs.appendChild(_inputShowPointer);
        var _inputPointer = this._createLocationPointerInputElement(id);
        inputs.appendChild(_inputPointer);

        if (this.options.tag.addOption) {
            var _inputAddStage = this._createLocationAddPointElement();
            inputs.appendChild(_inputAddStage);
        }

        if (this.options.tag.removeOption) {
            var _inputRemoveStage = this._createLocationRemovePointElement(id);
            inputs.appendChild(_inputRemoveStage);
        }

        var results = this._suggestedContainer = this._createLocationAutoCompleteResultElement(id);
        container.appendChild(results);

        return container;
    },

    /**
     * this method is called by constructor
     * and check the rights to resources and services
     *
     * @private
     */
    _checkRightsManagement : function () {
        var _resources = null;
        var _key = null;

        // les ressources du service du calcul inverse de geocodage
        _key = this.options.reverseGeocodeOptions.apiKey;
        _resources = (this.options.reverseGeocodeOptions.index) ? this.options.reverseGeocodeOptions.index : "";
        if (!_resources) {
            _resources = "StreetAddress";
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

        var rightManagementRerverse = RightManagement.check({
            key : _key || this.options.apiKey,
            resources : _resources,
            services : ["ReverseGeocode"]
        });

        // les ressources du service d'autocompletion
        _key = this.options.autocompleteOptions.apiKey;
        _resources = (this.options.autocompleteOptions) ? this.options.autocompleteOptions.type : [];
        // ou celles par défaut sinon.
        if (!_resources || _resources.length === 0) {
            _resources = [
                "StreetAddress",
                "PositionOfInterest"
            ];
        }

        var rightManagementAutoComplete = RightManagement.check({
            key : _key || this.options.apiKey,
            resources : _resources,
            services : ["AutoCompletion"]
        });

        // au cas où pas de droit !
        if (!rightManagementRerverse && !rightManagementAutoComplete) {
            this._noRightManagement = true;
        }

        // FIXME je reconstruis differement la structure pour la gestion des clefs differentes
        // pour chaque service...
        if (rightManagementAutoComplete) {
            this._resources["AutoCompletion"] = {};
            this._resources["AutoCompletion"]["resources"] = rightManagementAutoComplete["AutoCompletion"];
            this._resources["AutoCompletion"]["key"] = rightManagementAutoComplete["key"];
        }

        if (rightManagementRerverse) {
            this._resources["ReverseGeocode"] = {};
            this._resources["ReverseGeocode"]["resources"] = rightManagementRerverse["ReverseGeocode"];
            this._resources["ReverseGeocode"]["key"] = rightManagementRerverse["key"];
        }
    },

    // ################################################################### //
    // ################# privates methods use by events ################## //
    // ################################################################### //

    /**
     * this sends the label to the panel.
     *
     * @param {String} label - label suggested location
     *
     * @private
     */
    _setLabel : function (label) {
        this._inputAutoCompleteContainer.value = label || "";
    },

    /**
     * this sends the coordinates to the panel.
     *
     * @param {Object} oLatLng - geographic coordinate (L.LatLng)
     *
     * @private
     */
    _setCoordinate : function (oLatLng) {
        // structure
        // L.LatLng
        //     lat: 4.07249425916745
        //     lng: 2.4609375

        // FIXME les coordonnées en lat/lon sur du EPSG:4326 !
        // Mais règle sur les services : X -> LON et Y -> LAT
        this._coordinate = oLatLng;

        var lat = null;
        var lng = null;

        // decimal by default !
        lat = PositionFormater.roundToDecimal(oLatLng.lat, 4);
        lng = PositionFormater.roundToDecimal(oLatLng.lng, 4);

        // on envoie du lon/lat à l'affichage
        var value = lng + " , " + lat;
        this.GPdisplayCoordinate(value);
    },

    /**
     * this method is called by this.on*ResultsItemClick()
     * and move/zoom on a position.
     *
     * @param {Object} position - {lon: ..., lat: ...}
     *
     * @private
     */
    _setPosition : function (position) {
        logger.log("_setPosition()", position);

        var map = this._map;
        // TODO zoom
        // map.setZoomAround(L.latLng(position), map.getMaxZoom(), true);
        // FIXME on veut du lat/lon sur Leaflet donc on inverse !
        map.panTo(L.latLng(position));
    },

    /**
     * this method is called by this.on*ResultsItemClick()
     * and displays a marker.
     * FIXME : marker IGN et informations ?
     *
     * @param {Object} position - position {lon: ..., lat: ...}
     * @param {Object|String} information - suggested or geocoded information
     * @param {Boolean} display - display a popup information
     *
     * @private
     */
    _setMarker : function (position, information, display) {
        logger.log("_setMarker()", position, information, display);

        // sur du drag&drop, on garde le même marker !
        if (this._activeDragAndDrop) {
            return;
        }

        var map = this._map;
        // on supprime le marker, ainsi que les events
        // sur le drag&drop
        if (this._marker != null) {
            this._marker.off("mousedown", this.onMouseDownMarker, this);
            this._marker.off("dragstart", this.onStartDragMarker, this);
            this._marker.off("drag", this.onDragMarker, this);
            this._marker.off("dragend", this.onEndDragMarker, this);
            map.removeLayer(this._marker);
            this._marker = null;
        }

        if (position) {
            // cf. http://leafletjs.com/reference.html#marker-options
            var options = {
                icon : new IconDefault(this.options.tag.color),
                draggable : true,
                clickable : true,
                zIndexOffset : 1000
            };

            // FIXME on veut du lat/lon sur Leaflet donc on inverse !
            this._marker = L.marker(L.latLng(position), options);

            this._marker.on("mousedown", this.onMouseDownMarker, this);
            this._marker.on("dragstart", this.onStartDragMarker, this);
            this._marker.on("drag", this.onDragMarker, this);
            this._marker.on("dragend", this.onEndDragMarker, this);
            // this._marker.on("movestart", this.onStartMoveMarker, this);
            // this._marker.on("move",      this.onMoveMarker, this);
            // this._marker.on("moveend",   this.onEndMoveMarker, this);

            this._marker.addTo(map);

            // FIXME
            // doit on mettre une information
            // - correctement construite ?
            // - uniquement informatif ?
            // - RIEN ?
            if (display) {
                var popupContent = null;

                if (typeof information !== "string") {
                    if (information.service === "GeocodedLocation") {
                        popupContent = GeocodeUtils.getGeocodedLocationFreeform(information.location);
                    } else if (information.service === "SuggestedLocation") {
                        popupContent = GeocodeUtils.getSuggestedLocationFreeform(information.location);
                    } else {
                        popupContent = "sans informations.";
                    }
                } else {
                    popupContent = information;
                }

                this._marker.bindPopup(popupContent);
            }
        }
    },

    /**
     * this method is called by this.on()
     * and change the cursor of the map when entering a point.
     *
     * @param {String} cursor - cursor style
     *
     * @private
     */
    _setCursor : function (cursor) {
        var div = this._map.getContainer();

        if (cursor) {
            div.style.cursor = cursor;
        } else {
            div.style.cursor = null;
        }
    },

    /**
     * this method is called by this.()
     * and it clears all results and the marker.
     *
     * @private
     */
    _clearResults : function () {
        this._currentLocation = null;

        this._coordinate = null;

        this._clearSuggestedLocation();
    },

    /**
     * this method is called by this.onAutoCompleteSearchText()
     * and it clears all suggested location.
     *
     * @private
     */
    _clearSuggestedLocation : function () {
        // suppression du dom
        this._suggestedLocations = [];
        if (this._suggestedContainer) {
            while (this._suggestedContainer.firstChild) {
                this._suggestedContainer.removeChild(this._suggestedContainer.firstChild);
            }
        }
    },

    // ################################################################### //
    // ############## privates methods use by autocomplete ############### //
    // ################################################################### //

    /**
     * this method is called by this.onAutoCompleteSearch()
     * and executes a request to the service.
     *
     * @param {Object} settings - service settings
     * @param {String}   settings.text - text
     * @param {Function} settings.onSuccess - callback
     * @param {Function} settings.onFailure - callback
     *
     * @private
     */
    _requestAutoComplete : function (settings) {
        logger.log("_requestAutoComplete()", settings);

        // on ne fait pas de requête si on n'a pas renseigné de parametres !
        if (!settings || Object.keys(settings).length === 0) {
            return;
        }

        // on ne fait pas de requête si la parametre 'text' est vide !
        if (!settings.text) {
            return;
        }

        logger.log(settings);

        // on ne fait pas de requête si aucun droit !
        if (this._noRightManagement) {
            logger.log("no rights for all service !?");
            return;
        }

        // gestion des droits !
        if (!this._resources["AutoCompletion"]) {
            logger.log("no rights for this service !?");
            return;
        }

        var resources = this._resources["AutoCompletion"].resources;
        if (!resources || Object.keys(resources).length === 0) {
            return;
        }

        // gestion de la clef !
        var key = this._resources["AutoCompletion"]["key"];

        var options = {};
        // on recupere les options du service
        L.Util.extend(options, this.options.autocompleteOptions);
        // ainsi que la recherche et les callbacks
        L.Util.extend(options, settings);

        // cas où la clef API n'est pas renseignée dans les options du service,
        // on utilise celle de l'autoconf ou celle renseignée au niveau du controle
        L.Util.extend(options, {
            apiKey : options.apiKey || this.options.apiKey || key
        });

        logger.log(options);

        Gp.Services.autoComplete(options);
    },

    /**
     * this method is called by this.onAutoCompleteSearchText()
     * and fills the container of the location list.
     * it creates a HTML Element per location
     * (cf. this. ...)
     *
     * @param {Object[]} locations - locations
     *
     * @private
     */
    _fillAutoCompletedLocationListContainer : function (locations) {
        logger.log("_fillAutoCompletedLocationListContainer()", locations);

        if (!locations || locations.length === 0) {
            return;
        }

        // on vide la liste avant de la construire
        var element = this._suggestedContainer;
        if (element.childElementCount) {
            while (element.firstChild) {
                element.removeChild(element.firstChild);
            }
        }

        for (var i = 0; i < locations.length; i++) {
            // Proposals are dynamically filled in Javascript by autocomplete service
            this._createLocationAutoCompletedLocationElement(this.options.tag.id, locations[i], i);
        }

        // sauvegarde de l'etat des locations
        this._suggestedLocations = locations;
    },

    // ################################################################### //
    // ################# privates methods use by reverse ################# //
    // ################################################################### //

    /**
     * this method is called by this.onMouseMapClick() or this.onEndDragMarker()
     * and executes a request to the service.
     *
     * @param {Object} settings - service settings
     * @param {String}   settings.position - position
     * @param {Function} settings.onSuccess - callback
     * @param {Function} settings.onFailure - callback
     *
     * @private
     */
    _requestReverseGeocode : function (settings) {
        logger.log("_requestReverseGeocode()", settings);

        // on ne fait pas de requête si on n'a pas renseigné de parametres !
        if (!settings || Object.keys(settings).length === 0) {
            return;
        }

        // on ne fait pas de requête si la parametre 'position' est vide !
        if (!settings.searchGeometry || Object.keys(settings.searchGeometry).length === 0) {
            return;
        }

        // on ne fait pas de requête si aucun droit !
        if (this._noRightManagement) {
            logger.log("no rights for all service !?");
            return;
        }

        // gestion des droits !
        if (!this._resources["ReverseGeocode"]) {
            logger.log("no rights for this service !?");
            return;
        }

        var resources = this._resources["ReverseGeocode"].resources;
        if (!resources || Object.keys(resources).length === 0) {
            return;
        }

        // gestion de la clef !
        var key = this._resources["ReverseGeocode"]["key"];

        var options = {};
        // on recupere les options du service
        L.Util.extend(options, this.options.reverseGeocodeOptions);

        // ainsi que la positions et les callbacks
        L.Util.extend(options, settings);

        // on force qq options !
        // La table de geocodage est toujours par defaut : StreetAddress !
        L.Util.extend(options, {
            returnFreeForm : true, // FIXME cette option n'est pas implementée !?
            index : "StreetAddress"
        });

        // cas où la clef API n'est pas renseignée dans les options du service,
        // on utilise celle de l'autoconf ou celle renseignée au niveau du controle
        L.Util.extend(options, {
            apiKey : options.apiKey || this.options.apiKey || key
        });

        logger.log(options);

        Gp.Services.reverseGeocode(options);
    },

    /**
     * display Coordinate on panel, and places the marker on map
     *
     * @param {Object} oLatLng - geographic coordinate (L.LatLng)
     * @private
     */
    _displayResultOfCoordinate : function (oLatLng) {
        // on transmet les coordonnées au panneau
        this._setCoordinate(oLatLng);

        // on met en place le marker
        this._setMarker(oLatLng, null, false);

        logger.log(this.getCoordinate());

        // on desactive l'event sur la map en activant le gestionnaire !
        this.onActivateMapPointClick();
    },

    /**
     * display Label on panel, and places the marker on map
     *
     * @param {Object} oLocation - location Object
     * @private
     */
    _displayResultOfLabel : function (oLocation) {
        // FIXME Le service est intérrogé en SRS EPSG:4326 par defaut,
        // donc on récupère du lat/lon en reponse.
        // mais on inverse car on souhaite transmettre des coordonnées en lon/lat...

        // FIXME on construit une addresse car l'option freeForm ne semble pas
        // être fonctionnelle...
        var label = GeocodeUtils.getGeocodedLocationFreeform(oLocation);

        // on transmet les coordonnées au panneau,
        // même si on ne les affiche pas...
        this._setCoordinate({
            lat : oLocation.position.lat,
            lng : oLocation.position.lon
        });

        // on transmet le texte au panneau
        this._setLabel(label);

        var info = {
            service: "GeocodedLocation",
            location: oLocation,
        };

        // on met en place le marker
        this._setMarker(oLocation.position, info, true);

        this._inputShowPointerContainer.checked = false;
        this._inputAutoCompleteContainer.className = "GPlocationOriginVisible";
        this._inputCoordinateContainer.className = "GPlocationOriginHidden";

        // on desactive l'event sur la map en activant le gestionnaire !
        this.onActivateMapPointClick();
    },

    // ################################################################### //
    // ###################### handlers events (dom) ###################### //
    // ################################################################### //

    /**
     * this method is called by event 'keyup' on 'GPLocationOrigin' tag input
     * (cf. this.), and it gets the value of input.
     * this value is passed as a parameter for the service autocomplete (text).
     * the results of the request are displayed into a drop down menu.
     * FIXME
     *
     * @param {Object} e - HTMLElement
     *
     * @private
     */
    onAutoCompleteSearchText : function (e) {
        logger.log("onAutoCompleteSearchText()", e);

        var value = e.target.value;
        if (!value) {
            return;
        }

        // aucun droits !
        // on evite une requête...
        if (this._noRightManagement) {
            logger.log("no rights for this service !?");
            return;
        }

        // on sauvegarde le localisant
        this._currentLocation = value;

        // on limite les requêtes à partir de 3 car. saisie !
        if (value.length < 3) {
            return;
        }

        // INFORMATION
        // on effectue la requête au service d'autocompletion.
        // on met en place des callbacks afin de recuperer les resultats ou
        // les messages d'erreurs du service.
        // les resultats sont affichés dans une liste deroulante.
        var context = this;
        this._requestAutoComplete({
            text : value,
            maximumResponses : 5, // FIXME je limite le nombre de reponse car le container DOM est limité dans l'affichage !!!
            // callback onSuccess
            onSuccess : function (results) {
                logger.log(results);
                if (results) {
                    var locations = results.suggestedLocations;
                    context._fillAutoCompletedLocationListContainer(locations);
                }
            },
            // callback onFailure
            onFailure : function (error) {
                // FIXME
                // où affiche t on les messages : ex. 'No suggestion matching the search' ?
                // doit on nettoyer la liste des suggestions dernierement enregistrée :
                context._clearSuggestedLocation();
                logger.log(error.message);
            }
        });
    },

    /**
     * this method is called by event 'click' on 'GPautoCompleteResultsList' tag div
     * (cf. this._createAutoCompleteListElement), and it selects the location.
     * this location displays a marker on the map.
     * FIXME
     * TODO
     *
     * @param {Object} e - HTMLElement
     *
     * @private
     */
    onAutoCompletedResultsItemClick : function (e) {
        logger.log("onAutoCompletedResultsItemClick()", e);

        var idx = ID.index(e.target.id);
        logger.log(idx);
        logger.log(this._suggestedLocations[idx]);

        if (!idx) {
            return;
        }

        var position = {
            lon : this._suggestedLocations[idx].position.x, // LON !
            lat : this._suggestedLocations[idx].position.y // LAT !
        };

        var info = {
            service : "SuggestedLocation",
            location : this._suggestedLocations[idx]
        };

        var label = GeocodeUtils.getSuggestedLocationFreeform(this._suggestedLocations[idx]);
        this._setLabel(label);
        this._setPosition(position);
        this._setMarker(position, info, this.options.displayInfo);

        // on sauvegarde le point courant
        this._coordinate = position;
    },

    /**
     * this method is called by event 'click' on '' tag input
     * (cf. this.), and it create or remove the event of click map.
     *
     * @param {Object} e - HTMLElement
     *
     * @private
     */
    onActivateMapPointClick : function (e) {
        logger.trace("onActivateMapPointClick()", e);

        var map = this._map;

        if (this._inputShowPointerContainer.checked) {
            if (!this._activeDragAndDrop) {
                map.on("click", this.onMouseMapClick, this);
                // on change le curseur
                this._setCursor("crosshair");
                // on supprime le marker
                this._setMarker();
                // on efface l'ancien resultat
                this._clearResults();
            }
        } else {
            if (!this._activeDragAndDrop) {
                map.off("click", this.onMouseMapClick, this);
                // on retablie le curseur d'origine
                this._setCursor();
            }
        }
    },

    /**
     * this method is called by event 'click' on '(n)' tag label
     * (cf. this.).
     * this point is erased.
     *
     * @param {Object} e - HTMLElement
     *
     * @private
     */
    onLocationClearPointClick : function (e) {
        logger.log("onLocationClearPointClick", e);
        this._setCursor();
        this._setMarker();
        this._clearResults();
        this._inputAutoCompleteContainer.focus();
    },

    /**
     * this method is called by event 'click' on '(n)' tag input
     * (cf. this.).
     * this point is deleted.
     *
     * @param {Object} e - HTMLElement
     *
     * @private
     */
    onLocationRemovePointClick : function (e) {
        logger.log("onLocationRemovePointClick", e);
        this._setCursor();
        this._setMarker();
        this._clearResults();
    },

    /**
     * TODO this method is called by event 'click' on '(n)' tag input
     * (cf. this.).
     * this point is added as a parameter for the service Location.
     *
     * @param {Object} e - HTMLElement
     *
     * @private
     */
    onLocationAddPointClick : function (e) {
        logger.log("onLocationAddPointClick", e);
    },

    // ################################################################### //
    // #################### handlers events (control) #################### //
    // ################################################################### //

    /**
     * this method is called by event 'click' on map
     * (cf. this.onLocationMapPointClick), and it gets the coordinate of click on map.
     * this point is saved as a parameter for the service Location.
     *
     * @param {Object} e - HTMLElement
     *
     * @private
     */
    onMouseMapClick : function (e) {
        logger.log("onMouseMapClick", e);

        // les coordonnées
        var oLatLng = e.latlng;

        // si le geocodage inverse est desactivé,
        // on transmet les coordonnées au panneau,
        // sinon, on transmet la reponse du service
        if (this.options.disableReverse || this._noRightManagement) {
            // on transmet les coordonnées au panneau, puis on place le marker
            this._displayResultOfCoordinate(oLatLng);
        } else {
            // contexte
            var self = this;

            // on realise une requête au service, si la reponse est vide ou
            // en échec, on transmet les coordonnées !
            this._requestReverseGeocode({
                searchGeometry : {
                    type : "Circle",
                    coordinates : [oLatLng.lng, oLatLng.lat],
                    radius : 50
                },
                maximumResponses : 1,
                // callback onSuccess
                onSuccess : function (results) {
                    logger.log(results);
                    if (results.locations.length !== 0) {
                        var oLocation = results.locations[0];
                        self._displayResultOfLabel(oLocation);
                    } else {
                        self._displayResultOfCoordinate(oLatLng);
                    }
                },
                // callback onFailure
                onFailure : function (error) {
                    logger.log(error.message);
                    self._displayResultOfCoordinate(oLatLng);
                }
            });
        }
    },

    /**
     * this method is called by event 'startdrag' on marker
     * and it initializes the drag&drop.
     *
     * @private
     */
    onStartDragMarker : function () {
        if (!this._marker) {
            return;
        }

        this._activeDragAndDrop = true;
        this._inputShowPointerContainer.checked = true;
        this._inputAutoCompleteContainer.className = "GPlocationOriginHidden";
        this._inputCoordinateContainer.className = "GPlocationOriginVisible";
        this._marker.unbindPopup();
        this._setLabel();
        this._clearResults();
    },

    /**
     * this method is called by event 'drag' on marker
     * and it updates the panel of coordinate.
     *
     * @private
     */
    onDragMarker : function () {
        if (!this._marker) {
            return;
        }

        this._activeDragAndDrop = false;
        this._inputShowPointerContainer.checked = true;

        // on transmet les coordonnées au panneau
        var oLatLng = this._marker.getLatLng();
        this._setCoordinate(oLatLng);
    },

    /**
     * this method is called by event 'enddrag' on marker
     * and it finishes the drag&drop.
     * this point is saved as a parameter for the service Location.
     *
     * @private
     */
    onEndDragMarker : function () {
        if (!this._marker) {
            return;
        }

        this._inputShowPointerContainer.checked = true;

        var oLatLng = this._marker.getLatLng();

        if (this._pressedKeyOnDragAndDrop) {
            // on transmet les coordonnées au panneau
            this._setCoordinate(oLatLng);
        } else {
            logger.log("No key pressed, so autocomplete solution !");
            this.onMouseMapClick({
                latlng : oLatLng
            });
        }

        // init
        this._activeDragAndDrop = false;
        this._pressedKeyOnDragAndDrop = false;
    },

    /**
     * this method is called by event 'mousedown' on marker..
     * this event gets the pressed key code.
     *
     * @param {Object} e - HTMLElement
     *
     * @private
     */
    onMouseDownMarker : function (e) {
        if (!this._marker) {
            return;
        }

        this._pressedKeyOnDragAndDrop = e.originalEvent.ctrlKey;
    }

});

export default LocationSelector;
