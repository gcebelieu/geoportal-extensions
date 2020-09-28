import Gp from "geoportal-access-lib";
import L from "leaflet";
import Logger from "../../Common/Utils/LoggerByDefault";
import RightManagement from "../../Common/Utils/CheckRightManagement";
import ID from "../../Common/Utils/SelectorID";
import LocationSelector from "./LocationSelector";
import RouteDOM from "../../Common/Controls/RouteDOM";

var logger = Logger.getLogger("route(plus)");

/**
 * @classdesc
 *
 * Leaflet Control Class to compute and display route between start and end points using routing service of the geoportal platform.
 *
 * Use {@link module:Controls.Route L.geoportalControl.Route()} factory to create instances of that class.
 *
 * **Extends** Leaflet <a href="http://leafletjs.com/reference.html#control" target="_blank">L.Control</a> native class.
 *
 * @namespace
 * @alias L.geoportalControl.Route
 */
var Route = L.Control.extend(/** @lends L.geoportalControl.Route.prototype */ {

    includes : RouteDOM,

    /**
     * Options du service
     *
     * @private
     */
    options : {
        position : "topleft",
        collapsed : true, // plier !
        graphs : ["Voiture", "Pieton"],
        exclusions : {
            toll : false,
            tunnel : false,
            bridge : false
        },
        disableReverse : false,
        routeOptions : {}, // FIXME a t on besoin des options de ce service ?
        autocompleteOptions : {}
    },

    /**
     * @constructor Route
     * @private
     * @param {Object} options - options for function call.
     * @param {Sting}   [options.apiKey] - API key, mandatory if autoconf service has not been charged in advance
     * @param {Boolean} [options.ssl = true] - use of ssl or not (default true, service requested using https protocol)
     * @param {String}  [options.position] - position of component into the map, 'topleft' by default
     * @param {Boolean} [options.collapsed] - collapse mode, false by default
     * @param {Object}  [options.exclusions] - list of exclusions with status
     * @param {Array}   [options.graphs] - list of resources, by default : ["Voiture", "Pieton"], and the first element is selected
     * @param {Boolean} [options.disableReverse = false] - whether to enable/disable the reverse geocoding
     * @param {Object}  [options.autocompleteOptions] - options of autocomplete service
     * @param {Object}  [options.routeOptions] - options of route service
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
    initialize : function (options) {
        // on transmet les options au controle
        L.Util.setOptions(this, options);

        /** uuid */
        this._uid = ID.generate();

        // initialisation
        this._initTransport();
        this._initExclusions();
        this._initComputation();

        /** container principaux */
        this._showRouteContainer = null;
        this._pictoRouteContainer = null;
        this._waitingContainer = null;
        this._formRouteContainer = null;
        this._resultsRouteContainer = null;

        /** detection du support : desktop ou tactile */
        this._isDesktop = this._detectSupport();

        /** liste de points selectionnée */
        this._currentPoints = [];

        /** Mode de transport selectionné : 'Voiture' ou 'Pieton' */
        this._currentTransport = null;

        /** Mode de calcul selectionné : 'Plus rapide' ou 'plus court' */
        this._currentComputation = null;

        /** Exclusions selectionnées : Tunnel, Toll et Bridge */
        this._currentExclusions = [];

        /** la geometrie du parcours */
        this._geojsonRoute = null;

        /** la geometrie des troncons */
        this._geojsonSections = null;

        /** si un calcul est en cours ou non */
        this._waiting = false;
        /** timer pour cacher la patience après un certain temps */
        this._timer = null;

        /**
         * reponse du service
         * Ex. {
         *   totalTime, totalDistance, bbox, routeGeometry,
         *   routeInstructions : [{duration, distance, code, instruction, bbox, geometry}]
         * }
         */
        this._currentRouteInformations = null;

        /**
         * liste des ressources avec droits par service
         * Ex. {
         *   "Route" : {
         *       key : "ger4g456re45er456t4er5ge5",
         *       resources : ["Pieton", "Voiture"]
         *   }
         * }
         */
        this._resources = {};

        /** aucun droits sur les ressources */
        this._noRightManagement = false;

        // gestion des droits sur les ressources/services
        this._checkRightsManagement();
    },

    /**
     * this method is called by this.addTo(map) when the control is added on the map
     * and fills variable 'this._container = this.onAdd(map)',
     * and create or disable events on map.
     *
     * @param {Object} map - the map
     *
     * @returns {DOMElement} DOM element
     *
     * @private
     */
    onAdd : function (map) {
        // initialisation du DOM du composant
        var container = this._container = this._initLayout(map);

        // deactivate of events that may interfere with the map
        L.DomEvent
            .disableClickPropagation(container)
            .disableScrollPropagation(container);

        return container;
    },

    /**
     * TODO this method is called when the control is removed from the map
     * and removes events on map.
     *
     * @private
     */
    onRemove : function (/* map */) {},

    // ################################################################### //
    // ####################### init application ########################## //
    // ################################################################### //

    /**
     * this method is called by the constructor and initialize the ...
     *
     * @private
     */
    _initTransport : function () {
        // Mode de transport selectionné
        this._currentTransport = "Voiture"; // par defaut

        // par defaut
        var transport = this.options.graphs;
        if (!transport || transport.length === 0) {
            this.options.graphs = ["Voiture", "Pieton"];
        }

        // option
        if (L.Util.isArray(transport) && transport.length) {
            // FIXME pb si le 1er graphe n'est pas une ressource connue !
            if (transport[0] === "Voiture" || transport[0] === "Pieton") {
                this._currentTransport = transport[0];
            }
        }

        // TODO option sur le service
        var serviceOptions = this.options.routeOptions;
        if (serviceOptions.graph) {
            this._currentTransport = serviceOptions.graph;
        }
    },

    /**
     * this method is called by the constructor and initialize the ...
     *
     * @private
     */
    _initComputation : function () {
        // Mode de calcul selectionné
        this._currentComputation = "fastest"; // par defaut

        // TODO option sur le service
        var serviceOptions = this.options.routeOptions;
        if (serviceOptions.routePreference) {
            this._currentComputation = serviceOptions.routePreference;
        }
    },

    /**
     * this method is called by the constructor and initialize the ...
     *
     * @private
     */
    _initExclusions : function () {
        // Exclusions selectionnées : Tunnel, Toll et Bridge
        this._currentExclusions = []; // par defaut

        // par defaut
        var exclusion = this.options.exclusions;
        if (!exclusion || Object.keys(exclusion).length === 0) {
            this.options.exclusions = {
                toll : false,
                tunnel : false,
                bridge : false
            };
        }

        // option
        if (exclusion && Object.keys(exclusion).length) {
            for (var k in exclusion) {
                if (exclusion.hasOwnProperty(k)) {
                    if (exclusion.k) {
                        this._currentExclusions.push(k);
                    }
                }
            }
        }

        // TODO option sur le service
        var serviceOptions = this.options.routeOptions;
        if (L.Util.isArray(serviceOptions.exclusions)) {
            this._currentExclusions = serviceOptions.exclusions;
        }
    },

    // ################################################################### //
    // ############################## other init ######################### //
    // ################################################################### //

    /**
     * this method is called by constructor
     * and check the rights to resources
     * FIXME à revoir...
     *
     * @private
     */
    _checkRightsManagement : function () {
        var _opts = null;
        var _res = [];
        var _key = null;

        // les ressources du service du calcul d'Itineraire
        _key = this.options.routeOptions.apiKey;
        _opts = this.options.routeOptions.filterOptions;
        _res = (_opts) ? _opts.type : [];
        if (!_res || _res.length === 0) {
            _res = ["Voiture", "Pieton"];
        }

        var rightManagementRoute = RightManagement.check({
            key : _key || this.options.apiKey,
            resources : _res,
            services : ["Itineraire"]
        });

        // les ressources du service d'autocompletion
        _key = this.options.autocompleteOptions.apiKey;
        _opts = this.options.autocompleteOptions.filterOptions;
        _res = (_opts) ? _opts.type : [];
        if (!_res || _res.length === 0) {
            _res = [
                "StreetAddress",
                "PositionOfInterest"
                // "CadastralParcel"
            ];
        }

        var rightManagementAutoComplete = RightManagement.check({
            key : _key || this.options.apiKey,
            resources : _res,
            services : ["AutoCompletion"]
        });

        // au cas où pas de droit !
        if (!rightManagementRoute && !rightManagementAutoComplete) {
            this._noRightManagement = true;
        }

        // FIXME je reconstruis differement la structure pour la gestion des clefs differentes
        // pour chaque service...
        if (rightManagementAutoComplete) {
            this._resources["AutoCompletion"] = {};
            this._resources["AutoCompletion"]["resources"] = rightManagementAutoComplete["AutoCompletion"];
            this._resources["AutoCompletion"]["key"] = rightManagementAutoComplete["key"];
        }

        if (rightManagementRoute) {
            this._resources["Itineraire"] = {};
            this._resources["Itineraire"]["resources"] = rightManagementRoute["Itineraire"];
            this._resources["Itineraire"]["key"] = rightManagementRoute["key"];
        }
    },

    /**
     * TODO this method is called by the constructor.
     * this information is useful to switch to touch mode.
     * Detection : test for desktop or tactile
     *
     * @returns {Boolean} is desktop
     *
     * @private
     */
    _detectSupport : function () {
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
    },

    // ################################################################### //
    // ########################### init dom ############################## //
    // ################################################################### //

    /**
     * this method is called by this.onAdd(map)
     * and initialize the container HTMLElement
     *
     * @param {Object} map - the map
     *
     * @returns {DOMElement} DOM element
     *
     * @private
     */
    _initLayout : function (map) {
        // create main container
        var container = this._createMainContainerElement();

        var inputShow = this._showRouteContainer = this._createShowRouteElement();
        container.appendChild(inputShow);

        // mode "collapsed"
        if (!this.options.collapsed) {
            inputShow.checked = true;
        }

        var picto = this._pictoRouteContainer = this._createShowRoutePictoElement();
        container.appendChild(picto);

        var routePanel = this._createRoutePanelElement();

        // header form
        var routeHeader = this._createRoutePanelHeaderElement();
        routePanel.appendChild(routeHeader);

        // form
        var routeForm = this._formRouteContainer = this._createRoutePanelFormElement();

        // form: menu des points
        var points = this._createRoutePanelFormPointsElement(map);
        for (var i = 0; i < points.length; i++) {
            routeForm.appendChild(points[i]);
        }

        // form: menu des modes
        var choice = this._createRoutePanelFormModeChoiceElement();
        choice.appendChild(this._createRoutePanelFormModeChoiceTransportElement(this.options.graphs));
        choice.appendChild(this._createRoutePanelFormModeChoiceComputeElement());
        routeForm.appendChild(choice);

        // form: menu des exclusions
        routeForm.appendChild(this._createShowRouteExclusionsElement());
        routeForm.appendChild(this._createShowRouteExclusionsPictoElement());
        var exclusion = this._createRoutePanelFormExclusionsElement();
        exclusion.appendChild(this._createRoutePanelFormExclusionOptionsElement(this.options.exclusions));
        routeForm.appendChild(exclusion);

        // form: bouton du calcul
        var submit = this._createRouteSubmitFormElement();
        routeForm.appendChild(submit);

        routePanel.appendChild(routeForm);

        // results
        var routeResults = this._resultsRouteContainer = this._createRoutePanelResultsElement();
        routePanel.appendChild(routeResults);

        // waiting
        var waiting = this._waitingContainer = this._createRouteWaitingElement();
        routePanel.appendChild(waiting);

        container.appendChild(routePanel);

        return container;
    },

    // ################################################################### //
    // ############################## DOM ################################ //
    // ################################################################### //

    /**
     * Create List Points
     * FIXME OVERWRITTEN RouteDOM._createRoutePanelFormPointsElement() !
     *
     * @param {Object} map - the map
     *
     * @returns {Array} List DOM element
     *
     * @private
     */
    _createRoutePanelFormPointsElement : function (map) {
        var points = [];

        var count = 1;
        // point de depart
        var start = new LocationSelector({
            apiKey : this.options.apiKey || null,
            tag : {
                id : count,
                unique : this._uid,
                label : "Départ",
                color : "blue",
                display : true
            },
            disableReverse : this.options.disableReverse,
            autocompleteOptions : this.options.autocompleteOptions || null
        });
        start.setMap(map);

        var opts = this.options.routeOptions;

        if (opts.startPoint) {
            start._inputAutoCompleteContainer.value = opts.startPoint.x + " , " + opts.startPoint.y;
            start.setCoordinate({
                lng : opts.startPoint.x,
                lat : opts.startPoint.y
            });
        }

        points.push(start.getContainer());
        this._currentPoints.push(start);
        // points intermediaires
        for (count = 2; count < 7; count++) {
            var step = new LocationSelector({
                apiKey : this.options.apiKey || null,
                tag : {
                    id : count,
                    unique : this._uid,
                    label : "Etape",
                    color : "green",
                    display : false,
                    removeOption : true
                },
                disableReverse : this.options.disableReverse,
                autocompleteOptions : this.options.autocompleteOptions || null
            });
            step.setMap(map);
            points.push(step.getContainer());
            this._currentPoints.push(step);
        }
        // point d'arrivé
        var end = new LocationSelector({
            apiKey : this.options.apiKey || null,
            tag : {
                id : count,
                unique : this._uid,
                label : "Arrivée",
                color : "red",
                display : true,
                addOption : true,
                removeOption : false
            },
            disableReverse : this.options.disableReverse,
            autocompleteOptions : this.options.autocompleteOptions || null
        });
        end.setMap(map);

        if (opts.endPoint) {
            end._inputAutoCompleteContainer.value = opts.endPoint.x + " , " + opts.endPoint.y;
            end.setCoordinate({
                lng : opts.endPoint.x,
                lat : opts.endPoint.y
            });
        }

        points.push(end.getContainer());
        this._currentPoints.push(end);

        return points;
    },

    // ################################################################### //
    // ####################### handlers events to dom #################### //
    // ################################################################### //

    /**
     * this method is called by event 'click' on ''
     * tag label (cf. this._createShowRoutePictoElement),
     * and it cleans all value of input.
     *
     * @param {Object} e - HTMLElement
     *
     * @private
     */
    onShowRoutePanelClick : function (e) {
        logger.log("onShowRoutePanelClick", e);
        // clean !
        if (!this._geojsonSections) {
            this._clear();
        }
    },

    /**
     * this method is called by event 'change' on '' tag select
     * (cf. this.).
     * this value is saved as a parameter for the service route.
     *
     * @param {Object} e - HTMLElement
     *
     * @private
     */
    onRouteModeComputationChange : function (e) {
        logger.log("onRouteModeComputationChange", e);
        var idx = e.target.selectedIndex;
        var value = e.target.options[idx].value;

        if (!value) {
            return;
        }

        logger.log(value);
        this._currentComputation = value;
    },

    /**
     * this method is called by event 'change' on '' tag select
     * (cf. this.).
     * this value is saved as a parameter for the service route,
     * and this launches the route request !
     *
     * @param {Object} e - HTMLElement
     *
     * @private
     */
    onRouteModeComputationChangeAndRun : function (e) {
        logger.log("onRouteModeComputationChangeAndRun", e);

        // event choice computation
        this.onRouteModeComputationChange(e);

        // clean avant un nouveau calcul !
        this._clearRouteResultsDetails();
        this._clearRouteResultsGeometry();
        this._clearRouteResultsFeatureGeometry();

        // submit request
        this.onRouteComputationSubmit({
            computation : this._currentComputation,
            transport : this._currentTransport,
            exclusions : this._currentExclusions
        });
    },

    /**
     * this method is called by event 'change' on '' tag input
     * (cf. this.).
     * this value is saved as a parameter for the service route.
     *
     * @param {Object} e - HTMLElement
     *
     * @private
     */
    onRouteModeTransportChange : function (e) {
        logger.log("onRouteModeTransportChange", e);
        var value = e.target.value;

        if (!value) {
            return;
        }

        logger.log(value);
        this._currentTransport = value;
    },

    /**
     * this method is called by event 'click' on '' tag input
     * (cf. this.), and it displays the panel options of exclusions.
     * Not use !
     *
     * @param {Object} e - HTMLElement
     *
     * @private
     */
    onShowRouteExclusionsClick : function (e) {
        logger.log("onShowRouteExclusionsClick", e);
        // not use !
    },

    /**
     * this method is called by event 'change' on '' tag input
     * (cf. this.).
     * this value is saved as a parameter for the service route.
     * Not use !
     *
     * @param {Object} e - HTMLElement
     *
     * @private
     */
    onRouteExclusionsChange : function (e) {
        logger.log("onRouteExclusionsChange", e);
        var value = e.target.value;
        var checked = e.target.checked;

        if (!value) {
            return;
        }

        logger.log(value, checked);
        var bFound = false;
        var iFound = null;
        for (var i = 0; i < this._currentExclusions.length; i++) {
            if (this._currentExclusions[i] === value) {
                iFound = i;
                bFound = true;
            }
        }
        // on l'ajoute si la valeur n'existe pas et est selectionnée
        if (!bFound && checked) {
            this._currentExclusions.push(value);
        }
        // on la retire si la valeur existe et est desselectionnée
        if (bFound && !checked) {
            this._currentExclusions[iFound] = null;
        }
    },

    /**
     * this method is called by event 'submit' on '' tag form
     * (cf. this.), and it displays the results.
     *
     * @param {Object} options - options
     *
     * @private
     */
    onRouteComputationSubmit : function (options) {
        logger.log("onRouteComputationSubmit", options);

        // FIXME on lance une requête en EPSG:4326, les coordonnées
        // doivent donc être du type cad en lat/lon.
        // hors, BUG du service du calcul d'itineraire car les
        // coordonnées envoyées doivent être en lon/lat avec une SRS en EPSG:4326 !?
        // sinon, ça plante...

        // Liste des points
        var points = this._currentPoints;

        // - point de depart
        var start = points[0].getCoordinate();
        points[0].dragging(false);
        logger.log("start", start);
        // - point d'arrivée
        var end = points[points.length - 1].getCoordinate();
        points[points.length - 1].dragging(false);
        logger.log("end", end);
        // - les étapes
        var step = [];
        for (var i = 1; i < points.length - 1; i++) {
            var coordinate = points[i].getCoordinate();
            points[i].dragging(false);
            if (coordinate) {
                logger.log("step", coordinate);
                step.push(coordinate);
            }
        }

        // oups, aucun droits !
        // on evite donc une requête inutile ...
        if (this._noRightManagement) {
            return;
        }

        // valeurs selectionnées
        this._currentTransport = options.transport;
        this._currentComputation = options.computation;
        this._currentExclusions = options.exclusions;

        // mise en place de la patience
        this._displayWaitingContainer();

        // on met en place l'affichage des resultats dans la fenetre de resultats.
        var context = this;
        this._requestRouting({
            startPoint : start,
            endPoint : end,
            viaPoints : step,
            graph : this._currentTransport,
            routePreference : this._currentComputation,
            exclusions : this._currentExclusions,
            geometryInInstructions : true, // surcharge obligatoire !
            distanceUnit : "m", // surcharge obligatoire !
            // callback onSuccess
            onSuccess : function (results) {
                logger.log(results);
                if (results) {
                    context._fillRouteResultsDetails(results);
                }
            },
            // callback onFailure
            onFailure : function (error) {
                // FIXME mise à jour du controle mais le service ne repond pas en 200 !?
                context._hideWaitingContainer();

                context._clearRouteResultsDetails();
                logger.log(error.message);
            }
        });
    },

    /**
     * this method is called by event 'click' on ''
     * tag label (cf. this.),
     * and it cleans the old route geometry.
     *
     * @param {Object} e - HTMLElement
     *
     * @private
     */
    onShowRouteResultsNewClick : function (e) {
        logger.log("onShowRouteResultsNewClick", e);

        // on reactive le drag&drop
        var points = this._currentPoints;
        for (var i = 0; i < points.length; i++) {
            points[i].dragging(true);
        }

        // clean avant un nouveau calcul !
        this._clearRouteResultsDetails();
        this._clearRouteResultsGeometry();
        this._clearRouteResultsFeatureGeometry();
    },

    /**
     * this method is called by event 'mouseover' on ''
     * tag label (cf. this.),
     * and it makes a style on feature route.
     *
     * @param {Object} e - HTMLElement
     *
     * @private
     */
    onRouteResultsDetailsMouseOver : function (e) {
        logger.log("onRouteResultsDetailsMouseOver", e);

        var idx = ID.index(e.target.id);

        // valable uniquement pour le mode desktop !
        if (!this._isDesktop) {
            return;
        }

        if (!this._geojsonSections) {
            return;
        }

        this._geojsonSections.eachLayer(function (layer) {
            if (layer.feature.id === parseInt(idx, 10)) {
                layer.setStyle({
                    weight : 10,
                    color : "#0F9DE8",
                    opacity : 0.5
                });
            }
        });
    },

    /**
     * this method is called by event 'mouseout' on ''
     * tag label (cf. this.),
     * and it deletes a style on feature route.
     *
     * @param {Object} e - HTMLElement
     *
     * @private
     */
    onRouteResultsDetailsMouseOut : function (e) {
        logger.log("onRouteResultsDetailsMouseOut", e);

        var idx = ID.index(e.target.id);

        // valable uniquement pour le mode desktop !
        if (!this._isDesktop) {
            return;
        }

        if (!this._geojsonSections) {
            return;
        }

        this._geojsonSections.eachLayer(function (layer) {
            if (layer.feature.id === parseInt(idx, 10)) {
                layer.setStyle({
                    color : "#ED7F10",
                    weight : 5,
                    opacity : 0.75
                });
            }
        });
    },

    /**
     * this method is called by event 'click' on ''
     * tag label (cf. this.),
     * and it deletes a style on feature route.
     * Only for mobile !
     *
     * @param {Object} e - HTMLElement
     *
     * @private
     */
    onRouteResultsDetailsClick : function (e) {
        logger.log("onRouteResultsDetailsClick", e);

        var idx = ID.index(e.target.id);

        var self = this;

        // valable uniquement pour le mode mobile !
        if (this._isDesktop) {
            return;
        }

        if (!this._geojsonSections) {
            return;
        }

        // afficher le detail cumulé du parcours !
        var newInstruction = e.target.title;
        var oldInstruction = e.target.innerHTML;

        this._geojsonSections.eachLayer(function (layer) {
            if (layer.feature.id === parseInt(idx, 10)) {
                e.target.innerHTML = newInstruction;
                layer.setStyle({
                    weight : 10,
                    color : "#0F9DE8",
                    opacity : 0.5
                });
            }
        });

        clearTimeout(1000);
        setTimeout(function () {
            self._geojsonSections.eachLayer(function (layer) {
                if (layer.feature.id === parseInt(idx, 10)) {
                    e.target.innerHTML = oldInstruction;
                    layer.setStyle({
                        color : "#ED7F10",
                        weight : 5,
                        opacity : 0.75
                    });
                }
            });
        }, 1000);
    },

    // ################################################################### //
    // ########################### Routing ############################### //
    // ############## (methods to request and results) ################### //

    /**
     * this method is called by this.onRouteComputationSubmit()
     * and executes a request to the service.
     *
     * @param {Object} settings - service settings
     * @param {Function} settings.onSuccess - callback
     * @param {Function} settings.onFailure - callback
     *
     * @private
     */
    _requestRouting : function (settings) {
        // on ne fait pas de requête si on n'a pas renseigné de parametres !
        if (!settings || Object.keys(settings).length === 0) {
            return;
        }

        // on ne fait pas de requête si
        // - la parametre 'startPoint' est vide !
        if (!settings.startPoint) {
            return;
        }
        // - la parametre 'endPoint' est vide !
        if (!settings.endPoint) {
            return;
        }

        logger.log(settings);

        // on ne fait pas de requête si aucun droit !
        if (this._noRightManagement) {
            logger.log("no rights for all service !?");
            return;
        }

        // gestion des droits !
        if (!this._resources["Itineraire"]) {
            logger.log("no rights for this service !?");
            return;
        }

        var resources = this._resources["Itineraire"].resources;
        if (!resources || Object.keys(resources).length === 0) {
            return;
        }

        // gestion de la clef !
        var key = this._resources["Itineraire"]["key"];

        var options = {};
        // on recupere les options du service
        L.Util.extend(options, this.options.routeOptions);
        // ainsi que les parametres de saisie et les callbacks
        L.Util.extend(options, settings);

        // la ressource donne elle des droits ?
        var bFound = false;
        for (var i = 0; i < resources.length; i++) {
            if (resources[i] === options.graph) {
                bFound = true;
            }
        }

        // on fait quoi ?
        if (!bFound) {
            logger.log("no rights for this service !?");
            return;
        }

        // cas où la clef API n'est pas renseignée dans les options du service,
        // on utilise celle de l'autoconf ou celle renseignée au niveau du controle
        L.Util.extend(options, {
            apiKey : this.options.routeOptions.apiKey || this.options.apiKey || key
        });

        // si l'utilisateur a spécifié le paramètre ssl au niveau du control, on s'en sert
        // true par défaut (https)
        L.Util.extend(options, {
            ssl : this.options.ssl
        });

        logger.log(options);

        Gp.Services.route(options);
    },

    /**
     * this method is called by this.onRouteComputationSubmit()
     * and fills the container of the route instructions list, distance and time
     * information, aslo, constructs the geometry route.
     *
     * @param {Object} results - results of the route calculation
     *
     * @private
     */
    _fillRouteResultsDetails : function (results) {
        // FIXME
        // gestion des temps de traitement avec des callback !?

        // Distance et Durée
        var distance = results.totalDistance;
        var duration = results.totalTime;
        // Détails avec simplifications des troncons
        var instructions = this._simplifiedInstructions(results.routeInstructions);
        // var instructions = results.routeInstructions;

        if (instructions) {
            this._fillRouteResultsDetailsContainer(distance, duration, instructions);
        }

        // Geometries simplifiées
        var geometry = results.routeGeometry;
        if (geometry) {
            this._fillRouteResultsDetailsGeometry(geometry);
        }

        // existe t il une geometrie pour chaque troncon de route ?
        var bGeometryInstructions = (instructions[0].geometry.length !== 0);

        // Geometries des tronçon
        if (instructions && bGeometryInstructions) {
            this._fillRouteResultsDetailsFeatureGeometry(instructions);
        }

        // Emprise
        var bbox = results.bbox;
        if (bbox) {
            var map = this._map;
            var bounds = L.latLngBounds([bbox.bottom, bbox.left], [bbox.top, bbox.right]);
            map.fitBounds(bounds, {
                padding : [1, 1]
            });
        }

        // sauvegarde de l'etat des resultats
        this._currentRouteInformations = results;

        // mise à jour du controle !
        this._formRouteContainer.className = "GProuteComponentHidden";
        this._hideWaitingContainer();
        this._resultsRouteContainer.className = "";
    },

    /**
     * this method is called by this._fillRouteResultsDetails()
     * and fills the container of the route instructions list, distance and time
     * information.
     *
     * @param {Number} distance - distance
     * @param {Number} duration - duration
     * @param {Object[]} instructions - list of instructions
     *
     * @private
     */
    _fillRouteResultsDetailsContainer : function (distance, duration, instructions) {
        // FIXME callback

        // Distance et Durée
        this._resultsRouteValuesContainer = this._addRouteResultsValuesElement(distance, duration, this._convertSecondsToTime);

        // Détails
        this._resultsRouteDetailsContainer = this._addRouteResultsDetailsElement(instructions, this._convertSecondsToTime);
    },

    /**
     * this method is called by this._fillRouteResultsDetails()
     * and constructs the simplified geometry route.
     *
     * @param {Object} geometry - geometry
     *
     * @private
     */
    _fillRouteResultsDetailsGeometry : function (geometry) {
        // FIXME callback

        this._clearRouteResultsGeometry();

        var map = this._map;

        var _style = {
            color : "#ff7800",
            weight : 5,
            opacity : 0.65
        };

        this._geojsonRoute = L.geoJson(geometry, {
            style : _style
        }).addTo(map);
    },

    /**
     * this method is called by this._fillRouteResultsDetails()
     * and constructs the geometries street with informations.
     *
     * @param {Object[]} instructions - instructions
     *
     * @private
     */
    _fillRouteResultsDetailsFeatureGeometry : function (instructions) {
        // FIXME callback

        this._clearRouteResultsFeatureGeometry();

        var map = this._map;

        var _style = {
            color : "#ED7F10",
            weight : 5,
            opacity : 0.75
        };

        var _geometry = {
            type : "FeatureCollection",
            features : []
        };

        for (var i = 0; i < instructions.length; i++) {
            var o = instructions[i];
            var id = i + 1;

            _geometry.features.push({
                id : id,
                type : "Feature",
                geometry : o.geometry,
                properties : {
                    popupContent : "(" + id + ") distance : " + this._convertDistance(o.distance) +
                        " / temps : " + this._convertSecondsToTime(o.duration)
                }
            });
        }

        var self = this;

        function resetHighlight (e) {
            var layer = e.target;
            self._geojsonSections.resetStyle(layer);
            var div = L.DomUtil.get("GProuteResultsDetailsInstruction_" + layer.feature.id + "-" + self._uid);
            L.DomUtil.removeClass(div, "GProuteResultsDetailsHighlight");
        }

        function highlightFeature (e) {
            var layer = e.target;
            logger.log(layer);
            layer.setStyle({
                weight : 10,
                color : "#0F9DE8",
                opacity : 0.5
            });
            var div = L.DomUtil.get("GProuteResultsDetailsInstruction_" + layer.feature.id + "-" + self._uid);
            L.DomUtil.addClass(div, "GProuteResultsDetailsHighlight");
        }

        this._geojsonSections = L.geoJson(_geometry, {
            style : _style,
            // Function that will be called on each created feature layer.
            onEachFeature : function (feature, layer) {
                layer.on({
                    mouseover : highlightFeature,
                    mouseout : resetHighlight
                });

                layer.bindPopup(feature.properties.popupContent);
            }
        }).addTo(map);
    },

    // ################################################################### //
    // ############################# Clean ############################### //
    // ################################################################### //

    /**
     * this method is called by this.onShowRoutePanelClick()
     * and it clears all elements (reinit).
     *
     * @private
     */
    _clear : function () {
        this._currentTransport = null;
        this._currentExclusions = [];
        this._currentComputation = null;

        // les resultats
        this._clearRouteResultsDetails();
        // la geometrie
        this._clearRouteResultsGeometry();
        this._clearRouteResultsFeatureGeometry();
        // les points
        for (var i = 0; i < this._currentPoints.length; i++) {
            this._currentPoints[i].clear();
        }
    },

    /**
     * this method is called by this.onRouteComputationSubmit()
     * and it clears all route instructions.
     *
     * @private
     */
    _clearRouteResultsDetails : function () {
        this._currentRouteInformations = null;

        // doit on nettoyer le container "GProuteResultsDetails" ?
        // il sera de toute façon écrasé par la prochaine requête...
        if (this._resultsRouteDetailsContainer) {
            var divD = this._resultsRouteDetailsContainer;
            if (divD.childElementCount) {
                while (divD.firstChild) {
                    divD.removeChild(divD.firstChild);
                }
            }
        }

        if (this._resultsRouteValuesContainer) {
            var divV = this._resultsRouteValuesContainer;
            if (divV.childElementCount) {
                while (divV.firstChild) {
                    divV.removeChild(divV.firstChild);
                }
            }
        }
    },

    /**
     * this method is called by this.onRouteComputationSubmit()
     * and it clears all route geometries.
     *
     * @private
     */
    _clearRouteResultsGeometry : function () {
        var map = this._map;

        if (this._geojsonRoute != null) {
            map.removeLayer(this._geojsonRoute);
            this._geojsonRoute = null;
        }
    },

    /**
     * this method is called by this.onRouteComputationSubmit()
     * and it clears all route geometries.
     *
     * @private
     */
    _clearRouteResultsFeatureGeometry : function () {
        var map = this._map;

        if (this._geojsonSections != null) {
            map.removeLayer(this._geojsonSections);
            this._geojsonSections = null;
        }
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
        this._waitingContainer.className = "GProuteCalcWaitingContainerVisible";
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
            this._waitingContainer.className = "GProuteCalcWaitingContainerHidden";
            this._waiting = false;
            clearTimeout(this._timer);
            this._timer = null;
        }
    },

    // ################################################################### //
    // ########################## Geometry ############################### //
    // ################################################################### //

    /**
     * simplifies instructions
     *
     * @param {Object[]} instructions - instructions
     *
     * @returns {Object[]} simplified instructions
     *
     * @private
     */
    _simplifiedInstructions : function (instructions) {
        var newInstructions = [];

        var current = instructions[0];
        // cas où...
        if (instructions.length === 1) {
            newInstructions.push(current);
        }

        for (var i = 1; i < instructions.length; i++) {
            var o = instructions[i];
            if (o.instruction === current.instruction) {
                current.distance = (parseFloat(o.distance) + parseFloat(current.distance)).toString();
                current.duration = (parseFloat(o.duration) + parseFloat(current.duration)).toString();
                for (var j = 1; j < o.geometry.coordinates.length; j++) {
                    current.geometry.coordinates.push(o.geometry.coordinates[j]);
                }
                // last
                if (i === instructions.length - 1) {
                    newInstructions.push(current);
                    current = null;
                }
            } else {
                newInstructions.push(current);
                current = o;
                // last
                if (i === instructions.length - 1) {
                    newInstructions.push(o);
                    current = null;
                }
            }
        }
        logger.log(newInstructions);
        return newInstructions;
    },

    // ################################################################### //
    // ################# Utils for Distance/Duration ##################### //
    // ################################################################### //

    /**
     * convert seconds to time : HH:MM:SS
     *
     * @param {Number} duration - duration in seconds
     *
     * @returns {String} duration in HH:MM:SS
     *
     * @private
     */
    _convertSecondsToTime : function (duration) {
        var time = "";

        duration = Math.round(duration);
        var hours = Math.floor(duration / (60 * 60));
        if (!hours) {
            hours = "00";
        }

        var divisor4minutes = duration % (60 * 60);
        var minutes = Math.floor(divisor4minutes / 60);
        if (!minutes) {
            minutes = "00";
        }

        var divisor4seconds = divisor4minutes % 60;
        var seconds = Math.ceil(divisor4seconds);
        if (!seconds) {
            seconds = "00";
        }

        time = hours + "h " + minutes + "m " + seconds + "s";
        return time;
    },

    /**
     * convert distance in meters or kilometers
     *
     * @param {Number} distance - distance in meters
     *
     * @returns {String} distance in km
     *
     * @private
     */
    _convertDistance : function (distance) {
        var d = "";

        var distanceKm = parseInt(distance / 1000, 10);
        if (!distanceKm) {
            d = parseInt(distance, 10) + " m"; // arrondi !
        } else {
            d = distanceKm + " km";
        }

        return d;
    },

    // ################################################################### //
    // ###### METHODES PUBLIQUES (INTERFACE AVEC LE CONTROLE) ############ //
    // ################################################################### //

    /**
     * This method is public.
     * It allows to control the execution of a traitment.
     *
     * @param {Object} positions - positions = [{lng: , lat: }]
     * @param {Object} options - options = {...}
     */
    compute : function (positions, options) {
        if (!this._showRouteContainer.checked) {
            this._pictoRouteContainer.click();
        }

        var map = this._map;
        if (!map) {
            return;
        }

        // Les options par defauts
        var settings = {
            computation : "fastest",
            transport : "Voiture",
            exclusions : []
        };

        // On recupere les options
        L.Util.extend(settings, options);

        // Liste des points !
        var points = this._currentPoints;

        var start = 0;
        points[start].setCoordinate(positions[start]);
        var startInput = L.DomUtil.get("GPlocationOrigin_" + 1 + "-" + this._uid);
        startInput.value = positions[start].lng + " , " + positions[start].lat;

        var end = positions.length - 1;
        points[6].setCoordinate(positions[end]);
        var endInput = L.DomUtil.get("GPlocationOrigin_" + 7 + "-" + this._uid);
        endInput.value = positions[end].lng + " , " + positions[end].lat;

        for (var i = 1; i < positions.length - 1; i++) {
            points[i].setCoordinate(positions[i]);
            var stepInput = L.DomUtil.get("GPlocationOrigin_" + i + "-" + this._uid);
            stepInput.value = positions[i].lng + " , " + positions[i].lat;
        }

        (settings.transport === "Voiture")
            ? L.DomUtil.get("GProuteTransportCar-" + this._uid).checked = true : L.DomUtil.get("GProuteTransportPedestrian-" + this._uid).checked = true;

        (settings.computation === "fastest")
            ? L.DomUtil.get("GProuteComputationSelect-" + this._uid).selectedIndex = 0 : L.DomUtil.get("GProuteComputationSelect-" + this._uid).selectedIndex = 1;

        // TODO exclusion !

        // Calcul
        this.onRouteComputationSubmit(settings);
    }
});

export default Route;
