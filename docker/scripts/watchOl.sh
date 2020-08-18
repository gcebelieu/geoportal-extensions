#!/bin/bash

# Initialisation 
old="0"

# Monitoring 
inotifywait -r -m -e modify -e create -e delete --timefmt '%Y-%m-%d %H:%M:%S' --format '%T %w %e' /home/docker/geoportal-extensions/src/OpenLayers/ |
while read date time file event
do
  message=$date$time$file$event
  if [ $old != $message ]
  then 
    pushd /home/docker/geoportal-extensions/
    npm run build:ol
    cp -rf ./dist/* /home/docker/html/geoportal-extensions/dist/
    cp -rf ./samples/* /home/docker/html/geoportal-extensions/samples/
    cp -rf ./jsdoc/* /home/docker/html/geoportal-extensions/jsdoc/
    popd
    pushd /home/docker/geoportal-extensions/build/scripts/release/
    rm -rf ./geoportal-extensions-openlayers*.tgz
    bash build-pack.sh -a
    cp ./geoportal-extensions-openlayers*.tgz /home/docker/html/geoportal-extensions/package/geoportal-extensions-openlayers-local.tgz
    popd
    old=$message
  fi
done