import ID from "../Utils/SelectorID";
import Logger from "../../Common/Utils/LoggerByDefault";
import GeocodeUtils from "../Utils/GeocodeUtils";

var logger = Logger.getLogger("LocationSelectorDOM");

var LocationSelectorDOM = {

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
        container.className = this._addUID("GPlocationPoint"); // ceci permet de gerer les groupes de points !
        container.className += " GPwidget";
        return container;
    },

    /**
     * Create Container Point
     * see event !
     *
     * @param {Number} id - tag ID
     * @param {Number} display  - display
     * @returns {DOMElement} DOM element
     */
    _createLocationPointElement : function (id, display) {
        var div = document.createElement("div");
        div.id = this._addUID("GPlocationPoint_" + id);
        div.className = (display) ? "GPflexInput GPlocationStageFlexInput" : "GPflexInput GPlocationStageFlexInputHidden";
        div.style.cssText = "";

        return div;
    },

    /**
     * Create Container Point
     * see event !
     *
     * @param {Number} id - tag ID
     * @param {String} text - label
     * @returns {DOMElement} DOM element
     */
    _createLocationPointLabelElement : function (id, text) {
        // contexte d'execution
        var self = this;

        var labelOrigin = document.createElement("label");
        labelOrigin.id = this._addUID("GPlocationOriginLabel_" + id);
        labelOrigin.htmlFor = "GPlocationOrigin_" + id;
        labelOrigin.innerHTML = text;
        labelOrigin.addEventListener("click", function (e) {
            var i = ID.index(this.id);
            var points = document.getElementsByClassName(self._addUID("GPlocationPoint"));
            for (var j = 0; j < points.length; j++) {
                var tag = points[j].childNodes[0].id;
                var id = ID.index(tag);
                document.getElementById(self._addUID("GPlocationPoint_" + id)).style.cssText = "";
            }
            document.getElementById(self._addUID("GPlocationOriginCoords_" + i)).value = "";
            document.getElementById(self._addUID("GPlocationOrigin_" + i)).value = "";
            document.getElementById(self._addUID("GPlocationPoint_" + i)).style.cssText = "";
            document.getElementById(self._addUID("GPlocationOriginPointer_" + i)).checked = false;
            document.getElementById(self._addUID("GPlocationOrigin_" + i)).className = "GPlocationOriginVisible";
            document.getElementById(self._addUID("GPlocationOriginCoords_" + i)).className = "GPlocationOriginHidden";
            if (document.getElementById(self._addUID("GPlocationStageRemove_" + i))) {
                document.getElementById(self._addUID("GPlocationStageRemove_" + i)).className = "GPlocationStageRemove";
            }
            if (document.getElementById(self._addUID("GPlocationStageAdd"))) {
                document.getElementById(self._addUID("GPlocationStageAdd")).className = "";
            }
            // document.getElementById(self._addUID("GPlocationOriginCoords_" + i)).disabled = true;
            self.onLocationClearPointClick(e);
        });

        return labelOrigin;
    },

    /**
     * Create Input AutoComplete Point tag
     *
     * @param {Number} id - tag ID
     * @returns {DOMElement} DOM element
     */
    _createLocationAutoCompleteteInputElement : function (id) {
        // contexte d'execution
        var self = this;

        var inputOrigin = document.createElement("input");
        inputOrigin.id = this._addUID("GPlocationOrigin_" + id);
        inputOrigin.className = "GPlocationOriginVisible";
        inputOrigin.type = "text";
        inputOrigin.placeholder = "Saisir une adresse";
        inputOrigin.autocomplete = "off";
        inputOrigin.addEventListener("keyup", function (e) {
            var charCode = e.which || e.keyCode;
            if (charCode === 13 || charCode === 10 || charCode === 38 || charCode === 40) {
                return;
            }

            var i = ID.index(this.id);
            if (document.getElementById(self._addUID("GPlocationOrigin_" + i)).value.length > 2) {
                document.getElementById(self._addUID("GPlocationAutoCompleteList_" + i)).style.display = "block";
            } else {
                document.getElementById(self._addUID("GPlocationAutoCompleteList_" + i)).style.display = "none";
            }
            // gestionnaire d'evenement :
            // on récupère la valeur de saisie pour une requête sur le service d'autocompletion.
            // le resultat de la requête nous permet de recuperer les coordonnées du point...
            self.onAutoCompleteSearchText(e);
        });

        inputOrigin.addEventListener("keydown", function (e) {
            var charCode = e.which || e.keyCode;

            var container = document.getElementById(self._addUID("GPlocationAutoCompleteList_" + id));

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
                    logger.log("arrow up");
                    current.className = "GPautoCompleteProposal";
                    prev.className = "GPautoCompleteProposal current";
                    prev.style.color = "#000000";
                    prev.style["background-color"] = "#CEDBEF";
                    break;
                case 40: // arrow down
                    logger.log("arrow down");
                    current.className = "GPautoCompleteProposal";
                    next.className = "GPautoCompleteProposal current";
                    next.style.color = "#000000";
                    next.style["background-color"] = "#CEDBEF";
                    break;
                case 13: // enter
                    logger.log("enter");
                    current.click(e);
                    break;
            }

            current.focus();
        });

        return inputOrigin;
    },

    /**
     * Create Input Coordinate Point tag
     *
     * @param {Number} id - tag ID
     * @returns {DOMElement} DOM element
     */
    _createLocationCoordinateInputElement : function (id) {
        // contexte d'execution
        var self = this;

        var inputOriginCoord = document.createElement("input");
        inputOriginCoord.id = this._addUID("GPlocationOriginCoords_" + id);
        inputOriginCoord.className = "GPlocationOriginHidden";
        inputOriginCoord.type = "text";
        inputOriginCoord.disabled = false;
        inputOriginCoord.addEventListener("click", function () {
            var i = ID.index(this.id);
            document.getElementById(self._addUID("GPlocationOriginLabel_" + i)).click();
        });
        return inputOriginCoord;
    },

    /**
     * Create Show Pointer tag
     *
     * @param {Number} id - tag ID
     * @returns {DOMElement} DOM element
     */
    _createLocationPointerShowInputElement : function (id) {
        var inputOriginPointer = document.createElement("input");
        inputOriginPointer.id = this._addUID("GPlocationOriginPointer_" + id);
        inputOriginPointer.type = "checkbox";
        return inputOriginPointer;
    },

    /**
     * Create Input Pointer tag
     *
     * @param {Number} id - tag ID
     * @returns {DOMElement} DOM element
     */
    _createLocationPointerInputElement : function (id) {
        // contexte d'execution
        var self = this;

        var labelOriginPointer = document.createElement("label");
        labelOriginPointer.id = this._addUID("GPlocationOriginPointerImg_" + id);
        labelOriginPointer.htmlFor = "GPlocationOriginPointer_" + id;
        labelOriginPointer.className = "GPlocationOriginPointerImg";
        labelOriginPointer.title = "Pointer un lieu sur la carte";
        labelOriginPointer.addEventListener("click", function (e) {
            e.preventDefault();
            e.stopPropagation();
            var i = ID.index(this.id);
            var points = document.getElementsByClassName(self._addUID("GPlocationPoint"));
            var j;
            var tag;
            var id;
            for (j = 0; j < points.length; j++) {
                tag = points[j].childNodes[0].id;
                id = ID.index(tag);
                if (i !== id) {
                    document.getElementById(self._addUID("GPlocationOriginPointer_" + id)).checked = false;
                    if (document.getElementById(self._addUID("GPlocationOriginCoords_" + id)).value === "Pointer un lieu sur la carte") {
                        document.getElementById(self._addUID("GPlocationOriginCoords_" + id)).value = "";
                        document.getElementById(self._addUID("GPlocationOrigin_" + id)).className = "GPlocationOriginVisible";
                        document.getElementById(self._addUID("GPlocationOriginCoords_" + id)).className = "GPlocationOriginHidden";
                    }
                }
            }
            if (document.getElementById(self._addUID("GPlocationOriginPointer_" + i)).checked) {
                document.getElementById(self._addUID("GPlocationOriginCoords_" + i)).value = "";
                for (j = 0; j < points.length; j++) {
                    tag = points[j].childNodes[0].id;
                    id = ID.index(tag);
                    document.getElementById(self._addUID("GPlocationPoint_" + id)).style.cssText = "";
                }
                if (document.getElementById(self._addUID("GPlocationStageRemove_" + i))) {
                    document.getElementById(self._addUID("GPlocationStageRemove_" + i)).className = "GPlocationStageRemove";
                }
                if (document.getElementById(self._addUID("GPlocationStageAdd"))) {
                    document.getElementById(self._addUID("GPlocationStageAdd")).className = "";
                }
                document.getElementById(self._addUID("GPlocationOriginPointer_" + i)).checked = false;
                document.getElementById(self._addUID("GPlocationOrigin_" + i)).className = "GPlocationOriginVisible";
                document.getElementById(self._addUID("GPlocationOriginCoords_" + i)).className = "GPlocationOriginHidden";
            } else {
                document.getElementById(self._addUID("GPlocationOriginCoords_" + i)).value = "Pointer un lieu sur la carte";
                for (j = 0; j < points.length; j++) {
                    tag = points[j].childNodes[0].id;
                    id = ID.index(tag);
                    if (i === id) {
                        document.getElementById(self._addUID("GPlocationPoint_" + id)).style.cssText = "";
                    } else {
                        document.getElementById(self._addUID("GPlocationPoint_" + id)).style.display = "none";
                    }
                }
                if (document.getElementById(self._addUID("GPlocationStageRemove_" + i))) {
                    document.getElementById(self._addUID("GPlocationStageRemove_" + i)).className = "GPlocationOriginHidden";
                }
                if (document.getElementById(self._addUID("GPlocationStageAdd"))) {
                    document.getElementById(self._addUID("GPlocationStageAdd")).className = "GPlocationOriginHidden";
                }
                document.getElementById(self._addUID("GPlocationOriginPointer_" + i)).checked = true;
                document.getElementById(self._addUID("GPlocationOrigin_" + i)).className = "GPlocationOriginHidden";
                document.getElementById(self._addUID("GPlocationOriginCoords_" + i)).className = "GPlocationOriginVisible";
                document.getElementById(self._addUID("GPlocationOriginCoords_" + i)).disabled = true;
            }
            // gestionnaire d'evenement :
            // on stocke la valeur du point, utilisée pour la requête sur le service de calcul d'itiniraire
            self.onActivateMapPointClick(e);
        });

        return labelOriginPointer;
    },

    /**
     * Create Remove Point tag
     * see event !
     *
     * @param {Number} id - tag ID
     * @returns {DOMElement} DOM element
     */
    _createLocationRemovePointElement : function (id) {
        // contexte d'execution
        var self = this;

        var divRm = document.createElement("div");
        divRm.id = this._addUID("GPlocationStageRemove_" + id);
        divRm.className = "GPlocationStageRemove";
        divRm.title = "Supprimer l'étape";
        divRm.addEventListener("click", function (e) {
            var points = document.getElementsByClassName(self._addUID("GPlocationPoint"));
            var last = points.length - 1;
            var start = points[0].childNodes[0].id;
            var end = points[last].childNodes[0].id;

            var startID = ID.index(start);
            var endID = ID.index(end);

            if (id !== startID && id !== endID) {
                var i = ID.index(this.id);
                document.getElementById(self._addUID("GPlocationPoint_" + i)).className = "GPflexInput GPlocationStageFlexInputHidden";
                document.getElementById(self._addUID("GPlocationOrigin_" + i)).value = "";
                document.getElementById(self._addUID("GPlocationOrigin_" + i)).className = "GPlocationOriginVisible";
                document.getElementById(self._addUID("GPlocationOriginCoords_" + i)).value = "";
                document.getElementById(self._addUID("GPlocationOriginCoords_" + i)).className = "GPlocationOriginHidden";
                document.getElementById(self._addUID("GPlocationStageAdd")).style.display = "";
                // Moving up exclusions picto
                // var exclusionsPictoTop = document.getElementById(self._addUID("GPshowLocationExclusionsPicto")).style.top;
                // document.getElementById(self._addUID("GPshowLocationExclusionsPicto")).style.top = (parseInt(exclusionsPictoTop) - 33).toString() + "px";

                // gestionnaire d'evenement :
                // on supprime le point, utilisé pour la requête sur le service d'itiniraire
                self.onLocationRemovePointClick(e);
            }
        });

        return divRm;
    },

    /**
     * Create Add Point tag
     * see event !
     *
     * @returns {DOMElement} DOM element
     */
    _createLocationAddPointElement : function () {
        // contexte d'execution
        var self = this;

        var divAdd = document.createElement("div");
        divAdd.id = this._addUID("GPlocationStageAdd");
        divAdd.title = "Ajouter une étape";
        divAdd.addEventListener("click", function (e) {
            var lastStage = 1;
            var nbStages = 0;
            var points = document.getElementsByClassName(self._addUID("GPlocationPoint"));
            for (var i = 1; i < points.length - 1; i++) {
                var tag = points[i].childNodes[0].id;
                var id = ID.index(tag);
                if (document.getElementById(self._addUID("GPlocationPoint_" + id))) {
                    if (document.getElementById(self._addUID("GPlocationPoint_" + id)).className === "GPflexInput GPlocationStageFlexInputHidden") {
                        if (lastStage === 1) {
                            lastStage = id;
                        }
                    } else {
                        nbStages++;
                    }
                }
            }
            // FIXME algo à revoir : lastStage = id hors si id = 300 sur 3 points !?
            if (lastStage < points.length) {
                document.getElementById(self._addUID("GPlocationPoint_" + lastStage)).className = "GPflexInput GPlocationStageFlexInput";
                // Moving down exclusions picto
                // var exclusionsPictoTop = document.getElementById(self._addUID("GPshowLocationExclusionsPicto")).style.top;
                // document.getElementById(self._addUID("GPshowLocationExclusionsPicto")).style.top = (parseInt(exclusionsPictoTop) + 33).toString() + "px";
            }
            if (nbStages === 4) {
                document.getElementById(self._addUID("GPlocationStageAdd")).style.display = "none";
            }
            // gestionnaire d'evenement :
            // on ajoute le point, utilisé pour la requête sur le service d'itiniraire
            self.onLocationAddPointClick(e);
        });

        return divAdd;
    },

    /**
     * Create Results autocompletion to the point
     * see event!
     *
     * @param {Number} id - tag ID
     * @returns {DOMElement} DOM element
     */
    _createLocationAutoCompleteResultElement : function (id) {
        // contexte d'execution
        var self = this;

        var div = document.createElement("div");
        div.id = this._addUID("GPlocationAutoCompleteList_" + id);
        div.className = "GPadvancedAutoCompleteList";

        if (div.addEventListener) {
            div.addEventListener("click", function (e) {
                self.onAutoCompletedResultsItemClick(e);
                document.getElementById(self._addUID("GPlocationAutoCompleteList_" + id)).style.display = "none";
            }, false);
        } else if (div.attachEvent) {
            div.attachEvent("onclick", function (e) {
                self.onAutoCompletedResultsItemClick(e);
                document.getElementById(self._addUID("GPlocationAutoCompleteList_" + id)).style.display = "none";
            });
        }

        return div;
    },

    /**
     * Autocompletion result to a point.
     * Proposals are dynamically filled in Javascript by autocomplete service
     *
     * TODO formaliser le contenu des reponse
     *
     * @param {Number} id - tag ID
     * @param {Object} location - suggested location result
     * @param {Number} n  - number of the point
     */
    _createLocationAutoCompletedLocationElement : function (id, location, n) {
        var container = document.getElementById(this._addUID("GPlocationAutoCompleteList_" + id));

        var div = document.createElement("div");
        div.id = this._addUID("AutoCompletedLocation_" + n);
        div.className = "GPautoCompleteProposal";
        div.innerHTML = GeocodeUtils.getSuggestedLocationFreeform(location);

        container.appendChild(div);
    },

    /**
    * Display Coordinate
    * @param {String} value - a Coordinate
    */
    GPdisplayCoordinate : function (value) {
        var points = document.getElementsByClassName(this._addUID("GPlocationPoint"));
        for (var i = 0; i < points.length; i++) {
            var tag = points[i].childNodes[0].id;
            var id1 = ID.index(tag);
            if (document.getElementById(this._addUID("GPlocationOriginPointer_" + id1)).checked) {
                document.getElementById(this._addUID("GPlocationOriginCoords_" + id1)).value = value;
                document.getElementById(this._addUID("GPlocationOriginCoords_" + id1)).disabled = false;
                for (var j = 0; j < points.length; j++) {
                    tag = points[j].childNodes[0].id;
                    var id2 = ID.index(tag);
                    document.getElementById(this._addUID("GPlocationPoint_" + id2)).style.cssText = "";
                    if (document.getElementById(this._addUID("GPlocationStageRemove_" + id2))) {
                        document.getElementById(this._addUID("GPlocationStageRemove_" + id2)).className = "GPlocationStageRemove";
                    }
                }
                document.getElementById(this._addUID("GPlocationOriginPointer_" + id1)).checked = false;
                if (document.getElementById(this._addUID("GPlocationStageAdd"))) {
                    document.getElementById(this._addUID("GPlocationStageAdd")).className = "";
                }
                return;
            }
        }
    }
};

export default LocationSelectorDOM;
