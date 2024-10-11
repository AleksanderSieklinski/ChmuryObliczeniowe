import React, { useEffect, useRef } from 'react';
import cytoscape from 'cytoscape';

const Graph = React.memo(({ elements }) => {
    const containerRef = useRef(null);

    useEffect(() => {
        const cy = cytoscape({
            container: containerRef.current,
            elements: elements,
            style: [
                {
                    selector: 'node',
                    style: {
                        'background-color': '#666',
                        'label': 'data(id)',
                        'font-size': '10px'
                    }
                },
                {
                    selector: 'edge',
                    style: {
                        'width': 2,
                        'curve-style': 'bezier',
                        'line-color': '#ccc',
                        'target-arrow-color': '#ccc',
                        'target-arrow-shape': 'triangle',
                        'label': 'data(label)',
                        'text-wrap': 'wrap',
                        'font-size': '5px'

                    }
                }
            ],
            layout: {
                name: 'cose',
                rows: 1
            }
        });
        elements.forEach(element => {
            if (element.group === 'edges') {
                const { source, target } = element.data;
                if (!cy.getElementById(source).length) {
                    cy.add({
                        group: 'nodes',
                        data: { id: source }
                    });
                }
                if (!cy.getElementById(target).length) {
                    cy.add({
                        group: 'nodes',
                        data: { id: target }
                    });
                }
            }
        });
        return () => {
            cy.destroy();
        };
    }, [elements]);

    return <div ref={containerRef} style={{ width: '100%', height: '400px' }} />;
});

export default Graph;