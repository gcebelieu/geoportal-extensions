// import CSS
import "../CSS/Controls/ReverseGeocoding/GPreverseGeocodingOpenLayers.css";
// import OpenLayers
import Control from "ol/control/Control";
import Overlay from "ol/Overlay";
import Collection from "ol/Collection";
import Feature from "ol/Feature";
import {
    Fill,
    Icon,
    Stroke,
    Style,
    Circle
} from "ol/style";
import {
    Point,
    Polygon
} from "ol/geom";
import {
    Select as SelectInteraction,
    Draw as DrawInteraction
} from "ol/interaction";
import { pointerMove as eventPointerMove } from "ol/events/condition";
import { transform as olTransformProj } from "ol/proj";
import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";
// import geoportal library access
import Gp from "geoportal-access-lib";
// import local
import Utils from "../../Common/Utils";
import Logger from "../../Common/Utils/LoggerByDefault";
import SelectorID from "../../Common/Utils/SelectorID";
import RightManagement from "../../Common/Utils/CheckRightManagement";
import Markers from "./Utils/Markers";
import Draggable from "../../Common/Utils/Draggable";
// import local with ol dependencies
import LayerSwitcher from "./LayerSwitcher";
// DOM
import ReverseGeocodingDOM from "../../Common/Controls/ReverseGeocodingDOM";

var logger = Logger.getLogger("reversegeocoding");

/**
 * @classdesc
 *
 * ReverseGeocode Control.
 *
 * @constructor
 * @alias ol.control.ReverseGeocode
 * @extends {ol.control.Control}
 * @param {Object} options - ReverseGeocode control options
 * @param {String}   [options.apiKey] - API key for services call (reverse geocode service), mandatory if autoconf service has not been charged in advance
 * @param {String}   [options.ssl = true] - use of ssl or not (default true, service requested using https protocol)
 * @param {Boolean} [options.collapsed = true] - Specify if widget has to be collapsed (true) or not (false) on map loading. Default is true.
 * @param {Boolean} [options.draggable = false] - Specify if widget is draggable
 * @param {Object}   [options.resources =  ["StreetAddress", "PositionOfInterest", "CadastralParcel"]] - resources for geocoding, by default : ["StreetAddress", "PositionOfInterest", "CadastralParcel"]. Possible values are : "StreetAddress", "PositionOfInterest", "CadastralParcel", "Administratif". Resources will be displayed in the same order in widget list.
 * @param {Object}   [options.delimitations = ["Point", "Circle", "Extent"]] - delimitations for reverse geocoding, by default : ["Point", "Circle", "Extent"]. Possible values are : "Point", "Circle", "Extent". Delimitations will be displayed in the same order in widget list.
 * @param {Object}  [options.reverseGeocodeOptions = {}] - reverse geocode service options. see {@link http://ignf.github.io/geoportal-access-lib/latest/jsdoc/module-Services.html#~reverseGeocode Gp.Services.reverseGeocode()} to know all reverse geocode options.
 * @param {Object} [options.layerDescription = {}] - Layer informations to be displayed in LayerSwitcher widget (only if a LayerSwitcher is also added to the map)
 * @param {String} [options.layerDescription.title = "Saisie (recherche inverse)"] - Layer title to be displayed in LayerSwitcher
 * @param {String} [options.layerDescription.description = "Couche de saisie d'une zone de recherche pour la recherche inverse"] - Layer description to be displayed in LayerSwitcher
 * @example
 *  var iso = ol.control.ReverseGeocode({
 *      "collapsed" : false,
 *      "draggable" : true,
 *      "resources" : ["StreetAddress", "PositionOfInterest"],
 *      "delimitations" : ["Point", "Circle"],
 *      "reverseGeocodeOptions" : {}
 *  });
 */
