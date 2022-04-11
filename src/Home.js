import React, {Component} from 'react';
import MapOverlay from './MapOverlay';
import Map from './Map';

export default class Home extends Component {
    constructor (props) {
        super(props);
        this.mapRef = React.createRef();
        this.overlayRef = React.createRef();
    }

    render() {
        return(
            <div>
                <Map parent={this} ref={this.mapRef} startTimeInSeconds={100}/>
                <MapOverlay parent={this} ref={this.overlayRef} />
            </div>
        );
    }
}