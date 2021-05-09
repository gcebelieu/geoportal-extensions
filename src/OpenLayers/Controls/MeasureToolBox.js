// import CSS
import "../CSS/Controls/ToolBoxMeasure/GPtoolBoxMeasureOpenLayers.css";
// import local
import Logger from "../../Common/Utils/LoggerByDefault";
import Utils from "../../Common/Utils";
import ID from "../../Common/Utils/SelectorID";
// DOM
import MeasureToolBoxDOM from "../../Common/Controls/MeasureToolBoxDOM";

var logger = Logger.getLogger("toolbox");

/*
* MeasureToolBox - Boite à outils (ToolBox) pour les outils de mesures.
* - distance
* - aire
* - azimut
*/
var MeasureToolBox = {

    /**
     * liste des uid/map (pour chaque toolbox)
     * { map : uid }
     * Ex. { "map1" : 465456456486845 }
     */
    _toolbox : {},

    /**
     * Ajout d'un controle dans la ToolBox.
     * Creation de la toolbox si besoin...
     *
     * @param {ol.Map} map - map
     * @param {ol.control.Control} ctrl - objet à ajouter
     */
    add : function (map, ctrl) {
        logger.trace("ToolBox.add()", ctrl);

        if (!map) {
            logger.trace("map doesn't exist !?");
            return;
        }

        // contexte d'execution
        var context = typeof window !== "undefined" ? window : typeof self !== "undefined" ? self : null;
        if (context) {
            // Pour info
            // l'objet ToolBox devrait être partagé avec les outils de mesures...,
            // mais, ce n'est pas le cas pour le mode modules cad un module par extension.
            // c'est pourquoi, on l'enregistre dans le contexte, qui lui est partagé (ex. window)
            this._toolbox = context.gpShareMeasureToolBox || {};
        }

        var mapContainer = map.getTargetElement();
        var mapDocument = mapContainer.ownerDocument;
        var mapId = mapContainer.id;

        if (!this._toolbox || Object.keys(this._toolbox).length === 0) {
            this._toolbox = {};
            this._toolbox[mapId] = ID.generate();
        } else {
            if (!this._toolbox[mapId]) {
                this._toolbox[mapId] = ID.generate();
            }
        }

        var uid = this._toolbox[mapId];
        if (!mapDocument.getElementById(this.getToolBoxID(uid))) {
            logger.trace("create toolbox !");
            // creation et ajout de la toolbox sur la map
            var toolboxContainer = this._createToolBoxContainerElement(uid);
            toolboxContainer.style.pointerEvents = "auto"; // ajout pour ol6
            var overlaysContainer = mapContainer.getElementsByClassName("ol-overlaycontainer-stopevent");
            overlaysContainer[0].appendChild(toolboxContainer);
            // mapContainer.appendChild(toolboxContainer);
        }

        // ajout du widget dans la toolbox
        var widgetContainer = mapDocument.getElementById(this.getWidgetID(uid));
        ctrl.setTarget(widgetContainer);
        if (context) {
            // Pour info
            // on partage (enregistre) l'objet ToolBox dans le contexte d'execution !
            context.gpShareMeasureToolBox = this._toolbox;
        }
        logger.trace("add control to toolbox !");
    }
};

Utils.assign(MeasureToolBox, MeasureToolBoxDOM);

export default MeasureToolBox;
