/* global KeyboardEvent */
import Gp from "geoportal-access-lib";
import L from "leaflet";
import Logger from "../../Common/Utils/LoggerByDefault";
import RightManagement from "../../Common/Utils/CheckRightManagement";
import ID from "../../Common/Utils/SelectorID";
import SearchEngineUtils from "../../Common/Utils/SearchEngineUtils";
import GeocodeUtils from "../../Common/Utils/GeocodeUtils";
import IconDefault from "./Utils/IconDefault";
import SearchEngineDOM from "../../Common/Controls/SearchEngineDOM";
import Utils from "../../Common/Utils";

var logger = Logger.getLogger("searchengine");

/**
 * @classdesc
 *
 * Leaflet Control Class to search positons of geographic identifiers (places names, address, cadastral parcel) using :
 *
 * - the [geocoding web service of the Geoportal Platform]{@link https://geoservices.ign.fr/documentation/geoservices/geocodage.html}.
 * - the [autocompletion service of the Geoportal Platform]{@link https://geoservices.ign.fr/documentation/geoservices/autocompletion.html}
 * <br/>
 *
 * Use {@link module :Controls.SearchEngine L.geoportalControl.SearchEngine()} factory to create instances of that class.
 *
 * **Extends** Leaflet <a href="http://leafletjs.com/reference.html#control" target="_blank">L.Control</a> native class.
 *
 * @namespace
 * @alias L.geoportalControl.SearchEngine
 */
