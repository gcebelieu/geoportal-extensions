# Extension Géoportail pour OpenLayers

[![release](https://img.shields.io/badge/release%20-ol%203.0.15-brightgreen.svg?style=flat)](https://github.com/IGNF/geoportal-extensions/releases/tag/ol-3.0.15)

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
  * [Versions de OpenLayers supportées](#versions-de-openlayers-supportées)
  * [Navigateurs supportés](#navigateurs-supportés)
- [Fonctionnalités](#fonctionnalités)
  * [Systèmes de coordonnées](#systèmes-de-coordonnées)
  * [Affichage des couches WMTS Géoportail](#affichage-des-couche-wmts-géoportail)
    + [Utilisation d'un layer WMTS Géoportail](#utilisation-dun-layer-wmts-géoportail)
      - [Exemple d'utilisation](#exemple-dutilisation)
      - [Affichage en Lambert 93 (EPSG:2154)](#affichage-en-lambert-93-epsg2154)
    + [Utilisation d'une source WMTS Géoportail](#utilisation-dune-source-wmts-géoportail)
      - [Exemple d'utilisation](#exemple-dutilisation-1)
      - [Affichage en Lambert 93 (EPSG:2154)](#affichage-en-lambert-93-epsg2154-1)
  * [Affichage des couches WMS Géoportail](#affichage-des-couches-wms-géoportail)
    + [Utilisation d'un layer WMS Géoportail](#utilisation-dun-layer-wms-géoportail)
      - [Exemple d'utilisation](#exemple-dutilisation-2)
    + [Utilisation d'une source WMS Géoportail](#utilisation-dune-source-wms-géoportail)
      - [Exemple d'utilisation](#exemple-dutilisation-3)
  * [Widget de gestion d'empilement des couches](#widget-de-gestion-dempilement-des-couches)
    + [Exemples d'utilisation](#exemples-dutilisation)
      - [Utilisation simple](#utilisation-simple)
  * [Barre de recherche](#barre-de-recherche)
    + [Exemples d'utilisation](#exemples-dutilisation-1)
      - [Utilisation simple](#utilisation-simple-1)
  * [Calculs d'itinéraires](#calculs-ditinéraires)
    + [Exemples d'utilisation](#exemples-dutilisation-2)
      - [Utilisation simple](#utilisation-simple-2)
  * [Calculs d'isochrones / isodistances](#calculs-disochrones--isodistances)
    + [Exemples d'utilisation](#exemples-dutilisation-3)
      - [Utilisation simple](#utilisation-simple-3)
  * [Coordonnées et altitude en un point de la carte](#coordonnées-et-altitude-en-un-point-de-la-carte)
    + [Exemples d'utilisation](#exemples-dutilisation-4)
      - [Utilisation simple](#utilisation-simple-4)
  * [Affichage dynamique des attributions](#affichage-dynamique-des-attributions)
    + [Exemples d'utilisation](#exemples-dutilisation-5)
      - [Utilisation simple](#utilisation-simple-5)
  * [Adresse ou lieu en un point de la carte](#adresse-ou-lieu-en-un-point-de-la-carte)
    + [Exemples d'utilisation](#exemples-dutilisation-6)
      - [Utilisation simple](#utilisation-simple-6)
  * [Outils de croquis](#outils-de-croquis)
    + [Exemples d'utilisation](#exemples-dutilisation-7)
      - [Utilisation simple](#utilisation-simple-7)
  * [Widget d'import de couches](#widget-dimport-de-couches)
    + [Exemples d'utilisation](#exemples-dutilisation-8)
      - [Utilisation simple](#utilisation-simple-8)
  * [Profil altimétrique le long d'un traçé](#profil-altimétrique-le-long-dun-traçé)
    + [Exemples d'utilisation](#exemples-dutilisation-9)
      - [Utilisation simple](#utilisation-simple-9)
  * [Outils de mesures](#outils-de-mesures)
    + [Exemples d'utilisation](#exemples-dutilisation-10)
      - [Utilisation simple](#utilisation-simple-10)
  * [Accès aux informations attributaires des couches](#accès-aux-informations-attributaires-des-couches)
    + [Exemples d'utilisation](#exemples-dutilisation-11)
      - [Utilisation simple pour une seule couche](#utilisation-simple-pour-une-seule-couche)

<!-- tocstop -->

L'extension Géoportail pour OpenLayers propose les fonctionnalités suivantes à utiliser en complément de la bibliothèque [OpenLayers dans ses versions 3 et supérieures](http://openlayers.org/) :

* [affichage des couches WMTS Géoportail](#WMTS)

* [affichage des couches WMS Géoportail](#WMS)

* [affichage dynamique des attributions](#attributions)

* [widget de gestion d'empilement des couches](#layerswitcher)

* [barre de recherche utilisant le service de géocodage IGN](#geocode)

* [obtention d'une adresse, d'un nom de lieu, ... au clic sur la carte](#reverse)

* [calculs d'itinéraires à partir du service de la plateforme Géoportail](#route)

* [calculs d'isochrones / isodistances à partir du service de la plateforme Géoportail](#isocurve)

* [coordonnées et altitude en un point de la carte à l'aide du service d'altimétrie de la plateforme Géoportail](#mp)

* [outils de croquis](#drawing)

* [import de couches](#layerimport)

* [profil altimétrique d'un traçé à l'aide du service d'altimétrie de la plateforme Géoportail](#ep)

* [outils de mesures](#measure)

* [accès aux informations attributaires des couches](#getfeatureinfo)


## Mise en oeuvre

L'utilisation de l'extension Géoportail pour OpenLayers se fait via les étapes suivantes :

* [Téléchargement de l'extension Géoportail](#download)

* [Intégration de l'extension dans une page web](#integration)

* [Configuration de l'accès à la plateforme Géoportail](#config)



<a id="download"/>

### Téléchargement

Vous pouvez récupérer l'extension Géoportail pour OpenLayers soit par [téléchargement direct](#download-direct), soit en utilisant le [gestionnaire de dépendances javascript NPM](#download-npm).

L'extension Géoportail pour OpenLayers comprend l'arborescence de fichiers suivante :

```
    <Extension Géoportail pour OpenLayers>/
        GpPluginOpenLayers.js
            (version minifiée du code javascript pour une utilisation en production)
        GpPluginOpenLayers.css
            (version minifiée des css pour une utilisation en production)
        GpPluginOpenLayers-src.js
            (version non minifiée du code javascript pour une utilisation en développement)
        GpPluginOpenLayers-src.css
            (version non minifiée des css pour une utilisation en développement)
```

Les scripts d'OpenLayers s'obtiennent sur [la page de téléchargement d'OpenLayers](http://openlayers.org/download/).


<a id="download-direct"/>

#### Téléchargement direct

Vous pouvez télécharger la dernière version de l'extension Géoportail pour OpenLayers directement sur [la page des releases des extensions Géoportail](https://github.com/IGNF/geoportal-extensions/releases).

L'archive téléchargée (.zip) comprend l'arborescence décrite ci-dessus.


<a id="download-npm"/>

#### Récupération avec NPM

L'extension Géoportail pour OpenLayers est aussi disponible dans les dépôts [NPM](https://www.npmjs.com/package/geoportal-extensions-openlayers).

Prérequis : [NodeJS](https://nodejs.org/en/) et [npm](https://www.npmjs.com/) installés.

```
npm i geoportal-extensions-openlayers
```

L'arborescence décrite ci-dessus sera alors accessible dans le répertoire `node_modules/geoportal-extensions-openlayers/dist/` de votre projet.


#### Accès direct

Vous pouvez aussi choisir d'utiliser des fichiers hébergés en ligne, pour y accéder directement, lors de vos tests par exemple. Cependant, pour une utilisation en production, nous vous conseillons de télécharger ces fichiers et de les héberger vous-même, sur le même serveur qui héberge votre application.
Par exemple sur Github Pages :
```
http://ignf.github.io/geoportal-extensions/openlayers-latest/dist/GpPluginOpenLayers.js
http://ignf.github.io/geoportal-extensions/openlayers-latest/dist/GpPluginOpenLayers.css
http://ignf.github.io/geoportal-extensions/openlayers-latest/dist/GpPluginOpenLayers-src.js
http://ignf.github.io/geoportal-extensions/openlayers-latest/dist/GpPluginOpenLayers-src.css
```

<a id="integration"/>

### Intégration dans une page web

Dézippez l'extension géoportail dans l'arborescence votre de serveur web. Vous pouvez positionner à votre guise les fichiers css et javascript.

Intégrez l'extension géoportail pour OpenLayers dans votre page web classiquement à l'aide d'une balise **script** pour charger le fichier javascript et d'une balise **link** pour charger le fichier css en plus des balises correspondantes utilisées pour charger la bibliothèque OpenLayers.

``` html
<!-- Library OpenLayers -->
<link rel="stylesheet" href="chemin/vers/ol/ol.css" />
<script src="chemin/vers/ol/ol.js"></script>

<!-- Extension Géoportail pour OpenLayers -->
<script src="chemin/vers/GpPluginOpenLayers.js"></script>
<link rel="stylesheet" href="chemin/vers/GpPluginOpenLayers.css" />
```

<a id="config"/>

### Configuration de l'accès à la plateforme Géoportail

L'extension Géoportail pour OpenLayers exploite les services web exposés par la plateforme Géoportail. Ceux-ci sont soumis à l'obtention d'une **clef d'accès** obtenue sur le site [professionnels.ign.fr](http://professionnels.ign.fr/ign/contrats) ayant les droits sur les ressources que vous souhaitez exploiter.

Une fois la clef obtenue, vous pouvez paramétrer l'utilisation de l'extension avec cette clef de deux manières possibles :

**Méthode 1** : Au chargement de l'extension en utilisant l'attribut "data-key" de la balise **script** de chargement de l'extension :

``` html
<script data-key="VOTRE-CLEF" src="chemin/vers/GpPluginOpenLayers.js"></script>
```

Votre utilisation des fonctionnalités de l'extension Géoportail sera alors simplement conditionnée par la réception de l'événement onload de la page web, comme sur l'exemple suivant :

``` html
<html>
    <head>
        <!-- Library OpenLayers -->
        <link rel="stylesheet" href="ol.css" />
        <script src="ol.js"></script>
        <!-- Extension Géoportail pour OpenLayers -->
        <link rel="stylesheet" href="GpPluginOpenLayers.css" />
        <script src="GpPluginOpenLayers.js" data-key="CLEAPI"></script>
    </head>
    <body>
        <script>
            window.onload = function () {
                // votre utilisation de l'extension Géoportail pour OpenLayers
            }
        </script>
    </body>
</html>
```

**Méthode 2** : A la fin du chargement de la page en utilisant la fonction [Gp.Services.GetConfig()](https://github.com/IGNF/geoportal-access-lib#getConfig) et en conditionnant alors l'utilisation de l'extension à l'exécution de la fonction de rappel onSuccess passée en paramètres de Gp.Services.getConfig() comme sur l'exemple suivant :

``` html
<html>
    <head>
        <!-- Library OpenLayers -->
        <link rel="stylesheet" href="ol.css" />
        <script src="ol.js"></script>
        <!-- Extension Géoportail pour OpenLayers -->
        <link rel="stylesheet" href="GpPluginOpenLayers.css" />
        <script src="GpPluginOpenLayers.js"></script>
    </head>
    <body>
        <script>
            window.onload = function () {
                Gp.Services.getConfig({
                    apiKey: 'CLEAPI',
                    onSuccess: function (response) {
                        // votre utilisation de l'extension Géoportail pour OpenLayers
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
<script data-url="chemin/vers/autoconf.json" src="chemin/vers/GpPluginOpenLayers.js"></script>
```

Votre utilisation des fonctionnalités de l'extension Géoportail sera alors simplement conditionnée par la réception de l'événement onload de la page web, comme sur l'exemple suivant :

``` html
<html>
    <head>
        <!-- Library OpenLayers -->
        ...
        <script data-url="chemin/vers/autoconf.json" src="chemin/vers/GpPluginOpenLayers.js"></script>
    </head>
    <body>
        <script>
            window.onload = function () {
                // votre utilisation de l'extension Géoportail pour OpenLayers
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
                        // votre utilisation de l'extension Géoportail pour OpenLayers
                    }
                });
            }
        </script>
    </body>
</html>
```

### Appel de l'extension dans un module ES6

Le module de l'extension expose de multiples exports nommés (dont le module openlayers étendu).
L'utilisateur a le choix entre plusieurs méthodes d'import.

**Méthode 1** : import des exports nommés du module

``` javascript
import {Services, olExtended as Ol} from 'geoportal-extensions-openlayers';

// votre utilisation de l'extension
var map = new Ol.Map(...)
Services.getConfig(...)
```

**Méthode 2** : import d'un objet d’espace de noms pour le module

***Variante 1*** : le module openlayers étendu est récupéré depuis l'espace de noms

``` javascript
import * as Gp from 'geoportal-extensions-openlayers';

// votre utilisation de l'extension
const Ol = Gp.olExtended;
var map = new Ol.Map(...)
Gp.Services.getConfig(...)
```

***Variante 2*** : le module openlayers est importé indépendamment de l'extension

``` javascript
import Ol from 'openlayers';
import * as Gp from 'geoportal-extensions-openlayers';

// votre utilisation de l'extension
var map = new Ol.Map(...)
Gp.Services.getConfig(...)
```

## Compatibilités

### Versions de OpenLayers supportées

Les dernières **versions 3.0.z de l'extension Géoportail pour OpenLayers** peut s'utiliser avec les **versions 5.0.3 et supérieures** d'OpenLayers.

La compatibilité avec les **versions 4.0.z** n'est assurée que par les **versions 2.1.2 et antérieures de l'extension Géoportail pour OpenLayers**.

Le support des versions d'OpenLayers antérieures à la version 3.14 n'a pas été complètement testé.


### Navigateurs supportés


Navigateur | version
-----------|--------
Chrome     | Versions récentes (21+)
Firefox    | Versions récentes (28+)
IE         | IE10, IE11
Edge       | 12+
Safari     | Versions récentes (6.1+)


## Fonctionnalités

<a id="crs"/>

### Systèmes de coordonnées

OpenLayers utilise par défaut les systèmes de coordonnées mondiaux "standards" : EPSG:4326 (coordonnées géographiques) et EPSG:3857 (Projection Web Mercator utilisée par Google, Bings, OSM ... et le Géoportail) comme expliqué [ici](http://openlayers.org/en/latest/apidoc/ol.proj.html).

L'extension Géoportail pour OpenLayers embarque de nombreuses projections en *EPSG*, *CRS* ainsi que sous le registre *IGNF*.
Il est possible d'utiliser ces projections :

Exemple :

``` javascript

// création d'une vue OpenLayers avec la projection définie
var view = new ol.View({
    center: [48, 2],
    zoom: 12,
    projection: "IGNF:RGF93G"
})
```

La définition d'autres systèmes de coordonnées est cependant possible par l'adjonction de la bibliothèque [Proj4js](https://github.com/proj4js/proj4js) permettant de définir des systèmes de coordonnées et d'effectuer des transformations de coordonnées entre systèmes. Cette bibliothèque est directement compatible avec OpenLayers.

L'extension Géoportail pour OpenLayers **intègre nativement cette bibliothèque**. Si vous l'utilisez vous pouvez donc directement définir les systèmes de coordonnées que vous souhaitez selon la syntaxe proj4 et utiliser les alias ainsi définis en paramètres des fonctions d'OpenLayers.

Exemple :

``` javascript
// Définition de la Projection UTM 20N
proj4.defs("EPSG:4559",
    "+proj=utm +zone=20 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs") ;

// création d'une vue OpenLayers avec la projection définie
var view = new ol.View({
    center: [656481, 1796270],
    zoom: 12,
    projection: "EPSG:4559"
})
```

NB :

* Le site [epsg.io](http://epsg.io/) recense un grand nombre de registres de systèmes de coordonnées avec leurs définitions.

* Les définitions des systèmes de coordonnées du registre IGN-F peuvent être trouvées [ici](https://github.com/OSGeo/proj.4/blob/master/nad/IGNF).


<a id="WMTS"/>

### Affichage des couches WMTS Géoportail

Le modèle de données OpenLayers fait la distinction entre la notion de couche (ol.layer) et la notion de source de données (ol.source). Ainsi, une carte OpenLayers est constituée d'un empilement de "ol.layer", avec des propriétés relatives à leurs visibilité sur la carte, dont le contenu est alimenté par des "ol.source", avec des propriétés relatives à la manière d'obtenir ces données.

L'extension Géoportail pour OpenLayers propose deux manières d'accéder aux couches Géoportail selon ce modèle :

1. On souhaite une mise en oeuvre simple, où on saisit uniquement le nom de sa couche, et d'éventuels paramètres d'affichage (visibilité ou opacité). Définition d'un [layer WMTS Géoportail](#layerWMTS).

2. On souhaite pouvoir paramétrer plus finement l'affichage de sa couche dans la carte, ainsi que d'éventuels paramètres du service (format, style, ...). Définition d'une [source WMTS Géoportail](#sourceWMTS).

<a id="layerWMTS"/>

#### Utilisation d'un layer WMTS Géoportail

L'affichage se fait par la création d'une nouvelle instance de la classe [ol.layer.GeoportalWMTS](http://ignf.github.io/geoportal-extensions/ol-latest/jsdoc/ol.layer.GeoportalWMTS.html), de la manière suivante :

``` javascript
new ol.layer.GeoportalWMTS(options);
```

Cette fonction retourne un objet **ol.layer.GeoportalWMTS**, qui hérite de l'objet OpenLayers *ol.layer.Tile*, qui peut ainsi être interprété par la librairie OpenLayers pour l'ajout dans la carte.

##### Exemple d'utilisation

Affichage simple des ortho-images du Géoportail : création d'une *layer* Géoportail, et ajout à la *map* OpenLayers.

``` javascript
var map = new ol.Map({
        target: 'map',
        layers: [
            new ol.layer.GeoportalWMTS({
                layer: "ORTHOIMAGERY.ORTHOPHOTOS"
            })
        ],
        view: new ol.View({
            center: [288074.8449901076, 6247982.515792289],
            zoom: 12
        })
    });
```

**Exemple d'utilisation** [![jsFiddle](https://jsfiddle.net/img/embeddable/logo-dark.png)](https://jsfiddle.net/ignfgeoportail/j5rdjt2z/embedded/result,js,html,css/)

##### Affichage en Lambert 93 (EPSG:2154)

La plateforme Géoportail diffuse aussi des ressources WMTS en projection Lambert 93. Pour permettre de les afficher, l'extension Géoportail pour OpenLayers pré-définit l'alias "EPSG:2154" correspondant à cette projection.

Il suffit alors de paramétrer la carte OpenLayers avec cette projection et d'y rajouter la ressource WMTS de la même manière que précédemment.

``` javascript
var map = new ol.Map({
    target: 'map',
    layers: [
        new ol.layer.GeoportalWMTS({
            layer: "ORTHOIMAGERY.ORTHOPHOTOS.BDORTHO.L93"
        })
    ],
    view: new ol.View({
        center: [600000, 6750000],
        zoom: 12,
        projection : "EPSG:2154"
    })
});
```

**Exemple d'utilisation** [![jsFiddle](https://jsfiddle.net/img/embeddable/logo-dark.png)](https://jsfiddle.net/ignfgeoportail/bw0za4a8/embedded/result,js,html,css/)


NB : D'autres systèmes de coordonnées peuvent être définis et utilisés : [plus d'informations...](#crs)

<a id="sourceWMTS"/>

#### Utilisation d'une source WMTS Géoportail

Cette méthode permet plus de paramétrages : on crée une nouvelle instance de la classe [ol.source.GeoportalWMTS](http://ignf.github.io/geoportal-extensions/ol-latest/jsdoc/ol.source.GeoportalWMTS.html), de la manière suivante :

``` javascript
var gpsource = new ol.source.GeoportalWMTS(options);
```

Cette fonction retourne un objet **ol.source.GeoportalWMTS**, qui hérite de l'objet OpenLayers *ol.source.WMTS*. Cette source sert ensuite à la création d'un *layer* OpenLayers qui pourra ensuite être ajouté à la carte.

``` javascript
var layer = new ol.layer.Tile({
    source : gpsource
});
```

##### Exemple d'utilisation

Affichage simple des ortho-images du Géoportail : création d'un *layer* OpenLayers associé à une *source* Géoportail, et ajout à la *map* OpenLayers.

``` javascript
var map = new ol.Map({
    target: 'map',
    layers: [
        new ol.layer.Tile({
            source: new ol.source.GeoportalWMTS({
                layer: "ORTHOIMAGERY.ORTHOPHOTOS"
            }),
            opacity: 0.7
        })
    ],
    view: new ol.View({
        center: [288074.8449901076, 6247982.515792289],
        zoom: 12
    })
});
```

**Exemple d'utilisation** [![jsFiddle](https://jsfiddle.net/img/embeddable/logo-dark.png)](https://jsfiddle.net/ignfgeoportail/sdktaf9r/embedded/result,js,html,css/)

##### Affichage en Lambert 93 (EPSG:2154)

La plateforme Géoportail diffuse aussi des ressources WMTS en projection Lambert 93. Pour permettre de les afficher, l'extension Géoportail pour OpenLayers pré-définit l'alias "EPSG:2154" correspondant à cette projection.

Il suffit alors de paramétrer la carte OpenLayers avec cette projection et d'y rajouter la ressource WMTS de la même manière que précédemment.

``` javascript
var map = new ol.Map({
    target: 'map',
    layers: [
        new ol.layer.Tile({
            source: new ol.source.GeoportalWMTS({
                layer: "ORTHOIMAGERY.ORTHOPHOTOS.BDORTHO.L93"
            }),
            opacity: 0.7
        })
    ],
    view: new ol.View({
        center: [600000, 6750000],
        zoom: 12,
        projection : "EPSG:2154"
    })
});
```

**Exemple d'utilisation** [![jsFiddle](https://jsfiddle.net/img/embeddable/logo-dark.png)](https://jsfiddle.net/ignfgeoportail/o6tnhpnd/embedded/result,js,html,css/)


NB : D'autres systèmes de coordonnées peuvent être définis et utilisés : [plus d'informations...](#crs)


<a id="WMS"/>

### Affichage des couches WMS Géoportail

Le modèle de données OpenLayers fait la distinction entre la notion de couche (ol.layer) et la notion de source de données (ol.source). Ainsi, une carte OpenLayers est constituée d'un empilement de "ol.layer", avec des propriétés relatives à leurs visibilité sur la carte, dont le contenu est alimenté par des "ol.source", avec des propriétés relatives à la manière d'obtenir ces données.

L'extension Géoportail pour OpenLayers propose deux manières d'accéder aux couches Géoportail selon ce modèle :

1. on souhaite une mise en oeuvre simple, où on saisit uniquement le nom de sa couche, et d'éventuels paramètres d'affichage (visibilité ou opacité). Définition d'un [layer WMS Géoportail](#layerWMS).

2. On souhaite pouvoir paramétrer plus finement l'affichage de sa couche dans la carte, ainsi que d'éventuels paramètres du service (format, style, ...). Définitions d'une [source WMS Géoportail](#sourceWMS).

<a id="layerWMS"/>

#### Utilisation d'un layer WMS Géoportail

L'affichage se fait par la création d'une nouvelle instance de la classe [ol.layer.GeoportalWMS](http://ignf.github.io/geoportal-extensions/ol-latest/jsdoc/ol.layer.GeoportalWMS.html), de la manière suivante :

``` javascript
new ol.layer.GeoportalWMTS(options);
```

Cette fonction retourne un objet **ol.layer.GeoportalWMS**, qui hérite de l'objet OpenLayers *ol.layer.Tile*, qui peut ainsi être interprété par la librairie OpenLayers pour l'ajout dans la carte.

##### Exemple d'utilisation

Affichage d'une couche du serveur WMS INSPIRE raster du Géoportail (OI.OrthoimageCoverage) sur une carte en EPSG:4326.

``` javascript
var map = new ol.Map({
    target: 'map',
    layers: [
      new ol.layer.GeoportalWMS({
        layer: "OI.OrthoimageCoverage",
      })
    ],
    view: new ol.View({
      center: [2, 46],
      zoom: 12,
      projection: "EPSG:4326"
    })
});
```

**Exemple d'utilisation** [![jsFiddle](https://jsfiddle.net/img/embeddable/logo-dark.png)](https://jsfiddle.net/ignfgeoportail/jnfwc7k6/embedded/result,js,html,css/)

<a id="sourceWMS"/>

#### Utilisation d'une source WMS Géoportail

Cette méthode permet plus de paramétrages : on crée une nouvelle instance de la classe [ol.source.GeoportalWMS](http://ignf.github.io/geoportal-extensions/ol-latest/jsdoc/ol.source.GeoportalWMS.html), de la manière suivante :

``` javascript
var gpsource = new ol.source.GeoportalWMS(options);
```

Cette fonction retourne un objet **ol.source.GeoportalWMS**, qui hérite de l'objet OpenLayers *ol.source.TileWMS*. Cette source sert ensuite à la création d'un *layer* OpenLayers qui pourra ensuite être ajouté à la carte.

``` javascript
var layer = new ol.layer.Tile({
    source : gpsource
});
```

##### Exemple d'utilisation

Utilisation des service WMS INSPIRE raster (OI.OrthoimageCoverage) du Géoportail : création d'un *layer* OpenLayers associés à un *source* Géoportail, et ajout à la *map* OpenLayers.

``` javascript
var map = new ol.Map({
    target: 'map',
    layers: [
        new ol.layer.Tile({
            source: new ol.source.GeoportalWMS({
                layer: "OI.OrthoimageCoverage",
            })
        })
    ],
    view: new ol.View({
        center: [-61.55, 16.25],
        zoom: 12,
        projection : "EPSG:4326"
    })
});
```

**Exemple d'utilisation** [![jsFiddle](https://jsfiddle.net/img/embeddable/logo-dark.png)](https://jsfiddle.net/ignfgeoportail/e36ur78k/embedded/result,js,html,css/)


<a id="layerswitcher"/>

### Widget de gestion d'empilement des couches

Ce widget permet à l'utilisateur de gérer l'empilement des couches composant la carte ol.Map et, pour chacune d'elles, d'agir sur la visibilité, l'opacité et d'afficher des informations qui lui sont associées (titre, description, métadonnées, légende).

Son utilisation se fait par la création d'un nouveau contrôle, instance de la classe [ol.control.LayerSwitcher ](http://ignf.github.io/geoportal-extensions/ol-latest/jsdoc/ol.control.LayerSwitcher.html), que l'on peut ensuite ajouter à la carte comme [les autres contrôles OpenLayers](http://openlayers.org/en/latest/apidoc/ol.Map.html#addControl), de la manière suivante :

``` javascript
var layerSwitcher = new ol.control.LayerSwitcher(opts) ;
map.addControl(layerSwitcher);
```

Le widget affiche l'ensemble des couches composant la carte ol.Map.

Pour chaque couche de la carte ol.Map, le widget affiche son titre et sa description (par défaut : l'identifiant OpenLayers de la couche), et, si elles sont spécifiées, des informations plus détaillées : légendes, métadonnées, aperçu rapide.

La récupération de ces informations n'est pas la même selon la manière dont chaque couche a été ajoutée à la carte :

- Couches ajoutées via la [fonctionnalité d'affichage simple des couches WMS](#WMS) ou [WMTS du Géoportail](#WMTS) de l'extension pour OpenLayers : ces informations sont disponibles car elles ont été chargées par lors de la [configuration de l'accès au Géoportail](#config), il n'y a donc rien à faire de particulier.

- Autres couches : afin d'afficher ces informations, il est nécessaire de les spécifier dans les options du widget.

#### Exemples d'utilisation

##### Utilisation simple

Ajout du widget de gestion de l'empilement des couches. Paramétrage des couches non Géoportail.

``` javascript
// couche OSM (non Géoportail)
var osmLyr = new ol.layer.Tile({
    source: new ol.source.OSM()
});
// Création de la carte
var map = new ol.Map({
    target: 'map',
    layers: [
        osmLyr,
        // couche Géoportail
        new ol.layer.GeoportalWMTS({
            layer: "GEOGRAPHICALGRIDSYSTEMS.MAPS",
        })
    ],
    view: new ol.View({
        center: [288074.8449901076, 6247982.515792289],
        zoom: 12
    })
});    
// Création du Layer Switcher
var lsControl = new ol.control.LayerSwitcher({
    // paramétrage de l'affichage de la couche OSM
    layers : [{
        layer: osmLyr,
        config: {
            title: "OSM",
            description: "Couche OpenStreet Map"
        }
    }]
});
// Ajout du LayerSwitcher à la carte
map.addControl(lsControl);
```

**Exemple d'utilisation** [![jsFiddle](https://jsfiddle.net/img/embeddable/logo-dark.png)](https://jsfiddle.net/ignfgeoportail/5f9wxsof/embedded/result,js,html,css/)

<a id="geocode"/>

### Barre de recherche

La barre de recherche permet de positionner la carte à partir de la saisie d'un localisant dont la position sera retournée par le service de géocodage de l'IGN.

La saisie de localisants peut s'accompagner d'un mode d'autocomplétion s'appuyant sur le service d'autocomplétion de la plateforme Géoportail.

Son utilisation se fait par la création d'un nouveau contrôle, instance de la calsse [ol.control.SearchEngine](http://ignf.github.io/geoportal-extensions/ol-latest/jsdoc/ol.control.SearchEngine.html), que l'on peut ensuite ajouter à la carte comme [les autres contrôles OpenLayers](http://openlayers.org/en/latest/apidoc/ol.Map.html#addControl), de la manière suivante :

``` javascript
var search = new ol.control.SearchEngine(opts) ;
map.addControl(search);
```

#### Exemples d'utilisation

##### Utilisation simple

Ajout du moteur de recherche sans paramétrage particulier.

``` javascript
// Création de la carte
var map = new ol.Map({
    target: 'map',
    layers: [
        new ol.layer.GeoportalWMTS({
            layer: "GEOGRAPHICALGRIDSYSTEMS.MAPS"
        })
    ],
    view: new ol.View({
        center: [288074.8449901076, 6247982.515792289],
        zoom: 12
    })
});

// Creation du controle
var searchControl = new ol.control.SearchEngine({
});

// Ajout à la carte
map.addControl(searchControl);
```

**Exemple d'utilisation** [![jsFiddle](https://jsfiddle.net/img/embeddable/logo-dark.png)](https://jsfiddle.net/ignfgeoportail/qpcyp8nr/embedded/result,js,html,css/)


<a id="route"/>

### Calculs d'itinéraires

Le widget de calcul d'itinéraires permet d'intéragir avec une carte OpenLayers pour effectuer des calculs d'itinéraires utilisant le service dédié de la plateforme Géoportail.

Son utilisation se fait par la création d'un nouveau contrôle instance de la classe [ol.control.Route](http://ignf.github.io/geoportal-extensions/ol-latest/jsdoc/ol.control.Route.html), que l'on peut ensuite ajouter à la carte comme [les autres contrôles OpenLayers](http://openlayers.org/en/latest/apidoc/ol.Map.html#addControl), de la manière suivante :

``` javascript
var route = new ol.control.Route(opts) ;
map.addControl(route);
```

#### Exemples d'utilisation

##### Utilisation simple

Ajout du widget sans paramétrage particulier.

``` javascript
// Création de la carte
var map = new ol.Map({
    target: 'map',
    layers: [
        new ol.layer.GeoportalWMTS({
            layer: "GEOGRAPHICALGRIDSYSTEMS.MAPS"
        })
    ],
    view: new ol.View({
        center: [288074.8449901076, 6247982.515792289],
        zoom: 12
    })
});

// Creation du controle
var routeControl = new ol.control.Route({
});

// Ajout à la carte
map.addControl(routeControl);
```

**Exemple d'utilisation** [![jsFiddle](https://jsfiddle.net/img/embeddable/logo-dark.png)](https://jsfiddle.net/ignfgeoportail/1ngLrhuj/embedded/result,js,html,css/)

<a id="isocurve"/>

### Calculs d'isochrones / isodistances

Ce widget permet d'intéragir avec une carte OpenLayers pour effectuer des calculs d'isochrones / isodistances utilisant le service dédié de la plateforme Géoportail.

Son utilisation se fait par la création d'un nouveau contrôle, instance de la classe [ol.control.Isocurve()](http://ignf.github.io/geoportal-extensions/ol-latest/jsdoc/ol.control.Isocurve.html), que l'on peut ensuite ajouter à la carte comme [les autres contrôles OpenLayers](http://openlayers.org/en/latest/apidoc/ol.Map.html#addControl), de la manière suivante :

``` javascript
var iso = new ol.control.Isocurve(opts);
map.addControl(iso);
```

#### Exemples d'utilisation

##### Utilisation simple

Ajout du widget sans paramétrage particulier.

``` javascript
// Création de la carte
var map = new ol.Map({
    target: 'map',
    layers: [
        new ol.layer.GeoportalWMTS({
            layer: "GEOGRAPHICALGRIDSYSTEMS.MAPS"
        })
    ],
    view: new ol.View({
        center: [288074.8449901076, 6247982.515792289],
        zoom: 12
    })
});

// Creation du controle
var isoControl = new ol.control.Isocurve({
});

// Ajout à la carte
map.addControl(isoControl);
```

**Exemple d'utilisation** [![jsFiddle](https://jsfiddle.net/img/embeddable/logo-dark.png)](https://jsfiddle.net/ignfgeoportail/jpwf385t/embedded/result,js,html,css/)

<a id="mp"/>

### Coordonnées et altitude en un point de la carte

Ce widget permet d'afficher les coordonnées d'un point choisi par l'internaute sur une carte OpenLayers dans un ou plusieurs systèmes de coordonnées. Ces coordonnées peuvent comprendre l'altitude obtenue à l'aide du service d'altimétrie de la plateforme Géoportail.
Un mode "édition" permet de localiser des coordonnées sur la carte en éditant les coordonnées affichées dans le widget.

Son utilisation se fait par la création d'un nouveau contrôle, instance de la classe [ol.control.GeoportalMousePosition](http://ignf.github.io/geoportal-extensions/ol-latest/jsdoc/ol.control.GeoportalMousePosition.html), que l'on peut ensuite ajouter à la carte comme [les autres contrôles OpenLayers](http://openlayers.org/en/latest/apidoc/ol.Map.html#addControl), de la manière suivante :

``` javascript
var mp = new ol.control.GeoportalMousePosition(opts);
map.addControl(mp);
```

#### Exemples d'utilisation

##### Utilisation simple

Ajout du widget sans paramétrage particulier.

``` javascript
// Création de la carte
var map = new ol.Map({
    target: 'map',
    layers: [
        new ol.layer.GeoportalWMTS({
            layer: "GEOGRAPHICALGRIDSYSTEMS.MAPS"
        })
    ],
    view: new ol.View({
        center: [288074.8449901076, 6247982.515792289],
        zoom: 12
    })
});

// Creation du controle
var mpControl = new ol.control.GeoportalMousePosition({
});

// Ajout à la carte
map.addControl(mpControl);
```

**Exemple d'utilisation avec affichage unique de l'altitude** [![jsFiddle](https://jsfiddle.net/img/embeddable/logo-dark.png)](https://jsfiddle.net/ignfgeoportail/jhg5fhor/embedded/result,js,html,css/)

**Exemple d'utilisation avec paramétrage des systèmes de coordonnées** [![jsFiddle](https://jsfiddle.net/img/embeddable/logo-dark.png)](https://jsfiddle.net/ignfgeoportail/myg4t6qo/embedded/result,js,html,css/)

**Exemple d'utilisation avec activation de l'édition de coordonnées pour localisation** [![jsFiddle](https://jsfiddle.net/img/embeddable/logo-dark.png)](https://jsfiddle.net/ignfgeoportail/jrL59w29/embedded/result,js,html,css/)

<a id="attributions"/>

### Affichage dynamique des attributions

Ce widget a pour but d'afficher les attributions (de type [ol.Attribution](http://openlayers.org/en/latest/apidoc/ol.Attribution.html)) associées aux couches visibles sur la carte. Il étend les fonctionnalités du contrôle natif d'OpenLayers ([ol.control.Attribution](http://openlayers.org/en/latest/apidoc/ol.control.Attribution.html)) dont il hérite en permettant l'affichage des attributions en fonction du positionnement de la carte (centre, zoom) pour les couches ayant des originators multiples.

Les couches Géoportail (de type [WMS](#WMS) ou [WMTS](#WMTS)) possèdent nativement cette propriété. Pour les autres, le paramétrage dynamique des originators se fait par l'adjonction à l'objet source de la couche de la propriété "\_originators", tableau de [Gp.Services.Config.Originator](http://ignf.github.io/geoportal-access-lib/latest/jsdoc/Gp.Services.Config.Originator.html).

Son utilisation se fait par la création d'un nouveau contrôle, instance de la classe [ol.control.GeoportalAttribution](http://ignf.github.io/geoportal-extensions/ol-latest/jsdoc/ol.control.GeoportalAttribution.html), que l'on peut ensuite ajouter à la carte comme [les autres contrôles OpenLayers](http://openlayers.org/en/latest/apidoc/ol.Map.html#addControl), de la manière suivante :

``` javascript
var att = new ol.control.GeoportalAttribution(opts);
map.addControl(att);
```

#### Exemples d'utilisation

##### Utilisation simple

Ajout du widget sans paramétrage particulier.

``` javascript
// Création de la carte
var map = new ol.Map({
    target: 'map',
    layers: [
        new ol.layer.GeoportalWMTS({
            layer: "GEOGRAPHICALGRIDSYSTEMS.MAPS"
        })
    ],
    view: new ol.View({
        center: [288074.8449901076, 6247982.515792289],
        zoom: 12
    })
});

// Creation du controle
var attControl = new ol.control.GeoportalAttribution({
});

// Ajout à la carte
map.addControl(attControl);
```

**Exemple d'utilisation** [![jsFiddle](https://jsfiddle.net/img/embeddable/logo-dark.png)](https://jsfiddle.net/ignfgeoportail/x1jrLavb/embedded/result,js,html,css/)

<a id="reverse"/>

### Adresse ou lieu en un point de la carte

Ce widget permet d'obtenir un ensemble de localisants Géographiques (adresses, toponymes ou parcelles cadastrales) en un point ou une zone (cercle ou emprise rectangulaire) saisie interactivement par l'internaute sur une carte OpenLayers.

Son utilisation se fait par la création d'un nouveau contrôle, instance de la classe [ol.control.ReverseGeocode](http://ignf.github.io/geoportal-extensions/ol-latest/jsdoc/ol.control.ReverseGeocode.html), que l'on peut ensuite ajouter à la carte comme [les autres contrôles OpenLayers](http://openlayers.org/en/latest/apidoc/ol.Map.html#addControl), de la manière suivante :

``` javascript
var reverse = new ol.control.ReverseGeocode(opts);
map.addControl(reverse);
```

#### Exemples d'utilisation

##### Utilisation simple

Ajout du widget sans paramétrage particulier.

``` javascript
// Création de la carte
var map = new ol.Map({
    target: 'map',
    layers: [
        new ol.layer.GeoportalWMTS({
            layer: "GEOGRAPHICALGRIDSYSTEMS.MAPS"
        })
    ],
    view: new ol.View({
        center: [288074.8449901076, 6247982.515792289],
        zoom: 12
    })
});

// Creation du controle
var rvControl = new ol.control.ReverseGeocode({
});

// Ajout à la carte
map.addControl(rvControl);
```

**Exemple d'utilisation** [![jsFiddle](https://jsfiddle.net/img/embeddable/logo-dark.png)](https://jsfiddle.net/ignfgeoportail/9y6dgq15/embedded/result,js,html,css/)

<a id="drawing"/>

### Outils de croquis

Ce widget propose un ensemble d'outils de croquis permettant de dessiner sur une carte OpenLayers : poser des markers, dessiner des lignes, polygones ou faire des écritures dans des styles choisis par l'internaute.

Son utilisation se fait par la création d'un nouveau contrôle, instance de la classe [ol.control.Drawing](http://ignf.github.io/geoportal-extensions/ol-latest/jsdoc/ol.control.Drawing.html), que l'on peut ensuite ajouter à la carte comme [les autres contrôles OpenLayers](http://openlayers.org/en/latest/apidoc/ol.Map.html#addControl), de la manière suivante :

``` javascript
var drawing = new ol.control.Drawing(opts);
map.addControl(drawing);
```

#### Exemples d'utilisation

##### Utilisation simple

Ajout du widget sans paramétrage particulier.

``` javascript
// Création de la carte
var map = new ol.Map({
    target: 'map',
    layers: [
        new ol.layer.GeoportalWMTS({
            layer: "GEOGRAPHICALGRIDSYSTEMS.MAPS"
        })
    ],
    view: new ol.View({
        center: [288074.8449901076, 6247982.515792289],
        zoom: 12
    })
});

// Creation du controle
var drawControl = new ol.control.Drawing({
});

// Ajout à la carte
map.addControl(drawControl);
```

**Exemple d'utilisation** [![jsFiddle](https://jsfiddle.net/img/embeddable/logo-dark.png)](https://jsfiddle.net/ignfgeoportail/2Lj85jf1/embedded/result,js,html,css/)


<a id="layerimport"/>

### Widget d'import de couches

Ce widget permet à un internaute d'importer ses propres données géographiques dans des formats standards en superposition des données d'une carte OpenLayers.

Son utilisation se fait par la création d'un nouveau contrôle, instance de la classe [ol.control.LayerImport](http://ignf.github.io/geoportal-extensions/ol-latest/jsdoc/ol.control.LayerImport.html), que l'on peut ensuite ajouter à la carte comme [les autres contrôles OpenLayers](http://openlayers.org/en/latest/apidoc/ol.Map.html#addControl), de la manière suivante :


``` javascript
var lyrImport = new ol.control.LayerImport(opts);
map.addControl(lyrImport);
```

#### Exemples d'utilisation

##### Utilisation simple

Ajout du widget sans paramétrage particulier.

``` javascript
// Création de la carte
var map = new ol.Map({
    target: 'map',
    layers: [
        new ol.layer.GeoportalWMTS({
            layer: "GEOGRAPHICALGRIDSYSTEMS.MAPS"
        })
    ],
    view: new ol.View({
        center: [288074.8449901076, 6247982.515792289],
        zoom: 12
    })
});

// Creation du controle
var lyrImport = new ol.control.LayerImport({
});

// Ajout à la carte
map.addControl(lyrImport);
```

**Exemple d'utilisation** [![jsFiddle](https://jsfiddle.net/img/embeddable/logo-dark.png)](https://jsfiddle.net/ignfgeoportail/u04nvno2/embedded/result,js,html,css/)


<a id="ep"/>

### Profil altimétrique le long d'un traçé

Ce widget permet d'afficher le profil altimétrique d'un traçé saisi par l'internaute sur une carte OpenLayers. Le profil est calculé à l'aide du service d'altimétrie de la plateforme Géoportail.

Son utilisation se fait par la création d'un nouveau contrôle, instance de la classe [ol.control.ElevationPath](http://ignf.github.io/geoportal-extensions/ol-latest/jsdoc/ol.control.ElevationPath.html), que l'on peut ensuite ajouter à la carte comme [les autres contrôles OpenLayers](http://openlayers.org/en/latest/apidoc/ol.Map.html#addControl), de la manière suivante :


``` javascript
var ep = new ol.control.ElevationPath(opts);
map.addControl(ep);
```

#### Exemples d'utilisation

##### Utilisation simple

Ajout du widget sans paramétrage particulier.

``` javascript
// Création de la carte
var map = new ol.Map({
    target: 'map',
    layers: [
        new ol.layer.GeoportalWMTS({
            layer: "GEOGRAPHICALGRIDSYSTEMS.MAPS"
        })
    ],
    view: new ol.View({
        center: [288074.8449901076, 6247982.515792289],
        zoom: 12
    })
});

// Creation du controle
var ep = new ol.control.ElevationPath({
});

// Ajout à la carte
map.addControl(ep);
```

**Exemple d'utilisation** [![jsFiddle](https://jsfiddle.net/img/embeddable/logo-dark.png)](https://jsfiddle.net/ignfgeoportail/cwfsLge7/embedded/result,js,html,css/)

<a id="measure"/>

### Outils de mesures

Trois widgets sont proposés permettant à un internaute d'effectuer des mesures sur une carte OpenLayers : mesures de distance, de surface et d'azimuth.

Leur utilisation se fait par la création d'un nouveau contrôle, instance de la classe [ol.control.MeasureLength](http://ignf.github.io/geoportal-extensions/ol-latest/jsdoc/ol.control.MeasureLength.html), pour les distances ; [ol.control.MeasureArea](http://ignf.github.io/geoportal-extensions/ol-latest/jsdoc/ol.control.MeasureArea.html), pour les surfaces ou [ol.control.MeasureAzimuth](http://ignf.github.io/geoportal-extensions/ol-latest/jsdoc/ol.control.MeasureAzimuth.html) pour les mesures d'azimuth que l'on peut ensuite ajouter à la carte comme [les autres contrôles OpenLayers](http://openlayers.org/en/latest/apidoc/ol.Map.html#addControl), de la manière suivante :


``` javascript
var length = new ol.control.MeasureLength(opts);
map.addControl(length);
```

#### Exemples d'utilisation

##### Utilisation simple

Ajout du widget sans paramétrage particulier.

``` javascript
// Création de la carte
var map = new ol.Map({
    target: 'map',
    layers: [
        new ol.layer.GeoportalWMTS({
            layer: "GEOGRAPHICALGRIDSYSTEMS.MAPS"
        })
    ],
    view: new ol.View({
        center: [288074.8449901076, 6247982.515792289],
        zoom: 12
    })
});

// Creation du controle
var length = new ol.control.MeasureLength({
});

// Ajout à la carte
map.addControl(length);
```

**Exemple d'utilisation** [![jsFiddle](https://jsfiddle.net/img/embeddable/logo-dark.png)](https://jsfiddle.net/ignfgeoportail/cwfsLge7/embedded/result,js,html,css/)


<a id="getfeatureinfo"/>

### Accès aux informations attributaires des couches

Ce widget permet, au clic sur la carte, d'afficher dans une popup les informations attributaires des couches présentes dans la carte et spécifiées dans le widget.
Dans le cas des couches vecteur, ces informations correspondent aux informations attributaires des objets localisés au point cliqué.
Dans le cas des couches raster (WMS et WMTS), c'est le contenu de la réponse d'une requête GetFeatureInfo sur la première couche qui est affiché.
Lorsque le contrôle est activé pour plusieurs couches, les informations affichées seront celles de la première couche visible rencontrée dans la carte (en partant du haut de la pile des couches).

Son utilisation se fait par la création d'un nouveau contrôle, instance de la classe [ol.control.GetFeatureInfo](http://ignf.github.io/geoportal-extensions/ol-latest/jsdoc/ol.control.GetFeatureInfo.html), que l'on peut ensuite ajouter à la carte comme [les autres contrôles OpenLayers](http://openlayers.org/en/latest/apidoc/ol.Map.html#addControl), de la manière suivante :

``` javascript
var getFeatureInfo = new ol.control.GetFeatureInfo(opts);
map.addControl(getFeatureInfo);
```

#### Exemples d'utilisation

##### Utilisation simple pour une seule couche

Ajout du widget sans paramétrage particulier.

``` javascript
// Création de la couche que l'on souhaite interroger
var orthos = new ol.layer.GeoportalWMTS({
    layer: "ORTHOIMAGERY.ORTHOPHOTOS"
});

// Création de la carte
var map = new ol.Map({
    target: 'map',
    layers: [
        orthos
    ],
    view: new ol.View({
        center: [288074.8449901076, 6247982.515792289],
        zoom: 12
    })
});

// Création du contrôle, et activation pour la couche orthos créée ci-dessus
var getfeatureinfo = new ol.control.GetFeatureInfo({
    layers : [
        {
            obj : orthos
        }
    ]
});

// Ajout à la carte
map.addControl(getfeatureinfo);
```

**Exemple d'utilisation** [![jsFiddle](https://jsfiddle.net/img/embeddable/logo-dark.png)](https://jsfiddle.net/ignfgeoportail/vg6dz7bn/embedded/result,js,html,css/)
