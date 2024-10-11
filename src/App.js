import React, { useState, useEffect, useCallback, lazy, Suspense } from 'react';
import './App.css';
import axios from 'axios';
import { Container, TextField, Button, Select, MenuItem, Checkbox, AppBar, Toolbar, FormControlLabel, Typography, List, ListItem, ListItemText, Accordion, AccordionSummary, AccordionDetails } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

const Graph = lazy(() => import('./Graph.js'));

const App = () => {
    const API_BASE_URL = 'https://calm-island-96715-e77cfe48716f.herokuapp.com';
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
    const [isGraphExpanded, setIsGraphExpanded] = useState(false);

    const fetchUsers = useCallback(() => {
        axios.get(`${API_BASE_URL}/users`)
            .then(response => setUsers(response.data))
            .catch(error => console.error(error));
    }, [API_BASE_URL]);

    const fetchRelationships = useCallback(() => {
        axios.get(`${API_BASE_URL}/relationships`)
            .then(response => setRelationships(response.data))
            .catch(error => console.error(error));
    }, [API_BASE_URL]);

    useEffect(() => {
        fetchUsers();
        fetchRelationships();
    }, [fetchUsers, fetchRelationships]);

    useEffect(() => {
        if (selectedUser1 && selectedUser2) {
            axios.get(`${API_BASE_URL}/relationship/${selectedUser1}/${selectedUser2}`)
                .then(response => {
                    if (response.data.relationship) {
                        setRelationshipType(response.data.relationship);
                    } else {
                        setRelationshipType('');
                    }
                })
                .catch(error => console.error(error));
        } else {
            setRelationshipType('');
            setCommonRelations([]);
            setShortestPath([]);
            setMutualInterests([]);
            setShowCommonRelations(false);
            setShowShortestPath(false);
            setShowMutualInterests(false);
        }
    }, [selectedUser1, selectedUser2, API_BASE_URL]);

    useEffect(() => {
        const nodes = users.map(user => ({ data: { id: user.name, name: user.name, age: user.age, location: user.location, interests: user.interests.join(', ') } }));
        const edges = relationships.map(rel => ({ data: { source: rel.user1, target: rel.user2, label: rel.type } }));
        setElements([...nodes, ...edges]);
    }, [users, relationships]);

    const findMutualInterests = useCallback(() => {
        axios.get(`${API_BASE_URL}/mutual-interests/${selectedUser1}/${selectedUser2}`)
            .then(response => {
                setMutualInterests(response.data);
                setShowMutualInterests(true);
            })
            .catch(error => console.error(error));
    }, [selectedUser1, selectedUser2, API_BASE_URL]);

    const searchUsers = useCallback(() => {
        axios.get(`${API_BASE_URL}/search-users?query=${searchQuery}`)
            .then(response => setSearchResults(response.data))
            .catch(error => console.error(error));
    }, [searchQuery, API_BASE_URL]);

    const addUser = useCallback(() => {
        axios.post(`${API_BASE_URL}/add-user`, {
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
    }, [newUserName, newUserAge, newUserLocation, newUserInterests, users, API_BASE_URL]);

    const deleteUser = useCallback((name) => {
        axios.delete(`${API_BASE_URL}/delete-user/${name}`)
            .then(response => {
                setUsers(users.filter(user => user.name !== name));
                console.log(response.data);
            })
            .catch(error => console.error(error));
    }, [users, API_BASE_URL]);

    const addRelationship = useCallback(() => {
        axios.get(`${API_BASE_URL}/relationship/${selectedUser1}/${selectedUser2}`)
            .then(response => {
                if (response.data.relationship) {
                    axios.delete(`${API_BASE_URL}/delete-relationship`, {
                        data: { user1: selectedUser1, user2: selectedUser2, relationshipType, bidirectional }
                    })
                        .then(() => {
                            axios.post(`${API_BASE_URL}/add-relationship`, {
                                user1: selectedUser1,
                                user2: selectedUser2,
                                relationshipType,
                                bidirectional
                            })
                                .then(() => {
                                    setSelectedUser1('');
                                    setSelectedUser2('');
                                    setRelationshipType(null);
                                    fetchRelationships();
                                })
                                .catch(error => console.error(error));
                        })
                        .catch(error => console.error(error));
                } else {
                    axios.post(`${API_BASE_URL}/add-relationship`, {
                        user1: selectedUser1,
                        user2: selectedUser2,
                        relationshipType,
                        bidirectional
                    })
                        .then(() => {
                            setSelectedUser1('');
                            setSelectedUser2('');
                            setRelationshipType(null);
                            fetchRelationships();
                        })
                        .catch(error => console.error(error));
                }
            })
            .catch(error => console.error(error));
    }, [selectedUser1, selectedUser2, relationshipType, bidirectional, fetchRelationships, API_BASE_URL]);

    const deleteRelationship = useCallback(() => {
        axios.delete(`${API_BASE_URL}/delete-relationship`, {
            data: { user1: selectedUser1, user2: selectedUser2, relationshipType, bidirectional }
        })
            .then(response => {
                console.log(response.data);
                fetchRelationships();
            })
            .catch(error => console.error(error));
    }, [selectedUser1, selectedUser2, relationshipType, bidirectional, fetchRelationships, API_BASE_URL]);

    const findCommonRelations = useCallback(() => {
        axios.get(`${API_BASE_URL}/common-relations/${selectedUser1}/${selectedUser2}`)
            .then(response => {
                setCommonRelations(response.data);
                setShowCommonRelations(true);
            })
            .catch(error => console.error(error));
    }, [selectedUser1, selectedUser2, API_BASE_URL]);

    const findShortestPath = useCallback(() => {
        axios.get(`${API_BASE_URL}/shortest-path/${selectedUser1}/${selectedUser2}`)
            .then(response => {
                setShortestPath(response.data);
                setShowShortestPath(true);
            })
            .catch(error => console.error(error));
    }, [selectedUser1, selectedUser2, API_BASE_URL]);

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
                        <TextField label="Search" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} fullWidth margin="normal" />
                        <Button variant="contained" color="primary" onClick={searchUsers}>Search</Button>
                        <List>
                            {searchResults.map((user, index) => (
                                <ListItem key={index}>
                                    <ListItemText primary={`${user.name} (Age: ${user.age}, Location: ${user.location}, Interests: ${user.interests.join(', ')})`} />
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
                            <Select value={selectedUser2} onChange={e => setSelectedUser2(e.target.value)} fullWidth disabled={!selectedUser1}>
                                <MenuItem value=""><em>Select User</em></MenuItem>
                                {users.filter(user => user.name !== selectedUser1).map(user => (
                                    <MenuItem key={user.name} value={user.name}>{user.name}</MenuItem>
                                ))}
                            </Select>
                        </div>
                        {selectedUser1 && selectedUser2 && (
                            <div>
                                <Select value={relationshipType} onChange={e => setRelationshipType(e.target.value)} fullWidth>
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
                            <FormControlLabel control={<Checkbox checked={bidirectional} onChange={e => setBidirectional(e.target.checked)} />} label="Bidirectional" />
                            <Button variant="contained" color="primary" onClick={addRelationship}>Create Relationship</Button>
                            <Button variant="contained" color="secondary" onClick={deleteRelationship}>Delete Relationship</Button>
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
            <Accordion expanded={isGraphExpanded} onChange={() => setIsGraphExpanded(!isGraphExpanded)}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography variant="h5">Graph Visualization</Typography>
                </AccordionSummary>
                <AccordionDetails>
                    {isGraphExpanded && (
                        <Suspense fallback={<div>Loading...</div>}>
                            <Graph elements={elements} />
                        </Suspense>
                    )}
                </AccordionDetails>
            </Accordion>
        </Container>
    );
};

export default App;