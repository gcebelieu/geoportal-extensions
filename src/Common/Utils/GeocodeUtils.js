var GeocodeUtils = {
    /**
     * Return the freeform of a structured geocoded item
     *
     * @param {Object} geocodedLocation - Geocoded location
     * @returns {String} freeform string
     */
    getGeocodedLocationFreeform : function (geocodedLocation) {
        var attributes = geocodedLocation.placeAttributes;
        if (attributes.freeform) {
            return attributes.freeform;
        } else if (geocodedLocation.type === "PositionOfInterest") {
            return attributes.postalCode + " " + attributes.toponyme;
        } else if (geocodedLocation.type === "StreetAddress") {
            return (attributes.number ? attributes.number + " " : "") + attributes.street + " " + (attributes.postalCode ? attributes.postalCode + ", " : "") + attributes.city;
        } else if (geocodedLocation.type === "CadastralParcel") {
            return attributes.identifiant;
        } else {
            return "...";
        }
    },

    /**
     * Return the freeform of a structured suggested item
     *
     * @param {Object} suggestedLocation - Suggested location
     * @returns {String} freeform string
     */
    getSuggestedLocationFreeform : function (suggestedLocation) {
        if (suggestedLocation.fullText) {
            if (suggestedLocation.type === "PositionOfInterest") {
                return suggestedLocation.fullText + (suggestedLocation.postalCode ? " " + suggestedLocation.postalCode : "");
            }
            return suggestedLocation.fullText;
        } else {
            var values = [];
            values.push(suggestedLocation.street || "");
            values.push(suggestedLocation.postalCode || "");
            values.push(suggestedLocation.commune || "");

            if (suggestedLocation.type === "PositionOfInterest") {
                values.push(suggestedLocation.poi || "");
                values.push(suggestedLocation.kind || "");
            }
            return values.join(" - ");
        }
    }
};

export default GeocodeUtils;