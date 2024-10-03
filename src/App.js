import React, { useState, useEffect } from 'react';
import './App.css';
import axios from 'axios';
import { Container, TextField, Button, Select, MenuItem, Checkbox, AppBar, Toolbar , FormControlLabel, Typography, List, ListItem, ListItemText, Accordion, AccordionSummary, AccordionDetails } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import Graph from './Graph';
const App = () => {
    const [users, setUsers] = useState([]);
    const [newUserName, setNewUserName] = useState('');
    const [newUserAge, setNewUserAge] = useState('');
    const [newUserLocation, setNewUserLocation] = useState('');
    const [newUserInterests, setNewUserInterests] = useState('');
    const [selectedUser1, setSelectedUser1] = useState('');
    const [selectedUser2, setSelectedUser2] = useState('');
    const [relationshipType, setRelationshipType] = useState('FRIEND');
    const [bidirectional, setBidirectional] = useState(false);
    const [commonRelations, setCommonRelations] = useState([]);
    const [shortestPath, setShortestPath] = useState([]);
    const [mutualInterests, setMutualInterests] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [showShortestPath, setShowShortestPath] = useState(false);
    const [showCommonRelations, setShowCommonRelations] = useState(false);
    const [showMutualInterests, setShowMutualInterests] = useState(false);
    const [relationships, setRelationships] = useState([]);
    const [elements, setElements] = useState([]);
    useEffect(() => {
        fetchUsers();
        fetchRelationships();
    }, []);
    useEffect(() => {
        if (selectedUser1 && selectedUser2) {
            axios.get(`http://localhost:3000/relationship/${selectedUser1}/${selectedUser2}`)
                .then(response => {
                    if (response.data.relationship) {
                        setRelationshipType(response.data.relationship);
                    } else {
                        setRelationshipType('');
                    }
                })
                .catch(error => console.error(error));
        }
        else {
            setRelationshipType('');
            setCommonRelations([]);
            setShortestPath([]);
            setMutualInterests([]);
            setShowCommonRelations(false);
            setShowShortestPath(false);
            setShowMutualInterests(false);
        }
    }, [selectedUser1, selectedUser2]);
    useEffect(() => {
        const nodes = users.map(user => ({ data: { id: user.name, name: user.name , age: user.age, location: user.location, interests: user.interests.join(', ') } }));
        const edges = relationships.map(rel => ({ data: { source: rel.user1, target: rel.user2, label: rel.type } }));
        setElements([...nodes, ...edges]);
    }, [users, relationships]);
    const fetchUsers = () => {
        axios.get('http://localhost:3000/users')
            .then(response => setUsers(response.data))
            .catch(error => console.error(error));
    };
    const fetchRelationships = () => {
        axios.get('http://localhost:3000/relationships')
            .then(response => setRelationships(response.data))
            .catch(error => console.error(error));
    };
    const findMutualInterests = () => {
        axios.get(`http://localhost:3000/mutual-interests/${selectedUser1}/${selectedUser2}`)
            .then(response => {
                setMutualInterests(response.data);
                setShowMutualInterests(true);
            })
            .catch(error => console.error(error));
    };
    // const sendMessage = () => {
    //     axios.post('http://localhost:3000/send-message', {
    //         sender: selectedUser1,
    //         receiver: selectedUser2,
    //         message: messageText
    //     })
    //         .then(() => {
    //             setMessageText('');
    //             fetchMessages();
    //         })
    //         .catch(error => console.error(error));
    // };
    // const fetchMessages = () => {
    //     axios.get(`http://localhost:3000/messages/${selectedUser1}/${selectedUser2}`)
    //         .then(response => setMessages(response.data))
    //         .catch(error => console.error(error));
    // };
    const searchUsers = () => {
        axios.get(`http://localhost:3000/search-users?query=${searchQuery}`)
            .then(response => setSearchResults(response.data))
            .catch(error => console.error(error));
    };
    const addUser = () => {
        axios.post('http://localhost:3000/add-user', {
            name: newUserName,
            age: newUserAge,
            location: newUserLocation,
            interests: newUserInterests
        })
            .then(response => {
                setUsers([...users, response.data]);
                setNewUserName('');
                setNewUserAge('');
                setNewUserLocation('');
                setNewUserInterests('');
            })
            .catch(error => console.error(error));
    };
    const deleteUser = (name) => {
        axios.delete(`http://localhost:3000/delete-user/${name}`)
            .then(response => {
                setUsers(users.filter(user => user.name !== name));
                console.log(response.data);
            })
            .catch(error => console.error(error));
    };
    const addRelationship = () => {
        axios.get(`http://localhost:3000/relationship/${selectedUser1}/${selectedUser2}`)
            .then(response => {
                if (response.data.relationship) {
                    axios.delete('http://localhost:3000/delete-relationship', {
                        data: { user1: selectedUser1, user2: selectedUser2, relationshipType, bidirectional }
                    })
                        .then(() => {
                            axios.post('http://localhost:3000/add-relationship', {
                                user1: selectedUser1,
                                user2: selectedUser2,
                                relationshipType,
                                bidirectional
                            })
                                .then(() => {
                                    setSelectedUser1('');
                                    setSelectedUser2('');
                                    setRelationshipType(null);
                                    fetchRelationships(); // Fetch relationships to update the graph
                                })
                                .catch(error => console.error(error));
                        })
                        .catch(error => console.error(error));
                } else {
                    axios.post('http://localhost:3000/add-relationship', {
                        user1: selectedUser1,
                        user2: selectedUser2,
                        relationshipType,
                        bidirectional
                    })
                        .then(() => {
                            setSelectedUser1('');
                            setSelectedUser2('');
                            setRelationshipType(null);
                            fetchRelationships(); // Fetch relationships to update the graph
                        })
                        .catch(error => console.error(error));
                }
            })
            .catch(error => console.error(error));
    };
    const deleteRelationship = () => {
        axios.delete('http://localhost:3000/delete-relationship',
            { data: { user1: selectedUser1, user2: selectedUser2, relationshipType, bidirectional } })
            .then(response => {
                console.log(response.data);
                fetchRelationships(); // Fetch relationships to update the graph
            })
            .catch(error => console.error(error));
    };
    const findCommonRelations = () => {
        axios.get(`http://localhost:3000/common-relations/${selectedUser1}/${selectedUser2}`)
            .then(response => {
                setCommonRelations(response.data)
                setShowCommonRelations(true);
    })
            .catch(error => console.error(error));
    };
    const findShortestPath = () => {
        axios.get(`http://localhost:3000/shortest-path/${selectedUser1}/${selectedUser2}`)
            .then(response => {
                    setShortestPath(response.data);
                    setShowShortestPath(true);
                })
            .catch(error => console.error(error));
    };
    return (
        <Container>
            <AppBar position="static">
                <Toolbar>
                    <Typography variant="h4">Social Network Analysis</Typography>
                </Toolbar>
            </AppBar>
            <Accordion>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography variant="h5">Add New User</Typography>
                </AccordionSummary>
                <AccordionDetails>
                    <TextField label="New User Name" value={newUserName} onChange={e => setNewUserName(e.target.value)} fullWidth margin="normal" />
                    <TextField label="Age" value={newUserAge} onChange={e => setNewUserAge(e.target.value)} fullWidth margin="normal" />
                    <TextField label="Location" value={newUserLocation} onChange={e => setNewUserLocation(e.target.value)} fullWidth margin="normal" />
                    <TextField label="Interests (comma separated)" value={newUserInterests} onChange={e => setNewUserInterests(e.target.value)} fullWidth margin="normal" />
                    <Button variant="contained" color="primary" onClick={addUser}>Add User</Button>
                </AccordionDetails>
            </Accordion>
            <Accordion>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography variant="h5">Users</Typography>
                </AccordionSummary>
                <AccordionDetails>
                    <List>
                        {users.map(user => (
                            <Accordion key={user.name}>
                                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                                    <Typography>{`${user.name} (${user.age})`}</Typography>
                                </AccordionSummary>
                                <AccordionDetails>
                                    <Typography>Miejsce zamieszkania: {user.location}</Typography>
                                    <Typography>Zainteresowania: {user.interests.join(', ')}</Typography>
                                    <Button variant="contained" color="secondary" onClick={() => deleteUser(user.name)}>Delete User</Button>
                                </AccordionDetails>
                            </Accordion>
                        ))}
                    </List>
                </AccordionDetails>
            </Accordion>
            <Accordion>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography variant="h5">Actions</Typography>
                </AccordionSummary>
                <AccordionDetails>
                    <div>
                        <Typography variant="h6">Search Users</Typography>
                        <TextField label="Search" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                                   fullWidth margin="normal"/>
                        <Button variant="contained" color="primary" onClick={searchUsers}>Search</Button>
                        <List>
                            {searchResults.map((user, index) => (
                                <ListItem key={index}>
                                    <ListItemText
                                        primary={`${user.name} (Age: ${user.age}, Location: ${user.location}, Interests: ${user.interests.join(', ')})`}/>
                                </ListItem>
                            ))}
                        </List>
                    </div>
                    <div>
                        <Typography variant="h6">Select Users</Typography>
                        <div>
                            <Select value={selectedUser1} onChange={e => setSelectedUser1(e.target.value)} fullWidth>
                                <MenuItem value=""><em>Select User</em></MenuItem>
                                {users.map(user => (
                                    <MenuItem key={user.name} value={user.name}>{user.name}</MenuItem>
                                ))}
                            </Select>
                        </div>
                        <div>
                            <Select value={selectedUser2} onChange={e => setSelectedUser2(e.target.value)} fullWidth
                                    disabled={!selectedUser1}>
                                <MenuItem value=""><em>Select User</em></MenuItem>
                                {users.filter(user => user.name !== selectedUser1).map(user => (
                                    <MenuItem key={user.name} value={user.name}>{user.name}</MenuItem>
                                ))}
                            </Select>
                        </div>
                        {selectedUser1 && selectedUser2 && (
                        <div>
                            <Select value={relationshipType} onChange={e => setRelationshipType(e.target.value)}
                                    fullWidth>
                                <MenuItem value=""><em>Select Relationship</em></MenuItem>
                                <MenuItem value="FRIEND">Friend</MenuItem>
                                <MenuItem value="FAMILY_MEMBER">Family Member</MenuItem>
                                <MenuItem value="COLLEAGUE">Colleague</MenuItem>
                                <MenuItem value="PEER">Peer</MenuItem>
                                <MenuItem value="LOVER">Lover</MenuItem>
                            </Select>
                        </div>
                        )}
                    </div>
                    {selectedUser1 && selectedUser2 && (
                    <div>
                        <FormControlLabel
                            control={<Checkbox checked={bidirectional}
                                               onChange={e => setBidirectional(e.target.checked)}/>}
                            label="Bidirectional"
                        />
                        <Button variant="contained" color="primary" onClick={addRelationship}>Create
                            Relationship</Button>
                        <Button variant="contained" color="secondary" onClick={deleteRelationship}>Delete
                            Relationship</Button>
                    </div>
                    )}

                        <>
                        {selectedUser1 && selectedUser2 && (
                            <div>
                                <Button variant="contained" color="primary" onClick={findCommonRelations}>Find Common Relations</Button>
                                <Button variant="contained" color="primary" onClick={findShortestPath}>Find Shortest Path</Button>
                                <Button variant="contained" color="primary" onClick={findMutualInterests}>Find Mutual Interests</Button>
                            </div>
                        )}
                            {showMutualInterests && (
                                <div>
                                    <Typography variant="h6">Mutual Interests</Typography>
                                    <List>
                                        {mutualInterests.map((interest, index) => (
                                            <ListItem key={index}>
                                                <ListItemText primary={interest} />
                                            </ListItem>
                                        ))}
                                    </List>
                                </div>
                            )}
                            {showCommonRelations && (
                            <div>
                                <Typography variant="h6">Common Relations</Typography>
                                <List>
                                    {commonRelations.map((relation, index) => (
                                        <ListItem key={index}>
                                            <ListItemText primary={`${relation.commonUser}: ${selectedUser1} is a ${relation.user1Relation}, ${selectedUser2} is a ${relation.user2Relation}`} />
                                        </ListItem>
                                    ))}
                                </List>
                            </div>
                            )}
                            {showShortestPath && (
                                <div>
                                    <Typography variant="h6">Shortest Path</Typography>
                                    <List>
                                        {shortestPath.map((segment, index) => (
                                            <ListItem key={index}>
                                                <ListItemText primary={`${segment.start} -[${segment.type}]-> ${segment.end}`} />
                                            </ListItem>
                                        ))}
                                    </List>
                                </div>
                            )}
                        </>
                </AccordionDetails>
            </Accordion>
            <Accordion>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography variant="h5">Graph Visualization</Typography>
                </AccordionSummary>
                <AccordionDetails>
                    <Graph elements={elements}/>
                </AccordionDetails>
            </Accordion>
        </Container>
    );
};
export default App;