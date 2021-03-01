import React, { Component } from 'react';
import mapboxgl from 'mapbox-gl';
import map_data from './test.geojson';

mapboxgl.accessToken = 'pk.eyJ1IjoiaXNhYWNqbWlsbGVyIiwiYSI6ImNrMTZ6NnBqdjFiM3czcHRrb3ZtbTZsajYifQ.3tv9y_9KCHST0M5NaDj4Zg';

export default class Map extends Component {
    constructor(props) {
        super(props);
    }

    componentDidMount() {
        var map = new mapboxgl.Map({
            container: this.mapContainer,
            style: 'mapbox://styles/mapbox/satellite-streets-v11',
            center: [-78.496139, 37.931034],
            zoom: 16
        });

        var hoveredStateId = null;


        map.on('load', function () {
            map.addSource('blenheim_block', {
                'type': 'geojson',
                'data': map_data
            })

            // Squares
            map.addLayer({
                'id': 'blenheim_block_fill',
                'type': 'fill',
                'source': 'blenheim_block',
                'layout': {},
                'paint': {
                    'fill-color': ["rgb", ["feature-state", "temperature"], ["-", 100, ["feature-state", "temperature"]], ["-", 100, ["feature-state", "temperature"]]],
                    'fill-opacity': ['case', ['boolean', ['feature-state', 'hover'], false], 1, 0.8]
                }
            });

            // Lines between squares
            map.addLayer({
                'id': 'blenheim_block_border',
                'type': 'line',
                'source': 'blenheim_block',
                'layout': {},
                'paint': {
                    'line-color': ["rgb", ["feature-state", "temperature"], ["-", 100, ["feature-state", "temperature"]], ["-", 100, ["feature-state", "temperature"]]],
                    'line-width': 2
                }
            });

            // When the user moves their mouse over the state-fill layer, we'll update the
            // feature state for the feature under the mouse.
            map.on('mousemove', 'blenheim_block_fill', function (e) {
                if (e.features.length > 0) {
                    if (hoveredStateId) {
                        map.setFeatureState(
                            { source: 'blenheim_block', id: hoveredStateId },
                            { hover: false }
                        );
                    }
                    hoveredStateId = e.features[0].id;
                    map.setFeatureState(
                        { source: 'blenheim_block', id: hoveredStateId },
                        { hover: true }
                    );
                }
            });

            // When the mouse leaves the state-fill layer, update the feature state of the
            // previously hovered feature.
            map.on('mouseleave', 'blenheim_block_fill', function () {
                if (hoveredStateId) {
                    map.setFeatureState(
                        { source: 'blenheim_block', id: hoveredStateId },
                        { hover: false }
                    );
                }
                hoveredStateId = null;
            });


            // Temperature array used for dummy data
            const temps = []

            // For each block, push an empy list and then fill it with randomly changing data
            for (var block = 0; block < 40; block++) {
                temps.push([]);
                temps[block].push(Math.floor((Math.random() * 100) + 1));
                for (var i = 0; i < 1441; i++) {
                    var a = Math.floor((Math.random() * 100) + 1)
                    if (a > 48 && temps[block][i] < 95) {
                        temps[block].push(temps[block][i] + 1);
                    } else if (a <= 48 && temps[block][i] > 5) {
                        temps[block].push(temps[block][i] - 1);
                    } else {
                        temps[block].push(temps[block][i]);
                    }

                }
            }

            // Set map block temperature property to slider value
            for (var i = 0; i < 40; i++) {
                map.setFeatureState({ source: 'blenheim_block', id: i + 1 },
                    { temperature: temps[i][document.getElementById('slider').value] });
            }


            // Listens for slider change
            document.getElementById('slider').addEventListener('input', function (e){
                var hour = parseInt(e.target.value, 10);
                // Changes each block color to match temperature for that selection
                for (var i = 0; i < 40; i++) {
                    map.setFeatureState({ source: 'blenheim_block', id: i + 1 },
                        { temperature: temps[i][hour] });
                }
            })

        });


    }

    render() {
        return (
            <div>
                <div ref={el => this.mapContainer = el} className="mapContainer" />
            </div>
        )
    }
}