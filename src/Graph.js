import React, { useEffect, useRef } from 'react';
import cytoscape from 'cytoscape';

const Graph = ({ elements, events }) => {
    const cyRef = useRef(null);

    useEffect(() => {
        cyRef.current = cytoscape({
            container: document.getElementById('cy'), // container to render in
            elements: elements,
            style: [ // the stylesheet for the graph
                {
                    selector: 'node',
                    style: {
                        'background-color': '#666',
                        'label': 'data(name)'
                    }
                },
                {
                    selector: 'edge',
                    style: {
                        'width': 3,
                        'line-color': '#ccc',
                        'target-arrow-color': '#ccc',
                        'target-arrow-shape': 'triangle'
                    }
                }
            ],
            layout: {
                name: 'grid',
                fit: true,
                avoidOverlap: true,
                animate: true
            }
        });

        cyRef.current.on('tap', 'node', (event) => {
            // send an alert message with the node's name and details
            alert(`Node: ${event.target.data('name')}, \nage: ${event.target.data('age')}, \nlocation: ${event.target.data('location')}, \ninterests: ${event.target.data('interests')}`);
        });

        cyRef.current.on('tap', 'edge', (event) => {
            // send an alert message with all the edge data
            alert(`Source: ${event.target.source().data('name')}, \nTarget: ${event.target.target().data('name')}, \nRelationship: ${event.target.data('label')}`);
        });

        return () => {
            cyRef.current.destroy();
        };
    }, [elements, events]);

    return <div id="cy" style={{ width: '600px', height: '600px' }} />;
};

export default Graph;