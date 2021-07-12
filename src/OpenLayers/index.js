/**
* Global variable Gp.
*
* @module Gp
* @alias Gp
* @description
*
* This is the global variable that is exposed in the browser environment.
* Content is composed of constructor, functions and properties...
*
* > Config:  (...)
*
* > ColorUtils: (...)
* > LayerUtils: (...)
* > MathUtils: (...)
* > ProxyUtils: (...)
* > Logger: (...)
*
* > olExtended: (...)
* > olUtils: (...)
* > olExtDate: "YYYY-MM-DD"
* > olExtVersion: "X.X.X"
*
* > Error: (...)
* > Helper: (...)
* > Protocols: (...)
* > Services: (...)
* > servicesDate: "YYYY-MM-DD"
* > servicesVersion: "X.X.X"
*
* **Note :**
*
* function to add projections in 'proj4',
* they are exposed in the global variable 'proj4' and 'ol':
* > Gp.olExtended.includeProjections()
*
* You can test it :
* - ol.proj.proj4("EPSG:43260")
* - proj4("EPSG:4326")
*
* Projections include by default into proj4 and ol :
* > WGS84
* > ['EPSG:4326']
* > ['EPSG:3785'], ['EPSG:3857'],
* > ['EPSG:900913'], ['EPSG:102113']
*
* and
*
* > ["EPSG:2154"],
* > ["EPSG:27571"], ["EPSG:27572"],  ["EPSG:27573"],  ["EPSG:2757"],
* > ["CRS:84"],
* > ["IGNF:LAMB93"],
* > ["IGNF:LAMBE"],
* > ["IGNF:LAMB1"],  ["IGNF:LAMB2"],  ["IGNF:LAMB3"],  ["IGNF:LAMB4"],
* > ["IGNF:RGF93G"],
* > ["IGNF:WGS84G"]
*
* The following variables are aslo global :
*   - proj4,
*   - ol,
*   - eventbus
*/

import Pkg from "../../package.json";

// ordre des CSS communes puis extensions
import "../Common/Styles";
import "./Styles";

import GfiUtils from "./GfiUtils";
import KML from "./Formats/KML";
import WMTS from "./Sources/WMTS";
import SourceWMTS from "./Layers/SourceWMTS";
import SourceWMS from "./Layers/SourceWMS";
import LayerWMTS from "./Layers/LayerWMTS";
import LayerWMS from "./Layers/LayerWMS";
import LayerMapBox from "./Layers/LayerMapBox";
import LayerSwitcher from "./Controls/LayerSwitcher";
import GetFeatureInfo from "./Controls/GetFeatureInfo";
import SearchEngine from "./Controls/SearchEngine";
import MousePosition from "./Controls/MousePosition";
import Drawing from "./Controls/Drawing";
import Route from "./Controls/Route";
import Isocurve from "./Controls/Isocurve";
import ReverseGeocode from "./Controls/ReverseGeocode";
import LocationSelector from "./Controls/LocationSelector";
import LayerImport from "./Controls/LayerImport";
import GeoportalAttribution from "./Controls/GeoportalAttribution";
import Markers from "./Controls/Utils/Markers";
import ElevationPath from "./Controls/ElevationPath";
import MeasureLength from "./Controls/Measures/MeasureLength";
import MeasureArea from "./Controls/Measures/MeasureArea";
import MeasureAzimuth from "./Controls/Measures/MeasureAzimuth";

// import Proj4 from "proj4";

import Style from "./Controls/Editor/Style";
import Filter from "./Controls/Editor/Filter";
import Layer from "./Controls/Editor/Layer";
import Themes from "./Controls/Editor/Themes";
import Legend from "./Controls/Editor/Legend";
import Group from "./Controls/Editor/Group";
import Editor from "./Controls/Editor";

// Les autoload...
import "../Common/Utils/AutoLoadConfig";
import "./CRS/AutoLoadCRS";

// export des services
import Gp from "geoportal-access-lib";

import CRS from "./CRS/CRS";

var Services = Gp.Services;
var Error = Gp.Error;
var Helper = Gp.Helper;
var Protocols = Gp.Protocols;

var servicesDate = Gp.servicesDate;
var servicesVersion = Gp.servicesVersion;

