// import { THREE } from "itowns";
import { EventDispatcher } from "three";
import Logger from "../../Common/Utils/LoggerByDefault";

var logger = Logger.getLogger("Widget");

/**
* @classdesc
* iTowns Widget class.
* Every geoportal control inherits of this class.
*
* @constructor
* @alias itowns.control.Widget
* @param {Object} options - options for function call.
* @param {String}  options.name - Name of the widget.
* @param {Object}  options.element - HTML element of the widget
* @param {Object|String}  options.target - HTML element or HTML element id where to put the widget
* @param {String}  options.position - "absolute" or "relative"
* @example
* var myWidget = new itowns.control.Widget({
*      name : "myWidget",
*      element : myWidgetDiv,
*      target : myWidgetTargetDiv,
*      position: "absolute"
* });
*/
function Widget (options) {
    this._name = (options.name !== undefined) ? options.name : null;
    this._element = (options.element !== undefined) ? options.element : null;
    this._position = (options.position !== undefined) ? options.position : null;
    this._target = null;
    this._globe = null;

    if (options.target) {
        this.setTarget(options.target, this._position);
    }
}

/*
 * @lends module:Attributions
 */
Widget.prototype = Object.create( /*THREE*/ EventDispatcher.prototype, {});

/**
 * Constructor (alias)
 */
Widget.prototype.constructor = Widget;

/**
 * Return the widget's container element.
 *
 * @method
 * @return {HTMLElement} widget's container element.
 */
Widget.prototype.getElement = function getElement () {
    return this._element;
};

/**
 * Associates the widget to a specified target div.
 *
 * @method
 * @param {HTMLElement|String} target - widget target div html element or target div id.
 * @param {String} position - html position attribute.
 */
Widget.prototype.setTarget = function setTarget (target, position) {
    this._target = typeof target === "string" ? document.getElementById(target) : target;

    if (!this._element) {
        logger.error("Widget:setTarget - widget element not created");
        return;
    }

    this._element.style.position = position || "relative";

    this._target.appendChild(this._element);
};

/**
 * Return the widget's target div.
 *
 * @method
 * @return {HTMLElement} widget's target div.
 */
Widget.prototype.getTarget = function getTarget () {
    return this._target;
};

/**
 * Return the widget's element position.
 *
 * @method
 * @return {String} widget's element position.
 */
Widget.prototype.getPosition = function getPosition () {
    return this._position;
};

/**
 * Get the globe associated with the widget. Undefined if the widget is not added to a globe.
 *
 * @method
 * @return {Object} globe
 */
Widget.prototype.getGlobe = function getGlobe () {
    return this._globe;
};

/**
 * Associate a globe to the widget.
 *
 * @method
 * @param {Object} globe - Globe to associate to the widget.
 */
Widget.prototype.setGlobe = function setGlobe (globe) {
    this._globe = globe;
};

export default Widget;
