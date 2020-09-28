// import CSS
import "../CSS/Controls/SearchEngine/GPsearchEngineOpenLayers.css";
// import OpenLayers
import Control from "ol/control/Control";
import Overlay from "ol/Overlay";
import { transform as olProjTransform } from "ol/proj";
// import geoportal library access
import Gp from "geoportal-access-lib";
// import local
import Logger from "../../Common/Utils/LoggerByDefault";
import Utils from "../../Common/Utils";
import Markers from "./Utils/Markers";
import RightManagement from "../../Common/Utils/CheckRightManagement";
import SelectorID from "../../Common/Utils/SelectorID";
import SearchEngineUtils from "../../Common/Utils/SearchEngineUtils";
import GeocodeUtils from "../../Common/Utils/GeocodeUtils";
// DOM
import SearchEngineDOM from "../../Common/Controls/SearchEngineDOM";

var logger = Logger.getLogger("searchengine");

/**
 * @classdesc
 * SearchEngine control
 *
 * @constructor
 * @extends {ol.control.Control}
 * @alias ol.control.SearchEngine
 * @param {Object}  options - control options
 * @param {String}   [options.apiKey] - API key, mandatory if autoconf service has not been charged in advance
 * @param {String}   [options.ssl = true] - use of ssl or not (default true, service requested using https protocol)
 * @param {Boolean} [options.collapsed = true] - collapse mode, true by default
 * @param {Object}   [options.resources] - resources to be used by geocode and autocompletion services :
 * @param {String}   [options.resources.geocode] - resources geocoding, by default : "location"
 * @param {Array}   [options.resources.autocomplete] - resources autocompletion, by default : ["PositionOfInterest", "StreetAddress"]
 * @param {Boolean}  [options.displayAdvancedSearch = true] - False to disable advanced search tools (it will not be displayed). Default is true (displayed)
 * @param {Object}  [options.advancedSearch] - advanced search options for geocoding (filters). Properties can be found among geocode options.filterOptions (see {@link http://ignf.github.io/geoportal-access-lib/latest/jsdoc/module-Services.html#~geocode Gp.Services.geocode})
 * @param {Object}  [options.geocodeOptions = {}] - options of geocode service (see {@link http://ignf.github.io/geoportal-access-lib/latest/jsdoc/module-Services.html#~geocode Gp.Services.geocode})
 * @param {Object}  [options.autocompleteOptions = {}] - options of autocomplete service (see {@link http://ignf.github.io/geoportal-access-lib/latest/jsdoc/module-Services.html#~autoComplete Gp.Services.autoComplete}
 * @param {Object}  [options.autocompleteOptions.serviceOptions] - options of autocomplete service
 * @param {Boolean} [options.autocompleteOptions.triggerGeocode = false] - trigger a geocoding request if the autocompletion does not return any suggestions, false by default
 * @param {Number}  [options.autocompleteOptions.triggerDelay = 1000] - waiting time before sending the geocoding request, 1000ms by default
 * @param {Sting|Numeric|Function} [options.zoomTo] - zoom to results, by default, current zoom.
 *       Value possible : auto or zoom level.
 *       Possible to overload it with a function :
 *       zoomTo : function (info) {
 *           // do some stuff...
 *           return zoom;
 *       }
 * @param {String}  [options.placeholder] - Placeholder in search bar. Default is "Rechercher un lieu, une adresse".
 * @param {Boolean}  [options.displayMarker = true] - set a marker on search result, defaults to true.
 * @param {String}  [options.markerStyle = "lightOrange"] - Marker style. Currently possible values are "lightOrange" (default value), "darkOrange", "red" and "turquoiseBlue".
 * @example
 *  var SearchEngine = ol.control.SearchEngine({
 *      apiKey : "CLEAPI",
 *      collapsed : true,
 *      resources : {
 *          geocode : ["StreetAddress", "PositionOfInterest"],
 *          autocomplete : ["StreetAddress"]
 *      },
 *      advancedSearch : {
 *          PositionOfInterest : [{name : "municipality", title : "Ville"}],
 *          StreetAddress : [{...}]
 *      },
 *      geocodeOptions : {},
 *      autocompleteOptions : {}
 *  });
 */
