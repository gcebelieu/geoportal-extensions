/* global module, __dirname */

// -- modules
var fs = require("fs");
var path = require("path");
var webpack = require("webpack");
var header = require("string-template");
var glob = require("glob");

// -- plugins
var DefineWebpackPlugin = webpack.DefinePlugin;
var MiniCssExtractPlugin = require("mini-css-extract-plugin");
var BannerWebPackPlugin = webpack.BannerPlugin;
var TerserJsWebPackPlugin = require("terser-webpack-plugin");
var OptimizeCSSAssetsWebPackPlugin = require("optimize-css-assets-webpack-plugin");
var ReplaceWebpackPlugin = require("replace-bundle-webpack-plugin");
var JsDocWebPackPlugin = require("../scripts/webpackPlugins/jsdoc-plugin");
var HandlebarsPlugin = require("../scripts/webpackPlugins/handlebars-plugin");
var HandlebarsLayoutPlugin = require("handlebars-layouts");
var CopyWebpackPlugin = require("copy-webpack-plugin");

// -- performances
var SpeedMeasurePlugin = require("speed-measure-webpack-plugin");
var smp = new SpeedMeasurePlugin();

// -- variables
var ROOT = path.join(__dirname, "../..");
var pkg = require(path.join(ROOT, "package.json"));

