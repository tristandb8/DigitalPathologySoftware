import React from 'react';
import styled from 'styled-components'
import { func, array } from 'prop-types';
import "./styles/channelToggle.css"

export const ChannelPane = (props) => {

    const {channels, handleChannelToggle} = props;

    const ChannelToggle = (p) => {
        return( 
            <span>
                <label className="switch">
                    <input checked={props.channels[p.index].display} type="checkbox" onChange={() => handleChannelToggle(p)}/>
                    <span className="slider"/>
                </label>
            </span>
        );
    }

    const renderChannel = (channel, index) => {
        return (
            <ChannelCell>
                <ChannelCellContent>
                    <span>
                        {channel.channelName}
                    </span>
                    
                    <ChannelToggle index={index}/>
                </ChannelCellContent>
            </ChannelCell>
        );
    }

    return (
        <div>
            {channels.map(renderChannel)}
        </div>
    );
} 
ChannelPane.propTypes = {
    channels: array,
    handleInputChange: func.isRequired,
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