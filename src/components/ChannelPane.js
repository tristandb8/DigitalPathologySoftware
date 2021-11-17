import React from 'react';
import styled from 'styled-components'
import { func, array } from 'prop-types';
import "./styles/channelToggle.css"

export default class ChannelPane extends React.Component{

    constructor(props) {
        super(props);
        this.state = {
            channels: [],
            handleChannelToggle: null,
        }
    }

    componentDidMount() {
        this.setState({
            channels: this.props.channels,
            handleChannelToggle: this.props.handleChannelToggle,
        });
    }
    componentDidUpdate(prevProps) {
        if (this.props.channels !== prevProps.channels) {
            this.setState({
                channels: this.props.channels,
            })
        }
    }

    channelToggle(index) {
        return( 
            <span>
                <label className="switch">
                    <input checked={this.props.channels[index].display} type="checkbox" onChange={() => this.props.handleChannelToggle(index)}/>
                    <span className="slider"/>
                </label>
            </span>
        );
    }

    renderChannel(channel, index) {
        return (
            <ChannelCell>
                <ChannelCellContent>
                    <span>
                        {channel.channelName}
                    </span>

                    {this.channelToggle(index)}
                </ChannelCellContent>
            </ChannelCell>
        );
    }

    render() {
        return (
            <div>
                {this.props.channels.map(this.renderChannel, this)}
            </div>
        )
    }
} 
ChannelPane.propTypes = {
    channels: array,
    handleInputChange: func,
};

const ChannelList = styled.div`
    /* Auto Layout */

    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 0px;

    position: absolute;
    width: 200px;
    height: 230px;
    left: 1080px;
    top: 48px;
`

const ChannelCell = styled.div`
    position: static;
    width: 200px;
    height: 32px;
    left: 0px;
    top: 0px;


    /* Inside Auto Layout */

    flex: none;
    order: 0;
    flex-grow: 0;
    margin: 0px 0px;
`
const ChannelCellContent = styled.div`
    /* Auto Layout */

    display: flex;
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
    padding: 0px;
    
    width: 180px;
    height: 12px;
    left: 8px;
    top: 8px;
    
`