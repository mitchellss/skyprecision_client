import React, { Component } from 'react';

export default class MapOverlay extends Component {

    constructor() {
        super();
        this.state = {
            time_display: "test"
        }
    }

    render() {
        return (
            <div className="map-overlay top">
                <div className="map-overlay-inner">
                    <h2>Blenheim Block Temperature Over Time</h2>
                    <label id="hour"></label>
                    <div>
                    <input id="slider" type="range" min="0" max="59" step="1"></input>
                    </div>
                    <h2>{this.state.time_display}</h2>
                </div>
                <div className="map-overlay-inner">
                    <div id="legend" className="legend">
                        <div className="bar"></div>
                        <div>Temperature (F)</div>
                    </div>
                </div>
            </div>
        )
    }

}