export {
    /** Services
    * @see {@link http://ignf.github.io/geoportal-access-lib/current/jsdoc/module-Services.html|geoportal-access-lib}
    */
    Services,
    /** Error
    * @see {@link http://ignf.github.io/geoportal-access-lib/current/jsdoc/Gp.Error.html|geoportal-access-lib}
    */
    Error,
    /** Helper
    * @see {@link http://ignf.github.io/geoportal-access-lib/current/jsdoc/module-Helper.html|geoportal-access-lib}
    */
    Helper,
    /** Protocols
    * @see {@link http://ignf.github.io/geoportal-access-lib/current/jsdoc/module-XHR.html|geoportal-access-lib}
    */
    Protocols,
    /** servicesDate
    * @see {@link http://ignf.github.io/geoportal-access-lib/current/jsdoc/module-Gp.html|geoportal-access-lib}
    */
    servicesDate,
    /** servicesVersion
    * @see {@link http://ignf.github.io/geoportal-access-lib/current/jsdoc/module-Gp.html|geoportal-access-lib}
    */
    servicesVersion
};

/** Version */
export const olExtVersion = Pkg.olExtVersion || Pkg.version;
/** Publication date */
export const olExtDate = Pkg.date;

/** cf. Gp.olUtils */
export { default as olUtils } from "../Common/Utils";
/** cf. Gp.LayerUtils */
export { default as LayerUtils } from "../Common/Utils/LayerUtils";
/** cf. Gp.ProxyUtils */
export { default as ProxyUtils } from "../Common/Utils/ProxyUtils";
/** cf. Gp.ColorUtils */
export { default as ColorUtils } from "../Common/Utils/ColorUtils";
/** cf. Gp.MathUtils */
export { default as MathUtils } from "../Common/Utils/MathUtils";
/** cf. Gp.Logger */
export { default as Logger } from "../Common/Utils/LoggerByDefault";

function deepCopy (source, target) {
    // Implementing Tail Call Elimination
    function tce (source, target) {
        for (var prop in source) {
            if (source.hasOwnProperty(prop)) {
                if (!target.hasOwnProperty(prop)) {
                    target[prop] = source[prop];
                } else if (typeof source[prop] === "object") {
                    tce(source[prop], target[prop]);
                }
            }
        }
    }
    return tce(source, target);
}

var Ol = {};

// FIXME : est il utile d'avoir un ns particulier "gp" ?
Ol.gp = {};
Ol.gp.GfiUtils = GfiUtils;

// proposer une fonction de chargement des projections !
Ol.includeProjections = CRS.load;

// Editeur MapBox
Ol.style = Ol.style || {};
Ol.style.Editor = Editor;
Ol.style.editor = Ol.style.editor || {};
Ol.style.editor.Style = Style;
Ol.style.editor.Filter = Filter;
Ol.style.editor.Layer = Layer;
Ol.style.editor.Legend = Legend;
Ol.style.editor.Group = Group;
Ol.style.editor.Themes = Themes;

// Rajout des propriétés dans le namespace Ol
Ol.format = Ol.format || {};
Ol.format.KMLExtended = KML;
Ol.source = Ol.source || {};
Ol.source.WMTSExtended = WMTS;
Ol.source.GeoportalWMTS = SourceWMTS;
Ol.source.GeoportalWMS = SourceWMS;
Ol.layer = Ol.layer || {};
Ol.layer.GeoportalWMTS = LayerWMTS;
Ol.layer.GeoportalWMS = LayerWMS;
Ol.layer.GeoportalMapBox = LayerMapBox;
Ol.control = Ol.control || {};
Ol.control.LayerSwitcher = LayerSwitcher;
Ol.control.GeoportalAttribution = GeoportalAttribution;
Ol.control.GetFeatureInfo = GetFeatureInfo;
Ol.control.SearchEngine = SearchEngine;
Ol.control.Route = Route;
Ol.control.Isocurve = Isocurve;
Ol.control.GeoportalMousePosition = MousePosition;
Ol.control.Drawing = Drawing;
Ol.control.ReverseGeocode = ReverseGeocode;
Ol.control.LayerImport = LayerImport;
Ol.control.MeasureLength = MeasureLength;
Ol.control.MeasureArea = MeasureArea;
Ol.control.MeasureAzimuth = MeasureAzimuth;
Ol.control.DefaultMarkers = Markers;
Ol.control.ElevationPath = ElevationPath;
Ol.control.LocationSelector = LocationSelector;

// Expose extensions openlayers extended
export {
    /** Expose extensions openlayers extended */
    Ol as olExtended
};

// "proj4" is exposed into window (for a build bundle) with webpack.
//      console > proj4("EPSG:2154")
// And, it's useful to expose it too into OpenLayers :
//      console > ol.proj.get("EPSG:2154")
// if (window.ol && window.ol.proj && window.ol.proj.proj4) {
//     try {
//         window.ol.proj.proj4.register(Proj4);
//     } catch (e) {}
// }

// Expose extensions openlayers extended into ol
if (window.ol) {
    // on fusionne les fonctionnalités openlayers / étendues
    // Gp.olExtended -> ol
    deepCopy(Ol, window.ol);
    // ol -> Gp.olExtended
    deepCopy(window.ol, Ol);
}
