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
                        'background-color': 'rgba(24,154,248,0)',
                        'label': 'data(name)',
                        'font-size': '7px',
                        'width': '15px',
                        'height': '15px'
                    }
                },
                {
                    selector: 'edge',
                    style: {
                        'width': 2,
                        'line-color': '#ccc',
                        'target-arrow-color': 'rgba(204,204,204,0)',
                        'target-arrow-shape': 'triangle',
                        'curve-style': 'bezier',
                        'edge-distances': 'node-position',
                        'label': 'data(label)',
                        'text-rotation': 'autorotate',
                        'font-size': '3px',
                    }
                }
            ],
            layout: {
                name: 'cose',
                fit: true,
                avoidOverlap: true,
                animate: true,
                minNodeSpacing: 400,
            }
        });

        cyRef.current.on('tap', 'node', (event) => {
            alert(`Node: ${event.target.data('name')}, \nage: ${event.target.data('age')}, \nlocation: ${event.target.data('location')}, \ninterests: ${event.target.data('interests')}`);
        });

        return () => {
            cyRef.current.destroy();
        };
    }, [elements, events]);

    return <div id="cy" style={{ width: `100%`, height: '600px' }} />;
};

export default Graph;