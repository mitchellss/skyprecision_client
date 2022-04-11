import React, { Component } from 'react';
import mapboxgl from 'mapbox-gl';
import map_data from './xchange.geojson';
import axios from 'axios';
import backend from './globals'

mapboxgl.accessToken = 'pk.eyJ1IjoiaXNhYWNqbWlsbGVyIiwiYSI6ImNrMTZ6NnBqdjFiM3czcHRrb3ZtbTZsajYifQ.3tv9y_9KCHST0M5NaDj4Zg';

export default class Map extends Component {
    constructor(props) {
        super(props);
        this.state = {
            seconds: parseInt(props.startTimeInSeconds, 10) || 0,
            sensorData: {}
        };
    }

    componentDidMount() {

        // Creates map instance
        var map = new mapboxgl.Map({
            container: this.mapContainer,
            style: 'mapbox://styles/mapbox/satellite-streets-v11',
            center: [-78.86155385515599, 38.43296183843603],
            zoom: 19
        });
        
        this.interval = setInterval((map) => this.tick(map), 2000);

        var hoveredStateId = null;
        const NUM_SENSORS = 40;
        const MIN_IN_HOUR = 60;
        const MIN_IN_DAY = 1440;
        const SEC_IN_MIN = 60;

        const change_date_display = (time) => {
            var a = new Date(0);
            a.setUTCSeconds(time);

           var options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',  hour:'numeric', minute:'numeric'};

            this.props.parent.overlayRef.current.setState({ time_display: `${a.toLocaleDateString("en-US", options)}` });

        }

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

            // map.on("mousedown", function (e) {
            //     console.log(e.lngLat)
            // });

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

        });

    }

    tick(map) {
        this.setState(state => ({
          seconds: state.seconds + 1
        }));

        console.log(map)

        axios.get("http://192.168.43.68:42069").then(res => {
            
            var dict = {}
            var keys = Object.keys(res.data)
            var vals = Object.values(res.data)

            keys.map((item, index) => {
                dict[item] = vals[index]
            })

            // console.log(dict)
            

            this.setState(() => ({
                sensorData: dict
            }));
        })
    }

    componentWillUnmount() {
        clearInterval(this.interval);
    }


    formatTime(secs) {
        let hours   = Math.floor(secs / 3600);
        let minutes = Math.floor(secs / 60) % 60;
        let seconds = secs % 60;
        return [hours, minutes, seconds]
            .map(v => ('' + v).padStart(2, '0'))
            .filter((v,i) => v !== '00' || i > 0)
            .join(':');
    }

    render() {
        return (
            <div>
                <div ref={el => this.mapContainer = el} className="mapContainer" />
                {/* <div>
                    Timer: {this.formatTime(this.state.seconds)}
                </div>             */}
            </div>
        )
    }
}