module.exports = (env, argv) => {
    // par defaut
    var devMode = false;
    var logMode = false;
    var suffix = "";
    if (argv.mode === "production") {
        suffix = "";
        logMode = false;
        devMode = false;
    }
    if (argv.mode === "development") {
        suffix = "-map";
        logMode = true;
        devMode = true;
    }
    if (argv.mode === "none") {
        suffix = "-src";
        logMode = true;
        devMode = false;
    }

    return smp.wrap({
        entry : {
            "GpPluginOpenLayers" : [
                "whatwg-fetch",
                path.join(ROOT, "src", "OpenLayers", "index.js")
            ]
        },
        output : {
            path : path.join(ROOT, "dist", "openlayers"),
            filename : "[name]" + suffix + ".js",
            library : "Gp",
            // libraryTarget : "umd", 
            // umdNamedDefine : true,
            // globalObject: 'this'
        },
        resolve : {
            alias : {
                // - import auto en mode module ES6 :
                // "ol",
                // "geoportal-access-lib",
                // "proj4", cf. module.rules !
                // "ol-mapbox-style", cf. module.rules !
                // - import auto en mode bundle :
                // "loglevel",
                // "es6-promise",
                // "sortablejs",
                // "eventbusjs" cf. module.rules !
                // - import forcé en mode bundle :
                "proj4" : path.join(ROOT, "node_modules", "proj4", "dist", "proj4-src.js"),
            }
        },
        externals :
        [
            /**
            * ol est une dependance externe, elle doit donc être supprimé du bundle.
            * on realise un pre traitement qui consite à modifier les appels :
            *   "ol/control/Control" -> "ol.control.Control"
            * ceci afin de pointer vers la variable globale externe d'openlayers : ol !
            * une exception est faite sur les dependances ol pour olms..., car cette
            * librairie utilise des fonctionnalités uniquement disponible en ES6...
            */
            function(context, request, callback) {
                if (/^ol\/.+$/.test(request)) {
                    // liste des modules ES6 à garder dans le code...
                    if ([
                        "ol/events/Event",
                        "ol/events/EventType",
                        "ol/events",
                        "ol/obj",
                        "ol/render/canvas",
                        "ol/render/Feature",
                        "ol/css",
                        "ol/dom",
                        "ol/transform",
                        "ol/asserts",
                        "ol/AssertionError",
                        "ol/util",
                        "ol/render/canvas/LabelCache",
                        "ol/structs/LRUCache",
                        "ol/events/Target",
                        "ol/Disposable",
                        "ol/functions",
                        "ol/proj/transforms"
                    ].includes(request)) {
                        // console.log("#### IN : ", request);
                        return callback();
                    }
                    // console.log("#### OUT : ", request);
                    const replacedWith = request.replace(/\//g, '.');
                    return callback(null, replacedWith);
                }
                // console.log("#### NULL : ", request);
                callback();
            },
            /**
            * FIXME
            * configuration uniquement valable en mode umd !?
            * mais à tester lors de l'import dans le SDK...
            */
            {
                ol : {
                    commonjs : "ol",
                    commonjs2 : "ol",
                    amd : "ol",
                    root : "ol"
                },
                "node-fetch" : {
                    commonjs2 : "node-fetch",
                    commonjs : "node-fetch",
                    amd : "require"
                },
                xmldom : {
                    commonjs2 : "xmldom",
                    commonjs : "xmldom",
                    amd : "require"
                }
            }
        ],
        devtool : (devMode) ? "eval-source-map" : false,
        devServer : {
            // proxy: {
            //      "/samples/resources/proxy/" : {
            //          secure: false,
            //          target: "http://localhost/proxy/proxy.php" // proxy à deployer en local !
            //      }
            // },
            stats : "errors-only",
            host : "localhost",
            https: true,
            port : 9001,
            hot : true,
            contentBase : path.join(__dirname),
            // publicPath : "/dist/openlayers/",
            // openPage : "/samples/index-openlayers-map.html",
            open : "google-chrome",
            watchOptions : {
                watch : true,
                poll : true
            },
            overlay : {
                errors : true,
                warnings : false
            }
        },
        stats : "verbose", // "none",
        optimization : {
            /** MINIFICATION */
            minimizer: [
                new TerserJsWebPackPlugin({
                    extractComments: false,
                    terserOptions: {
                        output: {
                            // FIXME avec les banner !
                            comments: "some",
                            // drop_console: true
                        },
                        mangle: true
                    }
                }),
                new OptimizeCSSAssetsWebPackPlugin({})
            ],
            /** EXTRACT CSS INTO SINGLE FILE */
            splitChunks : {
                cacheGroups : {
                    styles : {
                        name : "GpPluginOpenLayers",
                        test : /\.css$/,
                        chunks : "all",
                        enforce : true
                    }
                }
            }
        },
        module : {
            rules : [
                {
                    /**
                    * transpilation avec babel des sources.
                    * (on exclut les dependances...)
                    */
                    test : /\.js$/,
                    include : [
                        path.join(ROOT, "src", "Common"),
                        path.join(ROOT, "src", "OpenLayers")
                    ],
                    exclude : /node_modules/,
                    use : {
                        loader : "babel-loader",
                        options : {
                            compact : false,
                            presets : [[
                                "@babel/preset-env", {
                                    // "useBuiltIns": "usage",
                                    "corejs": { version: '3.6', proposals: false },
                                    "debug": true,
                                    // "loose": true,
                                    // "exclude": ['transform-typeof-symbol'],
                                    // "targets": {
                                    //     "ie" : "10"
                                    // }
                                }
                            ]]
                        }
                    }
                },
                {
                    /**
                    * Compatibilité IE du module olms ...
                    */
                    test : /\.js$/,
                    include : [
                        /node_modules\/ol-mapbox-style/,
                        /node_modules\/@mapbox\/mapbox-gl-style-spec/
                    ],
                    use : {
                        loader : "babel-loader",
                        options : {
                            compact : false,
                            plugins : ["@babel/plugin-transform-template-literals"],
                            presets : [[
                                "@babel/preset-env", {
                                    // "useBuiltIns": "usage",
                                    "corejs": { version: '3.6', proposals: false },
                                    "debug": true,
                                    // "loose": true,
                                    // "exclude": ['transform-typeof-symbol'],
                                    // "targets": {
                                    //     "ie" : "10"
                                    // }
                                }
                            ]]
                        }
                    }
                },
                {
                    /**
                    * controle des JS en mode warning.
                    * (on exclut les dependances)
                    */
                    test : /\.js$/,
                    enforce : "pre",
                    include : [
                        path.join(ROOT, "src", "Common"),
                        path.join(ROOT, "src", "OpenLayers")
                    ],
                    exclude : [
                        /node_modules/,
                        path.resolve(ROOT, "src", "OpenLayers", "CSS")
                    ],
                    use : [
                        {
                            loader : "eslint-loader",
                            options : {
                                emitWarning : true
                            }
                        }
                    ]
                },
                {
                    /**
                    * proj4 est exposé en global : proj4 !
                    *
                    * > package.json::main = node_modules/proj4/dist/proj4-src.js
                    *   test : require.resolve("proj4")
                    *   c'est un bundle type umd, et la variable globale contient proj4 (fonction)
                    *
                    * > package.json::module = node_modules/proj4/lib/index.js (par defaut)
                    *   test : /node_modules\/proj4\/lib\/index\.js$/
                    *   c'est un module, et la variable globale est le module !
                    *   on souhaiterait la fonction proj4 !
                    */
                    test : require.resolve("proj4"),
                    use : [
                        {
                            loader : "expose-loader",
                            options : "proj4"
                        }
                    ]
                },
                {
                    /**
                    * eventbusjs est exposé en global : eventbus !
                    *
                    * > package.json::main = node_modules/eventbusjs/lib/eventbus.min.js (par defaut)
                    *   test : require.resolve("eventbusjs")
                    *   c'est un bundle minifié de type umd, et la variable globale
                    *   contient les listeners.
                    */
                    test : require.resolve("eventbusjs"),
                    use : [{
                        loader : "expose-loader",
                        options : "eventbus"
                    }]
                },
                {
                    /**
                    * ol-mapbox-style est exposé en global : olms !
                    *
                    * > package.json::main = node_modules/ol-mapbox-style/index.js (par defaut)
                    *   c'est un module..., donc pas besoin du loader.
                    *   mais exception à l'utilisation :
                    *   <TypeError: Cannot read property 'CLEAR'>
                    *   car ol n'expose pas en mode web la fonctionnalité suivante :
                    *       ol.events.EventType !?
                    *   ce module ne fonctionne que si ol est en module ES6 !?
                    *
                    * > on pointe sur le bundle minifié, et on l'exporte comme un module
                    *   test : /node_modules\/ol-mapbox-style\/dist\/olms\.js$/,
                    */
                    test : /node_modules\/ol-mapbox-style\/dist\/olms\.js$/,
                    use : [{
                        loader : "exports-loader",
                        options : "olms"
                    }]
                },
                {
                    /**
                    * controle et extraction des CSS.
                    */
                    test : /\.css$/,
                    include : [
                        path.join(ROOT, "src", "Common", "CSS"),
                        path.join(ROOT, "src", "OpenLayers", "CSS")
                    ],
                    exclude : /node_modules/,
                    use : [
                        MiniCssExtractPlugin.loader,
                        "css-loader"
                    ]
                },
                {
                    /**
                    * transformation des images en base64 dans les CSS.
                    */
                    test : /\.(png|jpg|gif|svg)$/,
                    loader : "url-loader",
                    options: {
                        fallback : "responsive-loader",
                        quality : 100
                    },
                    exclude : /node_modules/
                }
            ]
        },
        plugins : [
            /** REPLACEMENT DE VALEURS */
            new ReplaceWebpackPlugin(
                [
                    // {
                    //     partten : /__GPOLEXTVERSION__/g,
                    //     /** replacement de la clef __VERSION__ par la version du package */
                    //     replacement : function () {
                    //         return pkg.olExtVersion;
                    //     }
                    // },
                    {
                        partten : /__DATE__/g,
                        /** replacement de la clef __DATE__ par la date du build */
                        replacement : function () {
                            return pkg.date;
                        }
                    },
                    {
                        partten : /__PRODUCTION__/g,
                        replacement : function () {
                            /** replacement de la clef __PRODUCTION__ pour le LOGGER */
                            return !logMode;
                        }
                    }
                ]
            ),
            /** GESTION DU LOGGER */
            // new DefineWebpackPlugin({
            //     __PRODUCTION__ : JSON.stringify(!logMode)
            // }),
            /** GENERATION DE LA JSDOC */
            new JsDocWebPackPlugin({
                conf : path.join(ROOT, "build/jsdoc/jsdoc-openlayers.json")
            }),
            /** CSS / IMAGES */
            new MiniCssExtractPlugin({
                filename : "[name]" + suffix + ".css"
            }),
            /** HANDLEBARS TEMPLATES */
            new HandlebarsPlugin(
                {
                    entry : {
                        path : path.join(ROOT, "samples-src", "pages", "openlayers"),
                        pattern : "**/*-bundle-*.html"
                    },
                    output : {
                        path : path.join(ROOT, "samples", "openlayers"),
                        flatten : false,
                        filename : "[name]" + suffix + ".html"
                    },
                    helpers : [
                        HandlebarsLayoutPlugin
                    ],
                    partials : [
                        path.join(ROOT, "samples-src", "templates", "openlayers", "*.hbs"),
                        path.join(ROOT, "samples-src", "templates", "partials", "*.hbs"),
                        path.join(ROOT, "samples-src", "templates", "partials", "openlayers", "*.hbs")
                    ],
                    context : [
                        path.join(ROOT, "samples-src", "config.json"),
                        {
                            mode : suffix,
                            version : pkg.dependencies["ol"] === 'latest' ? pkg.dependencies["ol"] : 'v' + pkg.dependencies["ol"].match(/(\d+\.\d+\.\d+)/)[0]
                        }
                    ]
                }
            ),
            /** TEMPLATES INDEX */
            new HandlebarsPlugin(
                {
                    entry : path.join(ROOT, "samples-src", "pages", "index-openlayers.html"),
                    output : {
                        path : path.join(ROOT, "samples"),
                        filename : "[name]" + suffix + ".html"
                    },
                    context : {
                        samples : () => {
                            var _root = path.join(ROOT, "samples-src", "pages", "openlayers");
                            var list = glob.sync(path.join(_root, "**", "*-bundle-*.html"));
                            list = list.map(function (filePath) {
                                var relativePath = path.relative(_root, filePath);
                                var label = relativePath.replace("/", " -- ");
                                var pathObj = path.parse(relativePath);
                                return {
                                    filePath : path.join("openlayers", pathObj.dir, pathObj.name.concat(suffix).concat(pathObj.ext)),
                                    label : label
                                };
                            });
                            return list;
                        }
                    }
                }
            ),
            /* RESOURCES COPY FOR SAMPLES */
            new CopyWebpackPlugin([
                {
                    from : path.join(ROOT, "samples-src", "resources", "**/*"),
                    to : path.join(ROOT, "samples", "resources"),
                    context : path.join(ROOT, "samples-src", "resources")
                }
            ])
        ]
            /** AJOUT DES LICENCES */
            .concat([
                new BannerWebPackPlugin({
                    banner : header(fs.readFileSync(path.join(ROOT, "build/licences", "licence-proj4js.tmpl"), "utf8"), {
                        __VERSION__ : pkg.dependencies["proj4"],
                    }),
                    raw : true
                }),
                new BannerWebPackPlugin({
                    banner : fs.readFileSync(path.join(ROOT, "build/licences", "licence-es6promise.txt"), "utf8"),
                    raw : true
                }),
                new BannerWebPackPlugin({
                    banner : header(fs.readFileSync(path.join(ROOT, "build/licences", "licence-eventbusjs.tmpl"), "utf8"), {
                        __VERSION__ : pkg.dependencies["eventbusjs"],
                    }),
                    raw : true
                }),
                new BannerWebPackPlugin({
                    banner : header(fs.readFileSync(path.join(ROOT, "build/licences", "licence-fetch.tmpl"), "utf8"), {
                        __VERSION__ : pkg.dependencies["whatwg-fetch"],
                    }),
                    raw : true
                }),
                new BannerWebPackPlugin({
                    banner : header(fs.readFileSync(path.join(ROOT, "build/licences", "licence-sortablejs.tmpl"), "utf8"), {
                        __VERSION__ : pkg.dependencies["sortablejs"],
                    }),
                    raw : true
                }),
                new BannerWebPackPlugin({
                    banner : header(fs.readFileSync(path.join(ROOT, "build/licences", "licence-olms.tmpl"),"utf8"), {
                        __VERSION__ : pkg.dependencies["ol-mapbox-style"],
                    }),
                    raw : true,
                    entryOnly : true
                }),
                new BannerWebPackPlugin({
                    banner : header(fs.readFileSync(path.join(ROOT, "build/licences", "licence-ign.tmpl"), "utf8"), {
                        __BRIEF__ : pkg.olExtName,
                        __VERSION__ : pkg.olExtVersion,
                        __DATE__ : pkg.date
                    }),
                    raw : true,
                    entryOnly : true
                })
            ])
    });
};
