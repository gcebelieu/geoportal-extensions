/* globals AmCharts, d3 */
var ProfileElevationPathDOM = {

    /**
     * Gets a css property from an element
     *
     * @param {String} element The element to get the property from
     * @param {String} property The css property
     * @returns {String} The value of the property
     *
     * @see https://stackoverflow.com/questions/7444451/how-to-get-the-actual-rendered-font-when-its-not-defined-in-css
     */
    _getCssProperty : function (element, property) {
        return window.getComputedStyle(element, null).getPropertyValue(property);
    },

    /**
     * Uses canvas.measureText to compute and return the width of the given text of given font in pixels.
     *
     * @param {String} text The text to be rendered.
     * @param {String} container The container of the text
     * @returns {Number} The width of the text
     *
     * @see https://stackoverflow.com/questions/118241/calculate-text-width-with-javascript/21015393#21015393
     */
    _getTextWidth : function (text, container) {
        // re-use canvas object for better performance
        var canvas = this.canvas || (this.canvas = document.createElement("canvas"));
        var context = canvas.getContext("2d");
        context.font = `${this._getCssProperty(container, "font-weight")} ${this._getCssProperty(container, "font-size")} ${this._getCssProperty(container, "font-family")}`;
        var metrics = context.measureText(text);
        return metrics.width;
    },

    /**
     * Display Profile function used by default : no additonal framework needed.
     * @param {Object} data - elevations values for profile
     * @param {HTMLElement} container - html container where to display profile
     * @param {Object} context - this control object
     * @param {Object} className - calling class (ie ElevationPath)
     * @returns {DOMElement} profil container
     */
    displayProfileByDefault : function (data, container, context, className) {
        var self = context;

        // on nettoie toujours...
        if (container) {
            while (container.firstChild) {
                container.removeChild(container.firstChild);
            }
        }

        if (!data) {
            return;
        }

        const margin = {
            top : 10,
            right : 10,
            bottom : 10,
            left : 10
        };

        var _displayProfileOptions = self.options.displayProfileOptions;

        var _points = data.points;

        var sortedElev = JSON.parse(JSON.stringify(_points));
        sortedElev.sort(function (e1, e2) {
            return e1.z - e2.z;
        });

        var minZ = sortedElev[0].z;
        var maxZ = sortedElev[sortedElev.length - 1].z;
        var diff = maxZ - minZ;
        var dist = data.distance;
        let distUnit = "m";
        // var distMin = 0;
        var barwidth = 100 / _points.length;

        var div = document.createElement("div");
        div.id = "profileElevationByDefault";
        container.appendChild(div);

        // Détermination des tailles en pixels des éléments du widget
        const widgetHeigth = container.clientHeight - margin.top - margin.bottom;
        const widgetWidth = container.clientWidth - margin.left - margin.right;

        const zLabelWidth = 17;
        const zGradWidth = this._getTextWidth(maxZ, container);
        const xLabelHeight = 17;
        const xGradHeight = 15;

        const minZguideHeigth = 20;
        const minXguideWidth = 40;

        const pathHeight = widgetHeigth - xLabelHeight - xGradHeight;
        const pathWidth = widgetWidth - zLabelWidth - zGradWidth;

        const elevationSvg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        elevationSvg.id = "profileElevationByDefaultSvg";
        elevationSvg.setAttribute("style", `width: ${widgetWidth}px; height: ${widgetHeigth}px; display: block; margin: auto; overflow: visible;`);

        // Détermination des guides en ordonnée :
        const maxNumZguides = Math.floor(pathHeight / minZguideHeigth);
        let gradZ = Math.pow(10, (Math.ceil(Math.log((maxZ - minZ) / maxNumZguides) / Math.log(10)))) / 2;
        let minGraphZ = Math.floor(minZ / gradZ) * gradZ;
        let maxGraphZ = Math.ceil(maxZ / gradZ) * gradZ;

        let numZguides = (maxGraphZ - minGraphZ) / gradZ;

        // Si plus de guides que le max, on passe à la puissance de 10 supérieure
        if (numZguides > maxNumZguides) {
            gradZ = Math.pow(10, (Math.ceil(Math.log((dist) / maxNumZguides) / Math.log(10)) + 1)) / 2;
            numZguides = Math.floor(maxGraphZ / gradZ);
            minGraphZ = Math.floor(minZ / gradZ) * gradZ;
            maxGraphZ = Math.ceil(maxZ / gradZ) * gradZ;
        }

        numZguides = Math.max(numZguides, 1);

        const axisZ = document.createElementNS("http://www.w3.org/2000/svg", "g");
        axisZ.setAttribute("class", "profile-z-vertical");

        const guidesZ = document.createElementNS("http://www.w3.org/2000/svg", "g");

        const gradZyOffsetPx = Math.round(pathHeight / (numZguides + 1));
        const zRemainder = pathHeight - gradZyOffsetPx * (numZguides + 1);

        // Ajout des graduations au graphique
        for (let i = 0; i <= numZguides + 1; i++) {
            let gradZtext = document.createElementNS("http://www.w3.org/2000/svg", "text");
            gradZtext.setAttribute("class", "profile-z-graduation");
            gradZtext.innerHTML = minGraphZ + i * gradZ;

            gradZtext.setAttribute("transform", `translate(${zLabelWidth + zGradWidth - 8}, ${pathHeight - i * gradZyOffsetPx + 7})`);
            gradZtext.setAttribute("text-anchor", "end");
            axisZ.appendChild(gradZtext);

            let gradZstroke = document.createElementNS("http://www.w3.org/2000/svg", "g");
            let gradZpath = document.createElementNS("http://www.w3.org/2000/svg", "path");
            gradZpath.setAttribute("cs", "100,100");
            gradZpath.setAttribute("stroke-width", "1");
            if (i != 0) {
                gradZpath.setAttribute("stroke-opacity", "0.15");
                gradZpath.setAttribute("stroke-dasharray", "5,5");
            } else {
                gradZpath.setAttribute("stroke-opacity", "1");
            }
            gradZpath.setAttribute("stroke", "#000000");
            gradZpath.setAttribute("fill", "none");
            gradZpath.setAttribute("d", `M${zLabelWidth + zGradWidth},${pathHeight - i * gradZyOffsetPx} L${pathWidth + zLabelWidth + zGradWidth},${pathHeight - i * gradZyOffsetPx}`);

            let gradZgrad = document.createElementNS("http://www.w3.org/2000/svg", "path");
            gradZgrad.setAttribute("cs", "100,100");
            gradZgrad.setAttribute("stroke-width", "1");
            gradZgrad.setAttribute("stroke-opacity", "1");
            gradZgrad.setAttribute("stroke", "#000000");
            gradZgrad.setAttribute("fill", "none");
            gradZgrad.setAttribute("d", `M${zLabelWidth + zGradWidth},${pathHeight - i * gradZyOffsetPx} L${zLabelWidth + zGradWidth + 5},${pathHeight - i * gradZyOffsetPx}`);
            gradZgrad.setAttribute("transform", "translate(-5, 0)");

            gradZstroke.appendChild(gradZgrad);
            gradZstroke.appendChild(gradZpath);
            guidesZ.appendChild(gradZstroke);
        }

        var axisZLegend = document.createElementNS("http://www.w3.org/2000/svg", "text");
        axisZLegend.setAttribute("class", "profile-z-legend");
        axisZLegend.innerHTML = "Altitude (m)";

        axisZLegend.setAttribute("transform", `translate(${zLabelWidth - 5}, ${Math.round(pathHeight / 2)}) rotate(-90)`);
        axisZLegend.setAttribute("text-anchor", "middle");

        axisZ.appendChild(axisZLegend);
        elevationSvg.appendChild(axisZ);
        elevationSvg.appendChild(guidesZ);

        // Détermination des guides en abscisse :
        // Passage éventuel en km
        if (dist > 2000) {
            dist /= 1000;
            distUnit = "km";
        }

        const maxNumXguides = Math.floor(pathWidth / minXguideWidth);
        let gradX = Math.pow(10, (Math.ceil(Math.log((dist) / maxNumXguides) / Math.log(10)))) / 2;
        const maxGraphX = dist;

        // Si plus de guides que le max, on passe à la puissance de 10 supérieure
        let numXguides = Math.floor(maxGraphX / gradX);
        if (numXguides > maxNumXguides) {
            gradX = Math.pow(10, (Math.ceil(Math.log((dist) / maxNumXguides) / Math.log(10)) + 1)) / 2;
            numXguides = Math.floor(maxGraphX / gradX);
        }

        const axisX = document.createElementNS("http://www.w3.org/2000/svg", "g");
        axisX.setAttribute("class", "profile-x-vertical");

        const guidesX = document.createElementNS("http://www.w3.org/2000/svg", "g");

        const gradXxOffsetPx = Math.round(pathWidth / (numXguides + 1));

        // Ajout des graduations au graphique
        for (let i = 0; i <= numXguides + 1; i++) {
            let gradXtext = document.createElementNS("http://www.w3.org/2000/svg", "text");
            gradXtext.setAttribute("class", "profile-x-graduation");
            gradXtext.innerHTML = +i * gradX;

            gradXtext.setAttribute("transform", `translate(${zLabelWidth + zGradWidth + i * gradXxOffsetPx}, ${pathHeight + xGradHeight + 5})`);
            gradXtext.setAttribute("text-anchor", "middle");
            axisX.appendChild(gradXtext);

            let gradXstroke = document.createElementNS("http://www.w3.org/2000/svg", "g");
            let gradXpath = document.createElementNS("http://www.w3.org/2000/svg", "path");
            gradXpath.setAttribute("cs", "100,100");
            gradXpath.setAttribute("stroke-width", "1");
            if (i != 0) {
                gradXpath.setAttribute("stroke-opacity", "0.15");
                gradXpath.setAttribute("stroke-dasharray", "5,5");
            } else {
                gradXpath.setAttribute("stroke-opacity", "1");
            }
            gradXpath.setAttribute("stroke", "#000000");
            gradXpath.setAttribute("fill", "none");
            gradXpath.setAttribute("d", `M${zLabelWidth + zGradWidth + i * gradXxOffsetPx},${pathHeight} L${zLabelWidth + zGradWidth + i * gradXxOffsetPx},${zRemainder}`);

            let gradXgrad = document.createElementNS("http://www.w3.org/2000/svg", "path");
            gradXgrad.setAttribute("cs", "100,100");
            gradXgrad.setAttribute("stroke-width", "1");
            gradXgrad.setAttribute("stroke-opacity", "1");
            gradXgrad.setAttribute("stroke", "#000000");
            gradXgrad.setAttribute("fill", "none");
            gradXgrad.setAttribute("d", `M${zLabelWidth + zGradWidth + i * gradXxOffsetPx},${pathHeight} L${zLabelWidth + zGradWidth + i * gradXxOffsetPx},${pathHeight - 5}`);
            gradXgrad.setAttribute("transform", "translate(0, 5)");

            gradXstroke.appendChild(gradXgrad);
            gradXstroke.appendChild(gradXpath);
            guidesX.appendChild(gradXstroke);
        }

        var axisXLegend = document.createElementNS("http://www.w3.org/2000/svg", "text");
        axisXLegend.setAttribute("class", "profile-z-legend");
        axisXLegend.innerHTML = `Distance (${distUnit})`;

        axisXLegend.setAttribute("transform", `translate(${zLabelWidth + zGradWidth + pathWidth / 2}, ${pathHeight + xGradHeight + xLabelHeight + 3})`);
        axisXLegend.setAttribute("text-anchor", "middle");

        axisX.appendChild(axisXLegend);
        elevationSvg.appendChild(axisX);
        elevationSvg.appendChild(guidesX);

        var divData = document.createElement("div");
        divData.className = "profile-content";
        divData.addEventListener("mouseover", function (e) {
            var _lon = parseFloat(e.target.dataset["lon"]);
            var _lat = parseFloat(e.target.dataset["lat"]);

            if (_lon && _lat) {
                className.__createProfileMarker(self, {
                    lat : _lat,
                    lon : _lon
                });
            }
        });
        divData.addEventListener("mousemove", function (e) {
            var _lon = parseFloat(e.target.dataset["lon"]);
            var _lat = parseFloat(e.target.dataset["lat"]);

            if (_lon && _lat) {
                className.__updateProfileMarker(self, {
                    lat : _lat,
                    lon : _lon
                });
            }
        });
        divData.addEventListener("mouseout", function () {
            className.__removeProfileMarker(self);
        });

        var ulData = document.createElement("ul");
        ulData.id = "profile-data";
        ulData.className = "profile-z-axis profile-x-axis";
        divData.appendChild(ulData);

        for (var i = 0; i < _points.length; i++) {
            var d = _points[i];
            var li = document.createElement("li");
            li.setAttribute("data-z", d.z);
            li.setAttribute("data-lon", d.lon);
            li.setAttribute("data-lat", d.lat);
            li.setAttribute("data-dist", d.dist);

            var pct = Math.floor((d.z - minZ) * 100 / diff);
            li.setAttribute("class", "percent v" + pct);
            li.title = "Altitude : " + d.z + "m";
            if (_displayProfileOptions.currentSlope) {
                li.title += " - Pente : " + d.slope + "%";
            }
            li.title += " (Lat : " + d.lat + " / Lon : " + d.lon + ")";

            li.setAttribute("style", "width: " + barwidth + "%");
            ulData.appendChild(li);
        }

        div.appendChild(elevationSvg);

        return container;
    },

    /**
     * Display Profile without graphical rendering (raw service response)
     * @param {Object} data - elevations values for profile
     * @param {HTMLElement} container - html container where to display profile
     * @param {Object} context - this control object
     * @param {Object} className - calling class (ie ElevationPath)
     * @returns {DOMElement} profil container
     */
    displayProfileRaw : function (data, container, context, className) {
        // on nettoie toujours...
        if (container) {
            while (container.firstChild) {
                container.removeChild(container.firstChild);
            }
        }

        var _points = data.points;

        var div = document.createElement("textarea");
        div.id = "profilElevationResults";
        div.rows = 10;
        div.cols = 50;
        div.style.width = "100%";
        div.innerHTML = JSON.stringify(_points, undefined, 4);
        div.addEventListener("mouseover", function (e) {
            className.__customRawProfileMouseOverEvent(context, e);
        });

        // TODO
        // for (var i = 0; i < _points.length; i++) {
        //     var point = _points[i];
        //     var divC  = document.createElement("code");
        //     divC.id = "point_" + i;
        //     divC.innerHTML = JSON.stringify(point, undefined, 4);
        //     div.appendChild(divC);
        //     divC.addEventListener("mouseover", function (e) {
        //          className.__customRawProfileMouseOverEvent(context, e);
        //     });
        // }

        container.appendChild(div);

        return container;
    },

    /**
     * Display Profile using D3 javascript framework. This method needs D3 libraries to be loaded.
     * @param {Object} data - elevations values for profile
     * @param {HTMLElement} container - html container where to display profile
     * @param {Object} context - this control object
     * @param {Object} className - calling class (ie ElevationPath)
     * @returns {DOMElement} profil container
     */
    displayProfileLibD3 : function (data, container, context, className) {
        var self = context;

        // on nettoie toujours...
        if (container) {
            while (container.firstChild) {
                container.removeChild(container.firstChild);
            }
        }

        var _points = data.points;

        var _displayProfileOptions = self.options.displayProfileOptions;

        var margin = {
            top : 20,
            right : 20,
            bottom : 30,
            left : 40
        };

        var width = container.clientWidth - margin.left - margin.right;
        var height = container.clientHeight - margin.top - margin.bottom;

        var x = d3.scale.linear()
            .range([0, width]);

        var y = d3.scale.linear()
            .range([height, 0]);

        var xAxis = d3.svg.axis()
            .scale(x)
            .orient("bottom")
            .ticks(5);

        var yAxis = d3.svg.axis()
            .scale(y)
            .orient("left")
            .ticks(5);

        var line = d3.svg.line()
            .interpolate("basis")
            .x(function (d) {
                return x(d.dist);
            })
            .y(function (d) {
                return y(d.z);
            });

        var area = d3.svg.area()
            .interpolate("basis")
            .x(function (d) {
                return x(d.dist);
            })
            .y0(height)
            .y1(function (d) {
                return y(d.z);
            });

        var svg = d3.select(container)
            .append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .append("g")
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

        var xDomain = d3.extent(_points, function (d) {
            return d.dist;
        });
        x.domain(xDomain);

        var yDomain = [
            0,
            d3.max(_points, function (d) {
                return d.z;
            })
        ];
        y.domain(yDomain);

        svg.append("path")
            .datum(_points)
            .attr("class", "area-d3")
            .attr("d", area);

        svg.append("g")
            .attr("class", "x axis-d3")
            .attr("transform", "translate(0," + height + ")")
            .call(xAxis)
            .append("text")
            .attr("y", -15)
            .attr("dy", ".71em")
            .attr("x", width)
            .text("Distance (" + data.unit + ")");

        svg.append("g")
            .attr("class", "y axis-d3")
            .call(yAxis)
            .append("text")
            .attr("transform", "rotate(-90)")
            .attr("y", 6)
            .attr("dy", ".71em")
            .text("Altitude (m)");

        svg.append("g")
            .attr("class", "grid-d3 vertical")
            .attr("transform", "translate(0," + height + ")")
            .call(xAxis
                .orient("bottom")
                .tickSize(-height, 0, 0)
                .tickFormat("")
            );

        svg.append("g")
            .attr("class", "grid-d3 horizontal")
            .call(yAxis
                .orient("left")
                .tickSize(-width, 0, 0)
                .tickFormat("")
            );

        svg.append("path")
            .datum(_points)
            .attr("class", "line-d3")
            .attr("d", line);

        svg.selectAll("circle")
            .data(_points)
            .enter()
            .append("circle")
            .attr("cx", function (d) {
                return x(d.dist);
            })
            .attr("cy", function (d) {
                return y(d.z);
            })
            .attr("r", 0)
            .attr("class", "circle-d3");

        var focus = svg.append("g").style("display", "none");

        focus.append("line")
            .attr("id", "focusLineX")
            .attr("class", "focusLine-d3");
        focus.append("line")
            .attr("id", "focusLineY")
            .attr("class", "focusLine-d3");
        focus.append("circle")
            .attr("id", "focusCircle")
            .attr("r", 4)
            .attr("class", "circle-d3 focusCircle-d3");

        var div = d3.select(container).append("div")
            .attr("class", "tooltip-d3")
            .style("opacity", 0);

        var bisectDist = d3.bisector(function (d) {
            return d.dist;
        }).left;

        svg.append("rect")
            .attr("class", "overlay-d3")
            .attr("width", width)
            .attr("height", height)
            .on("mouseover", function () {
                focus.style("display", null);
                className.__createProfileMarker(self, _points[0]);
            })
            .on("mouseout", function () {
                focus.style("display", "none");
                className.__removeProfileMarker(self);

                // tooltips
                div.transition()
                    .duration(500)
                    .style("opacity", 0);
            })
            .on("mousemove", function () {
                var m = d3.mouse(this);
                var distance = x.invert(m[0]);
                var i = bisectDist(_points, distance);

                var d0 = _points[i - 1];
                var d1 = _points[i];
                var d = distance - d0[0] > d1[0] - distance ? d1 : d0;

                var xc = x(d.dist);
                var yc = y(d.z);

                focus.select("#focusCircle")
                    .attr("cx", xc)
                    .attr("cy", yc);
                focus.select("#focusLineX")
                    .attr("x1", xc).attr("y1", y(yDomain[0]))
                    .attr("x2", xc).attr("y2", y(yDomain[1]));
                focus.select("#focusLineY")
                    .attr("x1", x(xDomain[0])).attr("y1", yc)
                    .attr("x2", x(xDomain[1])).attr("y2", yc);

                className.__updateProfileMarker(self, d);

                // tooltips
                div.transition()
                    .duration(200)
                    .style("opacity", 0.9);

                var _message = "";
                _message += " Altitude : " + d.z + " m";
                if (_displayProfileOptions.currentSlope) {
                    _message += "<br/> Pente : " + d.slope + " %";
                }
                _message += "<br/> (Lat : " + d.lat + "/ Lon : " + d.lon + ")";

                div.html(_message)
                    .style("left", (d3.event.pageX) + "px")
                    .style("top", (d3.event.pageY - 28) + "px");
            });

        // return d3.selectAll("rect.overlay")[0][0];
        return svg;
    },

    /**
     * Display Profile using Amcharts framework. This method needs AmCharts libraries to be loaded.
     * @param {Object} data - elevations values for profile
     * @param {HTMLElement} container - html container where to display profile
     * @param {Object} context - this control object
     * @param {Object} className - calling class (ie ElevationPath)
     * @returns {DOMElement} profil container
     */
    displayProfileLibAmCharts : function (data, container, context, className) {
        var self = context;

        var _points = data.points;

        var ballonText = "<span class='altiPathValue'>[[title]] : [[value]]m</span><br/>";
        var currentSlope = self.options.displayProfileOptions.currentSlope;
        if (currentSlope) {
            ballonText += "<span class='altiPathValue'>Pente : [[slope]] %</span><br/>";
        }
        ballonText += "<span class='altiPathCoords'>(Lat: [[lat]] / Lon:[[lon]])</span>";

        AmCharts.addInitHandler(function () {});

        var settings = {
            type : "serial",
            pathToImages : "http://cdn.amcharts.com/lib/3/images/",
            categoryField : "dist",
            autoMarginOffset : 0,
            marginRight : 10,
            marginTop : 10,
            startDuration : 0,
            color : "#5E5E5E",
            fontSize : 8,
            theme : "light",
            thousandsSeparator : "",
            numberFormatter : {
                precision : -1,
                decimalSeparator : ",",
                thousandsSeparato : " "
            },
            categoryAxis : {
                color : "#5E5E5E",
                gridPosition : "start",
                minHorizontalGap : 40,
                tickPosition : "start",
                title : "Distance (" + data.unit + ")",
                titleColor : "#5E5E5E",
                labelOffset : 0,
                startOnAxis : true
            },
            chartCursor : {
                animationDuration : 0,
                bulletsEnabled : true,
                bulletSize : 10,
                categoryBalloonEnabled : false,
                cursorColor : "#F90",
                graphBulletAlpha : 1,
                graphBulletSize : 1,
                zoomable : false
            },
            trendLines : [],
            graphs : [{
                balloonColor : "#CCCCCC",
                balloonText : ballonText,
                bullet : "round",
                bulletAlpha : 0,
                bulletBorderColor : "#FFF",
                bulletBorderThickness : 2,
                bulletColor : "#F90",
                bulletSize : 6,
                hidden : false,
                id : "AmGraph-1",
                fillAlphas : 0.4,
                fillColors : "#C77A04",
                lineAlpha : 1,
                lineColor : "#C77A04",
                lineThickness : 1,
                title : "Altitude",
                valueField : "z"
            }],
            guides : [],
            valueAxes : [{
                id : "ValueAxis-1",
                minVerticalGap : 20,
                title : "Altitude (m)"
            }],
            balloon : {
                borderColor : "#CCCCCC",
                borderThickness : 1,
                fillColor : "#FFFFFF",
                showBullet : true
            },
            titles : [],
            allLabels : [],
            dataProvider : _points
        };

        var _containerProfile = AmCharts.makeChart(container, settings);

        _containerProfile.addListener("changed", function (e) {
            var obj = e.chart.dataProvider[e.index];
            className.__updateProfileMarker(self, obj);
        });

        return _containerProfile;
    }
};

export default ProfileElevationPathDOM;
