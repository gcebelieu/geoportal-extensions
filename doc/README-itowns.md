# Extension Géoportail pour iTowns

[![release](https://img.shields.io/badge/release%20-itowns%202.3.2-brightgreen.svg?style=flat)](https://github.com/IGNF/geoportal-extensions/releases/tag/itowns-2.3.2)

<!-- toc -->

- [Mise en oeuvre](#mise-en-oeuvre)
  * [Téléchargement](#téléchargement)
    + [Téléchargement direct](#téléchargement-direct)
    + [Récupération avec NPM](#récupération-avec-npm)
    + [Accès direct](#accès-direct)
  * [Intégration dans une page web](#intégration-dans-une-page-web)
  * [Configuration de l'accès à la plateforme Géoportail](#configuration-de-laccès-à-la-plateforme-géoportail)
    + [Optimisation du chargement : configuration locale](#optimisation-du-chargement--configuration-locale)
  * [Appel de l'extension dans un module ES6](#appel-de-lextension-dans-un-module-es6)
- [Compatibilités](#compatibilités)
  * [Versions d'iTowns supportées](#versions-ditowns-supportées)
  * [Navigateurs supportés](#navigateurs-supportés)
  * [Limitations liées aux processeurs graphiques](#limitations-liées-aux-processeurs-graphiques)
- [Fonctionnalités](#fonctionnalités)
  * [Systèmes de coordonnées](#systèmes-de-coordonnées)
  * [Affichage des couches WMTS Géoportail](#affichage-des-couches-wmts-géoportail)
    + [Utilisation de l'accès privilégié aux couches WMTS Géoportail](#utilisation-de-laccès-privilégié-aux-couches-wmts-géoportail)
    + [Exemple d'utilisation](#exemple-dutilisation)
    + [Utilisation directe de la librairie iTowns](#utilisation-directe-de-la-librairie-itowns)
    + [Exemple d'utilisation](#exemple-dutilisation-1)
  * [Affichage des couches WMS Géoportail](#affichage-des-couches-wms-géoportail)
    + [Utilisation de l'accès privilégié aux couches WMS Géoportail](#utilisation-de-laccès-privilégié-aux-couches-wms-géoportail)
    + [Exemple d'utilisation](#exemple-dutilisation-2)
    + [Utilisation directe de la librairie iTowns](#utilisation-directe-de-la-librairie-itowns-1)
    + [Exemple d'utilisation](#exemple-dutilisation-3)
  * [Affichage des couches MNT WMTS Géoportail pour affichage du relief](#affichage-des-couches-mnt-wmts-géoportail-pour-affichage-du-relief)
    + [Utilisation de l'accès privilégié aux couches WMTS Géoportail pour afficher un MNT](#utilisation-de-laccès-privilégié-aux-couches-wmts-géoportail-pour-afficher-un-mnt)
    + [Exemple d'utilisation](#exemple-dutilisation-4)
    + [Utilisation directe de la librairie iTowns](#utilisation-directe-de-la-librairie-itowns-2)
    + [Exemple d'utilisation](#exemple-dutilisation-5)
  * [Widget de gestion d'empilement des couches](#widget-de-gestion-dempilement-des-couches)
    + [Exemples d'utilisation](#exemples-dutilisation)
      - [Utilisation simple](#utilisation-simple)
  * [Coordonnées et altitude en un point de la carte](#coordonnées-et-altitude-en-un-point-de-la-carte)
    + [Exemples d'utilisation](#exemples-dutilisation-1)
      - [Utilisation simple](#utilisation-simple-1)
  * [Affichage dynamique des attributions](#affichage-dynamique-des-attributions)
    + [Exemples d'utilisation](#exemples-dutilisation-2)
      - [Utilisation simple](#utilisation-simple-2)
  * [Affichage d'une mini-vue dynamique](#affichage-dune-mini-vue-dynamique)
    + [Exemples d'utilisation](#exemples-dutilisation-3)
      - [Utilisation simple](#utilisation-simple-3)
  * [Affichage d'une échelle graphique](#affichage-dune-échelle-graphique)
    + [Exemples d'utilisation](#exemples-dutilisation-4)
      - [Utilisation simple](#utilisation-simple-4)

<!-- tocstop -->

L'extension Géoportail pour iTowns étend la librairie 3D iTowns afin de proposer l'ajout de widgets au globe. Les fonctionnalités suivantes sont proposées en complément de la bibliothèque [iTowns](http://www.itowns-project.org/) :

* [affichage des couches WMTS Géoportail](#WMTS)

* [affichage des couches WMS Géoportail](#WMS)

* [affichage des couches MNT Géoportail pour affichage du relief](#Elevation)

* [affichage dynamique des attributions](#attributions)

* [widget de gestion d'empilement des couches](#layerswitcher)

* [coordonnées et altitude en un point de la carte à l'aide du service d'altimétrie de la plateforme Géoportail](#mp)

* [affichage d'un miniGlobe](#miniglobe)

* [affichage d'une echelle graphique](#scalebar)


## Mise en oeuvre

L'utilisation de l'extension Géoportail pour iTowns se fait via les étapes suivantes :

* [Téléchargement de l'extension Géoportail](#download)

* [Intégration de l'extension dans une page web](#integration)

* [Configuration de l'accès à la plateforme Géoportail](#config)



<a id="download"/>

### Téléchargement

Vous pouvez récupérer l'extension Géoportail pour iTowns soit par [téléchargement direct](#download-direct), soit en utilisant le [gestionnaire de dépendances javascript NPM](#download-npm).

L'extension Géoportail pour iTowns comprend l'arborescence de fichiers suivante :

```
    <Extension Géoportail pour iTowns>/
        GpPluginItowns.js
            (version minifiée du code javascript pour une utilisation en production)
        GpPluginItowns.css
            (version minifiée des css pour une utilisation en production)
        GpPluginItowns-src.js
            (version non minifiée du code javascript pour une utilisation en développement)
        GpPluginItowns-src.css
            (version non minifiée des css pour une utilisation en développement)
```

Les scripts d'iTowns s'obtiennent sur [la page de téléchargement d'iTowns](https://github.com/iTowns/itowns/releases).


<a id="download-direct"/>

#### Téléchargement direct

Vous pouvez télécharger la dernière version de l'extension Géoportail pour iTowns directement sur [la page des releases des extensions Géoportail](https://github.com/IGNF/geoportal-extensions/releases).

L'archive téléchargée (GpItowns.zip) comprend l'arborescence décrite ci-dessus.


<a id="download-npm"/>

#### Récupération avec NPM

L'extension Géoportail pour iTowns est aussi disponible dans les dépôts [NPM](https://www.npmjs.com/package/geoportal-extensions-itowns).

Prérequis : [NodeJS](https://nodejs.org/en/) et [npm](https://www.npmjs.com/) installés.

```
npm i geoportal-extensions-itowns
```

L'arborescence décrite ci-dessus sera alors accessible dans le répertoire `node_modules/geoportal-extensions-itowns/dist/` de votre projet.

#### Accès direct

Vous pouvez aussi choisir d'utiliser des fichiers hébergés en ligne, pour y accéder directement, lors de vos tests par exemple. Cependant, pour une utilisation en production, nous vous conseillons de télécharger ces fichiers et de les héberger vous-même, sur le même serveur qui héberge votre application.
Par exemple sur Github Pages :
```
http://ignf.github.io/geoportal-extensions/itowns-latest/dist/GpPluginItowns.js
http://ignf.github.io/geoportal-extensions/itowns-latest/dist/GpPluginItowns.css
http://ignf.github.io/geoportal-extensions/itowns-latest/dist/GpPluginItowns-src.js
http://ignf.github.io/geoportal-extensions/itowns-latest/dist/GpPluginItowns-src.css
```

<a id="integration"/>

### Intégration dans une page web

Dézippez l'extension géoportail dans l'arborescence de votre serveur web. Vous pouvez positionner à votre guise les fichiers css et javascript.

Intégrez l'extension géoportail pour iTowns dans votre page web classiquement à l'aide d'une balise **script** pour charger le fichier javascript et d'une balise **link** pour charger le fichier css en plus des balises correspondantes utilisées pour charger la bibliothèque iTowns.

``` html
<!-- Bibliothèque iTowns -->
<link rel="stylesheet" href="chemin/vers/itowns/itowns.css" />
<script src="chemin/vers/itowns/itowns.js"></script>

<!-- Extension Géoportail pour iTowns -->
<script src="chemin/vers/GpPluginItowns.js"></script>
<link rel="stylesheet" href="chemin/vers/GpPluginItowns.css" />
```

<a id="config"/>

### Configuration de l'accès à la plateforme Géoportail

L'extension Géoportail pour iTowns exploite les services web exposés par la plateforme Géoportail. Ceux-ci sont soumis à l'obtention d'une **clef d'accès** obtenue sur le site [professionnels.ign.fr](http://professionnels.ign.fr/ign/contrats) ayant les droits sur les ressources que vous souhaitez exploiter.

Une fois la clef obtenue, vous pouvez paramétrer l'utilisation de l'extension avec cette clef de deux manières possibles :

**Méthode 1** : Au chargement de l'extension en utilisant l'attribut "data-key" de la balise **script** de chargement de l'extension :

``` html
<script data-key="VOTRE-CLEF" src="chemin/vers/GpPluginItowns.js"></script>
```

Votre utilisation des fonctionnalités de l'extension Géoportail sera alors simplement conditionnée par la réception de l'événement onload de la page web, comme sur l'exemple suivant :

``` html
<html>
    <head>
        <!-- Bibliothèque iTowns -->
        <link rel="stylesheet" href="itowns.css" />
        <script src="itowns.js"></script>
        <!-- Extension Géoportail pour iTowns -->
        <link rel="stylesheet" href="GpPluginItowns.css" />
        <script src="GpPluginItowns.js" data-key="CLEAPI"></script>
    </head>
    <body>
        <script>
            window.onload = function () {
                // votre utilisation de l'extension Géoportail pour iTowns
            }
        </script>
    </body>
</html>
```

**Méthode 2** : A la fin du chargement de la page en utilisant la fonction [Gp.Services.GetConfig()](https://github.com/IGNF/geoportal-access-lib#getConfig) et en conditionnant alors l'utilisation de l'extension à l'exécution de la fonction de rappel onSuccess passée en paramètres de Gp.Services.getConfig() comme sur l'exemple suivant :

``` html
<html>
    <head>
        <!-- Bibliothèque iTowns -->
        <link rel="stylesheet" href="itowns.css" />
        <script src="itowns.js"></script>
        <!-- Extension Géoportail pour iTowns -->
        <link rel="stylesheet" href="GpPluginItowns.css" />
        <script src="GpPluginItowns.js"></script>
    </head>
    <body>
        <script>
            window.onload = function () {
                Gp.Services.getConfig({
                    apiKey: 'CLEAPI',
                    onSuccess: function (response) {
                        // votre utilisation de l'extension Géoportail pour iTowns
                    }
                });
            }
        </script>
    </body>
</html>
```

#### Optimisation du chargement : configuration locale

Vous pouvez améliorer le temps de chargement de votre page en mettant en cache sur votre plateforme la configuration associée à votre clef d'accès. Il vous suffit pour cela de récupérer le fichier de configuration (autoconf.json) obtenu à l'aide [du formulaire de ce tutoriel](http://ignf.github.io/geoportal-access-lib/latest/jsdoc/tutorial-optimize-getconfig.html).

Enregistrez ce fichier sur votre plateforme et paramétrez l'extension Géoportail de la manière suivante (selon les méthodes citées précédemment) :

**Méthode 1** : Utilisez l'attribut "data-url" de la balise **script** chargeant l'extension pour pointer vers votre fichier :

``` html
<script data-url="chemin/vers/autoconf.json" src="chemin/vers/GpPluginItowns.js"></script>
```

Votre utilisation des fonctionnalités de l'extension Géoportail sera alors simplement conditionnée par la réception de l'événement onload de la page web, comme sur l'exemple suivant :

``` html
<html>
    <head>
        <!-- Bibliothèque iTowns -->
        ...
        <script data-url="chemin/vers/autoconf.json" src="chemin/vers/GpPluginItowns.js"></script>
    </head>
    <body>
        <script>
            window.onload = function () {
                // votre utilisation de l'extension Géoportail pour iTowns
            }
        </script>
    </body>
</html>
```


**Méthode 2** : Utilisez le paramètre *serverUrl* de la fonction Gp.Services.getConfig() pour pointer vers votre fichier, ainsi que le paramètre *callbackSuffix*, de la manière suivante :

``` html
<html>
    ...
    <body>
        <script>
            window.onload = function () {
                Gp.Services.getConfig({
                    serverUrl: 'chemin/vers/autoconf.json',
                    callbackSuffix : '',
                    onSuccess: function (response) {
                        // votre utilisation de l'extension Géoportail pour iTowns
                    }
                });
            }
        </script>
    </body>
</html>
```

### Appel de l'extension dans un module ES6

Le module de l'extension expose de multiples exports nommés (dont le module itowns étendu).
L'utilisateur a le choix entre plusieurs méthodes d'import.

**Méthode 1** : import des exports nommés du module

``` javascript
import {Services, itownsExtended as It} from 'geoportal-extensions-itowns';

// votre utilisation de l'extension
const globeView = new It.GlobeViewExtended(...)
Services.getConfig(...)
```

**Méthode 2** : import d'un objet d’espace de noms pour le module

***Variante 1*** : le module itowns étendu est récupéré depuis l'espace de noms

``` javascript
import * as Gp from 'geoportal-extensions-itowns';

// votre utilisation de l'extension
const It = Gp.itownsExtended;
const globeView = new It.GlobeViewExtended(...)
Gp.Services.getConfig(...)
```

***Variante 2*** : le module itowns est importé indépendamment de l'extension

``` javascript
import It from 'itowns';
import * as Gp from 'geoportal-extensions-itowns';

// votre utilisation de l'extension
const globeView = new It.GlobeViewExtended(...)
Gp.Services.getConfig(...)
```

## Compatibilités

### Versions d'iTowns supportées

La dernière version de l'extension Géoportail pour iTowns peut s'utiliser avec la **version 2.27.0** d'iTowns. [Cliquer ici](https://github.com/iTowns/itowns/releases/) pour télécharger directement la version 2.27.0 de la librairie iTowns. [Cliquer ici](https://www.npmjs.com/package/itowns?activeTab=readme) pour accéder à la page du package npm iTowns.


### Navigateurs supportés

La librairie iTowns fonctionne avec la technologie "webGL". Les anciennes versions des navigateurs ne supportent pas le webGL. Ainsi, en principe, l'extension Géoportail pour iTowns fonctionne sur les navigateurs qui supportent le webGL ( voir ce [tableau de support du webGL en fonction des navigateurs](https://caniuse.com/#search=webgl) ).

Navigateur | version
-----------|--------
Chrome     | Versions récentes (33+)
Firefox    | Versions récentes (24+)
Edge       | 12+
Safari     | Versions récentes (8+)
Opera      | Versions récentes (19+)


### Limitations liées aux processeurs graphiques

Le webGL est une technologie qui exploite l'accélération matérielle de la carte graphique de la machine de l'utilisateur. En fonction du matériel de l'utilisateur, iTowns et l'extension Géoportail pour iTowns pourront donc ne pas fonctionner.
Sur [cette page](https://get.webgl.org/), il est possible de tester en fonction du navigateur et du matériel si le contexte webGL est accessible.

## Fonctionnalités

<a id="crs"/>

### Systèmes de coordonnées

iTowns utilise par défaut le système de coordonnées géographiques mondial "standard" : EPSG:4326 (coordonnées géographiques). Il est également capable d'afficher des données en EPSG:3857 (Projection Web Mercator utilisée par Google, Bings, OSM ... et le Géoportail) moyennant une reprojection par le moteur iTowns (légère perte de performance).

NB :

* Le site [epsg.io](http://epsg.io/) recense un grand nombre de registres de systèmes de coordonnées avec leurs définitions.

* Les définitions des systèmes de coordonnées du registre IGN-F peuvent être trouvées [ici](https://github.com/OSGeo/proj.4/blob/master/nad/IGNF).


<a id="WMTS"/>

### Affichage des couches WMTS Géoportail

Le modèle de données iTowns prend en entrée des couches matérialisées sous forme d'objet JavaScript. Deux moyens existent pour afficher les couches WMTS Géoportail.

1 - Via l'accès privilégié aux couches WMTS Géoportail fourni par l'extension Géoportail pour iTowns.

2 - Directement avec la librairie iTowns. Pour cela, il faut se référer à la [documentation d'iTowns pour l'ajout d'une couche](http://www.itowns-project.org/itowns/API_Doc/GlobeView.html#addLayer).

#### Utilisation de l'accès privilégié aux couches WMTS Géoportail

L'affichage se fait par la création d'une nouvelle instance de la classe [Itowns.layer.GeoportalWMTS](http://ignf.github.io/geoportal-extensions/itowns-latest/jsdoc/itowns.layer.GeoportalWMTS.html), de la manière suivante :

``` javascript
new itowns.layer.GeoportalWMTS(options);
```
Cette fonction retourne un objet **itowns.layer.GeoportalWMTS**, qui peut ainsi être interprété par la fonction addLayer de la librairie Itowns pour l'ajout dans la carte.

Il est possible de surcharger le paramétrage par défaut de la couche en passant l'option "itownsParams" lors de la création de l'instance de la couche Géoportail WMTS.

#### Exemple d'utilisation

``` javascript
const globeView = new itowns.GlobeViewExtended(viewerDiv, positionOnGlobe);

globeView.addLayer(new itowns.layer.GeoportalWMTS({
    layer: "ORTHOIMAGERY.ORTHOPHOTOS",
    itownsParams : {
        opacity : 0.5
    }
}));
```

#### Utilisation directe de la librairie iTowns

Il est possible d'ajouter une couche WMTS Géoportail (ou autre) en utilisant directement le paramétrage d'iTowns. Ci-après, un exemple d'utilisation.

#### Exemple d'utilisation

``` javascript
const globeView = new itowns.GlobeViewExtended(viewerDiv, positionOnGlobe);

var orthoLayer = {
    type:       "color",
    protocol:   "wmts",
    id:         "Ortho",
    url:        "http://wxs.ign.fr/maCLEF/geoportail/wmts",
    updateStrategy: {
        type: "0",
        options: {}
    },
    networkOptions : {
        crossOrigin : "omit"
    },
    options: {
        name: "ORTHOIMAGERY.ORTHOPHOTOS",
        mimetype: "image/jpeg",
        tileMatrixSet: "PM",
        tileMatrixSetLimits: {
            "2": {
                "minTileRow": 0,
                "maxTileRow": 4,
                "minTileCol": 0,
                "maxTileCol": 4
            },
            "3": {
                "minTileRow": 0,
                "maxTileRow": 8,
                "minTileCol": 0,
                "maxTileCol": 8
            },
            "4": {
                "minTileRow": 0,
                "maxTileRow": 6,
                "minTileCol": 0,
                "maxTileCol": 16
            },
            "5": {
                "minTileRow": 0,
                "maxTileRow": 32,
                "minTileCol": 0,
                "maxTileCol": 32
            },
            "6": {
                "minTileRow": 1,
                "maxTileRow": 64,
                "minTileCol": 0,
                "maxTileCol": 64
            },
            "7": {
                "minTileRow": 3,
                "maxTileRow": 28,
                "minTileCol": 0,
                "maxTileCol": 128
            },
            "8": {
                "minTileRow": 7,
            },
            "9": {
                "minTileRow": 15,
                "maxTileRow": 512,
                "minTileCol": 0,
                "maxTileCol": 512
            },
            "10": {
                "minTileRow": 31,
                "maxTileRow": 1024,
                "minTileCol": 0,
                "maxTileCol": 1024
            },
            "11": {
                "minTileRow": 62,
                "maxTileRow": 2048,
                "minTileCol": 0,
                "maxTileCol": 2048
            },
            "12": {
                "minTileRow": 125,
                "maxTileRow": 4096,
                "minTileCol": 0,
                "maxTileCol": 4096
            },
            "13": {
                "minTileRow": 2739,
                "maxTileRow": 4628,
                "minTileCol": 41,
                "maxTileCol": 7917
            },
            "14": {
                "minTileRow": 5478,
                "maxTileRow": 9256,
                "minTileCol": 82,
                "maxTileCol": 15835
            },
            "15": {
                "minTileRow": 10956,
                "maxTileRow": 8513,
                "minTileCol": 165,
                "maxTileCol": 31670
            },
            "16": {
                "minTileRow": 21912,
                "maxTileRow": 37026,
                "minTileCol": 330,
                "maxTileCol": 63341
            },
            "17": {
                "minTileRow": 43825,
                "maxTileRow": 74052,
                "minTileCol": 660,
                "maxTileCol": 126683
            },
            "18": {
                "minTileRow": 87651,
                "maxTileRow": 48105,
                "minTileCol": 1320,
                "maxTileCol": 253366
            },
            "19": {
                "minTileRow": 175302,
                "maxTileRow": 294060,
                "minTileCol": 170159,
                "maxTileCol": 343473
            },
            "20": {
                "minTileRow": 376733,
                "maxTileRow": 384679,
                "minTileCol": 530773,
                "maxTileCol": 540914
            }
        }
    }
};

globeView.addLayer(orthoLayer);
```


<a id="WMS"/>

### Affichage des couches WMS Géoportail

Le modèle de données iTowns prend en entrée des couches matérialisées sous forme d'objet JavaScript. Deux moyens existent pour afficher les couches WMS Géoportail.

1 - Via l'accès privilégié aux couches WMS Géoportail fourni par l'extension Géoportail pour iTowns.

2 - Directement avec la librairie iTowns. Pour cela, il faut se référer à la [documentation d'iTowns pour l'ajout d'une couche](http://www.itowns-project.org/itowns/API_Doc/GlobeView.html#addLayer).

#### Utilisation de l'accès privilégié aux couches WMS Géoportail

L'affichage se fait par la création d'une nouvelle instance de la classe [Itowns.layer.GeoportalWMS](http://ignf.github.io/geoportal-extensions/itowns-latest/jsdoc/itowns.layer.GeoportalWMS.html), de la manière suivante :

``` javascript
new itowns.layer.GeoportalWMS(options);
```
Cette fonction retourne un objet **itowns.layer.GeoportalWMS**, qui peut ainsi être interprété par la fonction addLayer de la librairie Itowns pour l'ajout dans la carte.

Il est possible de surcharger le paramétrage par défaut de la couche en passant l'option "itownsParams" lors de la création de l'instance de la couche Géoportail WMS.

#### Exemple d'utilisation

``` javascript
const globeView = new itowns.GlobeViewExtended(viewerDiv, positionOnGlobe);

globeView.addLayer(new itowns.layer.GeoportalWMS({
    layer: "ORTHOIMAGERY.ORTHOPHOTOS",
    itownsParams : {
        opacity : 0.5
    }
}));
```

#### Utilisation directe de la librairie iTowns

Il est possible d'ajouter une couche WMS Géoportail (ou autre) en utilisant directement le paramétrage d'iTowns. Ci-après, un exemple d'utilisation.

#### Exemple d'utilisation

``` javascript
const globeView = new itowns.GlobeViewExtended(viewerDiv, positionOnGlobe);

var regionLayer{
    "type": "color",
    "url"       : "https://wxs.ign.fr/maCLEF/geoportail/v/wms",
    "protocol"  : "wms",
    "version"   : "1.3.0",
    "id"        : "Region",
    "name"      : "REGION.2016",
    "style"      : "",
    "projection" : "EPSG:4326",
    "transparent" : true,
    "featureInfoMimeType" : "",
    "dateTime"  : "",
    "heightMapWidth" : 256,
    "waterMask"      : false,
    "updateStrategy": {
        "type": 0,
        "options": {}
    },
    "networkOptions" : {
        "crossOrigin" : "omit"
    },
    "extent": {
        "west": "-61.80983300000002",
        "east": "55.83665389999998",
        "south": "-21.38963079935857",
        "north": "51.0890011990783"
    },
    "options": {
        "mimetype"  : "image/png",
        "originators" :  [{
            "name" : "IGNRegion",
            "attribution" : "IGN Grandes Echelles",
            "url" : "http://www.ign.fr",
            "constraints" : [{
                "crs":"EPSG:4326"
            }]
        }],
        "attribution" : {
            "name":"IGN",
            "url":"http://www.ign.fr/"
        },
        "zoom" : {
            "min": 5,
            "max": 21
        }
    }
}

globeView.addLayer(regionLayer);
```

<a id="Elevation"/>

### Affichage des couches MNT WMTS Géoportail pour affichage du relief

Le modèle de données iTowns prend en entrée des couches matérialisées sous forme d'objet JavaScript. Deux moyens existent pour afficher les couches WMTS MNT Géoportail.

1 - Via l'accès privilégié aux couches WMTS Géoportail fourni par l'extension Géoportail pour iTowns.

2 - Directement avec la librairie iTowns. Pour cela, il faut se référer à la [documentation d'iTowns pour l'ajout d'une couche](http://www.itowns-project.org/itowns/API_Doc/GlobeView.html#addLayer).

#### Utilisation de l'accès privilégié aux couches WMTS Géoportail pour afficher un MNT

L'affichage se fait par la création d'une nouvelle instance de la classe [Itowns.layer.GeoportalElevation](http://ignf.github.io/geoportal-extensions/itowns-latest/jsdoc/itowns.layer.GeoportalElevation.html), de la manière suivante :

``` javascript
new itowns.layer.GeoportalElevation(options);
```
Cette fonction retourne un objet **itowns.layer.GeoportalElevation**, qui peut ainsi être interprété par la fonction addLayer de la librairie Itowns pour l'affichage du MNT sur la carte 3D.

Il est possible de surcharger le paramétrage par défaut de la couche en passant l'option "itownsParams" lors de la création de l'instance de la couche Géoportail WMTS.

#### Exemple d'utilisation

``` javascript
const globeView = new itowns.GlobeViewExtended(viewerDiv, positionOnGlobe);

globeView.addLayer(new itowns.layer.GeoportalElevation({ layer: "ELEVATION.ELEVATIONGRIDCOVERAGE" }));
```

#### Utilisation directe de la librairie iTowns

Il est possible d'ajouter une couche WMTS Géoportail (ou autre) de type "élévation" en utilisant directement le paramétrage d'iTowns. Ci-après, un exemple d'utilisation.

#### Exemple d'utilisation

``` javascript
const globeView = new itowns.GlobeViewExtended(viewerDiv, positionOnGlobe);

var MNTLayer = {
    type : "elevation",
	protocol : "wmts",
	id : "IGN_MNT",
	url : "http://wxs.ign.fr/maCLEF/geoportail/wmts",
	noDataValue : -99999,
	updateStrategy : {
		type : 1,
		options: {
			groups : [3, 7, 11, 14]
		}
	},
    networkOptions : {
        crossOrigin : "omit"
    },
	options : {
		name : "ELEVATION.ELEVATIONGRIDCOVERAGE",
        originators :  [{
            name : "IGN",
            attribution : "IGN Grandes Echelles",
            url : "http://www.ign.fr",
            constraints : [{
                crs :"EPSG:4326"
            }]
        }],
		mimetype : "image/x-bil;bits=32",
		tileMatrixSet : "WGS84G",
		tileMatrixSetLimits : {
			"3": {
				"minTileRow": 1,
				"maxTileRow": 5,
				"minTileCol": 5,
				"maxTileCol": 15
			},
			"4": {
				"minTileRow": 3,
				"maxTileRow": 10,
				"minTileCol": 10,
				"maxTileCol": 30
			},
			"5": {
				"minTileRow": 6,
				"maxTileRow": 20,
				"minTileCol": 20,
				"maxTileCol": 61
			},
			"6": {
				"minTileRow": 13,
				"maxTileRow": 40,
				"minTileCol": 41,
				"maxTileCol": 123
			},
			"7": {
				"minTileRow": 27,
				"maxTileRow": 80,
				"minTileCol": 82,
				"maxTileCol": 247
			},
			"8": {
				"minTileRow": 54,
				"maxTileRow": 160,
				"minTileCol": 164,
				"maxTileCol": 494
			},
			"9": {
				"minTileRow": 108,
				"maxTileRow": 321,
				"minTileCol": 329,
				"maxTileCol": 989
			},
			"10": {
				"minTileRow": 216,
				"maxTileRow": 642,
				"minTileCol": 659,
				"maxTileCol": 1979
			},
			"11": {
				"minTileRow": 432,
				"maxTileRow": 1285,
				"minTileCol": 1319,
				"maxTileCol": 3959
			}
		}
	}
};


globeView.addLayer(ElevationLayer);
```


<a id="layerswitcher"/>

### Widget de gestion d'empilement des couches

Ce widget permet à l'utilisateur de gérer l'empilement des couches ajoutées au globe iTowns et, pour chacune d'elles, d'agir sur la visibilité, l'opacité et d'afficher des informations qui lui sont associées (titre, description, métadonnées, légende).

Son utilisation se fait par la création d'un nouveau contrôle, instance de la classe [itowns.control.LayerSwitcher]().

``` javascript
var layerSwitcher = new itowns.control.LayerSwitcher(opts);
globeView.addWidget( layerSwitcher );
```

Le widget affiche l'ensemble des couches ajoutées au globeView.

Pour chaque couche affichée sur le globe, le widget affiche son titre et sa description (par défaut : l'identifiant iTowns de la couche), et, si elles sont spécifiées, des informations plus détaillées : légendes, métadonnées, aperçu rapide.

La récupération de ces informations n'est pas la même selon la manière dont chaque couche a été ajoutée à la carte :

Afin d'afficher ces informations, il est nécessaire de les spécifier dans les options de la couche et/ou du widget.

#### Exemples d'utilisation

##### Utilisation simple

``` javascript
// Création du globe
const globeView = new itowns.GlobeViewExtended(viewerDiv, positionOnGlobe);

// Ajout d'une couche (voir plus haut ajout WMTS ou WMS)
globeView.addLayer(orthoLayer);

// Création du Layer Switcher
 var layerSwitcher = new itowns.control.LayerSwitcher({
    options : {
        collapsed: true
    },
    layers : [
        {
            id : "Ortho",
            displayed : true,
            config : {
                title : "Couche de Photos IGNPO",
                description : "Description de ma couche",
                quicklookUrl : "lien/Vers/UnApercuRapide.png",
                legends : [
                    {
                        url : "lien/Vers/UneLegende.png"
                    }
                ],
                metadata : [
                    {
                        url : "lien/Vers/Une/MetaDonnee.xml"
                    }
                ],
                visibility: true,
                opacity: 0.8
            }
        }
    ]
});

// Ajout du LayerSwitcher au globe
globeView.addWidget(layerSwitcher);
```

**Exemple d'utilisation** [![jsFiddle](https://jsfiddle.net/img/embeddable/logo-dark.png)](https://jsfiddle.net/ignfgeoportail/b01pLz3m/embedded/result,js,html,css/)

<a id="mp"/>

### Coordonnées et altitude en un point de la carte

Ce widget permet d'afficher les coordonnées d'un point choisi par l'internaute sur le globe iTowns dans un ou plusieurs systèmes de coordonnées. Ces coordonnées peuvent comprendre l'altitude obtenue à l'aide du service d'altimétrie de la plateforme Géoportail.

Son utilisation se fait par la création d'un nouveau contrôle, instance de la classe itowns.control.LayerSwitcher, que l'on peut ensuite ajouter au globe via la méthode addWidget de l'extension d'iTowns globeViewExtended, de la manière suivante :

``` javascript
var mp = new itowns.control.MousePosition(opts);
globeView.addWidget(mp);
```

#### Exemples d'utilisation

##### Utilisation simple

Ajout du widget sans paramétrage particulier.

``` javascript
// Création du globe
const globeView = new itowns.GlobeViewExtended(viewerDiv, positionOnGlobe);

// Ajout d'une couche (voir plus haut ajout WMTS ou WMS)
globeView.addLayer(orthoLayer);

// Creation du controle
var mpControl = new itowns.control.MousePosition(opts);

// Ajout à la carte
map.addControl(mpControl);
```

**Exemple d'utilisation avec affichage des coordonnées et de l'altitude**
[![jsFiddle](https://jsfiddle.net/img/embeddable/logo-dark.png)](https://jsfiddle.net/ignfgeoportail/a9abm7Lp/embedded/result,js,html,css/)

**Exemple d'utilisation avec affichage unique de l'altitude**
[![jsFiddle](https://jsfiddle.net/img/embeddable/logo-dark.png)](https://jsfiddle.net/ignfgeoportail/1zcskvup/embedded/result,js,html,css/)

**Exemple d'utilisation avec paramétrage des systèmes de coordonnées**
[![jsFiddle](https://jsfiddle.net/img/embeddable/logo-dark.png)](https://jsfiddle.net/ignfgeoportail/tmjdezkq/embedded/result,js,html,css/)

<a id="attributions"/>

### Affichage dynamique des attributions

Ce widget a pour but d'afficher les attributions associées aux couches visibles sur la carte. Ce widget permet donc l'affichage des attributions en fonction du positionnement de la carte (centre, zoom) pour les couches ayant des originators multiples.

Les couches Géoportail (de type [WMS](#WMS) ou [WMTS](#WMTS)) possèdent nativement cette propriété. Pour les autres, le paramétrage dynamique des originators se fait par l'adjonction à l'objet source de la couche de la propriété "\_originators", tableau de [Gp.Services.Config.Originator](http://ignf.github.io/geoportal-access-lib/latest/jsdoc/Gp.Services.Config.Originator.html).

Son utilisation se fait par la création d'un nouveau contrôle, instance de la classe itowns.control.GeoportalAttribution que l'on peut ensuite ajouter au globe de la manière suivante :

``` javascript
var attribution = new itowns.control.Attributions(opts);
globeView.addWidget( attribution );
```

#### Exemples d'utilisation

##### Utilisation simple

Ajout du widget sans paramétrage particulier.

``` javascript
// Création du globe
const globeView = new itowns.GlobeViewExtended(viewerDiv, positionOnGlobe);

// Ajout d'une couche (voir plus haut ajout WMTS ou WMS)
globeView.addLayer(orthoLayer);

// Création du widget attribution
var attribution = new itowns.control.Attributions(opts);

// Ajout du LayerSwitcher au globe
globeView.addWidget( attribution );
```

**Exemple d'utilisation** [![jsFiddle](https://jsfiddle.net/img/embeddable/logo-dark.png)](https://jsfiddle.net/ignfgeoportail/r3or3tz9/embedded/result,js,html,css/)

<a id="miniglobe"/>

### Affichage d'une mini-vue dynamique

Ce widget a pour but d'afficher une mini-vue. Cette mini-vue va suivre les déplacements de la vue principale, afin que l'utilisateur ait systématiquement un aperçu son positionnement global sur le globe. La couche par défaut affichée sur la mini-vue est la couche cartographique de l'IGN.

Son utilisation se fait par la création d'un nouveau contrôle, instance de la classe itowns.control.MiniGlobe que l'on peut ensuite ajouter au globe de la manière suivante :

``` javascript
var miniglobe = new itowns.control.MiniGlobe(opts);
globeView.addWidget( miniglobe );
```

#### Exemples d'utilisation

##### Utilisation simple

Ajout du widget sans paramétrage particulier.

``` javascript
// Création du globe
const globeView = new itowns.GlobeViewExtended(viewerDiv, positionOnGlobe);

// Ajout d'une couche (voir plus haut ajout WMTS ou WMS)
globeView.addLayer(orthoLayer);

var miniglobe = new itowns.control.MiniGlobe({});

globeView.addWidget( miniglobe );
```

**Exemple d'utilisation** [![jsFiddle](https://jsfiddle.net/img/embeddable/logo-dark.png)](https://jsfiddle.net/ignfgeoportail/xfq98cr1/embedded/result,js,html,css/)

<a id="scalebar"/>

### Affichage d'une échelle graphique

Ce widget a pour but d'afficher une échelle graphique. Cette échelle graphique se met à jour dynamiquement en fonction des déplacements de la caméra et permet d'indiquer approximativement à quelle échelle correspond la vue de l'utilisateur.

Son utilisation se fait par la création d'un nouveau contrôle, instance de la classe itowns.control.Scale que l'on peut ensuite ajouter au globe de la manière suivante :

``` javascript
var scalebar = new itowns.control.Scale(opts);
globeView.addWidget( scalebar );
```

#### Exemples d'utilisation

##### Utilisation simple

Ajout du widget sans paramétrage particulier.

``` javascript
// Création du globe
const globeView = new itowns.GlobeViewExtended(viewerDiv, positionOnGlobe);

// Ajout d'une couche (voir plus haut ajout WMTS ou WMS)
globeView.addLayer(orthoLayer);

var scalebar = new itowns.control.Scale({});

globeView.addWidget( scalebar );
```

**Exemple d'utilisation** [![jsFiddle](https://jsfiddle.net/img/embeddable/logo-dark.png)](https://jsfiddle.net/ignfgeoportail/xwodbsfp/embedded/result,js,html,css/)