var ReverseGeocode = (function (Control) {
    function ReverseGeocode (options) {
        options = options || {};

        if (!(this instanceof ReverseGeocode)) {
            throw new TypeError("ERROR CLASS_CONSTRUCTOR");
        }

        // initialisation du composant
        this.initialize(options);

        // Widget main DOM container
        this._container = this._initContainer();
        this._containerElement = null;

        // on peut éventuellement encapsuler le composant dans une div passée par l'utilisateur
        if (options.element && options.element.appendChild) {
            // dans ce cas on stocke les deux container
            options.element.appendChild(this._container);
            this._containerElement = options.element;
        }

        // call ol.control.Control constructor
        Control.call(this, {
            element : this._containerElement || this._container,
            target : options.target,
            render : options.render
        });
    };

    // Inherits from ol.control.Control
    if (Control) ReverseGeocode.__proto__ = Control;

    /**
     * @lends module:ReverseGeocode
     */
    ReverseGeocode.prototype = Object.create(Control.prototype, {});

    // on récupère les méthodes de la classe commune ReverseGeocodingDOM
    Utils.assign(ReverseGeocode.prototype, ReverseGeocodingDOM);

    /**
     * Constructor (alias)
     *
     * @private
     */
    ReverseGeocode.prototype.constructor = ReverseGeocode;

    // ################################################################### //
    // ############## public methods (getters, setters) ################## //
    // ################################################################### //

    /**
     * Returns true if widget is collapsed (minimized), false otherwise
     *
     * @returns {Boolean} collapsed - true if widget is collapsed
     */
    ReverseGeocode.prototype.getCollapsed = function () {
        return this.collapsed;
    };

    /**
     * Collapse or display widget main container
     *
     * @param {Boolean} collapsed - True to collapse widget, False to display it
     */
    ReverseGeocode.prototype.setCollapsed = function (collapsed) {
        if (collapsed === undefined) {
            logger.log("[ERROR] ReverseGeocode:setCollapsed - missing collapsed parameter");
            return;
        }
        if ((collapsed && this.collapsed) || (!collapsed && !this.collapsed)) {
            return;
        }
        if (collapsed) {
            document.getElementById("GPreverseGeocodingPanelClose-" + this._uid).click();
        } else {
            document.getElementById("GPshowReverseGeocoding-" + this._uid).click();
        }
        this.collapsed = collapsed;
    };

    /**
     * Overwrite OpenLayers setMap method
     *
     * @param {ol.Map} map - Map.
     */
    ReverseGeocode.prototype.setMap = function (map) {
        if (map) {
            // lors de l'ajout à la map, on active la saisie du point ou de la zone de recherche sur la carte,
            // mais seulement si le widget est ouvert
            this._activateMapInteraction(map);

            // mode "draggable"
            if (this.draggable) {
                Draggable.dragElement(
                    this._panelContainer,
                    this._panelHeaderContainer,
                    map.getTargetElement()
                );
            }
        } else {
            var _map = this.getMap();
            // on remet à zéro = on efface les géométries + interactions + valeurs stockées
            // suppression des résultats précédents
            this._clearResults();
            // on efface les points qui ont pu être saisis précédemment
            this._clearInputFeatures();
            // on supprime l'éventuelle précédente interaction
            this._removeMapInteraction(_map);
            // on retire aussi la couche de saisie de la zone de recherche à la fermeture du widget
            if (this._inputFeaturesLayer != null) {
                _map.removeLayer(this._inputFeaturesLayer);
                this._inputFeaturesLayer = null;
                this._inputFeaturesSources = null;
                this._inputFeatures = null;
            }
        }

        // on appelle la méthode setMap originale d'OpenLayers
        Control.prototype.setMap.call(this, map);
    };

    // ################################################################### //
    // ##################### init component ############################## //
    // ################################################################### //

    /**
     * Initialize ReverseGeocode control (called by ReverseGeocode constructor)
     *
     * @param {Object} options - constructor options
     * @private
     */
    ReverseGeocode.prototype.initialize = function (options) {
        // ############################################################ //
        // ################### Options du composant ################### //

        // check input options format (resources and delimitations arrays)
        this._checkInputOptions(options);

        // set default options
        this.options = {
            collapsed : true,
            draggable : false,
            resources : ["StreetAddress", "PositionOfInterest", "CadastralParcel"],
            delimitations : ["Point", "Circle", "Extent"],
            reverseGeocodeOptions : {},
            layerDescription : {
                title : "Saisie (recherche inverse)",
                description : "Couche de saisie d'une zone de recherche pour la recherche inverse"
            }
        };

        // merge with user options
        Utils.assign(this.options, options);

        /** {Boolean} specify if reverseGeocoding control is collapsed (true) or not (false) */
        this.collapsed = this.options.collapsed;

        /** {Boolean} specify if reverseGeocoding control is draggable (true) or not (false) */
        this.draggable = this.options.draggable;

        // identifiant du contrôle : utile pour suffixer les identifiants CSS (pour gérer le cas où il y en a plusieurs dans la même page)
        this._uid = SelectorID.generate();

        // #################################################################### //
        // ################### informations sur les droits #################### //

        // ressources des services d'autocompletion et de geocodage
        this._servicesRightManagement = {};

        // gestion des droits sur les ressources
        this._noRightManagement = false;

        // gestion des droits sur les ressources/services
        this._checkRightsManagement();

        // #################################################################### //
        // ################### informations sur les droits #################### //

        // Type de géocodage sélectionné (StreetAddress, PositionOfInterest, ...)
        this._currentGeocodingType = null;
        this._initGeocodingType();

        // Type de délimitation à utiliser pour la requête + pour sélection sur la containerDistance
        this._currentGeocodingDelimitation = null;
        this._initGeocodingDelimitation();

        // ################################################################## //
        // ################### Elements principaux du DOM ################### //

        // containers principaux
        this._showReverseGeocodingInput = null;
        // panel
        this._panelContainer = null;
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

        // collection des points saisis sur la carte
        this._inputFeatures = null;
        // source contenant les features ci-dessus
        this._inputFeaturesSource = null;
        // couche vectorielle dans laquelle seront saisis les points (features ci-dessus)
        this._inputFeaturesLayer = null;
        // interaction avec la carte (de type "Point", "Circle" ou "Polygon")
        this._mapInteraction = null;

        // #################################################################### //
        // ################### informations pour la requête ################### //

        // options pour la requête de géocodage inverse
        this._requestOptions = null;
        // geometrie de recherche du géocodage inverse qui sera envoyée dans la requête
        this._requestGeom = null;
        // pour savoir si un calcul est en cours ou non
        this._waiting = false;
        // timer pour cacher la patience après un certain temps
        this._timer = null;

        // #################################################################### //
        // #################### informations des résultats #################### //

        this._reverseGeocodingLocations = [];
        this._reverseGeocodingLocationsMarkers = [];
        this._resultsDefaultStyle = new Style({
            image : new Icon({
                src : Markers["lightOrange"],
                anchor : [0.5, 1]
            })
        });
        this._resultsSelectedStyle = new Style({
            image : new Icon({
                src : Markers["red"],
                anchor : [0.5, 1]
            })
        });
        this._resultsHoverInteraction = null;
        this._resultsSelectInteraction = null;
        // container de la popup (affichage des infos au clic sur les markers)
        this._popupContent = null;
        this._popupDiv = this._initPopupDiv();
        this._popupOverlay = null;
    };

    /**
     * this method is called by this.initialize()
     * and makes sure input options are correctly formated
     *
     * @param {Object} options - options
     *
     * @private
     */
    ReverseGeocode.prototype._checkInputOptions = function (options) {
        var i;
        var j;

        // on vérifie le tableau des resources
        if (options.resources) {
            var resources = options.resources;
            // on vérifie que la liste des ressources de geocodage est bien un tableau
            if (!Array.isArray(resources)) {
                logger.log("[ReverseGeocode] 'options.resources' parameter should be an array");
                resources = null;
            }
            var resourcesList = ["StreetAddress", "PositionOfInterest", "CadastralParcel"];
            var wrongResourcesIndexes = [];
            for (i = 0; i < resources.length; i++) {
                if (resourcesList.indexOf(resources[i]) === -1) {
                    // si la resource n'est pas référencée, on stocke son index pour la retirer du tableau (après avoir terminé de parcourir le tableau)
                    wrongResourcesIndexes.push(i);
                    logger.log("[ReverseGeocode] options.resources : " + resources[i] + " is not a resource for reverse geocode");
                }
            }
            // on retire les ressoures non référencées qu'on a pu rencontrer
            if (wrongResourcesIndexes.length !== 0) {
                for (j = 0; j < wrongResourcesIndexes.length; j++) {
                    resources.splice(wrongResourcesIndexes[j], 1);
                }
            }
        }

        // et le tableau des délimitations
        if (options.delimitations) {
            var delimitations = options.delimitations;
            // on vérifie que la liste des delimitations est bien un tableau
            if (!Array.isArray(delimitations)) {
                logger.log("[ReverseGeocode] 'options.delimitations' parameter should be an array");
                delimitations = null;
            }
            var delimitationsList = ["Circle", "Point", "Extent"];
            var wrongDelimitationsIndexes = [];
            for (i = 0; i < delimitations.length; i++) {
                if (delimitationsList.indexOf(delimitations[i]) === -1) {
                    // si la delimitations n'est pas référencée, on stocke son index pour la retirer du tableau (après avoir terminé de parcourir le tableau)
                    wrongDelimitationsIndexes.push(i);
                    logger.log("[ReverseGeocode] options.delimitations : " + delimitations[i] + " is not a delimitation for reverse geocode");
                }
            }
            // on retire les ressoures non référencées qu'on a pu rencontrer
            if (wrongDelimitationsIndexes.length !== 0) {
                for (j = 0; j < wrongDelimitationsIndexes.length; j++) {
                    delimitations.splice(wrongDelimitationsIndexes[j], 1);
                }
            }
        }
    };

    /**
     * this method is called by this.initialize() and initialize geocoding type (=resource)
     * ("StreetAddress", "PositionOfInterest", "CadastralParcel")
     *
     * @private
     */
    ReverseGeocode.prototype._initGeocodingType = function () {
        // Type de géocodage selectionné
        this._currentGeocodingType = "StreetAddress"; // par defaut

        // par defaut
        var resources = this.options.resources;
        if (!resources || resources.length === 0) {
            this.options.resources = ["StreetAddress", "PositionOfInterest", "CadastralParcel"];
        }

        // pas de droit ou pas d'autoconf chargée,
        // ce n'est pas la peine de tester les droits !
        if (this._noRightManagement) {
            return;
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
    };

    /**
     * this method is called by this.initialize() and initialize geocoding delimitation
     * ("Point", "Circle", "Extent")
     *
     * @private
     */
    ReverseGeocode.prototype._initGeocodingDelimitation = function () {
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
    };

    /**
     * this method is called by this.initialize() and initialize popup div
     * (to display results information on marker click)
     *
     * @return {Object} element - DOM element for popup
     * @private
     */
    ReverseGeocode.prototype._initPopupDiv = function () {
        var context = this;
        var element = document.createElement("div");
        element.className = "gp-feature-info-div";
        var closer = document.createElement("input");
        closer.type = "button";
        closer.className = "gp-styling-button closer";
        // on closer click : remove popup
        closer.onclick = function () {
            if (context._popupOverlay != null) {
                context._popupOverlay.setPosition(undefined);
            }
            return false;
        };
        this._popupContent = document.createElement("div");
        this._popupContent.className = "gp-features-content-div";
        element.appendChild(this._popupContent);
        element.appendChild(closer);

        return element;
    };

    /**
     * Check rights to resources (called by this.initialize())
     *
     * @private
     */
    ReverseGeocode.prototype._checkRightsManagement = function () {
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
    };

    /**
     * Create control main container (DOM initialize)
     *
     * @returns {DOMElement} DOM element
     *
     * @private
     */
    ReverseGeocode.prototype._initContainer = function () {
        // create main container
        var container = this._createMainContainerElement();

        // create show ReverseGeocode element
        var inputShow = this._showReverseGeocodingInput = this._createShowReverseGeocodingElement();
        container.appendChild(inputShow);

        // mode "collapsed"
        if (!this.collapsed) {
            inputShow.checked = true;
        }

        // create ReverseGeocode picto
        var picto = this._createShowReverseGeocodingPictoElement();
        container.appendChild(picto);

        // panel
        var reverseGeocodingPanel = this._panelContainer = this._createReverseGeocodingPanelElement();

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
    };

    // ################################################################### //
    // ################### Map interactions management ################### //
    // ################################################################### //

    /**
     * this method is called by this.setMap,
     * or by this.onShowReverseGeocodingClick,
     * and calls method corresponding to current delimitation, if widget is not collapsed.
     *
     * @param {ol.Map} map - control map.
     * @private
     */
    ReverseGeocode.prototype._activateMapInteraction = function (map) {
        if (!this.collapsed) {
            // 1. Creation de la couche vectorielle sur laquelle on va dessiner
            if (this._inputFeaturesLayer == null) {
                // on crée une collection, qui accueillera les points saisis sur la carte par les interactions,
                // sous formes de features (dans une couche vectorielle).
                // on les stocke de sorte à pouvoir les supprimer facilement
                this._inputFeatures = new Collection();

                // on crée la couche qui va accueillir les features
                this._inputFeaturesSource = new VectorSource({
                    features : this._inputFeatures
                });
                this._inputFeaturesLayer = new VectorLayer({
                    source : this._inputFeaturesSource,
                    style : new Style({
                        fill : new Fill({
                            color : "rgba(0, 183, 152, 0.3)"
                        }),
                        stroke : new Stroke({
                            color : "rgba(0, 183, 152, 0.8)",
                            width : 3
                        }),
                        image : new Icon({
                            src : Markers["turquoiseBlue"],
                            anchor : [0.5, 1]
                        })
                    })
                });
                // on rajoute le champ gpResultLayerId permettant d'identifier une couche crée par le composant. (pour layerSwitcher par ex)
                this._inputFeaturesLayer.gpResultLayerId = "reverseGeocoding";
                // on ajoute la couche à la carte
                map.addLayer(this._inputFeaturesLayer);
            }

            // 2. Création de l'interaction de dessin, selon le type de délimitation sélectionné
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
                default:
                    break;
            }

            // 3. Si un layer switcher est présent dans la carte, on lui affecte des informations pour cette couche
            map.getControls().forEach(
                (control) => {
                    if (control instanceof LayerSwitcher) {
                        // un layer switcher est présent dans la carte
                        var layerId = this._inputFeaturesLayer.gpLayerId;
                        // on n'ajoute des informations que s'il n'y en a pas déjà (si le titre est le numéro par défaut)
                        if (control._layers[layerId].title === layerId) {
                            control.addLayer(
                                this._inputFeaturesLayer, {
                                    title : this.options.layerDescription.title,
                                    description : this.options.layerDescription.description
                                }
                            );
                            control.setRemovable(this._inputFeaturesLayer, false);
                        }
                    }
                }
            );
        }
    };

    /**
     * this method is called by this._activateMapInteraction,
     * and creates map point drawing interaction.
     *
     * @param {ol.Map} map - control map.
     * @private
     */
    ReverseGeocode.prototype._activatePointInteraction = function (map) {
        // interaction permettant de dessiner un point
        this._mapInteraction = new DrawInteraction({
            style : new Style({
                image : new Circle({
                    radius : 0,
                    fill : new Fill({
                        color : "rgba(0, 183, 152, 0.8)"
                    })
                })
            }),
            type : ("Point"),
            source : this._inputFeaturesSource
        });

        this._mapInteraction.on(
            "drawstart",
            (e) => {
                logger.log("on drawstart ", e);

                // on efface les points qui ont pu être saisis précédemment (on vide la collection des features de la couche)
                this._inputFeatures.clear();

                // on récupère les coordonnées du point qui vient d'être saisi
                this._onDrawStart(e, "point");
            }
        );

        this._mapInteraction.on(
            "drawend",
            (e) => {
                logger.log("on drawend", e);

                // on récupère le rayon du cercle qui vient d'être tracé
                if (e.feature && e.feature.getGeometry) {
                    this._requestGeom = {
                        type : "Point",
                        coordinates : [
                            this._requestPosition.lon,
                            this._requestPosition.lat
                        ]
                    };
                }
            }
        );

        map.addInteraction(this._mapInteraction);
        this._setCursor("crosshair", map);
    };

    /**
     * this method is called by this._activateMapInteraction,
     * and creates map circle drawing interaction.
     *
     * @param {ol.Map} map - control map.
     * @private
     */
    ReverseGeocode.prototype._activateCircleInteraction = function (map) {
        // interaction permettant de dessiner un cercle
        this._mapInteraction = new DrawInteraction({
            style : new Style({
                fill : new Fill({
                    color : "rgba(0, 183, 152, 0.3)"
                }),
                stroke : new Stroke({
                    color : "rgba(0, 183, 152, 0.8)",
                    width : 3
                }),
                image : new Circle({
                    radius : 4,
                    fill : new Fill({
                        color : "rgba(0, 183, 152, 0.8)"
                    })
                })
            }),
            type : ("Circle"),
            source : this._inputFeaturesSource
        });

        this._mapInteraction.on(
            "drawstart",
            (e) => {
                logger.log("on drawstart ", e);
                // on efface les points qui ont pu être saisis précédemment (on vide la collection des features de la couche)
                this._inputFeatures.clear();
                // on récupère les coordonnées du centre du cercle = premier point du tracé
                this._onDrawStart(e, "circle");
            }
        );

        this._mapInteraction.on(
            "drawend",
            (e) => {
                logger.log("on drawend", e);

                // on récupère le rayon du cercle qui vient d'être tracé
                if (e.feature && e.feature.getGeometry) {
                    var radius = e.feature.getGeometry().getRadius();
                    // et on le stocke comme filtre pour la requête
                    this._requestGeom = {};
                    this._requestGeom.type = "Circle";
                    this._requestGeom.radius = radius;
                    if (this._requestPosition) {
                        this._requestGeom.coordinates = [
                            this._requestPosition.lon,
                            this._requestPosition.lat
                        ];
                    }
                    logger.log("circle radius : ", radius);
                }
            }
        );

        map.addInteraction(this._mapInteraction);
    };

    /**
     * this method is called by this._activateMapInteraction,
     * and creates map box drawing interaction.
     *
     * @param {ol.Map} map - control map.
     * @private
     */
    ReverseGeocode.prototype._activateBoxInteraction = function (map) {
        // info : il n'y a pas de geometry de type rectangle, donc on va créer un objet de type "LineString",
        // avec seulement 2 points qui formeront les extrémités du rectangle.
        // on aura donc une géométrie LineString avec 5 coordonnées : start, point2, end, point4, start,
        // où les coordonnées de point2 et point4 sont calculées à partir de start et end, et start est répété à la fin pour fermer la géométrie.

        // function to draw rectangle with only 2 points
        var geometryFunction = function (coordinates, geometry) {
            if (!geometry) {
                geometry = new Polygon([]);
            }
            var start = coordinates[0];
            var end = coordinates[1];
            // on crée les 5 coordonnées de la ligne à partir des 2 points saisis.
            geometry.setCoordinates([
                [start, [start[0], end[1]], end, [end[0], start[1]], start]
            ]);
            return geometry;
        };

        // interaction permettant de dessiner un rectangle (= LineString de 5 points, à partir de 2 points saisis)
        this._mapInteraction = new DrawInteraction({
            style : new Style({
                fill : new Fill({
                    color : "rgba(0, 183, 152, 0.3)"
                }),
                stroke : new Stroke({
                    color : "rgba(0, 183, 152, 0.8)",
                    width : 3
                }),
                image : new Circle({
                    radius : 4,
                    fill : new Fill({
                        color : "rgba(0, 183, 152, 0.8)"
                    })
                })
            }),
            type : ("LineString"),
            source : this._inputFeaturesSource,
            maxPoints : 2,
            geometryFunction : geometryFunction
        });

        this._mapInteraction.on(
            "drawstart",
            (e) => {
                logger.log("on drawstart", e);
                // on efface les points qui ont pu être saisis précédemment (on vide la collection des features de la couche)
                this._inputFeatures.clear();
            }
        );

        this._mapInteraction.on(
            "drawend",
            (e) => {
                logger.log("on drawend", e);
                // on va récupérer les coordonnées du rectangle qui vient d'être tracé
                this._onBoxDrawEnd(e);
            }
        );

        map.addInteraction(this._mapInteraction);
    };

    /**
     * remove draw interaction from map (if exists)
     *
     * @param {ol.Map} map - control map.
     * @private
     */
    ReverseGeocode.prototype._removeMapInteraction = function (map) {
        if (this._mapInteraction != null) {
            map.removeInteraction(this._mapInteraction);
            this._mapInteraction = null;
        }
        this._setCursor();
    };

    /**
     * this method is called by event 'drawstart' on map point or circle drawing interaction
     * (cf. this._activatePointInteraction), and it gets map click coordinates.
     * this point is saved as a parameter for reverse Geocode service.
     *
     * @param {Object} e - HTMLElement
     * @param {String} type - geometry type : "point" or "circle"
     * @private
     */
    ReverseGeocode.prototype._onDrawStart = function (e, type) {
        var coordinate;
        if (e.feature && e.feature.getGeometry) {
            var geometry = e.feature.getGeometry();
            if (type === "point") {
                coordinate = geometry.getCoordinates();
            }
            if (type === "circle") {
                coordinate = geometry.getCenter();
            }
        }
        if (!coordinate) {
            return;
        }

        var crs;
        if (this.options.reverseGeocodeOptions && this.options.reverseGeocodeOptions.srs) {
            crs = this.options.reverseGeocodeOptions.srs;
        } else {
            var map = this.getMap();
            if (!map || !map.getView()) {
                return;
            }
            crs = map.getView().getProjection();
        }

        var geoCoordinate = olTransformProj(coordinate, crs, "EPSG:4326");
        this._requestPosition = {
            lon : geoCoordinate[0],
            lat : geoCoordinate[1]
        };
        logger.log("position coordinates : ", this._requestPosition);
    };

    /**
     * this method is called by event 'drawend' on map box drawing interaction
     * (cf. this._activateBoxInteraction), and it gets geometry coordinates,
     * to be saved as a filter parameter for reverse Geocode service.
     *
     * @param {Object} e - HTMLElement
     * @private
     */
    ReverseGeocode.prototype._onBoxDrawEnd = function (e) {
        // on va récupérer les coordonnées du rectangle qui vient d'être tracé
        if (e.feature && e.feature.getGeometry) {
            // info: coordinates est un tableau [start, point2, end, point4, start]
            // car c'est une linestring donc on a 5 coordonnées pour boucler
            var coordinates = e.feature.getGeometry().getCoordinates()[0];
            var start = coordinates[0];
            var end = coordinates[2];

            var crs;
            if (this.options.reverseGeocodeOptions && this.options.reverseGeocodeOptions.srs) {
                crs = this.options.reverseGeocodeOptions.srs;
            } else {
                var map = this.getMap();
                if (!map || !map.getView()) {
                    return;
                }
                crs = map.getView().getProjection();
            }

            // on reprojette les coordonnées des deux extrémités du rectangle (start et end)
            var startGeoCoordinate = olTransformProj(start, crs, "EPSG:4326");
            var endGeoCoordinate = olTransformProj(end, crs, "EPSG:4326");

            var bbox = {};
            // on récupère les valeurs left, right, top et bottom, pour le filtre bbox du service reverseGeocode
            if (startGeoCoordinate[0] < endGeoCoordinate[0]) {
                bbox.left = startGeoCoordinate[0];
                bbox.right = endGeoCoordinate[0];
            } else {
                bbox.left = endGeoCoordinate[0];
                bbox.right = startGeoCoordinate[0];
            }
            if (startGeoCoordinate[1] < endGeoCoordinate[1]) {
                bbox.bottom = startGeoCoordinate[1];
                bbox.top = endGeoCoordinate[1];
            } else {
                bbox.bottom = endGeoCoordinate[1];
                bbox.top = startGeoCoordinate[1];
            }

            this._requestGeom = {
                type : "Polygon",
                coordinates : [[
                    [bbox.left, bbox.top],
                    [bbox.right, bbox.top],
                    [bbox.right, bbox.bottom],
                    [bbox.left, bbox.bottom],
                    [bbox.left, bbox.top]
                ]]
            };

            logger.log("searchGeometry filter : ", this._requestGeom);
        }
    };

    /**
     * this change the cursor of the map when entering a point.
     *
     * @param {String} cursor - cursor style
     * @param {ol.Map} map - control map (optional)
     * @private
     */
    ReverseGeocode.prototype._setCursor = function (cursor, map) {
        map = map || this.getMap();
        if (!map) {
            return;
        }
        var div = map.getTargetElement();

        if (cursor) {
            div.style.cursor = cursor;
        } else {
            div.style.cursor = null;
        }
    };

    // ################################################################### //
    // ##################### Reverse Geocoding request ################### //
    // ################################################################### //

    /**
     * this methode is called by this.onReverseGeocodingSubmit method,
     * it generates and sends reverse geocode request, then displays results
     *
     * @private
     */
    ReverseGeocode.prototype._reverseGeocodingRequest = function () {
        var map = this.getMap();

        // on construit les options pour la requête
        this._requestOptions = this._getReverseGeocodingRequestOptions();

        // retrait de l'interaction sur la map pendant l'attente (et l'affichage des résultats)
        this._removeMapInteraction(map);
        // affichage d'une patience pendant l'attente
        this._displayWaitingContainer();

        // envoi de la requête
        Gp.Services.reverseGeocode(this._requestOptions);
    };

    /**
     * this methode is called by this._reverseGeocodingRequest method,
     * and returns options object for Gp.Services.reverseGeocode request
     *
     * @returns {Object} requestOptions - reverse geocode options
     * @private
     */
    ReverseGeocode.prototype._getReverseGeocodingRequestOptions = function () {
        var map = this.getMap();

        // on recupere les éventuelles options du service passées par l'utilisateur
        var reverseGeocodeOptions = this.options.reverseGeocodeOptions;

        // on crée les options pour le service reverseGeocode
        var context = this;
        var requestOptions = {
            apiKey : reverseGeocodeOptions.apiKey || this.options.apiKey,
            index : this._currentGeocodingType,
            maximumResponses : reverseGeocodeOptions.maximumResponses || 10,
            timeOut : reverseGeocodeOptions.timeOut || 30000,
            // protocol : reverseGeocodeOptions.protocol || "XHR",
            // callback onSuccess
            onSuccess : function (response) {
                if (response.locations) {
                    logger.log("reverseGeocode results : ", response.locations);
                    context._displayGeocodedLocations(response.locations);
                }
            },
            // callback onFailure
            onFailure : function (error) {
                // FIXME mise à jour du controle mais le service ne repond pas en 200 !?

                // on cache la patience
                context._hideWaitingContainer();

                // suppression d'éventuels résultats précédents
                context._clearResults();
                // on efface les points qui ont été saisis précédemment
                context._clearInputFeatures();

                // et on réactive l'interaction sur la map
                context._activateMapInteraction(map);
                logger.log(error.message);
            }
        };

        // on récupère d'éventuels filtres
        if (this._requestGeom.type.toLowerCase() === "circle") {
            // FIXME : a confirmer !
            if (this._requestGeom.radius > 1000) {
                logger.log("INFO : initial circle radius (" + this._requestGeom.radius + ") limited to 1000m.");
                this._requestGeom.radius = 1000;
            }
            requestOptions.searchGeometry = this._requestGeom;
        } else if (this._requestGeom.type.toLowerCase() === "polygon") {
            requestOptions.searchGeometry = this._requestGeom;
        } else if (this._requestGeom.type.toLowerCase() === "point") {
            if (this._currentGeocodingType === "StreetAddress") {
                requestOptions.searchGeometry = {
                    type : "Circle",
                    radius : 50,
                    coordinates : this._requestGeom.coordinates
                };
                requestOptions.maximumResponses = 1;
            } else {
                requestOptions.searchGeometry = this._requestGeom;
            }
        }

        logger.log("reverseGeocode request options : ", requestOptions);

        return requestOptions;
    };

    /**
     * this method is called by this._reverseGeocodingRequest() (in case of reverse geocode success)
     * and display results : in both container list and map
     *
     * @param {Array} locations - array of geocoded locations (reverse geocode results)
     * @private
     */
    ReverseGeocode.prototype._displayGeocodedLocations = function (locations) {
        // 1. on vide les résultats précédents
        this._clearResults();
        this._reverseGeocodingLocations = locations;

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
    };

    // ################################################################### //
    // ############################# results list ######################## //
    // ################################################################### //

    /**
     * this method is called by this._displayGeocodedLocations()
     * and fills the container with results list
     *
     * @param {Array} locations - array of geocoded locations (reverse geocode results)
     * @private
     */
    ReverseGeocode.prototype._fillGeocodedLocationListContainer = function (locations) {
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
    };

    /**
     * this method is called by this._fillGeocodedLocationListContainer()
     * and fills location description (String), depending on matchType
     *
     * @param {Object} location - geocoded location (from reverse geocode results)
     * @returns {String} locationDescription - geocoded location description to be displayed
     * @private
     */
    ReverseGeocode.prototype._fillGeocodedLocationDescription = function (location) {
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
    };

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
    ReverseGeocode.prototype._displayGeocodedLocationsOnMap = function (locations) {
        if (this._reverseGeocodingLocations.length !== 0) {
            var map = this.getMap();

            // 1. création de la couche où seront ajoutés les résultats
            this._createResultsLayer();
            // ajout de chaque résultat à la couche (marker)
            for (var i = 0; i < locations.length; i++) {
                this._addResultFeature(locations[i], i);
            }

            // 2. Zoom sur l'étendue des résultats (features)
            if (this._resultsFeatures.getLength() > 1) {
                if (this._resultsFeaturesSource && this._resultsFeaturesSource.getExtent) {
                    var extent = this._resultsFeaturesSource.getExtent();
                    map.getView().fit(extent, map.getSize());
                }
            } else {
                // dans le cas où on n'a qu'un seul résultat, l'étendue n'est pas définie, on zoome donc sur le résulat
                var feature = this._resultsFeatures.item(0);
                var coords = feature.getGeometry().getCoordinates();
                map.getView().setCenter(coords);
                map.getView().setZoom(17);
            }

            // 3. ajout des interactions (survol, click)
            // au survol : modification des styles (marker et list)
            this._resultsHoverInteraction = new SelectInteraction({
                condition : eventPointerMove,
                layers : [this._resultsFeaturesLayer]
            });
            this._resultsHoverInteraction.on(
                "select",
                (e) => this._onResultsFeatureMouseOver(e)
            );
            map.addInteraction(this._resultsHoverInteraction);

            // au click : affichage popup
            this._resultsSelectInteraction = new SelectInteraction({
                layers : [this._resultsFeaturesLayer]
            });
            this._resultsSelectInteraction.on(
                "select",
                (e) => this._onResultsFeatureSelect(e)
            );
            map.addInteraction(this._resultsSelectInteraction);

            // 4. Si un layer switcher est présent dans la carte, on lui affecte des informations pour cette couche
            var geocodeType = "";
            switch (this._currentGeocodingType) {
                case "StreetAddress":
                    geocodeType = "adresses";
                    break;
                case "PositionOfInterest":
                    geocodeType = "toponymes";
                    break;
                case "CadastralParcel":
                    geocodeType = "parcelles cadastrales";
                    break;
                default:
                    break;
            }
            map.getControls().forEach(
                (control) => {
                    if (control instanceof LayerSwitcher) {
                        // un layer switcher est présent dans la carte
                        var layerId = this._resultsFeaturesLayer.gpLayerId;
                        // on n'ajoute des informations que s'il n'y en a pas déjà (si le titre est le numéro par défaut)
                        if (control._layers[layerId].title === layerId) {
                            control.addLayer(
                                this._resultsFeaturesLayer, {
                                    title : "Résultats de la recherche inverse",
                                    description : "Résultats de la recherche inverse sur les " + geocodeType
                                }
                            );
                            control.setRemovable(this._resultsFeaturesLayer, false);
                        }
                    }
                }
            );
        }
    };

    /**
     * this method is called by this._displayGeocodedLocations()
     * and creates result layer (where geocoded locations will be displayed)
     *
     * @private
     */
    ReverseGeocode.prototype._createResultsLayer = function () {
        var map = this.getMap();

        this._resultsFeatures = new Collection();

        // on crée la couche qui va accueillir les features
        this._resultsFeaturesSource = new VectorSource({
            features : this._resultsFeatures
        });
        this._resultsFeaturesLayer = new VectorLayer({
            source : this._resultsFeaturesSource
        });
        // on rajoute le champ gpResultLayerId permettant d'identifier une couche crée par le composant. (pour layerSwitcher par ex)
        this._resultsFeaturesLayer.gpResultLayerId = "reverseGeocodingResults";
        // on ajoute la couche à la carte
        map.addLayer(this._resultsFeaturesLayer);
    };

    /**
     * this method is called by this._displayGeocodedLocations()
     * and displays locations in map (markers) : add new feature to results layer
     *
     * @param {Object} location - geocoded location (reverse geocode result)
     * @param {Number} i - geocoded location index in response list
     * @private
     */
    ReverseGeocode.prototype._addResultFeature = function (location, i) {
        var map = this.getMap();

        // récupération de la position
        var position = [location.position.lon, location.position.lat];
        if (!position) {
            return;
        }
        var view = map.getView();
        var mapProj = view.getProjection().getCode();
        if (mapProj !== "EPSG:4326") {
            // on retransforme les coordonnées de la position dans la projection de la carte
            position = olTransformProj(position, "EPSG:4326", mapProj);
        }

        // on ajoute le résultat à la collection de points existantes (composant la couche vectorielle this._inputFeaturesLayer)
        var feature = new Feature({
            geometry : new Point(position)
        });
        feature.setStyle(this._resultsDefaultStyle);
        feature.setId(i);
        feature.setProperties({
            popupContent : this._fillPopupContent(location)
        });
        this._resultsFeatures.push(feature);
    };

    /**
     * this method is called by this._addResultFeature()
     * and fills popup content (to be displayed on marker click) for a given geocoded location
     *
     * @param {Object} location - geocoded location (reverse geocode result)
     * @returns {String} popupContent - text to be displayed in popup
     * @private
     */
    ReverseGeocode.prototype._fillPopupContent = function (location) {
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

        return popupContent;
    };

    /**
     * this method is called on 'pointerMove' on this._resultsFeaturesLayer (ol.interaction.Select)
     * (cf. this._displayGeocodedLocationsOnMap() )
     * and highlights result in list container
     *
     * @param {Object} e - on select event
     * @private
     */
    ReverseGeocode.prototype._onResultsFeatureMouseOver = function (e) {
        var f;

        // si on survole un résultat, on change son style (marker)
        if (e.selected.length !== 0) {
            // on change le style du marker (red)
            f = e.selected[0];
            f.setStyle(this._resultsSelectedStyle);

            // on surligne le résultat correspondant dans la liste des résultats
            if (f.getId() != null) {
                var selectedResultDiv = document.getElementById("ReverseGeocodedLocation_" + f.getId() + "-" + this._uid);
                if (selectedResultDiv && selectedResultDiv.classList) {
                    selectedResultDiv.classList.add("GPreverseGeocodedLocationHighlight");
                }
            }
            document.getElementById("ReverseGeocodedLocation_" + f.getId() + "-" + this._uid);
        }

        // si on déselectionne un résultat (mouseout), on rétablit un style normal pour le marker
        if (e.deselected.length !== 0) {
            // on change le style du marker (lightOrange)
            f = e.deselected[0];
            f.setStyle(this._resultsDefaultStyle);

            // on rétablit un style normal pour le résultat correspondant dans la liste des résultats
            var deSelectedResultDiv = document.getElementById("ReverseGeocodedLocation_" + f.getId() + "-" + this._uid);
            if (deSelectedResultDiv && deSelectedResultDiv.classList) {
                deSelectedResultDiv.classList.remove("GPreverseGeocodedLocationHighlight");
            }
        }
    };

    /**
     * this method is called on 'click' on this._resultsFeaturesLayer (ol.interaction.Select)
     * (cf. this._displayGeocodedLocationsOnMap() )
     * and sets a popup with feature information
     *
     * @param {Object} e - on select event
     * @private
     */
    ReverseGeocode.prototype._onResultsFeatureSelect = function (e) {
        var map = this.getMap();
        if (e.selected.length !== 0) {
            // si on a sélectionné un marker, on lui ajoute une popup
            var f = e.selected[0];
            this._popupContent.innerHTML = f.getProperties().popupContent;

            if (!this._popupOverlay) {
                // ajout de la popup a la carte comme un overlay
                this._popupOverlay = new Overlay({
                    element : this._popupDiv,
                    positioning : "bottom-center",
                    position : e.mapBrowserEvent.coordinate
                });
                map.addOverlay(this._popupOverlay);
            } else {
                // si l'overlay est déjà créé, on modifie juste sa position
                this._popupOverlay.setPosition(e.mapBrowserEvent.coordinate);
            }
        } else {
            // si aucun troncon n'est sélectionné (click à côté du tracé),
            // on fait disparaitre la popup si elle existe
            if (this._popupOverlay != null) {
                this._popupOverlay.setPosition(undefined);
            }
        }
    };

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
    ReverseGeocode.prototype.onShowReverseGeocodingClick = function () {
        this.collapsed = this._showReverseGeocodingInput.checked;
        // info : on génère nous même l'evenement OpenLayers de changement de propriété
        // (utiliser ol.control.ReverseGeocode.on("change:collapsed", function ) pour s'abonner à cet évènement)
        this.dispatchEvent("change:collapsed");
        var map = this.getMap();

        if (!this._waiting && !this._reverseGeocodingLocations.length) {
            // Cas 1 : input panel (ni en attente, ni sur le panel des résultats)
            if (this.collapsed) {
                // on remet à zéro = on efface les géométries + interactions + valeurs stockées
                // suppression des résultats précédents
                this._clearResults();
                // on efface les points qui ont pu être saisis précédemment
                this._clearInputFeatures();
                // on supprime l'éventuelle précédente interaction
                this._removeMapInteraction(map);
                // on retire aussi la couche de saisie de la zone de recherche à la fermeture du widget
                if (this._inputFeaturesLayer != null) {
                    map.removeLayer(this._inputFeaturesLayer);
                    this._inputFeaturesLayer = null;
                    this._inputFeaturesSources = null;
                    this._inputFeatures = null;
                }
            } else {
                // on réactive l'interaction
                this._activateMapInteraction(map);
            }
        }
        // info : si on est en attente ou sur le panel des résultats : on ne fait rien.
    };

    /**
     * this method is called by event 'change' on 'GPreverseGeocodingCode' tag select
     * (cf. ReverseGeocodingDOM._createReverseGeocodingFormModeChoiceGeocodingTypeElement).
     * this value is saved as a parameter for reverseGeocode service.
     *
     * @param {Object} e - HTMLElement
     * @private
     */
    ReverseGeocode.prototype.onReverseGeocodingTypeChange = function (e) {
        var idx = e.target.selectedIndex;
        var value = e.target.options[idx].value;

        if (!value) {
            return;
        }
        logger.log(value);
        this._currentGeocodingType = value;
    };

    /**
     * this method is called by event 'change' on 'GPreverseGeocodingCode' tag select
     * (cf. ReverseGeocodingDOM._createReverseGeocodingFormModeChoiceGeocodingDelimitationElement).
     * this value is saved as a parameter for reverseGeocode service.
     *
     * @param {Object} e - HTMLElement
     * @private
     */
    ReverseGeocode.prototype.onReverseGeocodingDelimitationChange = function (e) {
        var idx = e.target.selectedIndex;
        var value = e.target.options[idx].value;

        if (!value) {
            return;
        }

        logger.log(value);
        this._currentGeocodingDelimitation = value;

        // on met à jour l'interaction de la map en fonction de la nouvelle délimitation
        var map = this.getMap();
        // on supprime l'interaction précédente, ainsi que les géométries et valeurs stockées (filtres, position)
        this._clearInputFeatures();
        // on supprime l'éventuelle précédente interaction
        this._removeMapInteraction(map);
        // on crée une nouvelle interaction
        this._activateMapInteraction(map);
    };

    /**
     * this method is called by event 'click' on 'GPreverseGeocodingReturnPicto' div
     * (cf. ReverseGeocodingDOM._createReverseGeocodingPanelReturnPictoElement),
     * and clear geocoded location (from both list container and map)
     *
     * @private
     */
    ReverseGeocode.prototype.onGPreverseGeocodingReturnPictoClick = function () {
        // suppression des résultats précédents
        this._clearResults();
        // on efface les points qui ont pu être saisis précédemment
        this._clearInputFeatures();
        // et on réactive l'interaction sur la map
        this._activateMapInteraction(this.getMap());
    };

    /**
     * this methode is called by event 'submit' on reverseGeocoding form ('GPreverseGeocodingForm')
     * (cf. ReverseGeocodingDOM._createReverseGeocodingPanelFormElement),
     * it checks reverse geocode mandatory parameters,
     * then call this._reverseGeocodingRequest() to generate and send request
     *
     * @private
     */
    ReverseGeocode.prototype.onReverseGeocodingSubmit = function () {
        // le paramètre position est obligatoire
        if (!this._requestPosition) {
            logger.log("missing position");
            return;
        }

        // si on n'a trouvé aucun droit, on evite une requête inutile ...
        if (this._noRightManagement) {
            return;
        }

        this._reverseGeocodingRequest();
    };

    /**
     * this method is called by event 'click' on 'ReverseGeocodedLocation_' div
     * (cf. ReverseGeocodingDOM._createReverseGeocodingResultElement),
     * and zoom to location ?
     * TODO
     *
     * @param {Object} e - HTMLElement
     * @private
     */
    ReverseGeocode.prototype.onReverseGeocodingResultClick = function (e) {
        logger.log("onReverseGeocodingResultClick", e);
    };

    /**
     * this method is called by event 'mouseover' on 'ReverseGeocodedLocation_' div
     * (cf. ReverseGeocodingDOM._createReverseGeocodingResultElement),
     * and changes style of matching marker on map (selected)
     *
     * @param {Object} e - HTMLElement
     * @private
     */
    ReverseGeocode.prototype.onReverseGeocodingResultMouseOver = function (e) {
        // récupération de l'id du résultat survolé
        var tagid = e.target.id; // ex ReverseGeocodedLocation_21
        var idx = tagid.substring(tagid.indexOf("_") + 1); // ex. 21

        // on passe le texte en gras
        if (e.target.classList) {
            e.target.classList.add("GPreverseGeocodedLocationHighlight");
        }

        if (!this._resultsFeaturesSource) {
            return;
        }

        // on récupère l'entité correspondante au résultat survolé
        var f = this._resultsFeaturesSource.getFeatureById(parseInt(idx, 10));
        // et on lui affecte un nouveau style
        f.setStyle(this._resultsSelectedStyle);
    };

    /**
     * this method is called by event 'mouseout' on 'ReverseGeocodedLocation_' div
     * (cf. ReverseGeocodingDOM._createReverseGeocodingResultElement),
     * and changes style of matching marker on map (default)
     *
     * @param {Object} e - HTMLElement
     * @private
     */
    ReverseGeocode.prototype.onReverseGeocodingResultMouseOut = function (e) {
        // récupération de l'id du résultat survolé
        var tagid = e.target.id; // ex GProuteResultsDetailsInstruction_125
        var idx = tagid.substring(tagid.indexOf("_") + 1); // ex. 125

        // on repasse le texte en style normal
        if (e.target.classList) {
            e.target.classList.remove("GPreverseGeocodedLocationHighlight");
        }

        if (!this._resultsFeaturesSource) {
            return;
        }
        // on récupère l'entité correspondante au résultat qui était survolé
        var f = this._resultsFeaturesSource.getFeatureById(parseInt(idx, 10));
        // et on lui réaffecte un style normal
        f.setStyle(this._resultsDefaultStyle);
    };

    // ################################################################### //
    // ################################ clean ############################ //
    // ################################################################### //

    /**
     * this method clears previous location results
     *
     * @private
     */
    ReverseGeocode.prototype._clearResults = function () {
        var map = this.getMap();

        this._reverseGeocodingLocations = [];
        // on vide le container avec la liste des résultats
        if (this._resultsListContainer) {
            while (this._resultsListContainer.firstChild) {
                this._resultsListContainer.removeChild(this._resultsListContainer.firstChild);
            }
        }
        // on retire la couche des résultats
        if (this._resultsFeaturesLayer) {
            map.removeLayer(this._resultsFeaturesLayer);
            this._resultsFeaturesLayer = null;
        }
        // on retire l'overlay de la popup de la carte
        if (this._popupOverlay != null) {
            map.removeOverlay(this._popupOverlay);
            this._popupOverlay = null;
        }
        // on retire les interactions sur les markers (select et mouseover)
        if (this._resultsSelectInteraction != null) {
            map.removeInteraction(this._resultsSelectInteraction);
            this._resultsSelectInteraction = null;
        }
        if (this._resultsHoverInteraction != null) {
            map.removeInteraction(this._resultsHoverInteraction);
            this._resultsHoverInteraction = null;
        }
    };

    /**
     * this method clears previous input features (features, layer, position and filters)
     *
     * @private
     */
    ReverseGeocode.prototype._clearInputFeatures = function () {
        // on efface les points qui ont pu être saisis précédemment (on vide la collection des features de la couche)
        if (this._inputFeatures) {
            this._inputFeatures.clear();
        }

        // on supprime les valeurs stockées
        this._requestGeom = null;
    };

    /**
     * this method displays waiting container and sets a timeout
     *
     * @private
     */
    ReverseGeocode.prototype._displayWaitingContainer = function () {
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
    };

    /**
     * this method hides waiting container and clears timeout
     *
     * @private
     */
    ReverseGeocode.prototype._hideWaitingContainer = function () {
        if (this._waiting) {
            this._waitingContainer.className = "GProuteCalcWaitingContainerHidden";
            this._waiting = false;
            clearTimeout(this._timer);
            this._timer = null;
        }
    };

    return ReverseGeocode;
}(Control));

export default ReverseGeocode;

// Expose ReverseGeocode as ol.control.ReverseGeocode (for a build bundle)
if (window.ol && window.ol.control) {
    window.ol.control.ReverseGeocode = ReverseGeocode;
}
