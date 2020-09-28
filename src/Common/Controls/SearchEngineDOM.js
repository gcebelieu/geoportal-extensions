import ID from "../Utils/SelectorID";
import GeocodeUtils from "../Utils/GeocodeUtils";

var SearchEngineDOM = {

    /**
    * Add uuid to the tag ID
    * @param {String} id - id selector
    * @returns {String} uid - id selector with an unique id
    */
    _addUID : function (id) {
        var uid = (this._uid) ? id + "-" + this._uid : id;
        return uid;
    },

    /**
     * Main container (DOM)
     *
     * @returns {DOMElement} DOM element
     */
    _createMainContainerElement : function () {
        var container = document.createElement("div");
        container.id = this._addUID("GPsearchEngine");
        container.className = "GPwidget";
        return container;
    },

    // ################################################################### //
    // ################### Methods of main container ##################### //
    // ################################################################### //

    /**
     * Hidden checkbox for minimizing/maximizing
     *
     * @returns {DOMElement} DOM element
     */
    _createShowSearchEngineElement : function () {
        var input = document.createElement("input");
        input.id = this._addUID("GPshowSearchEngine");
        input.type = "checkbox";
        return input;
    },

    /**
     * Show search engine
     *
     * @returns {DOMElement} DOM element
     */
    _createShowSearchEnginePictoElement : function () {
        // contexte d'execution
        var self = this;

        var label = document.createElement("label");
        label.id = this._addUID("GPshowSearchEnginePicto");
        label.className = "GPshowAdvancedToolPicto";
        label.htmlFor = this._addUID("GPshowSearchEngine");
        label.title = "Afficher/masquer la recherche par lieux";

        // Close all results and panels when minimizing the widget
        label.addEventListener("click", function () {
            document.getElementById(self._addUID("GPautoCompleteList")).style.display = "none";
            document.getElementById(self._addUID("GPgeocodeResultsList")).style.display = "none";
            var showAdvancedSearch = document.getElementById(self._addUID("GPshowAdvancedSearch"));
            if (showAdvancedSearch) {
                showAdvancedSearch.style.display = null;
                document.getElementById(self._addUID("GPadvancedSearchPanel")).style.display = "none";
            }
            var id = "#GPsearchInput-" + self._uid;
            document.querySelector(id + " input").disabled = false; // FIXME form[id^=GPsearchInput] = #GPsearchInput ?
            self.onShowSearchEngineClick();
        });

        var spanOpen = document.createElement("span");
        spanOpen.id = this._addUID("GPshowSearchEngineOpen");
        spanOpen.className = "GPshowAdvancedToolOpen";
        label.appendChild(spanOpen);

        return label;
    },

    /**
     * Simple search input
     * @param {String} placeholder - placeholder
     *
     * @returns {DOMElement} DOM element
     */
    _createSearchInputElement : function (placeholder) {
        // contexte d'execution
        var self = this;

        var form = document.createElement("form");
        form.id = this._addUID("GPsearchInput");
        // Open geocode results panel when submitting the input
        form.addEventListener("submit", function (e) {
            e.preventDefault();
            document.getElementById(self._addUID("GPgeocodeResultsList")).style.display = "block";
            document.getElementById(self._addUID("GPautoCompleteList")).style.display = "none";
            // cf. FIXME
            // document.querySelector("#GPsearchInput input").blur ();

            // gestionnaire d'evenement :
            // on récupère la valeur de saisie pour requête sur le service de geocodage
            self.onGeocodingSearchSubmit(e);
            return false;
        });

        var input = document.createElement("input");
        input.id = this._addUID("GPsearchInputText");
        input.type = "text";
        input.placeholder = placeholder;
        input.autocomplete = "off";
        // Manage autocomplete list appearance when filling the address input
        input.addEventListener("keyup", function (e) {
            var charCode = e.which || e.keyCode;
            if (charCode === 13 || charCode === 10 || charCode === 38 || charCode === 40) {
                return;
            }
            document.getElementById(self._addUID("GPgeocodeResultsList")).style.display = "none";
            if (input.value.length > 2) {
                document.getElementById(self._addUID("GPautoCompleteList")).style.display = "block";
            } else {
                document.getElementById(self._addUID("GPautoCompleteList")).style.display = "none";
            }
            // gestionnaire d'evenement :
            // on récupère la valeur de saisie pour requête sur le service d'autocompletion
            self.onAutoCompleteSearchText(e);
        });

        // FIXME ce code interfere avec le click sur la liste des suggested locations !
        // input.addEventListener("blur", function(e) {
        //     document.getElementById(self._addUID("GPautoCompleteList")).style.display = "none";
        // });

        input.addEventListener("keydown", function (e) {
            // FIXME
            // l'action clavier 'enter (13)' lance le submit de la form !
            // Ce comportement n'est pas souhaité car le submit execute un geocodage !
            // Il faut donc trouver le moyen d'eviter le submit sur un return venant
            // seulement d'une selection de suggestion...

            var charCode = e.which || e.keyCode;

            var container = document.getElementById(self._addUID("GPautocompleteResults"));

            // si aucun container !?
            if (!container) {
                return;
            }

            var curr = container.getElementsByClassName("GPautoCompleteProposal current");
            var list = container.getElementsByClassName("GPautoCompleteProposal");

            // si aucune suggestion, on ne va pas plus loin !
            var length = list.length;
            if (!length) {
                return;
            }

            var current = null;

            // si aucun item courant, on prend le 1er !
            if (!curr.length) {
                current = list[0];
                current.className = "GPautoCompleteProposal current";
                current.style.color = "#000000";
                current.style["background-color"] = "#CEDBEF";
                return;
            } else {
                current = curr[0];
            }

            var index = parseInt(ID.index(current.id), 10);
            var next = (index === length - 1) ? list[0] : list[index + 1];
            var prev = (index === 0) ? list[length - 1] : list[index - 1];

            current.style["background-color"] = "";
            current.style.color = "";
            prev.style["background-color"] = "";
            prev.style.color = "";
            next.style["background-color"] = "";
            next.style.color = "";

            switch (charCode) {
                case 38: // arrow up
                    current.className = "GPautoCompleteProposal";
                    prev.className = "GPautoCompleteProposal current";
                    prev.style.color = "#000000";
                    prev.style["background-color"] = "#CEDBEF";
                    break;
                case 40: // arrow down
                    current.className = "GPautoCompleteProposal";
                    next.className = "GPautoCompleteProposal current";
                    next.style.color = "#000000";
                    next.style["background-color"] = "#CEDBEF";
                    break;
                case 13: // enter
                    // cf. FIXME
                    e.preventDefault();
                    current.click(e);
                    break;
            }

            current.focus();
        });

        form.appendChild(input);

        var div = document.createElement("div");
        div.id = this._addUID("GPsearchInputReset");
        // Reset input
        div.addEventListener("click", function () {
            document.getElementById(self._addUID("GPsearchInputText")).value = "";
            document.getElementById(self._addUID("GPautoCompleteList")).style.display = "none";
            document.getElementById(self._addUID("GPgeocodeResultsList")).style.display = "none";
            self.onSearchResetClick();
        });
        form.appendChild(div);

        return form;
    },

    /**
     * Show advanced search panel
     *
     * @returns {DOMElement} DOM element
     */
    _createShowAdvancedSearchElement : function () {
        // contexte d'execution
        var self = this;

        var div = document.createElement("div");
        div.id = this._addUID("GPshowAdvancedSearch");
        div.className = "GPshowAdvancedToolPicto";
        div.title = "Ouvrir la recherche avancée";

        // Open advanced search
        div.addEventListener("click", function () {
            var id = "#GPsearchInput-" + self._uid;
            document.querySelector(id + " input").disabled = true;
            document.getElementById(self._addUID("GPautoCompleteList")).style.display = "none";
            document.getElementById(self._addUID("GPgeocodeResultsList")).style.display = "none";
            document.getElementById(self._addUID("GPshowAdvancedSearch")).style.display = "none";
            document.getElementById(self._addUID("GPadvancedSearchPanel")).style.display = "inline-block";
        });

        var span = document.createElement("span");
        span.id = this._addUID("GPshowAdvancedSearchOpen");
        span.className = "GPshowAdvancedToolOpen";
        div.appendChild(span);

        return div;
    },

    /**
     * Advanced search panel
     *
     * FIXME
     * don't call this._createAdvancedSearchPanelHeaderElement
     * don't call this._createAdvancedSearchPanelFormElement
     *
     * @returns {DOMElement} DOM element
     */
    _createAdvancedSearchPanelElement : function () {
        var div = document.createElement("div");
        div.id = this._addUID("GPadvancedSearchPanel");
        div.className = "GPpanel";
        div.style.display = "none";

        // FIXME on decompose la fonction pour les besoins du controle,
        // on ajoutera ces childs à la main...
        // div.appendChild(this._createAdvancedSearchPanelHeaderElement ());
        // div.appendChild(this._createAdvancedSearchPanelFormElement ());

        return div;
    },

    /**
     * Geocoding results
     *
     * FIXME
     * don't call this._createGeocodeResultsListElement
     *
     * @returns {DOMElement} DOM element
     */
    _createGeocodeResultsElement : function () {
        var div = document.createElement("div");
        div.id = this._addUID("GPgeocodeResultsList");
        div.className = "GPpanel";
        div.style.display = "none";

        div.appendChild(this._createGeocodeResultsHeaderElement());

        // FIXME on decompose la fonction pour les besoins du controle,
        // on ajoutera ces childs à la main...
        // div.appendChild(this._createGeocodeResultsListElement ());

        return div;
    },

    /**
     * Autocompletion results
     *
     * FIXME
     * don't call this._createAutoCompleteListElement
     *
     * @returns {DOMElement} DOM element
     */
    _createAutoCompleteElement : function () {
        var div = document.createElement("div");
        div.id = this._addUID("GPautoCompleteList");
        div.className = "GPautoCompleteList"; // GPpanel ?
        div.style.display = "none";

        // FIXME on decompose la fonction pour les besoins du controle,
        // on ajoutera ces childs à la main...
        // div.appendChild(this._createAutoCompleteListElement ());

        return div;
    },

    // ################################################################### //
    // ################### Autocompletion container ###################### //
    // ################################################################### //

    /**
     * Autocompletion results list.
     *
     * @returns {DOMElement} DOM element
     */
    _createAutoCompleteListElement : function () {
        // contexte d'execution
        var self = this;

        var container = document.createElement("div");
        container.id = this._addUID("GPautocompleteResults");

        if (container.addEventListener) {
            container.addEventListener("click", function (e) {
                self.onAutoCompletedResultsItemClick(e);
                document.getElementById(self._addUID("GPautoCompleteList")).style.display = "none";
            }, false);
        } else if (container.attachEvent) {
            container.attachEvent("onclick", function (e) {
                self.onAutoCompletedResultsItemClick(e);
                document.getElementById(self._addUID("GPautoCompleteList")).style.display = "none";
            });
        }

        // Proposals are dynamically filled in Javascript by autocomplete service
        // <div class="GPautoCompleteProposal">...</div>

        return container;
    },

    /**
     * Autocompletion result.
     * Proposals are dynamically filled in Javascript by autocomplete service
     *
     * TODO formaliser le contenu des reponse
     *
     * @param {Object} location - suggested or geocoded location results
     * @param {Number} id - ID
     */
    _createAutoCompletedLocationElement : function (location, id) {
        var container = document.getElementById(this._addUID("GPautocompleteResults"));

        var div = document.createElement("div");
        div.id = this._addUID("AutoCompletedLocation_" + id);
        div.className = "GPautoCompleteProposal";
        div.innerHTML = GeocodeUtils.getSuggestedLocationFreeform(location);
        if (div.addEventListener) {
            div.addEventListener("click", function (e) {
                container.click(e);
            }, false);
        } else if (div.attachEvent) {
            div.attachEvent("onclick", function (e) {
                container.click(e);
            });
        }

        container.appendChild(div);
    },

    // ################################################################### //
    // ############### Geocoding with advanced container ################# //
    // ################################################################### //

    /**
     * @returns {DOMElement} DOM element
     */
    _createAdvancedSearchPanelHeaderElement : function () {
        // contexte d'execution
        var self = this;

        var container = document.createElement("div");
        container.className = "GPpanelHeader";

        var divTitle = document.createElement("div");
        divTitle.className = "GPpanelTitle";
        divTitle.innerHTML = "Recherche avancée";
        container.appendChild(divTitle);

        var divClose = document.createElement("div");
        divClose.id = this._addUID("GPadvancedSearchClose");
        divClose.className = "GPpanelClose";
        divClose.title = "Fermer la recherche avancée";

        if (divClose.addEventListener) {
            divClose.addEventListener("click", function () {
                var id = "#GPsearchInput-" + self._uid;
                document.querySelector(id + " input").disabled = false;
                document.getElementById(self._addUID("GPgeocodeResultsList")).style.display = "none";
                document.getElementById(self._addUID("GPshowAdvancedSearch")).style.display = "inline-block";
                document.getElementById(self._addUID("GPadvancedSearchPanel")).style.display = "none";
            }, false);
        } else if (divClose.attachEvent) {
            divClose.attachEvent("onclick", function () {
                var id = "#GPsearchInput-" + self._uid;
                document.querySelector(id + " input").disabled = false;
                document.getElementById(self._addUID("GPgeocodeResultsList")).style.display = "none";
                document.getElementById(self._addUID("GPshowAdvancedSearch")).style.display = "inline-block";
                document.getElementById(self._addUID("GPadvancedSearchPanel")).style.display = "none";
            });
        }

        container.appendChild(divClose);

        return container;
    },

    /**
     * @param {Object[]} advancedSearchCodes - codes
     *
     * @returns {DOMElement} DOM element
     */
    _createAdvancedSearchPanelFormElement : function (advancedSearchCodes) {
        // contexte d'execution
        var self = this;

        var form = document.createElement("form");
        form.id = this._addUID("GPadvancedSearchForm");
        form.addEventListener("submit", function (e) {
            e.preventDefault();
            // data
            var data = [];
            // liste des attributs de la ressource de geocodage
            var id = "#GPadvancedSearchFilters-" + self._uid;
            var matchesFilters = document.querySelectorAll(id + " > div > div > input");
            for (var i = 0; i < matchesFilters.length; i++) {
                var element = matchesFilters[i];
                data.push({
                    key : element.name,
                    value : element.value
                });
            }

            // gestionnaire d'evenement :
            // on récupère les valeurs de saisies pour requête sur le service de geocodage
            self.onGeocodingAdvancedSearchSubmit(e, data);
            document.getElementById(self._addUID("GPgeocodeResultsList")).style.display = "block";

            return false;
        });

        var div = document.createElement("div");
        div.className = "GPflexInput";

        var label = document.createElement("label");
        label.className = "GPadvancedSearchCodeLabel";
        label.innerHTML = "Recherche par";
        div.appendChild(label);

        var select = this._createAdvancedSearchFormCodeElement(advancedSearchCodes);
        div.appendChild(select);

        // FIXME on decompose la fonction pour les besoins du controle,
        // on ajoutera ces childs à la main...

        // var filters = this._createAdvancedSearchFormFiltersElement ();
        // form.appendChild(filters);

        // var input = this._createAdvancedSearchFormInputElement ();
        // form.appendChild(input);

        form.appendChild(div);

        return form;
    },

    /**
     * @param {Object[]} codes - codes
     * @returns {DOMElement} DOM element
     */
    _createAdvancedSearchFormCodeElement : function (codes) {
        // contexte d'execution
        var self = this;

        var select = document.createElement("select");
        select.id = this._addUID("GPadvancedSearchCode");
        select.className = "GPadvancedSearchCode";
        select.addEventListener("change", function (e) {
            // var idx   = e.target.selectedIndex;
            // var value = e.target.options[idx].value;
            // gestionnaire d'evenement :
            // permet de recuperer des informations diverses...
            self.onGeocodingAdvancedSearchCodeChange(e);
        }, false);

        // liste statique au cas où des codes n'ont pas été passés en entrée
        if (!codes) {
            codes = [{
                id : "PositionOfInterest",
                title : "Lieux/toponymes"
            }, {
                id : "StreetAddress",
                title : "Adresses"
            }, {
                id : "CadastralParcel",
                title : "Parcelles cadastrales"
            }];
        }

        for (var i = 0; i < codes.length; i++) {
            var option = document.createElement("option");
            option.value = codes[i].id;
            option.text = codes[i].title;
            select.appendChild(option);
        }

        return select;
    },

    /**
     * @returns {DOMElement} DOM element
     */
    _createAdvancedSearchFormInputElement : function () {
        var input = document.createElement("input");
        input.type = "submit";
        input.id = this._addUID("GPadvancedSearchSubmit");
        input.className = "GPinputSubmit";
        input.value = "Chercher";

        return input;
    },

    /**
     * Filters geocoding.
     *
     * @returns {DOMElement} DOM element
     */
    _createAdvancedSearchFormFiltersElement : function () {
        var container = document.createElement("div");
        container.id = this._addUID("GPadvancedSearchFilters");
        return container;
    },

    /**
     * Create filter container for resources :
     * "PositionOfInterest", "StreetAddress", ...
     *
     * @param {String} code - code of geocoding resource
     * @param {Boolean} display - display
     *
     * @returns {DOMElement} DOM element
     */
    _createAdvancedSearchFiltersTableElement : function (code, display) {
        var container = document.createElement("div");
        container.id = this._addUID(code);
        if (!display) {
            container.style.display = "none";
        }

        return container;
    },

    /**
     * Create filter attribut for a resource :
     * "PositionOfInterest", "StreetAddress", ...
     * Research filters are filled in Javascript depending on developer choice
     *
     * @param {Object} filterAttributes - filter attributes :
     * @param {String} filterAttributes.code - code of geocoding resource
     * @param {String} filterAttributes.name - ID
     * @param {String} filterAttributes.title - label
     * @param {String} filterAttributes.description - description
     * @param {String} filterAttributes.value - value
     *
     * @returns {DOMElement} DOM element
     */
    _createAdvancedSearchFiltersAttributElement : function (filterAttributes) {
        // INFORMATION
        // cette methode peut être appelée si le document n'existe pas, elle
        // permet ainsi de creer une div sans insertion dans le container...

        var container = null;
        var name = filterAttributes.name;
        var title = filterAttributes.title;
        var description = filterAttributes.description;
        var code = filterAttributes.code;
        var value = filterAttributes.value;

        var div = document.createElement("div");
        div.className = "GPflexInput";

        var label = document.createElement("label");
        label.className = "GPadvancedSearchFilterLabel";
        label.htmlFor = name;
        label.title = description || title;
        label.innerHTML = title;
        div.appendChild(label);

        var input = document.createElement("input");
        input.id = name;
        input.className = "GPadvancedSearchFilterInput";
        input.type = "text";
        input.name = name;
        if (value) {
            if (Array.isArray(value)) {
                var listId = name + "_list";
                input.setAttribute("list", listId);
                var dl = document.createElement("datalist");
                dl.id = listId;
                for (var i = 0; i < value.length; ++i) {
                    var option = document.createElement("option");
                    option.value = value[i];
                    dl.appendChild(option);
                }
                div.appendChild(dl);
            } else {
                input.value = value;
            }
        }
        div.appendChild(input);

        container = document.getElementById(this._addUID(code));

        if (container) {
            container.appendChild(div);
        } else {
            // le container, c'est la div !
            container = div;
        }

        return container;
    },

    // ################################################################### //
    // ################## Geocoding results container #################### //
    // ################################################################### //

    /**
     * @returns {DOMElement} DOM element
     */
    _createGeocodeResultsHeaderElement : function () {
        var self = this;

        var container = document.createElement("div");
        container.className = "GPpanelHeader";

        var divTitle = document.createElement("div");
        divTitle.className = "GPpanelTitle";
        divTitle.innerHTML = "Résultats de la recherche";
        container.appendChild(divTitle);

        var divClose = document.createElement("div");
        divClose.id = this._addUID("GPgeocodeResultsClose");
        divClose.className = "GPpanelClose";
        divClose.title = "Fermer la fenêtre de résultats";

        if (divClose.addEventListener) {
            divClose.addEventListener("click", function () {
                document.getElementById(self._addUID("GPgeocodeResultsList")).style.display = "none";
            }, false);
        } else if (divClose.attachEvent) {
            divClose.attachEvent("onclick", function () {
                document.getElementById(self._addUID("GPgeocodeResultsList")).style.display = "none";
            });
        }
        container.appendChild(divClose);

        return container;
    },

    /**
     * Geocoding results list.
     *
     * @returns {DOMElement} DOM element
     */
    _createGeocodeResultsListElement : function () {
        // contexte d'execution
        var self = this;

        var container = document.createElement("div");
        container.id = this._addUID("GPgeocodeResults");

        if (container.addEventListener) {
            container.addEventListener("click", function (e) {
                if (!e.ctrlKey) {
                    document.getElementById(self._addUID("GPgeocodeResultsList")).style.display = "none";
                }
                self.onGeocodedResultsItemClick(e);
            }, false);
        } else if (container.attachEvent) {
            container.attachEvent("onclick", function (e) {
                if (!e.ctrlKey) {
                    document.getElementById(self._addUID("GPgeocodeResultsList")).style.display = "none";
                }
                self.onGeocodedResultsItemClick(e);
            });
        }
        // Results are dynamically filled in Javascript by geocoding service
        // <div class="GPautoCompleteProposal">...</div>

        return container;
    },

    /**
     * Geocoding result.
     * Results are dynamically filled in Javascript by geocoding service
     *
     * TODO formaliser le contenu des reponses
     * FIXME formater la reponse en amont !
     *
     * @param {Object} location - suggested or geocoded location results
     * @param {Number} id - ID
     */
    _createGeocodedLocationElement : function (location, id) {
        var container = document.getElementById(this._addUID("GPgeocodeResults"));

        var div = document.createElement("div");
        div.id = this._addUID("GeocodedLocation_" + id);
        div.className = "GPautoCompleteProposal";

        if (typeof location === "string") {
            div.innerHTML = location;
        } else {
            div.innerHTML = GeocodeUtils.getGeocodedLocationFreeform(location);
        }

        container.appendChild(div);
    }
};

export default SearchEngineDOM;