var SearchEngine = L.Control.extend(/** @lends L.geoportalControl.SearchEngine.prototype */ {

    includes : SearchEngineDOM,

    /**
     * options by default
     *
     * @private
     */
    options : {
        position : "topleft",
        collapsed : true,
        displayInfo : true,
        zoomTo : "",
        resources : [],
        placeholder : "Rechercher un lieu, une adresse",
        displayMarker : true,
        markerStyle : "blue",
        displayAdvancedSearch : true,
        advancedSearch : {},
        geocodeOptions : {},
        autocompleteOptions : {
            serviceOptions : {},
            triggerGeocode : false,
            triggerDelay : 1000
        }
    },

    /**
     * @constructor SearchEngine
     *
     * @private
     * @alias SearchEngine
     * @extends {L.Control}
     * @param {Object} options - control options
     * @param {String} [options.apiKey] - API key, mandatory if autoconf service has not been charged in advance
     * @param {Boolean} [options.ssl = true] - use of ssl or not (default true, service requested using https protocol)
     * @param {Boolean} [options.collapsed] - collapse mode, false by default
     * @param {String} [options.position] - position of component into the map, 'topleft' by default
     * @param {Boolean} [options.displayInfo] - get informations on popup marker
     * @param {Sting|Numeric|Function} [options.zoomTo] - zoom to results, by default, current zoom.
     *       Value possible : auto or zoom level.
     *       Possible to overload it with a function :
     *       zoomTo : function (info) {
     *           // do some stuff...
     *           return zoom;
     *       }
     * @param {String}  [options.placeholder] - set placeholder in search bar. Default is "Rechercher un lieu, une adresse".
     * @param {Boolean}  [options.displayMarker] - set a marker on search result, defaults to true.
     * @param {String|Object}  [options.markerStyle] - set a marker style. Currently possible values are "blue" (default value), "orange", "red" and "green". But you can use an L.Icon object (see {@link http://leafletjs.com/reference-1.2.0.html#icon L.Icon }).
     * @param {Sting} [options.apiKey] - API key, mandatory if autoconf service has not been charged in advance
     * @param {String} [options.resources.geocode] - resources geocoding, by default : "location"
     * @param {Object} [options.resources.autocomplete] - resources to be used by autocompletion service, by default : ["StreetAddress", "PositionOfInterest"]
     * @param {Boolean} [options.displayAdvancedSearch] - False to disable advanced search tools (it will not be displayed). Default is true (displayed)
     * @param {Object} [options.advancedSearch] - advanced search for geocoding (filters)
     * @param {Object} [options.geocodeOptions] - options of geocode service
     * @param {Object} [options.autocompleteOptions] - options of autocomplete service
     * @param {Object} [options.autocompleteOptions.serviceOptions] - options of autocomplete service
     * @param {Boolean} [options.autocompleteOptions.triggerGeocode] - trigger a geocoding request if the autocompletion does not return any suggestions, false by default
     * @param {Number}  [options.autocompleteOptions.triggerDelay] - waiting time before sending the geocoding request, 1000ms by default
     * @example
     *  var SearchEngine = L.geoportalControl.SearchEngine({
     *      position : "topright",
     *      collapsed : true,
     *      displayInfo : true,
     *      displayAdvancedSearch : true,
     *      placeholder : "Rechercher un lieu, une adresse",
     *      displayMarker : true,
     *      markerStyle : L.icon(iconUrl : 'https://maps.google.com/mapfiles/kml/pushpin/ylw-pushpin.png');
     *      zoomTo : 15,
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
     *
     */
    initialize : function (options) {
        // on transmet les options au controle
        L.Util.setOptions(this, options);

        if (typeof this.options.resources === "undefined") {
            this.options.resources = {};
        }

        if (typeof this.options.resources.geocode === "undefined" || this.options.resources.geocode === "") {
            this.options.resources.geocode = "location";
        }
        if (typeof this.options.resources.autocomplete === "undefined" || this.options.resources.autocomplete.length === 0) {
            this.options.resources.autocomplete = ["PositionOfInterest", "StreetAddress"];
        }

        /** uuid */
        this._uid = ID.generate();

        /** affichage du container de saisie */
        this._showContainer = null;
        this._pictoContainer = null;

        /** container de la saisie du la recherche */
        this._inputContainer = null;

        /** container des reponses de l'autocompletion */
        this._suggestedContainer = null;

        /** listes des reponses de l'autocompletion */
        this._suggestedLocations = [];

        /** container des reponses du geocodage */
        this._geocodedContainer = null;

        /** liste des reponses du geocodage */
        this._geocodedLocations = [];

        /** container des filtres du geocodage */
        this._filterContainer = null;

        /** ressource de geocodage selectionnée pour le geocodage avancé */
        this._currentGeocodingCode = null;

        /** localisant */
        this._currentGeocodingLocation = null;

        /** liste des filtres du geocodage pour le geocodage avancé */
        this._advancedSearchFilters = {};

        /** liste des ressources du geocodage pour le geocodage avancé */
        this._advancedSearchCodes = [];

        /** marker */
        this._marker = null;

        /** ressources des services d'autocompletion et de geocodage */
        this._servicesRightManagement = {};

        /**
         * Droit sur les ressources sur les services.
         * Par defaut, on n'en s'occupe pas
         * sauf si l'autoconfiguration est chargée !
         */
        this._noRightManagement = false;

        // gestion des droits sur les ressources/services
        this._checkRightsManagement();

        // trigger geocode
        this._triggerHandler = null;
    },

    /**
     * this method is called by this.addTo(map)
     * and fills variable : this._container = this.onAdd(map)
     *
     * @returns {DOMElement} DOM element
     * @private
     */
    onAdd : function (/* map */) {
        // TODO initialisation des ressources du geocodage avancé
        this._initAdvancedSearchCodes();

        // initialisation des filtres du geocodage avancé
        this._initAdvancedSearchFilters();

        // initialisation du DOM du composant
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
     * @param {Object} map - the map
     *
     * @private
     */
    onRemove : function (map) {
        this._clearSuggestedLocation();
        this._clearGeocodedLocation();

        if (this._marker != null) {
            map.removeLayer(this._marker);
            this._marker = null;
        }
    },

    // ################################################################### //
    // ##################### methods rights management ################### //
    // ################################################################### //

    /**
     * this method is called by constructor
     * and check the rights to resources and services
     *
     * @private
     */
    _checkRightsManagement : function () {
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

        // les ressources du service de geocodage
        // on prend celles des options du services en priorité
        _key = this.options.geocodeOptions.apiKey;
        // on récupère les éventuelles ressources passées en option, soit dans geocodeOptions :
        _resources = (this.options.geocodeOptions.index) ? this.options.geocodeOptions.index : "";
        // soit directement dans options.resources.geocodage :
        if (!_resources) {
            _resources = this.options.resources.geocodage;
        }
        // ou celles par défaut sinon.
        if (!_resources) {
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

        // les ressources du service d'autocompletion
        // on prend celles des options du services en priorité
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

        // au cas où pas de droit !
        if (!rightManagementGeocode && !rightManagementAutoComplete) {
            this._noRightManagement = true;
        }

        // je reconstruis differement la structure pour la gestion des clefs differentes
        // pour chaque service...
        if (rightManagementAutoComplete) {
            this._servicesRightManagement["AutoCompletion"] = {};
            this._servicesRightManagement["AutoCompletion"]["resources"] = rightManagementAutoComplete["AutoCompletion"];
            this._servicesRightManagement["AutoCompletion"]["key"] = rightManagementAutoComplete["key"];
        }

        if (rightManagementGeocode) {
            this._servicesRightManagement["Geocode"] = {};
            this._servicesRightManagement["Geocode"]["resources"] = rightManagementGeocode["Geocode"];
            this._servicesRightManagement["Geocode"]["key"] = rightManagementGeocode["key"];
        }
    },

    // ################################################################### //
    // ########################## methods DOM ############################ //
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

        // create show search engine element
        var inputShow = this._showContainer = this._createShowSearchEngineElement();
        container.appendChild(inputShow);

        // mode "collapsed"
        if (!this.options.collapsed) {
            inputShow.checked = "true";
        }

        // create search engine picto
        var picto = this._pictoContainer = this._createShowSearchEnginePictoElement();
        container.appendChild(picto);

        var search = this._createSearchInputElement(this.options.placeholder);
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
        var autocomplete = this._createAutoCompleteElement();
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
    },

    // ################################################################### //
    // ################# methods Filters Geocode Advanced ################ //
    // ################################################################### //

    /**
     * this method is called by this.onAdd()
     * and initialize the geocoding resources.
     * TODO
     *
     * @private
     */
    _initAdvancedSearchCodes : function () {
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
    },

    /**
     * this method is called by this.onAdd()
     * and initialize the advanced geocoding filters.
     * FIXME
     *
     * @private
     */
    _initAdvancedSearchFilters : function () {
        // FIXME la liste des filtres attributaires doit elle être recuperée
        // de l'objet geocode ? doit on tous les mettre ou doit on faire un choix ?

        // liste des filtres par defauts pour toutes les ressources
        this._advancedSearchFilters = SearchEngineUtils.advancedSearchFiltersByDefault;

        // on merge les options avancées avec celles par defaut
        var advancedSearchFiltersCustom = this.options.advancedSearch;
        Utils.assign(this._advancedSearchFilters, advancedSearchFiltersCustom);

        logger.log("advancedSearchFilters", this._advancedSearchFilters);
    },

    /**
     * this method is called by :
     * - this._initLayout() : ...
     * - this.onGeocodingAdvancedSearchCodeChoice() : ...
     * and initialize or create the filters container HTMLElement
     * to the geocoding advanced menu.
     *
     * @param {String} code - resource geocoding name
     *
     * @returns {DOMElement} DOM element
     *
     * @private
     */
    _setFilter : function (code) {
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
    },

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
     *
     * @private
     */
    _requestAutoComplete : function (settings) {
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
        if (!this._servicesRightManagement["AutoCompletion"]) {
            logger.log("no rights for this service !?");
            return;
        }

        var options = {};
        // on recupere les options du service
        L.Util.extend(options, this.options.autocompleteOptions.serviceOptions);
        // ainsi que la recherche et les callbacks
        L.Util.extend(options, settings);

        var resources = this._servicesRightManagement["AutoCompletion"].resources;
        if (!resources || Object.keys(resources).length === 0) {
            return;
        }

        // au cas où les options du services ne sont pas renseignées, on y ajoute
        // les tables de ressources
        if (resources && L.Util.isArray(resources)) {
            options.type = resources;
        }

        // gestion de la clef !
        var key = this._servicesRightManagement["AutoCompletion"]["key"];

        // cas où la clef API n'est pas renseignée dans les options du service,
        // on utilise celle de l'autoconf ou celle renseignée au niveau du controle
        L.Util.extend(options, {
            apiKey : options.apiKey || this.options.apiKey || key
        });

        // si l'utilisateur a spécifié le paramètre ssl au niveau du control, on s'en sert
        // true par défaut (https)
        L.Util.extend(options, {
            ssl : this.options.ssl
        });

        logger.log(options);

        Gp.Services.autoComplete(options);
    },

    /**
     * this method is called by this.onGeocodingSearch()
     * and fills the container of the location list.
     * it creates a HTML Element per location
     * (cf. this. ...)
     *
     * @param {Array} locations - Array of Gp.Services.AutoComplete.SuggestedLocation corresponding to autocomplete results list
     * @private
     */
    _fillAutoCompletedLocationListContainer : function (locations) {
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
            this._createAutoCompletedLocationElement(locations[i], i);
        }
    },

    /**
     * this method is called by this.onAutoCompleteSearch()
     * and executes a request to the service.
     *
     * @param {Object} settings - service settings
     * @param {String}   settings.location - text
     * @param {Function} settings.onSuccess - callback
     * @param {Function} settings.onFailure - callback
     *
     * @private
     */
    _requestGeocoding : function (settings) {
        // on ne fait pas de requête si on n'a pas renseigné de parametres !
        if (!settings || Object.keys(settings).length === 0) {
            return;
        }

        // on ne fait pas de requête si la parametre 'text' est vide !
        if (!settings.query) {
            return;
        }

        logger.log(settings);

        // on ne fait pas de requête si aucun droit !
        if (this._noRightManagement) {
            logger.log("no rights for all service !?");
            return;
        }

        // gestion des droits !
        if (!this._servicesRightManagement["Geocode"]) {
            logger.log("no rights for this service !?");
            return;
        }

        var options = {};
        // on recupere les options du service
        L.Util.extend(options, this.options.geocodeOptions);
        // ainsi que la recherche, les filtres du geocodage avancé et les callbacks
        L.Util.extend(options, settings);

        // on ajoute le paramètre index spécifiant les ressources.
        var resources = this.options.resources.geocode;
        if (resources) {
            // il se peut que l'utilisateur ait surchargé ce paramètre dans geocodeOptions,
            // ou qu'il ait déjà été rempli (cas de la recherche avancée)
            if (!options.index) {
                options.index = resources;
            }
        }

        // gestion de la clef !
        var key = this._servicesRightManagement["Geocode"]["key"];

        // cas où la clef API n'est pas renseignée dans les options du service,
        // on utilise celle de l'autoconf ou celle renseignée au niveau du controle
        L.Util.extend(options, {
            apiKey : options.apiKey || this.options.apiKey || key
        });

        // si l'utilisateur a spécifié le paramètre ssl au niveau du control, on s'en sert
        // true par défaut (https)
        L.Util.extend(options, {
            ssl : this.options.ssl
        });

        logger.log(options);
        Gp.Services.geocode(options);
    },

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
    _fillGeocodedLocationListContainer : function (locations) {
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
    },

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
    _getGeocodeCoordinatesFromFullText : function (suggestedLocation, i) {
        var _location = GeocodeUtils.getSuggestedLocationFreeform(suggestedLocation);

        var context = this;
        this._requestGeocoding({
            query : _location,
            // callback onSuccess
            onSuccess : function (response) {
                logger.log("request from Geocoding (coordinates null)", response);
                if (response.locations && response.locations.length !== 0 && response.locations[0].position) {
                    // on modifie les coordonnées du résultat en EPSG:4326 donc lat,lon
                    if (context._suggestedLocations && context._suggestedLocations[i]) {
                        context._suggestedLocations[i].position = {
                            lat : response.locations[0].position.y,
                            lon : response.locations[0].position.x
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
    },

    // ################################################################### //
    // ######################### other methods ########################### //
    // ################################################################### //

    /**
     * this sends the label to the input panel.
     *
     * FIXME appel en dur d'un identifiant CSS !
     *
     * @param {String} label - label suggested location
     *
     * @private
     */
    _setLabel : function (label) {
        var element = L.DomUtil.get("GPsearchInputText-" + this._uid);
        element.value = label || "";
    },

    /**
     * this method is called by this.on*ResultsItemClick()
     * and move/zoom on a position.
     *
     * @param {Object} position - {x : ..., y : ...}
     * @param {Number} zoom - zoom level
     *
     * @private
     */
    _setPosition : function (position, zoom) {
        var map = this._map;

        map.setZoomAround(L.latLng(position), zoom, true);
        map.panTo(L.latLng(position));
    },

    /**
     * this method is called by this.on*ResultsItemClick()
     * and get zoom.
     *
     * @param {Object} info - info
     *
     * @returns {Integer} zoom level
     *
     * @private
     */
    _getZoom : function (info) {
        var map = this._map;
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
            zoom = map.getZoom();
        }

        // test si le zoom est dans l'espace de la carte
        var min = map.getMinZoom();
        var max = map.getMaxZoom();
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
    },

    /**
     * this method is called by this.on*ResultsItemClick()
     * and displays a marker.
     * FIXME
     *
     * @param {Object} position - position {x : ..., y : ...}
     * @param {Object} information - suggested or geocoded information
     * @param {Boolean} display - display a popup information
     * @param {String} marker - style style
     *
     * @private
     */
    _setMarker : function (position, information, display, marker) {
        var map = this._map;
        if (this._marker != null) {
            map.removeLayer(this._marker);
            this._marker = null;
        }

        if (position) {
            var _icon = null;
            if (typeof marker === "string") {
                _icon = new IconDefault(marker);
            } else if (marker instanceof L.Icon) {
                _icon = marker;
            } else {
                _icon = new IconDefault("blue");
                logger.log("Utilisation du marker par défaut !");
            }

            // cf. http://leafletjs.com/reference.html#marker-options
            var options = {
                clickable : true,
                zIndexOffset : 1000,
                icon : _icon
            };

            this._marker = L.marker(L.latLng(position), options);
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

                this._marker.bindPopup(popupContent);
            }
        }
    },

    /**
     * this method is called by this.onSearchReset()
     * and it clears all results and the marker.
     *
     * @private
     */
    _clearResults : function () {
        this._currentGeocodingLocation = null;

        this._clearSuggestedLocation();
        this._clearGeocodedLocation();

        this._setMarker();
    },

    /**
     * this method is called by this.onAutoCompleteSearchText()
     * and it clears all suggested location.
     *
     * @private
     */
    _clearSuggestedLocation : function () {
        this._suggestedLocations = [];
        if (this._suggestedContainer) {
            while (this._suggestedContainer.firstChild) {
                this._suggestedContainer.removeChild(this._suggestedContainer.firstChild);
            }
        }
    },

    /**
     * this method is called by this.onGeocodingAdvancedSearchSubmit()
     * and it clears all geocoded location.
     *
     * @private
     */
    _clearGeocodedLocation : function () {
        this._geocodedLocations = [];
        if (this._geocodedContainer) {
            while (this._geocodedContainer.firstChild) {
                this._geocodedContainer.removeChild(this._geocodedContainer.firstChild);
            }
        }
    },

    // ################################################################### //
    // ###################### other handlers events ###################### //
    // ################################################################### //

    /**
     * this method is called by event 'click' on 'GPshowSearchEnginePicto' tag label
     * (cf. this._createShowSearchEnginePictoElement), and it cleans the component
     * when it's closed.
     * FIXME
     *
     * @private
     */
    onShowSearchEngineClick : function () {
        // FIXME on nettoie ou pas ?
        // this._clearResults();
    },

    /**
     * this method is called by event 'click' on 'GPsearchInputReset' tag div
     * (cf. this._createSearchInputElement), and it cleans the value of input.
     *
     * @private
     */
    onSearchResetClick : function () {
        this._clearResults();
    },

    // ################################################################### //
    // ################## handlers events AutoComplete ################### //
    // ################################################################### //

    /**
     * this method is called by event 'keyup' on 'GPsearchInputText' tag input
     * (cf. this._createSearchInputElement), and it gets the value of input.
     * this value is passed as a parameter for the service autocomplete (text).
     * the results of the request are displayed into a drop down menu.
     * FIXME
     *
     * @param {Object} e - HTMLElement
     *
     * @private
     */
    onAutoCompleteSearchText : function (e) {
        var value = e.target.value;
        if (!value) {
            return;
        }

        // aucun droits !
        // on evite une requête...
        if (this._noRightManagement) {
            return;
        }

        // on sauvegarde le localisant
        this._currentGeocodingLocation = value;

        // on limite les requêtes à partir de 3 car. saisie !
        if (value.length < 3) {
            return;
        }

        var _triggerGeocode = this.options.autocompleteOptions.triggerGeocode;
        var _triggerDelay = this.options.autocompleteOptions.triggerDelay;

        // INFORMATION
        // on effectue la requête au service d'autocompletion.
        // on met en place des callbacks afin de recuperer les resultats ou
        // les messages d'erreurs du service.
        // les resultats sont affichés dans une liste deroulante.
        // les messages d'erreurs sont affichés sur la console (?)

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
                    if (context._servicesRightManagement["Geocode"] && context._servicesRightManagement["Geocode"]["key"]) {
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
                    } else {
                        // si on n'a aucun droit d'accès au géocodage, on affiche la liste telle quelle (pas d'autre option pour les coordonnées nulles)
                        context._locationsToBeDisplayed = context._suggestedLocations;
                    }
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
                if (error.message === "No suggestion matching the search" && _triggerGeocode) {
                    if (context._triggerHandler) {
                        clearTimeout(context._triggerHandler);
                        logger.warn("Cancel the last geocode request !");
                    }
                    context._triggerHandler = setTimeout(
                        function () {
                            logger.warn("Launch a geocode request (code postal) !");
                            context._requestGeocoding({
                                query : value,
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
    },

    /**
     * this method is called by event 'click' on 'GPautoCompleteResultsList' tag div
     * (cf. this._createAutoCompleteListElement), and it selects the location.
     * this location displays a marker on the map.
     * FIXME
     *
     * @param {Object} e - HTMLElement
     *
     * @private
     */
    onAutoCompletedResultsItemClick : function (e) {
        var idx = ID.index(e.target.id);
        var label = e.target.innerHTML;
        logger.log(idx, label);
        logger.log(this._locationsToBeDisplayed[idx]);

        if (!idx) {
            return;
        }

        // FIXME
        // les coordonnées sont inversées entre les 2 services !?
        // AutoCompletion : lon/lat
        // Geocoding : lat/lon
        var position = {
            lat : this._locationsToBeDisplayed[idx].position.y,
            lon : this._locationsToBeDisplayed[idx].position.x
        };
        var info = {
            service : "SuggestedLocation",
            location : this._locationsToBeDisplayed[idx]
        };

        var zoom = this._getZoom(info);

        this._setLabel(label);
        this._setPosition(position, zoom);
        if (this.options.displayMarker) {
            this._setMarker(position, info, this.options.displayInfo, this.options.markerStyle);
        }
    },

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
     *
     * @private
     */
    onGeocodingSearchSubmit : function (e) {
        logger.log(e);
        var value = e.target[0].value;
        if (!value) {
            return;
        }

        // aucun droits !
        // on evite une requête...
        if (this._noRightManagement) {
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
    },

    /**
     * this method is called by event 'submit' on 'GPgeocodeResultsList' tag div
     * (cf. this._createGeocodeResultsListElement), and it selects the location.
     * this location displays a marker on the map.
     *
     * @param {Object} e - HTMLElement
     *
     * @private
     */
    onGeocodedResultsItemClick : function (e) {
        var idx = ID.index(e.target.id);
        var label = e.target.innerHTML;

        logger.log(idx, label);
        logger.log(this._geocodedLocations[idx]);

        if (!idx) {
            return;
        }

        var position = this._geocodedLocations[idx].position;
        var info = {
            service : "GeocodedLocation",
            location : this._geocodedLocations[idx]
        };

        var zoom = this._getZoom(info);

        this._setLabel(label);
        this._setPosition(position, zoom);
        if (this.options.displayMarker) {
            this._setMarker(position, info, this.options.displayInfo, this.options.markerStyle);
        }
    },

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
     *
     * @private
     */
    onGeocodingAdvancedSearchCodeChange : function (e) {
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
    },

    /**
     * this method is called by event 'submit' on 'GPadvancedSearchForm' tag form
     * (cf. this._createAdvancedSearchPanelFormElement), and it gets the value of all input.
     * this value is passed as a parameter for the service geocoding.
     * the results of the request are displayed into a window.
     * TODO
     *
     * @param {Object} e - HTMLElement
     * @param {Array} data - [{key : ..., value : ...}]
     *
     * @private
     */
    onGeocodingAdvancedSearchSubmit : function (e, data) {
        logger.log(data);
        if (!data || data.length === 0) {
            return;
        }

        // recuperation des parametres des filtres pour les transmettre
        // à la requête, ainsi que le type de table de ressources de geocodage,
        // et le localisant
        var _index = this._currentGeocodingCode;
        var inputSearchTextContainer = L.DomUtil.get("GPsearchInputText-" + this._uid);
        var _location = inputSearchTextContainer.value;
        var _filterOptions = {};

        for (var i = 0; i < data.length; i++) {
            var filter = data[i];
            if (filter.value) {
                _filterOptions[filter.key] = filter.value;
            }
        }

        // on met en place l'affichage des resultats dans une fenetre de recherche.
        var context = this;
        this._requestGeocoding({
            query : _location,
            index : _index,
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
    },

    // ################################################################### //
    // ###### METHODES PUBLIQUES (INTERFACE AVEC LE CONTROLE) ############ //
    // ################################################################### //

    /**
     * This method is public.
     * It allows to control the execution of a geocoding or an autocompletion.
     *
     * @param {String} text - location
     * @param {Boolean} type - true (geocoding) / false (autocompletion)
     * @param {Object} options - options
     */
    setText : function (text, type, options) {
        if (!this._showContainer.checked) {
            this._pictoContainer.click();
        }

        // on récupere les options des services
        L.Util.extend(this.options, options);

        var element = L.DomUtil.get("GPsearchInputText-" + this._uid);
        element.value = text;
        if (type) {
            var form = L.DomUtil.get("GPsearchInput-" + this._uid);
            form.dispatchEvent(new Event("submit", {
                bubbles : true,
                cancelable : true
            }));
        } else {
            element.dispatchEvent(new KeyboardEvent("keyup"));
        }
    }
});

export default SearchEngine;
