import React, { Component } from "react";
import mapboxgl from "mapbox-gl";
import map_data from "./xchange.geojson";
import axios from "axios";
import host from "./globals";

mapboxgl.accessToken =
  "pk.eyJ1IjoiaXNhYWNqbWlsbGVyIiwiYSI6ImNrMTZ6NnBqdjFiM3czcHRrb3ZtbTZsajYifQ.3tv9y_9KCHST0M5NaDj4Zg";

export default class Map extends Component {
  constructor(props) {
    super(props);
    this.state = {
      seconds: parseInt(props.startTimeInSeconds, 10) || 0,
      sensorData: {},
    };
  }

  componentDidMount() {
    // Creates map instance
    var map = new mapboxgl.Map({
      container: this.mapContainer,
      style: "mapbox://styles/mapbox/satellite-streets-v11",
      center: [-78.86155385515599, 38.43296183843603],
      zoom: 19,
    });

    var hoveredStateId = null;

    map.on("load", () => {
      // Add geojson data to map
      map.addSource("blenheim_block", {
        type: "geojson",
        data: map_data,
      });

      // Code defining how squares behave
      map.addLayer({
        id: "blenheim_block_fill",
        type: "fill",
        source: "blenheim_block",
        layout: {},
        paint: {
          // Fill color determined by "temperature" feature for each geojson block
          "fill-color": [
            "rgb",
            ["feature-state", "temperature"],
            ["-", 100, ["feature-state", "temperature"]],
            ["-", 100, ["feature-state", "temperature"]],
          ],
          // 'fill-color': ['interpolate-hcl', ['linear'], ['get', 'temperature'], 0, 'red', 100, 'blue'],
          // 'fill-color': ["rgb", 0, 0, 30],
          // 'fill-color': '#088',
          "fill-opacity": [
            "case",
            ["boolean", ["feature-state", "hover"], false],
            1,
            0.8,
          ],
        },
      });

      // Lines between squares
      map.addLayer({
        id: "blenheim_block_border",
        type: "line",
        source: "blenheim_block",
        layout: {},
        paint: {
          "line-color": [
            "rgb",
            ["feature-state", "temperature"],
            ["-", 100, ["feature-state", "temperature"]],
            ["-", 100, ["feature-state", "temperature"]],
          ],
          "line-width": 2,
        },
      });

      // When the user moves their mouse over the state-fill layer, update the
      // feature state for the feature under the mouse.
      map.on("mousemove", "blenheim_block_fill", (e) => {
        if (e.features.length > 0) {
          if (hoveredStateId) {
            map.setFeatureState(
              { source: "blenheim_block", id: hoveredStateId },
              { hover: false }
            );
          }
          hoveredStateId = e.features[0].id;
          map.setFeatureState(
            { source: "blenheim_block", id: hoveredStateId },
            { hover: true }
          );
        }
      });

      // map.on("mousedown", function (e) {
      //     console.log(e.lngLat)
      // });

      // When the mouse leaves the state-fill layer, update the feature state of the
      // previously hovered feature.
      map.on("mouseleave", "blenheim_block_fill", () => {
        if (hoveredStateId) {
          map.setFeatureState(
            { source: "blenheim_block", id: hoveredStateId },
            { hover: false }
          );
        }
        // console.log(hoveredStateId);
        hoveredStateId = null;
        // console.log(map.getFeatureState({source: 'blenheim_block', id: "4016624233773201214"}))
        // console.log(this.state.sensorData)
        // map.querySourceFeatures("blenheim_block").map(item => {
        //     console.log(item)
        // })
      });

      // map.setFeatureState(
      //     { source: 'blenheim_block', id: hoveredStateId },
      //     { temperature: 50 }
      // );

      var tick = () => {
        // this.setState(state => ({
        //     seconds: state.seconds + 1
        //   }));

        axios.get("http://localhost:8000").then((res) => {
          var dict = {};
          var keys = Object.keys(res.data);
          var vals = Object.values(res.data);

          var features = map.queryRenderedFeatures({
            layers: ["blenheim_block_fill"],
          });
          features.map(item => {
              var id = item.properties.sensor_id
              keys.map((item2, index) => {
                  if (item2) {
                      if (id === item2) {
                        map.setFeatureState(
                            { source: "blenheim_block", id: item.id },
                            { temperature: vals[index] }
                          );          
                      }
                  }
              })
          })
        //   keys.map((item, index) => {
        //     map.setFeatureState(
        //       { source: "blenheim_block", id: item },
        //       { temperature: vals[index] }
        //     );
        //     dict[item] = vals[index];
        //     return null;
        //   });
        //   this.setState(() => ({
        //     sensorData: dict,
        //   }));
        });
      };

      this.interval = setInterval(tick, 2000);
    });
  }

  componentWillUnmount() {
    clearInterval(this.interval);
  }

  formatTime(secs) {
    let hours = Math.floor(secs / 3600);
    let minutes = Math.floor(secs / 60) % 60;
    let seconds = secs % 60;
    return [hours, minutes, seconds]
      .map((v) => ("" + v).padStart(2, "0"))
      .filter((v, i) => v !== "00" || i > 0)
      .join(":");
  }

  render() {
    return (
      <div>
        <div ref={(el) => (this.mapContainer = el)} className="mapContainer" />
      </div>
    );
  }
}
