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

                const MIN = 77; // min val on dataset (TODO: replace with function)
                const RANGE = 6; // range of dataset (TODO: replace with function)

                // Sets the initial colors of the blocks based on the initial slider value
                for (var sensor_id = 1; sensor_id <= 40; sensor_id++) {

                    // Filters data gotten from api call by sensor number. 
                    var sensor_data = res.data.filter(x => x.sensor == sensor_id);

                    var initial_slider_value = document.getElementById('slider').value;

                    if (sensor_data[initial_slider_value]) { // If data at initial slider value exists
                        map.setFeatureState({ source: 'blenheim_block', id: sensor_id },
                            { temperature: (Math.round(sensor_data[initial_slider_value].temperature) - MIN) / RANGE * 100 });

                    } else { // set to null (gray box)
                        map.setFeatureState({ source: 'blenheim_block', id: sensor_id },
                            { temperature: null });
                    }
                }

                document.getElementById('slider').addEventListener('input', function (e) {

                    // Changes each block color to match temperature for that selection
                    for (var sensor_id = 1; sensor_id <= 40; sensor_id++) {

                        // Filters data gotten from api call by sensor number. 
                        var sensor_data = res.data.filter(x => x.sensor == sensor_id);

                        var slider_value = e.target.value

                        if (sensor_data[e.target.value]) { // If data at slider value exits
                            map.setFeatureState({ source: 'blenheim_block', id: sensor_id },
                                // Sets color of block from resulting list based on slider value picked.
                                { temperature: (Math.round(sensor_data[slider_value].temperature) - MIN) / RANGE * 100 });

                        } else { // If it doesn't exist, set to null (gray box)
                            map.setFeatureState({ source: 'blenheim_block', id: sensor_id },
                                { temperature: null });
                        }
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