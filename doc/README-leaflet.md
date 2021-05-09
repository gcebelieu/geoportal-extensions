# Extension Géoportail pour Leaflet

[![release](https://img.shields.io/badge/release%20-leaflet%202.1.9-brightgreen.svg?style=flat)](https://github.com/IGNF/geoportal-extensions/releases/tag/leaflet-2.1.9)

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
  * [Versions de Leaflet supportées](#versions-de-leaflet-supportées)
  * [Navigateurs supportés](#navigateurs-supportés)
- [Fonctionnalités](#fonctionnalités)
  * [Systèmes de coordonnées](#systèmes-de-coordonnées)
  * [Affichage des couche WMTS Géoportail](#affichage-des-couche-wmts-géoportail)
    + [Exemples d'utilisation](#exemples-dutilisation)
    + [Utilisation simple de la fonction](#utilisation-simple-de-la-fonction)
    + [Affichage en Lambert 93 (EPSG:2154)](#affichage-en-lambert-93-epsg2154)
  * [Affichage des couche WMS Géoportail](#affichage-des-couche-wms-géoportail)
  * [Exemple d'utilisation](#exemple-dutilisation)
    + [Utilisation simple de la fonction](#utilisation-simple-de-la-fonction-1)
  * [Widget de gestion d'empilement des couches](#widget-de-gestion-dempilement-des-couches)
    + [Exemples d'utilisation](#exemples-dutilisation-1)
      - [Utilisation simple](#utilisation-simple)
      - [Utilisation personnalisée](#utilisation-personnalisée)
  * [Barre de recherche](#barre-de-recherche)
    + [Exemples d'utilisation](#exemples-dutilisation-2)
      - [Utilisation simple](#utilisation-simple-1)
  * [Adresse ou lieu en un point de la carte](#adresse-ou-lieu-en-un-point-de-la-carte)
    + [Exemples d'utilisation](#exemples-dutilisation-3)
      - [Utilisation simple](#utilisation-simple-2)
  * [Calculs d'itinéraires](#calculs-ditinéraires)
    + [Exemples d'utilisation](#exemples-dutilisation-4)
      - [Utilisation simple](#utilisation-simple-3)
  * [Calculs d'isochrones / isodistances](#calculs-disochrones--isodistances)
    + [Exemples d'utilisation](#exemples-dutilisation-5)
      - [Utilisation simple](#utilisation-simple-4)
  * [Altitude en un point de la carte](#altitude-en-un-point-de-la-carte)
    + [Exemples d'utilisation](#exemples-dutilisation-6)
      - [Utilisation simple](#utilisation-simple-5)
  * [Profil altimétrique le long d'un traçé](#profil-altimétrique-le-long-dun-traçé)
    + [Exemples d'utilisation](#exemples-dutilisation-7)
      - [Utilisation simple](#utilisation-simple-6)

<!-- tocstop -->

L'extension Géoportail pour Leaflet propose les fonctionnalités suivantes à utiliser en complément de la biblothèque [Leaflet](http://leafletjs.com/) :

* [affichage des couches WMTS Géoportail](#WMTS)

* [affichage des couches WMS Géoportail](#WMS)

* [widget de gestion d'empilement des couches](#layerswitcher)

* [barre de recherche utilisant le service de géocodage IGN](#geocode)

* [obtention d'une adresse, d'un nom de lieu, ... au clic sur la carte](#reverse)

* [calculs d'itinéraires à partir du service de la plateforme Géoportail](#route)

* [calculs d'isochrones / isodistances à partir du service de la plateforme Géoportail](#isocurve)

* [altitude en un point de la carte à l'aide du service d'altimétrie de la plateforme Géoportail](#mp)

* [profil altimétrique d'un traçé à l'aide du service d'altimétrie de la plateforme Géoportail](#ep)


## Mise en oeuvre

L'utilisation de l'extension Géoportail pour Leaflet se fait via les étapes suivantes :

* [Téléchargement de l'extension Géoportail](#download)

* [Intégration de l'extension dans une page web](#integration)

* [Configuration de l'accès à la plateforme Géoportail](#config)



<a id="download"/>

### Téléchargement

Vous pouvez récupérer l'extension Géoportail pour Leaflet soit par [téléchargement direct](#download-direct), soit en utilisant le [gestionnaire de dépendances javascript NPM](#download-npm).

L'extension Géoportail pour Leaflet comprend l'arborescence de fichiers suivante :


```
  <Extension Géoportail pour Leaflet>/
    GpPluginLeaflet.js         (version minifiée du code javascript pour une utilisation en production)
    GpPluginLeaflet.css        (version minifiée des css pour une utilisation en production)
    GpPluginLeaflet-src.js     (version non minifiée du code javascript pour une utilisation en développement)
    GpPluginLeaflet-src.css    (version non minifiée des css pour une utilisation en développement)
```

Les scripts de Leaflet s'obtiennent sur [la page de téléchargement de Leaflet](http://leafletjs.com/download.html).

<a id="download-direct"/>

#### Téléchargement direct

Vous pouvez télécharger la dernière version de l'extension Géoportail pour Leaflet directement sur [la page des releases des extensions Géoportail](https://github.com/IGNF/geoportal-extensions/releases).

L'archive téléchargée (GpLeaflet.zip) comprend l'arborescence décrite ci-dessus.


<a id="download-npm"/>

#### Récupération avec NPM

L'extension Géoportail pour Leaflet est aussi disponible dans les dépôts [NPM](https://www.npmjs.com/package/geoportal-extensions-leaflet).

Prérequis : [NodeJS](https://nodejs.org/en/) et [npm](https://www.npmjs.com/) installés.

```
npm i geoportal-extensions-leaflet
```

L'arborescence décrite ci-dessus sera alors accessible dans le répertoire `node_modules/geoportal-extensions-leaflet/dist/` de votre projet.


#### Accès direct

Vous pouvez aussi choisir d'utiliser des fichiers hébergés en ligne, pour y accéder directement, lors de vos tests par exemple. Cependant, pour une utilisation en production, nous vous conseillons de télécharger ces fichiers et de les héberger vous-même, sur le même serveur qui héberge votre application.
Par exemple sur Github Pages :
```
http://ignf.github.io/geoportal-extensions/leaflet-latest/dist/GpPluginLeaflet.js
http://ignf.github.io/geoportal-extensions/leaflet-latest/dist/GpPluginLeaflet.css
http://ignf.github.io/geoportal-extensions/leaflet-latest/dist/GpPluginLeaflet-src.js
http://ignf.github.io/geoportal-extensions/leaflet-latest/dist/GpPluginLeaflet-src.css
```

<a id="integration"/>

### Intégration dans une page web

Dézippez l'extension géoportail dans l'arborescence de votre serveur web. Vous pouvez positionner à votre guise les fichiers css et javascript.

Intégrez l'extension géoportail pour leaflet dans votre page web classiquement à l'aide d'une balise **script** pour charger le fichier javascript et d'une balise **link** pour charger le fichier css en plus des balises correspondantes utilisées pour charger la bibliothèque Leaflet.

``` html
<!-- Library Leaflet -->
<link rel="stylesheet" href="chemin/vers/leaflet/leaflet.css" />
<script src="chemin/vers/leaflet/leaflet.js"></script>

<!-- Extension Géoportail pour Leaflet -->
<script src="chemin/vers/GpPluginLeaflet.js"></script>
<link rel="stylesheet" href="chemin/vers/GpPluginLeaflet.css" />
```

<a id="config"/>

### Configuration de l'accès à la plateforme Géoportail

L'extension Géoportail pour Leaflet exploite les services web exposés par la plateforme Géoportail. Ceux-ci sont soumis à l'obtention d'une **clef d'accès** obtenue sur le site [professionnels.ign.fr](http://professionnels.ign.fr/ign/contrats) ayant les droits sur les ressources que vous souhaitez exploiter.

Une fois la clef obtenue, vous pouvez paramétrer l'utilisation de l'extension avec cette clef de deux manières possibles :

**Méthode 1** : Au chargement de l'extension en utilisant l'attribut "data-key" de la balise **script** de chargement de l'extension :

``` html
<script data-key="VOTRE-CLEF" src="chemin/vers/GpPluginLeaflet.js"></script>
```

Votre utilisation des fonctionnalités de l'extension Géoportail sera alors simplement conditionnée par la réception de l'événement onload de la page web, comme sur l'exemple suivant :

``` html
<html>
    <head>
        <!-- Library Leaflet -->
        <link rel="stylesheet" href="leaflet.css" />
        <script src="leaflet.js"></script>
        <!-- Extension Géoportail pour Leaflet -->
        <link rel="stylesheet" href="GpPluginLeaflet.css" />
        <script src="GpPluginLeaflet.js" data-key="CLEAPI"></script>
    </head>
    <body>
        <script>
            window.onload = function () {
                // votre utilisation de l'extension Géoportail pour Leaflet
            }
        </script>
    </body>
</html>
```

**Méthode 2** : A la fin du chargement de la page en utilisant la fonction [Gp.Services.GetConfig()](https://github.com/IGNF/geoportal-access-lib#getConfig) et en conditionnant alors l'utilisation de l'extension à l'exécution de la fonction de rappel onSuccess passée en paramètres de Gp.Services.getConfig() comme sur l'exemple suivant :

``` html
<html>
    <head>
        <!-- Library Leaflet -->
        <link rel="stylesheet" href="leaflet.css" />
        <script src="leaflet.js"></script>
        <!-- Extension Géoportail pour Leaflet -->
        <link rel="stylesheet" href="GpPluginLeaflet.css" />
        <script src="GpPluginLeaflet.js"></script>
    </head>
    <body>
        <script>
            window.onload = function () {
                Gp.Services.getConfig({
                    apiKey: 'CLEAPI',
                    onSuccess: function (response) {
                        // votre utilisation de l'extension Géoportail pour Leaflet
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
<script data-url="chemin/vers/autoconf.json" src="chemin/vers/GpPluginLeaflet.js"></script>
```

Votre utilisation des fonctionnalités de l'extension Géoportail sera alors simplement conditionnée par la réception de l'événement onload de la page web, comme sur l'exemple suivant :

``` html
<html>
    <head>
        <!-- Library Leaflet -->
        ...
        <script data-url="chemin/vers/autoconf.json" src="chemin/vers/GpPluginLeaflet.js"></script>
    </head>
    <body>
        <script>
            window.onload = function () {
                // votre utilisation de l'extension Géoportail pour Leaflet
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
                        // votre utilisation de l'extension Géoportail pour Leaflet
                    }
                });
            }
        </script>
    </body>
</html>
```

### Appel de l'extension dans un module ES6

Le module de l'extension expose de multiples exports nommés (dont le module leaflet étendu).
L'utilisateur a le choix entre plusieurs méthodes d'import.

**Méthode 1** : import des exports nommés du module

``` javascript
import {Services, LExtended as L} from 'geoportal-extensions-leaflet';

// votre utilisation de l'extension
var map  = L.map(...)
Services.getConfig(...)
```

**Méthode 2** : import d'un objet d’espace de noms pour le module

***Variante 1*** : le module leaflet étendu est récupéré depuis l'espace de noms

``` javascript
import * as Gp from 'geoportal-extensions-leaflet';

// votre utilisation de l'extension
const L = Gp.LExtended;
var map  = L.map(...)
Gp.Services.getConfig(...)
```

***Variante 2*** : le module leaflet est importé indépendamment de l'extension

``` javascript
import L from 'leaflet';
import * as Gp from 'geoportal-extensions-leaflet';

// votre utilisation de l'extension
var map  = L.map(...)
Gp.Services.getConfig(...)
```

## Compatibilités

### Versions de Leaflet supportées

L'extension Géoportail pour Leaflet peut s'utiliser avec les versions de Leaflet suivantes :
* [version 0.7.X](http://leafletjs.com/reference-0.7.7.html)
* [version 1.0.X](http://leafletjs.com/reference-1.0.3.html)
* [version 1.2.X](http://leafletjs.com/reference-1.2.0.html)
* [version 1.3.X](http://leafletjs.com/reference-1.3.4.html)
* [version 1.4.X](http://leafletjs.com/reference-1.4.0.html)
* [version 1.5.1](http://leafletjs.com/reference-1.5.1.html)
* [version 1.7.1](http://leafletjs.com/reference-1.7.1.html)

La release Leaflet [version 1.1.0](http://leafletjs.com/reference-1.1.0.html) est incompatible avec l'utilisation du plugin [Leaflet-Draw](https://github.com/Leaflet/Leaflet.draw).

Pour profiter de toutes les fonctionnalités, il faut utiliser la dernière release Leaflet [version 1.7.1](http://leafletjs.com/reference-1.7.1.html).

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

Leaflet utilise par défaut les systèmes de coordonnées mondiaux "standards" dont on peut trouver la liste [ici](http://leafletjs.com/reference.html#icrs).

L'extension Géoportail pour Leaflet embarque de nombreuses projections en *EPSG*, *CRS* ainsi que sous le registre *IGNF*.
Il est possible d'appeler ces projections avec le mécanisme de Leaflet.

Exemple :

``` javascript
// Appel de la Projection Lambert 93
var LAMB93 = new L.Proj.CRS('IGNF:LAMB93');

```

La définition d'autres systèmes de coordonnées est cependant possible par l'adjonction de deux bibliothèques [Proj4js](http://proj4js.org/) et [Proj4Leaflet](http://kartena.github.io/Proj4Leaflet/). La première permettant de définir des systèmes de coordonnées et d'effectuer des transformations de coordonnées entre systèmes ; la seconde permettant d'utiliser la première dans Leaflet.

L'extension Géoportail pour Leaflet **intègre nativement ces deux bibliothèques**. Si vous l'utilisez vous pouvez donc directement définir les systèmes de coordonnées que vous souhaitez selon la syntaxe proj4 et en utilisant le mécanisme de Leaflet.

Exemple :

``` javascript
// Définition de la Projection UTM 20N
var utm20 = new L.Proj.CRS('EPSG:4559',
    '+proj=utm +zone=20 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs');

```

NB :

* Le site [epsg.io](http://epsg.io/) recense un grand nombre de registres de systèmes de coordonnées avec leurs définitions.

* Les définitions des systèmes de coordonnées du registre IGNF peuvent être trouvées [ici](https://github.com/OSGeo/proj.4/blob/master/nad/IGNF).



L'extension Géoportail pour Leaflet définit par défaut la projection légale Lambert 93 (EPSG:2154) qu'elle expose sous la variable globale suivante.

``` javascript
L.geoportalCRS.EPSG2154
```


<a id="WMTS"/>

### Affichage des couche WMTS Géoportail

L'affichage des couches WMTS Géoportail se fait à l'aide de la fonction [L.geoportalLayer.WMTS()](http://ignf.github.io/geoportal-extensions/leaflet-latest/jsdoc/module-Layers.html#.WMTS), utilisée de la manière suivante :

``` javascript
L.geoportalLayer.WMTS(options, [leafletParams]);
```

Cette fonction retourne un objet de type [L.TileLayer](http://leafletjs.com/reference.html#tilelayer).


#### Exemples d'utilisation

#### Utilisation simple de la fonction

Affichage simple des ortho-images du Géoportail : création d'une *layer* Géoportail, et ajout à la *map* Leaflet.

``` javascript
// Création de la carte
var map  = L.map('map', {
    zoom : 10,
    center : L.latLng(48, 2)
});

// Création de la couche
var lyr = L.geoportalLayer.WMTS({
    layer  : "ORTHOIMAGERY.ORTHOPHOTOS"
}) ;

lyr.addTo(map); // ou map.addLayer(lyr);
```

**Exemple d'utilisation** [![jsFiddle](https://jsfiddle.net/img/embeddable/logo-dark.png)](https://jsfiddle.net/ignfgeoportail/nqz6xmpa/embedded/result,js,html,css/)

#### Affichage en Lambert 93 (EPSG:2154)

La plateforme Géoportail diffuse aussi des ressources WMTS en projection Lambert 93. Pour permettre de les afficher, l'extension Géoportail pour Leaflet pré-définit la projection correspondante accessible via la constante :

``` javascript
L.geoportalCRS.EPSG2154
```

Il vous suffit alors de paramétrer la carte Leaflet avec cette projection et d'y rajouter la ressource WMTS de la même manière que précédemment.

``` javascript
// Création de la carte
var map = L.map('divmap', {
    crs : L.geoportalCRS.EPSG2154
}).setView([48, 2], 10);

// Création de la couche
var lyr = L.geoportalLayer.WMTS({
    layer  : "CADASTRALPARCELS.PARCELS.L93"
}) ;

lyr.addTo(map); // ou map.addLayer(lyr);
```

**Exemple d'utilisation** [![jsFiddle](https://jsfiddle.net/img/embeddable/logo-dark.png)](https://jsfiddle.net/ignfgeoportail/kss0j1yp/embedded/result,js,html,css/)


NB : D'autres systèmes de coordonnées peuvent être définis : [plus d'informations...](#crs)


<a id="WMS"/>

### Affichage des couche WMS Géoportail

L'affichage des couches WMS Géoportail se fait à l'aide de la fonction [L.geoportalLayer.WMS()](http://ignf.github.io/geoportal-extensions/leaflet-latest/jsdoc/module-Layers.html#.WMS), utilisée de la manière suivante :

``` javascript
L.geoportalLayer.WMS(options[,leafletParams]);
```

Cette fonction retourne un objet de type [L.TileLayer.WMS](http://leafletjs.com/reference.html#tilelayer-wms).

### Exemple d'utilisation

#### Utilisation simple de la fonction

Affichage des orthos-images servies par le service WMS INSPIRE de la plateforme Géoportail sur une carte Leaflet en projection EPSG:4326.

``` javascript
// creation de la carte
var map = L.map("map",{
    crs : L.CRS.EPSG4326
}).setView([16.239, -61.545], 12);

// creation et ajout de la couche WMS à la carte
L.geoportalLayer.WMS({
    layer: "OI.OrthoimageCoverage"
}).addTo(map);
```

**Exemple d'utilisation** [![jsFiddle](https://jsfiddle.net/img/embeddable/logo-dark.png)](https://jsfiddle.net/ignfgeoportail/d9402Lba/embedded/result,js,html,css/)


<a id="layerswitcher"/>

### Widget de gestion d'empilement des couches

Ce widget permet à l'utilisateur de gérer l'empilement des couches composant la carte L.Map et, pour chacune d'elle, d'agir sur la visibilité, l'opacité et d'afficher des informations qui lui sont associées (titre, description, métadonnées, légende).

Son utilisation se fait par la création d'un nouveau contrôle à l'aide de la fonction [L.geoportalControl.LayerSwitcher()](http://ignf.github.io/geoportal-extensions/leaflet-latest/jsdoc/module-Controls.html#.LayerSwitcher), que l'on peut ensuite ajouter à la carte comme [les autres contrôles Leaflet](http://leafletjs.com/reference.html#map-stuff-methods), par exemple de la manière suivante :

``` javascript
var layerSwitcher = L.geoportalControl.LayerSwitcher(opts);
map.addControl(layerSwitcher);
```

Le widget affiche l'ensemble des couches composant la carte L.Map.

Pour chaque couche de la carte L.Map, le widget affiche son titre et sa description (par défaut : l'identifiant Leaflet de la couche), et, si elles sont spécifiées, des informations plus détaillées : légendes, métadonnées, aperçu rapide.

La récupération de ces informations n'est pas la même selon la manière dont chaque couche a été ajoutée à la carte :

- Couches ajoutées via la [fonctionnalité d'affichage simple des couches WMS](#WMS) ou [WMTS du Géoportail](#WMTS) de l'extension pour Leaflet : ces informations sont disponibles car elles ont été chargées par lors de la [configuration de l'accès au Géoportail](#config), il n'y a donc rien à faire de particulier.

- Autres couches : afin d'afficher ces informations, il est nécessaire de les spécifier dans les options du widget.

#### Exemples d'utilisation

##### Utilisation simple

Ajout du widget de gestion de l'empilement des couches sans paramétrage particulier.

``` javascript
// Création de la carte
var map = L.Map('divmap', {center: [2.38, 45.23] , zoom: 13});

// création et ajout d'une cocuhe Géoportail
var lyr = L.geoportalLayer.WMTS({
    layer  : "ORTHOIMAGERY.ORTHOPHOTOS",
});
lyr.addTo(map); // ou map.addLayer(lyr);

// Création et ajout du LayerSwitcher
map.addControl(
    L.geoportalControl.LayerSwitcher()
);
```

##### Utilisation personnalisée

Paramétrage de l'affichage de la couche dans le LayerSwitcher.

``` javascript
// Création de la carte
var map = L.Map('divmap', {center: [2.38, 45.23] , zoom: 13});

// Création d'une couche quelconque
var lyr = L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png?') ;

// Création et ajout du LayerSwitcher à la carte
map.addControl(
    L.geoportalControl.LayerSwitcher({
        layers : [{
            layer : lyr,
            config : {
                title : "Couche externe",
                description : "Description de ma couche",
                quicklookUrl : "lien/Vers/UnApercuRapide.png",
                legends: [{url : "lien/Vers/UneLegende.png"}],
                metadata : [{url : "lien/Vers/Une/MetaDonnee.xml"}]
            }
        }],
        options : {
            collapsed : true
        }
    })
);
```

**Exemple d'utilisation** [![jsFiddle](https://jsfiddle.net/img/embeddable/logo-dark.png)](https://jsfiddle.net/ignfgeoportail/0t1nLra7/embedded/result,js,html,css/)

<a id="geocode"/>

### Barre de recherche

La barre de recherche permet de positionner la carte à partir de la saisie d'un localisant dont la position sera retournée par le service de géocodage de l'IGN.

La saisie de localisants peut s'accompagner d'un mode d'autocomplétion s'appuyant sur le service d'autocomplétion de la plateforme Géoportail.

Son utilisation se fait par la création d'un nouveau contrôle à l'aide de la fonction [L.geoportalControl.SearchEngine()](http://ignf.github.io/geoportal-extensions/leaflet-latest/jsdoc/module-Controls.html#.SearchEngine), que l'on peut ensuite ajouter à la carte comme [les autres contrôles Leaflet](http://leafletjs.com/reference.html#map-stuff-methods), par exemple de la manière suivante :

``` javascript
var search = L.geoportalControl.SearchEngine(opts);
map.addControl(search);
```

#### Exemples d'utilisation

##### Utilisation simple

Ajout du moteur de recherhe sans paramétrage particulier.

``` javascript
// creation de la carte
map = L.map("map").setView([47, 2.424], 12);

// ajout d'une couche
var lyrMaps = L.geoportalLayer.WMTS({
    layer: "GEOGRAPHICALGRIDSYSTEMS.MAPS",
});
map.addLayer(lyrMaps) ;

// création et ajout du controle
var searchCtrl = L.geoportalControl.SearchEngine({
});
map.addControl(searchCtrl);
```

**Exemple d'utilisation** [![jsFiddle](https://jsfiddle.net/img/embeddable/logo-dark.png)](https://jsfiddle.net/ignfgeoportail/uLokwebc/embedded/result,js,html,css/)

<a id="reverse"/>

### Adresse ou lieu en un point de la carte

Ce widget permet d'obtenir un ensemble de localisants Géographiques (adresses, toponymes ou parcelles cadastrales) en un point ou une zone (cercle ou emprise rectangulaire) saisie interactivement par l'internaute sur une carte Leaflet.

Son utilisation se fait par la création d'un nouveau contrôle à l'aide de la fonction [L.geoportalControl.ReverseGeocode()](http://ignf.github.io/geoportal-extensions/leaflet-latest/jsdoc/module-Controls.html#.ReverseGeocode), que l'on peut ensuite ajouter à la carte comme [les autres contrôles Leaflet](http://leafletjs.com/reference.html#map-stuff-methods), par exemple de la manière suivante :

``` javascript
var revSearch = L.geoportalControl.ReverseGeocode(opts);
map.addControl(revSearch);
```

#### Exemples d'utilisation

##### Utilisation simple

Ajout du widget sans paramétrage particulier.

``` javascript
// creation de la carte
map = L.map("map").setView([47, 2.424], 12);

// ajout d'une couche
var lyrMaps = L.geoportalLayer.WMTS({
    layer: "GEOGRAPHICALGRIDSYSTEMS.MAPS",
});
map.addLayer(lyrMaps) ;

// création et ajout du controle
var revCtrl = L.geoportalControl.ReverseGeocode({
});
map.addControl(revCtrl);
```

**Exemple d'utilisation** [![jsFiddle](https://jsfiddle.net/img/embeddable/logo-dark.png)](https://jsfiddle.net/ignfgeoportail/7tohyehs/embedded/result,js,html,css/)

<a id="route"/>

### Calculs d'itinéraires

Le widget de calcul d'itinéraires permet d'intéragir avec une carte Leaflet pour effectuer des calculs d'itinéraires utilisant le service dédié de la plateforme Géoportail.

Son utilisation se fait par la création d'un nouveau contrôle à l'aide de la fonction [L.geoportalControl.Route()](http://ignf.github.io/geoportal-extensions/leaflet-latest/jsdoc/module-Controls.html#.Route), que l'on peut ensuite ajouter à la carte comme [les autres contrôles Leaflet](http://leafletjs.com/reference.html#map-stuff-methods), par exemple de la manière suivante :

``` javascript
var route = L.geoportalControl.Route(opts);
map.addControl(route);
```

#### Exemples d'utilisation

##### Utilisation simple

Ajout du widget sans paramétrage particulier.

``` javascript
// creation de la carte
map = L.map("map").setView([47, 2.424], 12);

// ajout d'une couche
var lyrMaps = L.geoportalLayer.WMTS({
    layer: "GEOGRAPHICALGRIDSYSTEMS.MAPS",
});
map.addLayer(lyrMaps) ;

// création et ajout du controle
var routeCtrl = L.geoportalControl.Route({
});
map.addControl(routeCtrl);
```

**Exemple d'utilisation** [![jsFiddle](https://jsfiddle.net/img/embeddable/logo-dark.png)](https://jsfiddle.net/ignfgeoportail/s30zo9eo/embedded/result,js,html,css/)

<a id="isocurve"/>

### Calculs d'isochrones / isodistances

Ce widget permet d'intéragir avec une carte Leaflet pour effectuer des calculs d'isochrones / isodistances utilisant le service dédié de la plateforme Géoportail.

Son utilisation se fait par la création d'un nouveau contrôle à l'aide de la fonction [L.geoportalControl.Isocurve()](http://ignf.github.io/geoportal-extensions/leaflet-latest/jsdoc/module-Controls.html#.Isocurve), que l'on peut ensuite ajouter à la carte comme [les autres contrôles Leaflet](http://leafletjs.com/reference.html#map-stuff-methods), par exemple de la manière suivante :

``` javascript
var iso = L.geoportalControl.Isocurve(opts);
map.addControl(iso);
```

#### Exemples d'utilisation

##### Utilisation simple

Ajout du widget sans paramétrage particulier.

``` javascript
// creation de la carte
map = L.map("map").setView([47, 2.424], 12);

// ajout d'une couche
var lyrMaps = L.geoportalLayer.WMTS({
    layer: "GEOGRAPHICALGRIDSYSTEMS.MAPS",
});
map.addLayer(lyrMaps) ;

// création et ajout du controle
var isoCtrl = L.geoportalControl.Isocurve({
});
map.addControl(isoCtrl);
```

**Exemple d'utilisation** [![jsFiddle](https://jsfiddle.net/img/embeddable/logo-dark.png)](https://jsfiddle.net/ignfgeoportail/z85j92hv/embedded/result,js,html,css/)

<a id="mp"/>

### Altitude en un point de la carte

Ce widget permet d'afficher les coordonnées d'un point choisi par l'internaute sur une carte Leaflet dans un ou plusieurs systèmes de coordonnées. Ces coordonnées peuvent comprendre l'altitude obtenue à l'aide du service d'altimétrie de la plateforme Géoportail.

Son utilisation se fait par la création d'un nouveau contrôle à l'aide de la fonction [L.geoportalControl.MousePosition()](http://ignf.github.io/geoportal-extensions/leaflet-latest/jsdoc/module-Controls.html#.MousePosition), que l'on peut ensuite ajouter à la carte comme [les autres contrôles Leaflet](http://leafletjs.com/reference.html#map-stuff-methods), par exemple de la manière suivante :

``` javascript
var mp = L.geoportalControl.MousePosition(opts);
map.addControl(mp);
```

#### Exemples d'utilisation

##### Utilisation simple

Ajout du widget sans paramétrage particulier.

``` javascript
// creation de la carte
map = L.map("map").setView([47, 2.424], 12);

// ajout d'une couche
var lyrMaps = L.geoportalLayer.WMTS({
    layer: "GEOGRAPHICALGRIDSYSTEMS.MAPS",
});
map.addLayer(lyrMaps) ;

// création et ajout du controle
var mpCtrl = L.geoportalControl.MousePosition({
});
map.addControl(mpCtrl);
```

**Exemple d'utilisation avec affichage unique de l'altitude** [![jsFiddle](https://jsfiddle.net/img/embeddable/logo-dark.png)](https://jsfiddle.net/ignfgeoportail/cenwojqe/embedded/result,js,html,css/)

**Exemple d'utilisation avec paramétrage des systèmes de coordonnées** [![jsFiddle](https://jsfiddle.net/img/embeddable/logo-dark.png)](https://jsfiddle.net/ignfgeoportail/oy601s3c/embedded/result,js,html,css/)

**Exemple d'utilisation avec appel d'un système de coordonnées défini** [![jsFiddle](https://jsfiddle.net/img/embeddable/logo-dark.png)](https://jsfiddle.net/ignfgeoportail/ggx4u7n8/embedded/result,js,html,css/)

**Exemple d'utilisation avec activation de l'édition de coordonnées pour localisation** [![jsFiddle](https://jsfiddle.net/img/embeddable/logo-dark.png)](https://jsfiddle.net/ignfgeoportail/jLcgeng9/embedded/result,js,html,css/)

<a id="ep"/>

### Profil altimétrique le long d'un traçé

Ce widget permet d'afficher le profil altimétrique d'un traçé saisi par l'internaute sur une carte Leaflet. Le profil est calculé à l'aide du service d'altimétrie de la plateforme Géoportail.

Son utilisation se fait par la création d'un nouveau contrôle à l'aide de la fonction [L.geoportalControl.ElevationPath()](http://ignf.github.io/geoportal-extensions/leaflet-latest/jsdoc/module-Controls.html#.ElevationPath), que l'on peut ensuite ajouter à la carte comme [les autres contrôles Leaflet](http://leafletjs.com/reference.html#map-stuff-methods), par exemple de la manière suivante :

``` javascript
var ep = L.geoportalControl.ElevationPath(opts);
map.addControl(ep);
```

#### Exemples d'utilisation

##### Utilisation simple

Ajout du widget sans paramétrage particulier.

``` javascript
// creation de la carte
map = L.map("map").setView([47, 2.424], 12);

// ajout d'une couche
var lyrMaps = L.geoportalLayer.WMTS({
    layer: "GEOGRAPHICALGRIDSYSTEMS.MAPS",
});
map.addLayer(lyrMaps) ;

// création et ajout du controle
var ep = L.geoportalControl.ElevationPath({
});
map.addControl(ep);
```

**Exemple d'utilisation** [![jsFiddle](https://jsfiddle.net/img/embeddable/logo-dark.png)](https://jsfiddle.net/ignfgeoportail/L5ctL3nq/embedded/result,js,html,css/)