var SearchEngine = (function (Control) {
    function SearchEngine (options) {
        options = options || {};

        if (!(this instanceof SearchEngine)) {
            throw new TypeError("ERROR CLASS_CONSTRUCTOR");
        }

        // initialisation du composant
        this.initialize(options);

        // // Widget main DOM container
        this._container = this._initContainer();
        // info: le container sera complété lors de l'ajout à la carte (setMap), car certains composants nécessitent d'être liés à la map.
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
    if (Control) SearchEngine.__proto__ = Control;

    /*
     * @lends module:SearchEngine
     */
    SearchEngine.prototype = Object.create(Control.prototype, {});

    // on récupère les méthodes de la classe commune IsoDOM
    Utils.assign(SearchEngine.prototype, SearchEngineDOM);

    /**
     * Constructor (alias)
     *
     * @private
     */
    SearchEngine.prototype.constructor = SearchEngine;

    // ################################################################### //
    // ##################### public methods ############################## //
    // ################################################################### //

    /**
     * Overwrite OpenLayers setMap method
     *
     * @param {ol.Map} map - Map.
     */
    SearchEngine.prototype.setMap = function (map) {
        if (!map) {
            this._clearResults();
        }

        // on appelle la méthode setMap originale d'OpenLayers
        Control.prototype.setMap.call(this, map);
    };

    /**
     * Returns true if widget is collapsed (minimized), false otherwise
     *
     * @returns {Boolean} collapsed - true if widget is collapsed
     */
    SearchEngine.prototype.getCollapsed = function () {
        return this.collapsed;
    };

    /**
     * Collapse or display widget main container
     *
     * @param {Boolean} collapsed - True to collapse widget, False to display it
     */
    SearchEngine.prototype.setCollapsed = function (collapsed) {
        if (collapsed === undefined) {
            logger.log("[ERROR] SearchEngine:setCollapsed - missing collapsed parameter");
            return;
        }
        if ((collapsed && this.collapsed) || (!collapsed && !this.collapsed)) {
            return;
        }
        if (collapsed) {
            this._showSearchEngineInput.click();
        } else {
            this._showSearchEngineInput.click();
        }
        this.collapsed = collapsed;
    };

    // ################################################################### //
    // ##################### init component ############################## //
    // ################################################################### //

    /**
     * Initialize SearchEngine control (called by SearchEngine constructor)
     *
     * @param {Object} options - constructor options
     * @private
     */
    SearchEngine.prototype.initialize = function (options) {
        this._checkInputOptions(options);

        // define default options
        this.options = {
            collapsed : true,
            zoomTo : "",
            resources : {
                geocode : "",
                autocomplete : []
            },
            displayAdvancedSearch : true,
            advancedSearch : {},
            geocodeOptions : {},
            autocompleteOptions : {
                serviceOptions : {},
                triggerGeocode : false,
                triggerDelay : 1000
            },
            displayMarker : true,
            markerStyle : "lightOrange",
            placeholder : "Rechercher un lieu, une adresse"
        };

        // merge with user options
        Utils.mergeParams(this.options, options);
        if (this.options.resources.geocode === "") {
            this.options.resources.geocode = "location";
        }
        if (this.options.resources.autocomplete.length === 0) {
            this.options.resources.autocomplete = ["PositionOfInterest", "StreetAddress"];
        }

        /** {Boolean} specify if searchEngine control is collapsed (true) or not (false) */
        this.collapsed = this.options.collapsed;

        // identifiant du contrôle : utile pour suffixer les identifiants CSS (pour gérer le cas où il y en a plusieurs dans la même page)
        this._uid = SelectorID.generate();

        this._showSearchEngineInput = null;

        // container de l'input de recherche
        this._inputSearchContainer = null;

        // container des reponses de l'autocompletion
        this._autocompleteContainer = null;
        this._suggestedContainer = null;

        // listes des reponses de l'autocompletion
        this._suggestedLocations = [];

        // container des reponses du geocodage
        this._geocodedContainer = null;

        // liste des reponses du geocodage
        this._geocodedLocations = [];

        // container des filtres du geocodage
        this._filterContainer = null;

        // ressource de geocodage selectionnée pour le geocodage avancé
        this._currentGeocodingCode = null;

        // localisant */
        this._currentGeocodingLocation = null;

        // liste des filtres du geocodage pour le geocodage avancé
        this._advancedSearchFilters = {};
        this._initAdvancedSearchFilters();

        // liste des ressources du geocodage pour le geocodage avancé
        this._advancedSearchCodes = [];
        this._initAdvancedSearchCodes();

        // marker
        this._marker = null;

        // marker style
        var _markerStyle = this.options.markerStyle;
        this._markerUrl = (Object.keys(Markers).indexOf(_markerStyle) === -1) ? Markers["lightOrange"] : Markers[_markerStyle];

        // marker display
        this._displayMarker = this.options.displayMarker;

        // popup
        this._popupContent = null;
        this._popupDiv = this._initPopupDiv();
        this._popupOverlay = null;

        // ressources des services d'autocompletion et de geocodage
        this._servicesRightManagement = {};

        /*
         * Droit sur les ressources sur les services.
         * Par defaut, on n'en s'occupe pas
         * sauf si l'autoconfiguration est chargée !
         */
        this._noRightManagement = false;

        // gestion des droits sur les ressources/services
        this._checkRightsManagement();

        // trigger geocode
        this._triggerHandler = null;
    };

    /**
     * this method is called by this.initialize()
     * and makes sure input options are correctly formated
     *
     * @param {Object} options - options
     *
     * @private
     */
    SearchEngine.prototype._checkInputOptions = function (options) {
        var i;

        if (options.resources) {
            // on vérifie que resources est bien un objet
            if (typeof options.resources === "object") {
                // ressources de geocodage
                var geocodeResources = options.resources.geocode;
                if (geocodeResources) {
                    // on vérifie que la liste des ressources de geocodage est bien un tableau
                    if (!Array.isArray(geocodeResources)) {
                        logger.log("[SearchEngine] 'options.resources.geocode' parameter should be an array");
                        geocodeResources = null;
                    }
                    var geocodeResourcesList = ["StreetAddress", "PositionOfInterest", "CadastralParcel"];
                    for (i = 0; i < geocodeResources.length; i++) {
                        if (geocodeResourcesList.indexOf(geocodeResources[i]) === -1) {
                            // si la resource n'est pas référencée, on l'enlève
                            // geocodeResources.splice(i, 1);
                            logger.log("[SearchEngine] options.resources.geocode : " + geocodeResources[i] + " is not a resource for geocode");
                        }
                    }
                }

                // ressources d'autocompletion
                var autocompleteResources = options.resources.autocomplete;
                if (autocompleteResources) {
                    // on vérifie que la liste des ressources d'autocompletion est bien un tableau
                    if (!Array.isArray(autocompleteResources)) {
                        logger.log("[SearchEngine] 'options.resources.autocomplete' parameter should be an array");
                        autocompleteResources = null;
                    }
                    var autocompleteResourcesList = ["StreetAddress", "PositionOfInterest"];
                    for (i = 0; i < autocompleteResources.length; i++) {
                        if (autocompleteResourcesList.indexOf(autocompleteResources[i]) === -1) {
                            // si la resource n'est pas référencée, on l'enlève
                            // autocompleteResources.splice(i, 1);
                            logger.log("[SearchEngine] options.resources.autocomplete : " + autocompleteResources[i] + " is not a resource for autocomplete");
                        }
                    }
                }
            } else {
                logger.log("[SearchEngine] 'resources' parameter should be an object");
                options.resources = null;
            }
        }
    };

    /**
     * this method is called by this.initialize()
     * and initialize the geocoding resources titles.
     *
     * @private
     */
    SearchEngine.prototype._initAdvancedSearchCodes = function () {
        // INFORMATION
        // on y ajoute les filtres attributaires pour une table de ressources
        // selectionnée via un evenement (onchange) de la liste deroulante du
        // menu avancé du geocodage.
        // cf. onGeocodingAdvancedSearchCodeChange() pour la selection de la
        // ressource de geocodage à afficher

        var geocodeResources = this.options.resources.geocode;
        if (geocodeResources === "location") {
            geocodeResources = ["PositionOfInterest", "StreetAddress", "CadastralParcel"];
        }
        if (!Array.isArray(geocodeResources)) {
            geocodeResources = [geocodeResources];
        }
        for (var i = 0; i < geocodeResources.length; i++) {
            switch (geocodeResources[i]) {
                case "PositionOfInterest":
                    this._advancedSearchCodes.push({
                        id : "PositionOfInterest",
                        title : "Lieux/toponymes"
                    });
                    break;
                case "StreetAddress":
                    this._advancedSearchCodes.push({
                        id : "StreetAddress",
                        title : "Adresses"
                    });
                    break;
                case "CadastralParcel":
                    this._advancedSearchCodes.push({
                        id : "CadastralParcel",
                        title : "Parcelles cadastrales"
                    });
                    break;
                default:
                    break;
            }
        }
        // par défaut, au cas où aucune ressource passée en option ne correspond à celles attendues
        if (this._advancedSearchCodes.length === 0) {
            this._advancedSearchCodes = [{
                id : "StreetAddress",
                title : "Adresses"
            }, {
                id : "PositionOfInterest",
                title : "Lieux/toponymes"
            }, {
                id : "CadastralParcel",
                title : "Cadastre"
            }];
        }

        logger.log("advancedSearchCodes", this._advancedSearchCodes);
    };

    /**
     * this method is called by this.onAdd()
     * and initialize the advanced geocoding filters.
     *
     * @private
     */
    SearchEngine.prototype._initAdvancedSearchFilters = function () {
        // liste des filtres par defauts pour toutes les ressources
        this._advancedSearchFilters = SearchEngineUtils.advancedSearchFiltersByDefault;

        // on merge les options avancées avec celles par defaut
        var advancedSearchFiltersCustom = this.options.advancedSearch;
        Utils.assign(this._advancedSearchFilters, advancedSearchFiltersCustom);

        logger.log("advancedSearchFilters", this._advancedSearchFilters);
    };

    /**
     * this method is called by this.initialize() and initialize popup div
     * (to display results information on marker click)
     *
     * @return {Object} element - DOM element for popup
     * @private
     */
    SearchEngine.prototype._initPopupDiv = function () {
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
        this._popupContent.style["min-width"] = "200px";
        element.appendChild(this._popupContent);
        element.appendChild(closer);

        return element;
    };

    // ################################################################### //
    // ######################## DOM initialize ########################### //
    // ################################################################### //

    /**
     * Create control main container
     *
     * @returns {DOMElement} DOM element
     *
     * @private
     */
    SearchEngine.prototype._initContainer = function () {
        // create main container
        var container = this._createMainContainerElement();

        // create show search engine element
        var inputShow = this._showSearchEngineInput = this._createShowSearchEngineElement();
        container.appendChild(inputShow);

        // mode "collapsed"
        if (!this.options.collapsed) {
            inputShow.checked = true;
        }

        // create search engine picto
        var picto = this._createShowSearchEnginePictoElement();
        container.appendChild(picto);

        var search = this._inputSearchContainer = this._createSearchInputElement(this.options.placeholder);
        var context = this;
        if (search.addEventListener) {
            search.addEventListener("click", function () {
                context.onAutoCompleteInputClick();
            });
        } else if (search.attachEvent) {
            search.attachEvent("onclick", function () {
                context.onAutoCompleteInputClick();
            });
        }
        container.appendChild(search);

        if (this.options.displayAdvancedSearch) {
            var advancedShow = this._createShowAdvancedSearchElement();
            container.appendChild(advancedShow);

            // INFO je decompose les appels car j'ai besoin de recuperer le container
            // des filtres
            var advancedPanel = this._createAdvancedSearchPanelElement();
            var advancedHeader = this._createAdvancedSearchPanelHeaderElement();
            var advancedForm = this._createAdvancedSearchPanelFormElement(this._advancedSearchCodes);
            var advancedFormFilters = this._filterContainer = this._createAdvancedSearchFormFiltersElement();
            this._setFilter(this._advancedSearchCodes[0].id); // ex "PositionOfInterest"
            var advancedFormInput = this._createAdvancedSearchFormInputElement();
            advancedForm.appendChild(advancedFormFilters);
            advancedForm.appendChild(advancedFormInput);
            advancedPanel.appendChild(advancedHeader);
            advancedPanel.appendChild(advancedForm);
            container.appendChild(advancedPanel);
        }

        // INFO je decompose les appels car j'ai besoin de recuperer le container
        // des resultats de l'autocompletion
        var autocomplete = this._autocompleteContainer = this._createAutoCompleteElement();
        var autocompleteList = this._suggestedContainer = this._createAutoCompleteListElement();
        autocomplete.appendChild(autocompleteList);
        container.appendChild(autocomplete);

        // INFO je decompose les appels car j'ai besoin de recuperer le container
        // des resultats du geocodage
        var geocode = this._createGeocodeResultsElement();
        var geocodeList = this._geocodedContainer = this._createGeocodeResultsListElement();
        geocode.appendChild(geocodeList);
        container.appendChild(geocode);

        return container;
    };

    /**
     * this method is called by :
     * - this._initContainer() : ...
     * - this.onGeocodingAdvancedSearchCodeChoice() : ...
     * and initialize or create the filters container HTMLElement
     * to the geocoding advanced menu.
     *
     * @param {String} code - resource geocoding name
     *
     * @returns {DOMElement} DOM element
     * @private
     */
    SearchEngine.prototype._setFilter = function (code) {
        // INFORMATION
        // Nous avons 2 solutions possibles pour la mise en place des filtres.
        // 1. Soit on decide de creer tous les filtres pour chaque ressource
        // de geocodage à l'initialisation du composant, et on joue sur le
        // mode 'hidden' pour n'afficher que la ressource selectionnée.
        // 2. Soit on decide de creer à chaque fois les filtres pour la
        // ressource selectionnée.
        // Chaque solution a ses inconvenients/avantages.
        // Implementation du choix 2 car elle offre plus de souplesse pour
        // recuperer les 'form-data'...

        var container = this._filterContainer;

        var codeFound = false;
        for (var i = 0; i < this._advancedSearchCodes.length; i++) {
            if (this._advancedSearchCodes[i].id === code) {
                codeFound = true;
                break;
            }
        }

        if (!codeFound) {
            // cette ressource n'est pas disponible,
            // on supprime les anciens enfants...
            while (container.firstChild) {
                container.removeChild(container.firstChild);
            }
            return;
        }

        // on sauvegarde la ressource de geocodage sélectionnée
        this._currentGeocodingCode = code;

        // on supprime les enfants...
        while (container.firstChild) {
            container.removeChild(container.firstChild);
        }

        var lstAttributs = this._advancedSearchFilters[code];
        if (!lstAttributs || lstAttributs.length === 0) {
            // cette ressource n'est pas parametrable
            return;
        }

        var divTable = this._createAdvancedSearchFiltersTableElement(code, true);

        for (var j = 0; j < lstAttributs.length; j++) {
            var divFilter = this._createAdvancedSearchFiltersAttributElement(lstAttributs[j]);
            divTable.appendChild(divFilter);
        }

        container.appendChild(divTable);

        return container;
    };

    // ################################################################### //
    // ##################### methods rights management ################### //
    // ################################################################### //

    /**
     * this method is called by constructor
     * and check the rights to resources and services
     *
     * @private
     */
    SearchEngine.prototype._checkRightsManagement = function () {
        // INFORMATION
        // l'autoconfiguration n'est utile que pour récupérer la clef si elle
        // n'est pas renseignée, et pour vérifier les droits sur les ressources
        // et les services.

        // si l'autoconfiguration n'est pas chargée,
        // il est toujours possible de requeter le service avec une clef API,
        // mais les droits sur les ressources ne sont pas garantis, on risque
        // d'obtenir des erreurs 403 forbidden..., la responsabilité revient
        // à l'utilisateur (message d'information)...
        // par contre, sans clef API renseignée au niveau du controle,
        // l'utilisateur doit la renseigner au niveau des services...,
        // sinon, Exception du service

        // si l'autoconfiguration est chargée,
        // si une clef API est renseignée au niveau controle, on controle
        // le mapping entre le contrat et la clef...
        // on obtient la liste des ressources ayant droits,
        // si on ne trouve pas de ressources ou certaines ressources ne sont
        // pas disponible, on previent l'utilisateur (message d'information).

        var _resources = null;
        var _key = null;

        // les ressources du service d'autocompletion
        _key = this.options.autocompleteOptions.apiKey;
        // on récupère les éventuelles ressources passées en option, soit dans autocompleteOptions
        _resources = (this.options.autocompleteOptions) ? this.options.autocompleteOptions.type : [];
        // soit dans options.resources.autocomplete
        if (!_resources || _resources.length === 0) {
            _resources = this.options.resources.autocomplete;
        }
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
        logger.log("rightManagementAutoComplete", rightManagementAutoComplete);

        // les ressources du service de geocodage_checkRightsManagement
        // on récupère les éventuelles ressources passées en option, soit dans geocodeOptions :
        _resources = (this.options.geocodeOptions.index) ? this.options.geocodeOptions.index : "";
        // soit directement dans options.resources.geocode :
        if (!_resources || _resources.length === 0) {
            _resources = this.options.resources.geocode;
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
        if (!rightManagementAutoComplete && !rightManagementGeocode) {
            this._noRightManagement = true;
            return;
        }

        // on recupère les informations utiles
        // Ex. la clef API issue de l'autoconfiguration si elle n'a pas
        // été renseignée.
        if (!this.options.apiKey) {
            if (rightManagementGeocode) {
                this.options.apiKey = rightManagementGeocode.key;
            } else {
                this.options.apiKey = rightManagementAutoComplete.key;
            }
        }

        // les ressources par services ayant droit doivent servir pour les
        // appels aux services
        if (rightManagementAutoComplete) {
            this._servicesRightManagement["AutoCompletion"] = rightManagementAutoComplete["AutoCompletion"];
        }

        if (rightManagementGeocode) {
            this._servicesRightManagement["Geocode"] = rightManagementGeocode["Geocode"];
        }
    };

    // ################################################################### //
    // ################ methods to request and results ################### //
    // ################################################################### //

    /**
     * this method is called by this.onAutoCompleteSearch()
     * and executes a request to the service.
     *
     * @param {Object} settings - service settings
     * @param {String}   settings.text - text
     * @param {Function} settings.onSuccess - callback
     * @param {Function} settings.onFailure - callback
     * @private
     */
    SearchEngine.prototype._requestAutoComplete = function (settings) {
        // on ne fait pas de requête si on n'a pas renseigné de parametres !
        if (!settings || (typeof settings === "object" && Object.keys(settings).length === 0)) {
            return;
        }

        // on ne fait pas de requête si la parametre 'text' est vide !
        if (!settings.text) {
            return;
        }

        logger.log(settings);

        var options = {};
        // on recupere les options du service
        Utils.assign(options, this.options.autocompleteOptions.serviceOptions);
        // ainsi que la recherche et les callbacks
        Utils.assign(options, settings);

        // on ajoute le paramètre filterOptions.type spécifiant les ressources.
        var resources = this.options.resources.autocomplete;
        if (resources && Array.isArray(resources)) {
            // il se peut que l'utilisateur ait surchargé ce paramètre dans geocodeOptions,
            if (!options.type) {
                options.type = resources;
            }
        }

        // cas où la clef API n'est pas renseignée dans les options du service,
        // on utilise celle de l'autoconf ou celle renseignée au niveau du controle
        options.apiKey = options.apiKey || this.options.apiKey;

        // si l'utilisateur a spécifié le paramètre ssl au niveau du control, on s'en sert
        // true par défaut (https)
        options.ssl = options.ssl || this.options.ssl || true;

        logger.log(options);

        Gp.Services.autoComplete(options);
    };

    /**
     * this method is called by this.onAutoCompleteSearchText() (case of success)
     * and fills the container of the location list.
     * it creates a HTML Element per location
     *
     * @param {Array} locations - Array of Gp.Services.AutoComplete.SuggestedLocation corresponding to autocomplete results list
     * @private
     */
    SearchEngine.prototype._fillAutoCompletedLocationListContainer = function (locations) {
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

        this._displaySuggestedLocation();
        for (var i = 0; i < locations.length; i++) {
            // Proposals are dynamically filled in Javascript by autocomplete service
            this._createAutoCompletedLocationElement(locations[i], i);
        }
    };

    /**
     * this method is called by this.onAutoCompleteSearch()
     * and executes a request to the service.
     *
     * @param {Object} settings - service settings
     * @param {String}   settings.location - text
     * @param {Function} settings.onSuccess - callback
     * @param {Function} settings.onFailure - callback
     * @private
     */
    SearchEngine.prototype._requestGeocoding = function (settings) {
        // on ne fait pas de requête si on n'a pas renseigné de parametres !
        if (!settings || (typeof settings === "object" && Object.keys(settings).length === 0)) {
            return;
        }

        // on ne fait pas de requête si la parametre 'text' est vide !
        if (settings.query === null) {
            return;
        }

        logger.log(settings);

        var options = {};
        // on recupere les options du service
        Utils.assign(options, this.options.geocodeOptions);
        // ainsi que la recherche et les callbacks
        Utils.assign(options, settings);

        // on ajoute le paramètre index spécifiant les ressources.
        var resources = this.options.resources.geocode;
        if (resources) {
            // il se peut que l'utilisateur ait surchargé ce paramètre dans geocodeOptions,
            // ou qu'il ait déjà été rempli (cas de la recherche avancée)
            if (!options.index) {
                options.index = resources;
            }
        }

        // cas où la clef API n'est pas renseignée dans les options du service,
        // on utilise celle de l'autoconf ou celle renseignée au niveau du controle
        options.apiKey = options.apiKey || this.options.apiKey;

        // si l'utilisateur a spécifié le paramètre ssl au niveau du control, on s'en sert
        // true par défaut (https)
        options.ssl = options.ssl || this.options.ssl || true;

        logger.log(options);

        Gp.Services.geocode(options);
    };

    /**
     * this method is called by this.onGeocodingSearch()
     * and fills the container of the location results.
     * it creates a HTML Element per location
     * (cf. this. ...)
     *
     * @param {Object[]} locations - locations
     *
     * @private
     */
    SearchEngine.prototype._fillGeocodedLocationListContainer = function (locations) {
        if (!locations || locations.length === 0) {
            this._clearGeocodedLocation();
            return;
        }

        // on vide la liste avant de la construire
        var element = this._geocodedContainer;
        if (element.childElementCount) {
            while (element.firstChild) {
                element.removeChild(element.firstChild);
            }
        }

        for (var i = 0; i < locations.length; i++) {
            logger.log(locations[i]);
            // Proposals are dynamically filled in Javascript by autocomplete service
            this._createGeocodedLocationElement(locations[i], i);
        }

        // sauvegarde de l'etat des locations
        this._geocodedLocations = locations;
    };

    // ################################################################### //
    // ######################### other methods ########################### //
    // ################################################################### //

    /**
     * this sends the label to the panel.
     *
     * @param {String} label - label suggested location
     * @private
     */
    SearchEngine.prototype._setLabel = function (label) {
        document.getElementById("GPsearchInputText-" + this._uid).value = label;
    };

    /**
     * this method is called by this.on*ResultsItemClick()
     * and move/zoom on a position.
     *
     * @param {Array} position - ol.Coordinate object [lon, lat] (en lat/lon : "EPSG:4326")
     * @param {Number} zoom - zoom level
     * @private
     */
    SearchEngine.prototype._setPosition = function (position, zoom) {
        var view = this.getMap().getView();
        view.setCenter(position);
        view.setZoom(zoom);
    };

    /**
     * this method is called by this.on*ResultsItemClick()
     * and displays a marker.
     * FIXME
     *
     * @param {Array} position - ol.Coordinate object [lon, lat] ou [x, y]
     * @param {Object} info - location information
     * @private
     */
    SearchEngine.prototype._setMarker = function (position, info) {
        var map = this.getMap();
        var context = this;

        // remove previous markers
        if (this._marker != null) {
            map.removeOverlay(this._marker);
            this._marker = null;
        }

        if (position) {
            // création de l'élément DOM
            var markerDiv = document.createElement("img");
            markerDiv.src = this._markerUrl;

            // ajout de l'évènement onclick (pour afficher une popup)
            if (markerDiv.addEventListener) {
                markerDiv.addEventListener(
                    "click",
                    function () {
                        context._onResultMarkerSelect(info);
                    }
                );
            } else if (markerDiv.attachEvent) {
                // Internet Explorer
                markerDiv.attachEvent(
                    "onclick",
                    function () {
                        context._onResultMarkerSelect(info);
                    }
                );
            }

            // création du marker (overlay)
            this._marker = new Overlay({
                position : position,
                offset : [-25.5, -38],
                element : markerDiv,
                stopEvent : false
            });
            map.addOverlay(this._marker);
        }
    };

    /**
     * this method is called by this.on*ResultsItemClick()
     * and get zoom to results.
     *
     * @param {Object} info - info
     *
     * @returns {Integer} zoom
     * @private
     */
    SearchEngine.prototype._getZoom = function (info) {
        var map = this.getMap();
        var key = this.options.zoomTo;
        var zoom = null;

        // les valeurs du zooms sont determinées
        // soit par les mots clefs suivants :  max, min ou auto
        // soit par un niveau de zoom
        // soit defini par l'utilisateur via une fonction

        if (typeof key === "function") {
            logger.trace("zoom function");
            zoom = key.call(this, info);
        }

        if (typeof key === "number") {
            logger.trace("zoom level");
            zoom = key;
        }

        if (typeof key === "string") {
            // if (key === "max") {
            //     zoom = map.getMaxZoom();
            // } else if (key === "min") {
            //     zoom = map.getMinZoom();
            // } else

            if (key === "auto") {
                logger.trace("zoom auto");
                zoom = SearchEngineUtils.zoomToResultsByDefault(info);
            } else {
                logger.trace("zoom level parsing");
                var value = parseInt(key, 10);
                if (!isNaN(value)) {
                    logger.trace("zoom parsing");
                    zoom = value;
                }
            }
        }

        // polyfill IE
        Number.isInteger = Number.isInteger || function (value) {
            return typeof value === "number" &&
                isFinite(value) &&
                Math.floor(value) === value;
        };

        // test de validité du zoom,
        // on prend le zoom courant par defaut ...
        if (!zoom || zoom === "" || !Number.isInteger(zoom)) {
            logger.trace("zoom not found, current zoom...");
            zoom = map.getView().getZoom();
        }

        // FIXME test si le zoom est dans l'espace de la carte
        var min = map.minZoom; // .getMinZoom();
        var max = map.maxZoom; // .getMaxZoom();
        if (zoom < min) {
            logger.trace("zoom level min...");
            zoom = min;
        }
        if (zoom > max) {
            logger.trace("zoom level max...");
            zoom = max;
        }

        logger.trace("zoom", zoom);
        return zoom;
    };

    /**
     * this method is called on 'click' on this._marker
     * (cf. this._setMarker() )
     * and sets a popup with marker information
     *
     * @param {Object} information - location information
     * @private
     */
    SearchEngine.prototype._onResultMarkerSelect = function (information) {
        var map = this.getMap();

        var popupContent = "";
        if (typeof information !== "string") {
            if (information.service === "GeocodedLocation") {
                popupContent = "<ul>";
                var attributes = information.location.placeAttributes;
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
            } else if (information.service === "SuggestedLocation") {
                popupContent = GeocodeUtils.getSuggestedLocationFreeform(information.location);
            } else {
                popupContent = "sans informations.";
            }
        } else {
            popupContent = information;
        }

        this._popupContent.innerHTML = popupContent;
        if (!this._popupOverlay) {
            // ajout de la popup a la carte comme un overlay
            this._popupOverlay = new Overlay({
                element : this._popupDiv,
                positioning : "bottom-center",
                position : this._marker.getPosition(),
                offset : [0, -42]
            });
            map.addOverlay(this._popupOverlay);
        } else {
            // si l'overlay est déjà créé, on modifie juste sa position
            this._popupOverlay.setPosition(this._marker.getPosition());
        }
    };

    // ################################################################### //
    // ###################### other handlers events ###################### //
    // ################################################################### //

    /**
     * this method is called by event 'click' on 'GPshowSearchEnginePicto' tag label
     * (cf. this._createShowSearchEnginePictoElement), and it cleans the component
     * when it's closed.
     *
     * @private
     */
    SearchEngine.prototype.onShowSearchEngineClick = function () {
        this.collapsed = this._showSearchEngineInput.checked;
        // on génère nous même l'evenement OpenLayers de changement de propriété
        // (utiliser ol.control.SearchEngine.on("change:collapsed", function ) pour s'abonner à cet évènement)
        this.dispatchEvent("change:collapsed");
    };

    /**
     * this method is called by event 'click' on 'GPsearchInputReset' tag div
     * (cf. this._createSearchInputElement), and it cleans the value of input.
     *
     * @private
     */
    SearchEngine.prototype.onSearchResetClick = function () {
        this._clearResults();
    };

    // ################################################################### //
    // ################## handlers events AutoComplete ################### //
    // ################################################################### //

    /**
     * this method is called by event 'click' on 'GPlocationOrigin' input
     *
     * @private
     */
    SearchEngine.prototype.onAutoCompleteInputClick = function () {
        var inputSearchTextContainer = document.getElementById("GPsearchInputText-" + this._uid);
        if (inputSearchTextContainer && !inputSearchTextContainer.disabled && inputSearchTextContainer.value.length > 2) {
            this._displaySuggestedLocation();
        }
    };

    /**
     * this method is called by event 'keyup' on 'GPsearchInputText' tag input
     * (cf. this._createSearchInputElement), and it gets the value of input.
     * this value is passed as a parameter for the service autocomplete (text).
     * the results of the request are displayed into a drop down menu.
     *
     * @param {Object} e - HTMLElement
     * @private
     */
    SearchEngine.prototype.onAutoCompleteSearchText = function (e) {
        var value = e.target.value;
        if (!value) {
            return;
        }

        // aucun droits !
        // on evite une requête...
        if (this._noRightManagement) {
            logger.log("no rights for this service !");
            return;
        }

        // on sauvegarde le localisant
        this._currentGeocodingLocation = value;

        // on limite les requêtes à partir de 3 car. saisie !
        if (value.length < 3) {
            this._clearSuggestedLocation();
            return;
        }

        var _triggerGeocode = this.options.autocompleteOptions.triggerGeocode;
        var _triggerDelay = this.options.autocompleteOptions.triggerDelay;

        // INFORMATION
        // on effectue la requête au service d'autocompletion.
        // on met en place des callbacks afin de recuperer les resultats ou
        // les messages d'erreurs du service.
        // les resultats sont affichés dans une liste deroulante.
        var context = this;
        this._requestAutoComplete({
            text : value,
            // callback onSuccess
            onSuccess : function (results) {
                logger.log("request from AutoComplete", results);
                if (results) {
                    // on sauvegarde l'etat des résultats
                    context._suggestedLocations = results.suggestedLocations;
                    context._locationsToBeDisplayed = [];
                    // on vérifie qu'on n'a pas récupéré des coordonnées nulles (par ex recherche par code postal)
                    for (var i = 0; i < context._suggestedLocations.length; i++) {
                        var ilocation = context._suggestedLocations[i];
                        if (ilocation.position && ilocation.position.x === 0 && ilocation.position.y === 0 && ilocation.fullText) {
                            // si les coordonnées sont nulles, il faut relancer une requête de géocodage avec l'attribut "fullText" récupéré
                            context._getGeocodeCoordinatesFromFullText(ilocation, i);
                        } else {
                            // sinon on peut afficher normalement le résultat dans la liste
                            context._locationsToBeDisplayed.push(ilocation);
                        }
                    };
                    // on affiche les résultats qui n'ont pas des coordonnées nulles
                    context._fillAutoCompletedLocationListContainer(context._locationsToBeDisplayed);
                    // on annule eventuellement une requete de geocodage en cours car on obtient des
                    // de nouveau des resultats d'autocompletion...
                    if (context._triggerHandler) {
                        clearTimeout(context._triggerHandler);
                        context._triggerHandler = null;
                        logger.warn("Cancel a geocode request !");
                    }
                }
            },
            // callback onFailure
            onFailure : function (error) {
                // FIXME
                // où affiche t on les messages : ex. 'No suggestion matching the search' ?
                context._clearSuggestedLocation();
                logger.log(error.message);
                // on envoie une requete de geocodage si aucun resultat d'autocompletion
                // n'a été trouvé ! Et on n'oublie pas d'annuler celle qui est en cours !
                if (error.message === "No suggestion matching the search" && _triggerGeocode /* && value.length === 5 */) {
                    if (context._triggerHandler) {
                        clearTimeout(context._triggerHandler);
                        logger.warn("Cancel the last geocode request !");
                    }
                    context._triggerHandler = setTimeout(
                        function () {
                            logger.warn("Launch a geocode request (code postal) !");
                            context._requestGeocoding({
                                location : value,
                                // callback onSuccess
                                onSuccess : function (results) {
                                    logger.log("request from Geocoding", results);
                                    if (results) {
                                        context._locationsToBeDisplayed = [];
                                        // on modifie la structure des reponses pour être
                                        // compatible avec l'autocompletion !
                                        var locations = results.locations;
                                        for (var i = 0; i < locations.length; i++) {
                                            var location = locations[i];
                                            location.fullText = GeocodeUtils.getGeocodedLocationFreeform(location);
                                            location.position = {
                                                x : location.position.lon,
                                                y : location.position.lat
                                            };
                                            context._locationsToBeDisplayed.push(location);
                                        }
                                        context._fillAutoCompletedLocationListContainer(locations);
                                    }
                                },
                                // callback onFailure
                                onFailure : function (error) {
                                    logger.log(error.message);
                                }
                            });
                        }, _triggerDelay
                    );
                }
            }
        });

        var map = this.getMap();
        map.on(
            "click",
            this._hideSuggestedLocation,
            this
        );
        map.on(
            "pointerdrag",
            this._hideSuggestedLocation,
            this
        );
    };

    /**
     * this method is called by Gp.Services.autoComplete callback in case of success
     * (cf. this.onAutoCompleteSearchText), for suggested locations with null coordinates
     * (case of postalCode research for instance).
     * Send a geocode request with suggested location 'fullText' attribute, to get its coordinates and display it in autocomplete results list container.
     *
     * @param {Gp.Services.AutoCompleteResponse.SuggestedLocation} suggestedLocation - autocompletion result (with null coordinates) to be geocoded
     * @param {Number} i - suggestedLocation position in Gp.Services.AutoCompleteResponse.suggestedLocations autocomplete results list
     * @private
     */
    SearchEngine.prototype._getGeocodeCoordinatesFromFullText = function (suggestedLocation, i) {
        var context = this;
        Gp.Services.geocode({
            apiKey : this.options.apiKey,
            ssl : this.options.ssl,
            q : GeocodeUtils.getSuggestedLocationFreeform(suggestedLocation),
            index : suggestedLocation.type,
            // callback onSuccess
            onSuccess : function (response) {
                logger.log("request from Geocoding (coordinates null)", response);
                if (response.locations && response.locations.length !== 0 && response.locations[0].position) {
                    // on modifie les coordonnées du résultat en EPSG:4326 donc lat,lon
                    /// \TODO verifier si l'inversion des coordonnees est necessaire
                    if (context._suggestedLocations && context._suggestedLocations[i]) {
                        context._suggestedLocations[i].position = {
                            lon : response.locations[0].position.y,
                            lat : response.locations[0].position.x
                        };
                        // et on l'affiche dans la liste
                        context._locationsToBeDisplayed.unshift(context._suggestedLocations[i]);
                        context._fillAutoCompletedLocationListContainer(context._locationsToBeDisplayed);
                    }
                }
            },
            /** callback onFailure */
            onFailure : function () {
                // si on n'a pas réussi à récupérer les coordonnées, on affiche quand même le résultat
                if (context._suggestedLocations && context._suggestedLocations[i]) {
                    context._createAutoCompletedLocationElement(context._suggestedLocations[i], i);
                }
            }
        });
    };

    /**
     * this method is called by event 'click' on 'GPautoCompleteResultsList' tag div
     * (cf. this._createAutoCompleteListElement), and it selects the location.
     * this location displays a marker on the map.
     *
     * @param {Object} e - HTMLElement
     * @private
     */
    SearchEngine.prototype.onAutoCompletedResultsItemClick = function (e) {
        // TODO on souhaite un comportement different pour la selection des reponses
        // de l'autocompletion :
        // - liste deroulante des reponses,
        // - puis possibilité de cliquer sur une suggestion
        // - mais aussi de la choisir avec le clavier (arrow up/down), puis valider
        // par un return
        // cette selection avec les fleches doit mettre à jour le input !
        // (comme un moteur de recherche de navigateur)

        var idx = SelectorID.index(e.target.id);
        logger.log(idx);
        logger.log(this._locationsToBeDisplayed[idx]);

        if (!idx) {
            return;
        }

        var position = [
            this._locationsToBeDisplayed[idx].position.x,
            this._locationsToBeDisplayed[idx].position.y
        ];
        var info = {
            service : "SuggestedLocation",
            location : this._locationsToBeDisplayed[idx]
        };

        // on ajoute le texte de l'autocomplétion dans l'input
        var label = GeocodeUtils.getSuggestedLocationFreeform(this._locationsToBeDisplayed[idx]);
        this._setLabel(label);

        // on sauvegarde le localisant
        this._currentGeocodingLocation = label;

        // Info : la position est en EPSG:4326, à transformer dans la projection de la carte
        var view = this.getMap().getView();
        var mapProj = view.getProjection().getCode();
        if (mapProj !== "EPSG:4326") {
            // on retransforme les coordonnées de la position dans la projection de la carte
            position = olProjTransform(position, "EPSG:4326", mapProj);
        }
        // on centre la vue et positionne le marker, à la position reprojetée dans la projection de la carte
        var zoom = this._getZoom(info);
        this._setPosition(position, zoom);
        if (this._displayMarker) {
            this._setMarker(position, info);
        }
    };

    // ################################################################### //
    // ################### handlers events Geocode ####################### //
    // ################################################################### //

    /**
     * this method is called by event 'submit' on 'GPsearchInput' tag form
     * (cf. this._createSearchInputElement), and it gets the value of input.
     * this value is passed as a parameter for the service geocoding.
     * the results of the request are displayed into a window.
     *
     * @param {Object} e - HTMLElement
     * @private
     */
    SearchEngine.prototype.onGeocodingSearchSubmit = function (e) {
        var value = e.target[0].value;
        if (!value) {
            return;
        }

        // aucun droits !
        // on evite une requête...
        if (this._noRightManagement) {
            logger.log("no rights for this service !");
            return;
        }

        // on sauvegarde le localisant
        this._currentGeocodingLocation = value;

        // on met en place l'affichage des resultats dans une fenetre de recherche.
        var context = this;
        this._requestGeocoding({
            query : value,
            // callback onSuccess
            onSuccess : function (results) {
                logger.log("request from Geocoding", results);
                if (results) {
                    var locations = results.locations;
                    context._fillGeocodedLocationListContainer(locations);
                }
            },
            // callback onFailure
            onFailure : function (error) {
                // FIXME cf. this.onAutoCompleteSearch()
                context._clearGeocodedLocation();
                logger.log(error.message);
            }
        });
    };

    /**
     * this method is called by event 'submit' on 'GPgeocodeResultsList' tag div
     * (cf. this._createGeocodeResultsListElement), and it selects the location.
     * this location displays a marker on the map.
     *
     * @param {Object} e - HTMLElement
     * @private
     */
    SearchEngine.prototype.onGeocodedResultsItemClick = function (e) {
        var idx = SelectorID.index(e.target.id);

        if (!idx) {
            return;
        }

        var position = [
            this._geocodedLocations[idx].position.lon,
            this._geocodedLocations[idx].position.lat
        ];
        var info = {
            service : "GeocodedLocation",
            location : this._geocodedLocations[idx]
        };

        // on ajoute le texte du géocodage dans l'input
        var label = GeocodeUtils.getGeocodedLocationFreeform(this._geocodedLocations[idx]);
        this._setLabel(label);

        // Info : la position est en EPSG:4326, à transformer dans la projection de la carte
        var view = this.getMap().getView();
        var mapProj = view.getProjection().getCode();
        if (mapProj !== "EPSG:4326") {
            // on retransforme les coordonnées de la position dans la projection de la carte
            position = olProjTransform(position, "EPSG:4326", mapProj);
        }
        // on centre la vue et positionne le marker, à la position reprojetée dans la projection de la carte
        var zoom = this._getZoom(info);
        this._setPosition(position, zoom);
        if (this._displayMarker) {
            this._setMarker(position, info);
        }
    };

    // ################################################################### //
    // ############## handlers events Geocode Advanced ################### //
    // ################################################################### //

    /**
     * this method is called by event 'change' on 'GPadvancedSearchCode' tag select
     * (cf. this._createAdvancedSearchFormCodeElement), and it gets the value of
     * option selected.
     * this value is passed as a parameter to create the attributs container.
     *
     * @param {Object} e - HTMLElement
     * @private
     */
    SearchEngine.prototype.onGeocodingAdvancedSearchCodeChange = function (e) {
        logger.log(e);
        var idx = e.target.selectedIndex;
        var value = e.target.options[idx].value;

        if (!value) {
            return;
        }

        // INFORMATION
        // le declenchement de l'evenement va creer un container de filtre à la volée...
        // l'insertion des containers d'attributs dans le DOM sont :
        // - soit GPadvancedSearchFilters > PositionOfInterest
        // - soit GPadvancedSearchFilters > StreetAddress
        // - soit GPadvancedSearchFilters > CadastralParcel
        // cf. _setFilter() pour la creation du container

        this._setFilter(value);
    };

    /**
     * this method is called by event 'submit' on 'GPadvancedSearchForm' tag form
     * (cf. this._createAdvancedSearchPanelFormElement), and it gets the value of all input.
     * this value is passed as a parameter for the service geocoding.
     * the results of the request are displayed into a window.
     *
     * @param {Object} e - HTMLElement
     * @param {Array} data - [{key: ..., value: ...}]
     * @private
     */
    SearchEngine.prototype.onGeocodingAdvancedSearchSubmit = function (e, data) {
        logger.log(data);
        if (!data || data.length === 0) {
            return;
        }

        var _location;
        var _filterOptions = {};

        for (var i = 0; i < data.length; i++) {
            var filter = data[i];
            if (filter.value) {
                _filterOptions[filter.key] = filter.value;
            }
        }

        var inputSearchTextContainer = document.getElementById("GPsearchInputText-" + this._uid);
        _location = inputSearchTextContainer.value;

        // Pour pouvoir utiliser les filtres comme des champs de recherche
        if (this._currentGeocodingCode === "CadastralParcel" && _location === null) {
            _location = "";
        }

        // on met en place l'affichage des resultats dans une fenetre de recherche.
        var context = this;
        this._requestGeocoding({
            query : _location,
            index : this._currentGeocodingCode,
            filters : _filterOptions,
            // callback onSuccess
            onSuccess : function (results) {
                logger.log(results);
                if (results) {
                    var locations = results.locations;
                    context._fillGeocodedLocationListContainer(locations);
                }
            },
            // callback onFailure
            onFailure : function (error) {
                // FIXME cf. this.onAutoCompleteSearch()
                context._clearGeocodedLocation();
                logger.log(error.message);
            }
        });
    };

    /**
     * this method is called by 'onGeocodingAdvancedSearchSubmit' method,
     * in case geocoding type is 'CadastralParcel',
     * and gets request parameters from inputs
     *
     * @param {Object} filterOptions - object with inputs value (department, insee, ...)
     * @returns {String} location - cadastral parcel number : concatenation of inputs values (e.g. : 940670000D0041 or 94067_____0041)
     * @private
     */
    SearchEngine.prototype._getCadastralParcelRequestParams = function (filterOptions) {
        /* info:
            la parcelle cadastrale se compose de 14 chiffres ou lettres, indiquant, de gauche à droite :
            - le code du département (2 caractères)
            - le code commune (3 caractères). (Remarque : code département + code commune = code INSEE)
            - OU le code INSEE de la commune (5 chiffres) (remplace les 2 précédents)
            - le code commune absorbée INSEE, ou '000' (3 caractères),
            - la section (2 caractères),
            - le numéro de parcelle (4 caractères).
            Exemple de parcelle : '940670000D0041'. Si l'identifiant est incomplet (par exemple '940670000D'), le service renverra uniquement les 25 premiers résultats pouvant correspondre.
        */

        var _location = "";

        var l;
        // code département (2 caractères)
        var dep = filterOptions.department;
        if (dep) {
            l = dep.length;
            if (l === 2) {
                _location = dep;
            } else if (l === 1) {
                // si un seul numéro a été saisi, on présume que c'est un numéro < 10
                _location = "0" + dep;
            } else {
                _location = dep.substring(0, 2);
            }
        } else {
            _location = "__";
        }

        // code commune insee (3 caractères)
        var commune = filterOptions.commune;
        if (commune) {
            l = commune.length;
            if (l === 3) {
                _location += commune;
            } else if (l === 2) {
                _location += "_" + commune;
            } else if (l === 1) {
                _location += "__" + commune;
            } else { // l > 3
                _location += commune.substring(0, 3);
            }
        } else {
            _location += "___";
        }

        // code insee (5 caractères) : surcharge les 2 autres si renseigné
        var insee = filterOptions.insee;
        if (insee) {
            if (insee.length === 5) {
                _location = insee;
            }
        }

        // code commune absorbee INSEE (3 caractères)
        var absorbedCity = filterOptions.absorbedCity;
        if (absorbedCity) {
            l = absorbedCity.length;
            if (l === 3) {
                _location += absorbedCity;
            } else if (l < 3) {
                if (l === 2) {
                    _location += "_" + absorbedCity;
                } else if (l === 1) {
                    _location += "__" + absorbedCity;
                }
            } else { // l > 3
                _location += absorbedCity.substring(0, 3);
            }
        } else {
            _location += "___";
        }

        // section (2 caractères)
        var section = filterOptions.section;
        if (section) {
            l = section.length;
            if (l === 2) {
                _location += section;
            } else if (l === 1) {
                _location += "_" + section;
            } else {
                _location += section.substring(0, 2);
            }
        } else {
            _location += "__";
        }

        // numéro de parcelle (4 caractères)
        var number = filterOptions.number;
        if (number) {
            l = number.length;
            if (l === 4) {
                _location += number;
            } else if (l === 3) {
                _location += "_" + number;
            } else if (l === 2) {
                _location += "__" + number;
            } else if (l === 1) {
                _location += "___" + number;
            } else { // l > 4
                _location += number.substring(0, 4);
            }
        } else {
            _location += "___";
        }

        logger.log("location : " + _location);

        return _location;
    };

    // ################################################################### //
    // ############################## clean ############################## //
    // ################################################################### //

    /**
     * this method is called by this.onSearchReset()
     * and it clears all results and the marker.
     *
     * @private
     */
    SearchEngine.prototype._clearResults = function () {
        var map = this.getMap();

        this._currentGeocodingLocation = null;

        this._clearSuggestedLocation();
        this._clearGeocodedLocation();

        this._setMarker();
        // on retire l'overlay de la popup de la carte
        if (this._popupOverlay != null) {
            map.removeOverlay(this._popupOverlay);
            this._popupOverlay = null;
        }
    };

    /**
     * this method is called by this.onAutoCompleteSearchText()
     * and it clears all suggested location.
     *
     * @private
     */
    SearchEngine.prototype._clearSuggestedLocation = function () {
        this._suggestedLocations = [];
        if (this._suggestedContainer) {
            while (this._suggestedContainer.firstChild) {
                this._suggestedContainer.removeChild(this._suggestedContainer.firstChild);
            }
        }
    };

    /**
     * this method is called by event 'click' on map
     * and it hides suggested locations
     *
     * @private
     */
    SearchEngine.prototype._hideSuggestedLocation = function () {
        if (this._autocompleteContainer) {
            this._autocompleteContainer.style.display = "none";
        }
    };

    /**
     * this method is called by event 'click' on label input
     * and it displays suggested location.
     *
     * @private
     */
    SearchEngine.prototype._displaySuggestedLocation = function () {
        if (this._autocompleteContainer) {
            this._autocompleteContainer.style.display = "block";
        }
    };

    /**
     * this method is called by this.onGeocodingAdvancedSearchSubmit()
     * and it clears all geocoded location.
     *
     * @private
     */
    SearchEngine.prototype._clearGeocodedLocation = function () {
        this._geocodedLocations = [];
        if (this._geocodedContainer) {
            while (this._geocodedContainer.firstChild) {
                this._geocodedContainer.removeChild(this._geocodedContainer.firstChild);
            }
        }
    };

    return SearchEngine;
}(Control));

export default SearchEngine;

// Expose SearchEngine as ol.control.SearchEngine (for a build bundle)
if (window.ol && window.ol.control) {
    window.ol.control.SearchEngine = SearchEngine;
}
