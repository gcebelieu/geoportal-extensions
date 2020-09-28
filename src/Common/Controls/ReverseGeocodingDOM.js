var ReverseGeocodingDOM = {

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
        container.id = this._addUID("GPreverseGeocoding");
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
    _createShowReverseGeocodingElement : function () {
        var input = document.createElement("input");
        input.id = this._addUID("GPshowReverseGeocoding");
        input.type = "checkbox";
        return input;
    },

    /**
     * Show ReverseGeocoding
     *
     * @returns {DOMElement} DOM element
     */
    _createShowReverseGeocodingPictoElement : function () {
        // contexte d'execution
        var self = this;

        var label = document.createElement("label");
        label.id = this._addUID("GPshowReverseGeocodingPicto");
        label.className = "GPshowAdvancedToolPicto";
        label.htmlFor = this._addUID("GPshowReverseGeocoding");
        label.title = "Ouvrir la recherche inverse";

        // Close all results and panels when minimizing the widget
        if (label.addEventListener) {
            label.addEventListener("click", function () {
                self.onShowReverseGeocodingClick();
            });
        } else if (label.attachEvent) {
            label.attachEvent("onclick", function () {
                self.onShowReverseGeocodingClick();
            });
        }

        var spanOpen = document.createElement("span");
        spanOpen.id = this._addUID("GPshowReverseGeocodingOpen");
        spanOpen.className = "GPshowAdvancedToolOpen";
        label.appendChild(spanOpen);

        return label;
    },

    /**
     * Create Waiting Panel
     *
     * @returns {DOMElement} DOM element
     */
    _createReverseGeocodingWaitingElement : function () {
        var div = document.createElement("div");
        div.id = this._addUID("GPreverseGeocodingCalcWaitingContainer");
        div.className = "GPreverseGeocodingCalcWaitingContainerHidden";

        var p = document.createElement("p");
        p.className = "GPreverseGeocodingCalcWaiting";
        p.innerHTML = "Recherche en cours...";

        div.appendChild(p);

        return div;
    },

    /**
     * Reverse geocoding results panel element.
     *
     * @returns {DOMElement} DOM element
     */
    _createReverseGeocodingResultsPanelElement : function () {
        var resultsPanelDiv = document.createElement("div");
        resultsPanelDiv.id = this._addUID("GPreverseGeocodingResultsPanel");
        resultsPanelDiv.className = "GPpanel GPreverseGeocodingComponentHidden";
        return resultsPanelDiv;
    },

    /**
     * Reverse geocoding results list.
     *
     * @returns {DOMElement} DOM element
     */
    _createReverseGeocodingResultsListElement : function () {
        var container = document.createElement("div");
        container.id = this._addUID("GPreverseGeocodingResultsList");
        // Results are dynamically filled in Javascript by reverse geocoding service
        return container;
    },

    /**
     *  Add Result
     * (results dynamically generate !)
     *
     * @param {String} locationDescription - reverse geocoded location results
     * @param {Number} id - ID
     */
    _createReverseGeocodingResultElement : function (locationDescription, id) {
        // contexte
        var context = this;

        var container = document.getElementById(this._addUID("GPreverseGeocodingResultsList"));

        var div = document.createElement("div");
        div.id = this._addUID("ReverseGeocodedLocation_" + id);
        div.className = "GPautoCompleteProposal";
        div.innerHTML = locationDescription;
        div.title = locationDescription;

        if (div.addEventListener) {
            div.addEventListener("mouseover", function (e) {
                context.onReverseGeocodingResultMouseOver(e);
            });
            div.addEventListener("mouseout", function (e) {
                context.onReverseGeocodingResultMouseOut(e);
            });
            div.addEventListener("click", function (e) {
                if (typeof context.onReverseGeocodingResultClick === "function") {
                    context.onReverseGeocodingResultClick(e);
                }
            });
        } else if (div.attachEvent) {
            div.attachEvent("onmouseover", function (e) {
                context.onReverseGeocodingResultMouseOver(e);
            });
            div.attachEvent("onmouseout", function (e) {
                context.onReverseGeocodingResultMouseOut(e);
            });
            div.attachEvent("onclick", function (e) {
                if (typeof context.onReverseGeocodingResultClick === "function") {
                    context.onReverseGeocodingResultClick(e);
                }
            });
        }

        container.appendChild(div);
    },

    // ################################################################### //
    // ######################### Inputs panel ############################ //
    // ################################################################### //

    /**
     * Create Container Panel
     *
     * @returns {DOMElement} DOM element
     */
    _createReverseGeocodingPanelElement : function () {
        var div = document.createElement("div");
        div.id = this._addUID("GPreverseGeocodingPanel");
        div.className = "GPpanel";

        return div;
    },

    /**
     * Create Header Panel
     *
     * @returns {DOMElement} DOM element
     */
    _createReverseGeocodingPanelHeaderElement : function () {
        var container = document.createElement("div");
        container.className = "GPpanelHeader";
        // info: on sépare les appels pour la création du picto de retour,
        // du titre et de la croix de fermeture pour les récupérer dans le composant
        return container;
    },

    /**
     * Create return picto in panel header
     *
     * @returns {DOMElement} DOM element
     */
    _createReverseGeocodingPanelReturnPictoElement : function () {
        // contexte
        var self = this;

        var divNew = document.createElement("div");
        divNew.id = this._addUID("GPreverseGeocodingReturnPicto");
        divNew.title = "Nouvelle recherche";
        divNew.className = "GPreverseGeocodingReturnPictoHidden";
        if (divNew.addEventListener) {
            divNew.addEventListener("click", function (e) {
                document.getElementById(self._addUID("GPreverseGeocodingResultsPanel")).className = "GProuteComponentHidden";
                document.getElementById(self._addUID("GPreverseGeocodingForm")).className = "";
                document.getElementById(self._addUID("GPreverseGeocodingHeaderTitle")).innerHTML = "Recherche inverse";
                document.getElementById(self._addUID("GPreverseGeocodingReturnPicto")).className = "GPreverseGeocodingReturnPictoHidden";
                self.onGPreverseGeocodingReturnPictoClick(e);
            });
        } else if (divNew.attachEvent) {
            divNew.attachEvent("onclick", function (e) {
                document.getElementById(self._addUID("GPreverseGeocodingResultsPanel")).className = "GProuteComponentHidden";
                document.getElementById(self._addUID("GPreverseGeocodingForm")).className = "";
                document.getElementById(self._addUID("GPreverseGeocodingHeaderTitle")).innerHTML = "Recherche inverse";
                document.getElementById(self._addUID("GPreverseGeocodingReturnPicto")).className = "GPreverseGeocodingReturnPictoHidden";
                self.onGPreverseGeocodingReturnPictoClick(e);
            });
        }
        return divNew;
    },

    /**
     * Create Header Title Panel
     *
     * @returns {DOMElement} DOM element
     */
    _createReverseGeocodingPanelTitleElement : function () {
        var div = document.createElement("div");
        div.className = "GPpanelTitle";
        div.id = this._addUID("GPreverseGeocodingHeaderTitle");
        div.innerHTML = "Recherche inverse";
        return div;
    },

    /**
     * Create Header close div
     *
     * @returns {DOMElement} DOM element
     */
    _createReverseGeocodingPanelCloseElement : function () {
        // contexte
        var self = this;

        var divClose = document.createElement("div");
        divClose.id = this._addUID("GPreverseGeocodingPanelClose");
        divClose.className = "GPpanelClose";
        divClose.title = "Fermer le panneau";

        // Link panel close / visibility checkbox
        if (divClose.addEventListener) {
            divClose.addEventListener("click", function () {
                document.getElementById(self._addUID("GPshowReverseGeocodingPicto")).click();
            }, false);
        } else if (divClose.attachEvent) {
            divClose.attachEvent("onclick", function () {
                document.getElementById(self._addUID("GPshowReverseGeocodingPicto")).click();
            });
        }

        return divClose;
    },

    /**
     * Create Form
     * see event !
     *
     * @returns {DOMElement} DOM element
     */
    _createReverseGeocodingPanelFormElement : function () {
        // contexte d'execution
        var self = this;

        var form = document.createElement("form");
        form.id = this._addUID("GPreverseGeocodingForm");

        if (form.addEventListener) {
            form.addEventListener("submit", function (e) {
                e.preventDefault();
                self.onReverseGeocodingSubmit();
            });
        } else if (form.attachEvent) {
            form.attachEvent("onsubmit", function (e) {
                e.preventDefault();
                self.onReverseGeocodingSubmit();
            });
        }

        return form;
    },

    // ################################################################### //
    // ####################### Choice mode into form ##################### //
    // ################################################################### //

    /**
     * Create Container to Mode choice geocoding type
     *
     * @param {Array} resources - geocoding resources to be displayed (and used)
     * @returns {DOMElement} DOM element
     */
    _createReverseGeocodingFormModeChoiceGeocodingTypeElement : function (resources) {
        // contexte d'execution
        var context = this;

        var div = document.createElement("div");
        div.className = "GPflexInput";

        var label = document.createElement("label");
        label.className = "GPreverseGeocodingCodeLabel";
        label.innerHTML = "Recherche par";
        label.title = "Recherche par";
        div.appendChild(label);

        var select = document.createElement("select");
        select.className = "GPreverseGeocodingCode";
        // gestionnaire d'evenement : on stocke la valeur du type de geocodage,
        // utilisé dans la requête de géocodage inverse
        if (select.addEventListener) {
            select.addEventListener("change", function (e) {
                context.onReverseGeocodingTypeChange(e);
            });
        } else if (select.attachEvent) {
            select.attachEvent("onchange", function (e) {
                context.onReverseGeocodingTypeChange(e);
            });
        }

        // on prend soit les valeurs passées par l'utilisateur, soit des valeurs par défaut
        if (!resources || !Array.isArray(resources)) {
            resources = ["StreetAddress", "PositionOfInterest", "CadastralParcel"];
        }
        for (var i = 0; i < resources.length; i++) {
            switch (resources[i]) {
                case "PositionOfInterest":
                    var POIOption = document.createElement("option");
                    POIOption.value = "PositionOfInterest";
                    POIOption.text = "Lieux/toponymes";
                    select.appendChild(POIOption);
                    break;
                case "StreetAddress":
                    var SAOption = document.createElement("option");
                    SAOption.value = "StreetAddress";
                    SAOption.text = "Adresses";
                    select.appendChild(SAOption);
                    break;
                case "CadastralParcel":
                    var CPOption = document.createElement("option");
                    CPOption.value = "CadastralParcel";
                    CPOption.text = "Parcelles cadastrales";
                    select.appendChild(CPOption);
                    break;
                default:
                    break;
            }
        }

        div.appendChild(select);

        return div;
    },

    /**
     * Create Container to Mode choice geocoding delimitation
     *
     * @param {Array} delimitations - geocoding delimitations to be displayed (and used)
     * @returns {DOMElement} DOM element
     */
    _createReverseGeocodingFormModeChoiceGeocodingDelimitationElement : function (delimitations) {
        // contexte d'execution
        var context = this;

        var div = document.createElement("div");
        div.className = "GPflexInput";

        var label = document.createElement("label");
        label.className = "GPreverseGeocodingCodeLabel";
        label.innerHTML = "Délimitation";
        label.title = "Délimitation";
        div.appendChild(label);

        var select = document.createElement("select");
        select.className = "GPreverseGeocodingCode";
        // gestionnaire d'evenement : on stocke la valeur du type de délimitation,
        // et on modifie l'événement de pointage sur la carte en fonction
        if (select.addEventListener) {
            select.addEventListener("change", function (e) {
                context.onReverseGeocodingDelimitationChange(e);
            });
        } else if (select.attachEvent) {
            select.attachEvent("onchange", function (e) {
                context.onReverseGeocodingDelimitationChange(e);
            });
        }

        // on prend soit les valeurs passées par l'utilisateur, soit des valeurs par défaut
        if (!delimitations || !Array.isArray(delimitations)) {
            delimitations = ["Point", "Circle", "Extent"];
        }
        for (var i = 0; i < delimitations.length; i++) {
            switch (delimitations[i].toLowerCase()) {
                case "point":
                    var pointOption = document.createElement("option");
                    pointOption.value = "point";
                    pointOption.text = "Pointer un lieu";
                    select.appendChild(pointOption);
                    break;
                case "circle":
                    var circleOption = document.createElement("option");
                    circleOption.value = "circle";
                    circleOption.text = "Dessiner un cercle";
                    select.appendChild(circleOption);
                    break;
                case "extent":
                    var extentOption = document.createElement("option");
                    extentOption.value = "extent";
                    extentOption.text = "Dessiner une emprise";
                    select.appendChild(extentOption);
                    break;
                default:
                    break;
            }
        }

        div.appendChild(select);

        return div;
    },

    // ################################################################### //
    // ########################### Submit Form ########################### //
    // ################################################################### //

    /**
     * Create Submit Form Element
     *
     * @returns {DOMElement} DOM element
     */
    _createReverseGeocodingSubmitFormElement : function () {
        var input = document.createElement("input");
        input.id = this._addUID("GPreverseGeocodingSubmit");
        input.className = "GPinputSubmit";
        input.type = "submit";
        input.value = "Rechercher";

        return input;
    }

};

export default ReverseGeocodingDOM;
