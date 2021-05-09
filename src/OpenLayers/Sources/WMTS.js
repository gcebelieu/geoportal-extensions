// import OpenLayers
import WMTSSource from "ol/source/WMTS";
import {
    createEmpty as olCreateEmpty,
    getWidth as olGetWidth,
    intersects as olIntersects
} from "ol/extent";
// import geoportal library access
import Gp from "geoportal-access-lib";
// import local
import Utils from "../../Common/Utils";

/**
 * @classdesc
 *
 * Extended ol.source.WMTS.
 *
 * @constructor
 * @alias ol.source.WMTSExtended
 * @extends {ol.source.WMTS}
 * @param {Object} options - Options
 */
var WMTS = (function (WMTSSource) {
    function WMTS (options) {
        if (!(this instanceof WMTS)) {
            throw new TypeError("ERROR CLASS_CONSTRUCTOR");
        }

        // call constructor
        WMTSSource.call(this,
            options
        );
    }

    // Inherits
    if (WMTSSource) WMTS.__proto__ = WMTSSource;

    /*
     * @lends module:WMTS
     */
    WMTS.prototype = Object.create(WMTSSource.prototype, {});

    /**
     * Constructor (alias)
     */
    WMTS.prototype.constructor = WMTS;

    /**
     * Return the GetFeatureInfo URL for the passed coordinate, resolution, and
     * projection. Return `undefined` if the GetFeatureInfo URL cannot be
     * constructed.
     * @param {ol.Coordinate} coordinate - Coordinate.
     * @param {Number} resolution - Resolution.
     * @param {ol.proj.Projection} projection - Projection.
     * @param {!Object} params - GetFeatureInfo params. `INFOFORMAT` at least should
     *     be provided.
     * @return {String|undefined} GetFeatureInfo URL.
     */
    WMTS.prototype.getFeatureInfoUrl = function (coordinate, resolution, projection, params) {
        // INFO
        // en fonction de la version d'openlayers, la méthode est differente :
        // - getGetFeatureInfoUrl en v5
        // - getFeatureInfoUrl en v6
        var pixelRatio = (this.option && this.options.tilePixelRatio) ? this.options.tilePixelRatio : 1;

        var tileGrid = this.tileGrid;
        var tileCoord = this.tileGrid.getTileCoordForCoordAndResolution(coordinate, resolution);

        // this code is duplicated from createFromWMTSTemplate function
        var getTransformedTileCoord = function (tileCoord, tileGrid, projection) {
            var tmpTileCoord = [0, 0, 0]; /* Note : [z(zoomLevel),x,y] */
            var tmpExtent = olCreateEmpty();
            var x = tileCoord[1];
            var y = tileCoord[2];
            var tileExtent = tileGrid.getTileCoordExtent(tileCoord);
            var extent = projection.getExtent();

            if (extent != null && projection.isGlobal()) {
                var numCols = Math.ceil(olGetWidth(extent) / olGetWidth(tileExtent));
                x = x % numCols;
                tmpTileCoord[0] = tileCoord[0];
                tmpTileCoord[1] = x;
                tmpTileCoord[2] = tileCoord[2];
                tileExtent = tileGrid.getTileCoordExtent(tmpTileCoord, tmpExtent);
            }
            if (!olIntersects(tileExtent, extent) /* || ol.extent.touches(tileExtent, extent) */) {
                return null;
            }
            return [tileCoord[0], x, y];
        };

        var tileExtent = tileGrid.getTileCoordExtent(tileCoord);
        var transformedTileCoord = getTransformedTileCoord(tileCoord, tileGrid, projection);

        if (tileGrid.getResolutions().length <= tileCoord[0]) {
            return undefined;
        }

        var tileResolution = tileGrid.getResolution(tileCoord[0]);
        var tileMatrix = tileGrid.getMatrixIds()[tileCoord[0]];

        var baseParams = {
            SERVICE : "WMTS",
            VERSION : "1.0.0",
            REQUEST : "GetFeatureInfo",
            LAYER : this.getLayer(),
            TILECOL : transformedTileCoord[1],
            TILEROW : transformedTileCoord[2],
            TILEMATRIX : tileMatrix,
            TILEMATRIXSET : this.getMatrixSet(),
            FORMAT : this.getFormat() || "image/png",
            STYLE : this.getStyle() || "normal"
        };

        Utils.assign(baseParams, params);

        /* var tileSize = tileGrid.getTileSize();
        var x = Math.floor(tileSize*((coordinate[0]-tileExtent[0])/(tileExtent[2]-tileExtent[0])));
        var y = Math.floor(tileSize*((tileExtent[3]-coordinate[1])/(tileExtent[3]-tileExtent[1]))); */

        var x = Math.floor((coordinate[0] - tileExtent[0]) / (tileResolution / pixelRatio));
        var y = Math.floor((tileExtent[3] - coordinate[1]) / (tileResolution / pixelRatio));

        /* patch parce que la fonction getTileCoordForCoordAndResolution(coords,res) d'Openlayers peut renvoyer
        une tuile dont l'étendue (getTileCoordExtent) ne contient pas le point passé en paramètre (coords) */
        var tileSize = tileGrid.getTileSize(tileCoord[0]);
        x = Math.min(x, (tileSize[0] | tileSize) - 1);
        y = Math.max(y, 0);

        baseParams["I"] = x;
        baseParams["J"] = y;

        var url = this.urls[0];

        var featureInfoUrl = Gp.Helper.normalyzeUrl(url, baseParams);

        return featureInfoUrl;
    };

    return WMTS;
}(WMTSSource));

export default WMTS;

// Expose WMTS as ol.source.WMTSExtended. (for a build bundle)
if (window.ol && window.ol.source) {
    window.ol.source.WMTSExtended = WMTS;
}
