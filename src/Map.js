import React, { Component } from 'react';
import mapboxgl from 'mapbox-gl';
import map_data from './test.geojson';
import axios from 'axios';
import backend from './globals'

mapboxgl.accessToken = 'pk.eyJ1IjoiaXNhYWNqbWlsbGVyIiwiYSI6ImNrMTZ6NnBqdjFiM3czcHRrb3ZtbTZsajYifQ.3tv9y_9KCHST0M5NaDj4Zg';

export default class Map extends Component {
    constructor(props) {
        super(props);
    }


    componentDidMount() {

        // Creates map instance
        var map = new mapboxgl.Map({
            container: this.mapContainer,
            style: 'mapbox://styles/mapbox/satellite-streets-v11',
            center: [-78.496139, 37.931034],
            zoom: 16
        });

        var hoveredStateId = null;

        map.on('load', function () {

           // Add geojson data to map 
            map.addSource('blenheim_block', {
                'type': 'geojson',
                'data': map_data
            })

            // Code defining how squares behave
            map.addLayer({
                'id': 'blenheim_block_fill',
                'type': 'fill',
                'source': 'blenheim_block',
                'layout': {},
                'paint': { // Fill color determined by "temperature" feature for each geojson block
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

            // When the user moves their mouse over the state-fill layer, update the
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

            // Calls backend api requesting values
            axios.get(`${backend.value}/api/temperature_sensor/`).then(res => {

                // Sets the initial colors of the blocks based on the initial slider value
                for (var i = 0; i < 40; i++) {
                    map.setFeatureState({ source: 'blenheim_block', id: i + 1 },
                            { temperature: Math.floor(res.data.filter(x => x.sensor == i+1)[document.getElementById('slider').value].temperature )});
                }

                document.getElementById('slider').addEventListener('input', function (e){
                    // Changes each block color to match temperature for that selection
                    for (var i = 0; i < 40; i++) {
                        map.setFeatureState({ source: 'blenheim_block', id: i + 1 },
                            // Filters data gotten from api call by sensor number. Sets color of block from resulting list based on slider value picked.
                            { temperature: Math.floor(res.data.filter(x => x.sensor == i+1)[document.getElementById('slider').value].temperature )});
                    }
                });

            });

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