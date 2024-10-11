const express = require('express');
const neo4j = require('neo4j-driver');
const bodyParser = require('body-parser');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());

const URL = 'neo4j+s://b5e9126b.databases.neo4j.io';
const USER = 'neo4j';
const PASSWORD = 'tl6EmVne1kc2Oo7aZkA3G_WVz3Ni_pgho-p-Iuof9YY';
const driver = neo4j.driver(URL, neo4j.auth.basic(USER, PASSWORD));

app.use((req, res, next) => {
    console.log(`${req.method} ${req.url}`);
    const originalSend = res.send;
    res.send = function (body) {
        console.log(`Response: ${res.statusCode} ${body}`);
        originalSend.call(this, body);
    };
    next();
});
app.use(async (req, res, next) => {
    const session = driver.session();
    req.neo4jSession = session;
    req.tx = session.beginTransaction();

    res.on('finish', async () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
            await req.tx.commit();
        } else {
            await req.tx.rollback();
        }
        await session.close();
    });

    next();
});
app.post('/add-user', async (req, res) => {
    const { name, age, location, interests } = req.body;
    try {
        const result = await req.tx.run(
            'CREATE (u:User {name: $name, age: $age, location: $location, interests: $interests}) RETURN u',
            { name, age, location, interests: interests.split(',').map(interest => interest.trim()) }
        );
        res.json(result.records[0].get('u').properties);
    } catch (error) {
        res.status(500).send(error);
    }
});
app.post('/add-relationship', async (req, res) => {
    const { user1, user2, relationshipType, bidirectional } = req.body;

    if (user1 === user2) {
        return res.status(400).send('A user cannot have a relationship with themselves');
    }

    try {
        const checkQuery = `
            MATCH (u1:User {name: $user1})-[r]->(u2:User {name: $user2})
            RETURN r
        `;
        const checkResult = await req.tx.run(checkQuery, { user1, user2 });

        if (checkResult.records.length > 0) {
            return res.status(400).send('A relationship already exists between these users');
        }

        let query = `MATCH (u1:User {name: $user1}), (u2:User {name: $user2}) CREATE (u1)-[:${relationshipType}]->(u2)`;
        if (bidirectional) {
            query += `, (u2)-[:${relationshipType}]->(u1)`;
        }
        query += ' RETURN u1, u2';
        const result = await req.tx.run(query, { user1, user2 });
        res.json({
            user1: result.records[0].get('u1').properties,
            user2: result.records[0].get('u2').properties
        });
    } catch (error) {
        res.status(500).send(error);
    }
});
app.get('/users', async (req, res) => {
    try {
        const result = await req.tx.run('MATCH (u:User) RETURN u');
        res.json(result.records.map(record => record.get('u').properties));
    } catch (error) {
        res.status(500).send(error);
    }
});
app.get('/relationship/:user1/:user2', async (req, res) => {
    const { user1, user2 } = req.params;
    try {
        const result = await req.tx.run(
            `
            MATCH (u1:User {name: $user1})-[r]->(u2:User {name: $user2})
            RETURN type(r) as relationship
            `,
            { user1, user2 }
        );
        const relationship = result.records.length > 0 ? result.records[0].get('relationship') : null;
        res.json({ relationship });
    } catch (error) {
        res.status(500).send(error);
    }
});
app.get('/common-relations/:user1/:user2', async (req, res) => {
    const { user1, user2 } = req.params;
    try {
        const result = await req.tx.run(
            `
            MATCH (u1:User {name: $user1})-[r1]->(common:User)<-[r2]-(u2:User {name: $user2})
            RETURN common, type(r1) as relation1, type(r2) as relation2
            `,
            { user1, user2 }
        );

        const commonRelations = result.records.map(record => ({
            commonUser: record.get('common').properties.name,
            user1Relation: record.get('relation1'),
            user2Relation: record.get('relation2')
        }));

        res.json(commonRelations);
    } catch (error) {
        res.status(500).send(error);
    }
});
app.get('/mutual-interests/:user1/:user2', async (req, res) => {
    const { user1, user2 } = req.params;
    try {
        const result = await req.tx.run(
            `
            MATCH (u1:User {name: $user1}), (u2:User {name: $user2})
            RETURN apoc.coll.intersection(u1.interests, u2.interests) AS mutualInterests
            `,
            { user1, user2 }
        );
        res.json(result.records[0].get('mutualInterests'));
    } catch (error) {
        res.status(500).send(error);
    }
});
app.get('/search-users', async (req, res) => {
    const { query } = req.query;
    try {
        const result = await req.tx.run(
            `
            MATCH (u:User)
            WHERE u.name CONTAINS $query OR u.location CONTAINS $query OR ANY(interest IN u.interests WHERE interest CONTAINS $query)
            RETURN u
            `,
            { query }
        );
        res.json(result.records.map(record => record.get('u').properties));
    } catch (error) {
        res.status(500).send(error);
    }
});
app.get('/relationships', async (req, res) => {
    try {
        const result = await req.tx.run(
            'MATCH (u1:User)-[r]->(u2:User) RETURN u1.name AS user1, u2.name AS user2, type(r) AS type'
        );
        const relationships = result.records.map(record => ({
            user1: record.get('user1'),
            user2: record.get('user2'),
            type: record.get('type')
        }));
        res.json(relationships);
    } catch (error) {
        res.status(500).send(error);
    }
});
app.get('/shortest-path/:user1/:user2', async (req, res) => {
    const { user1, user2 } = req.params;
    try {
        const result = await req.tx.run(
            'MATCH (u1:User {name: $user1}), (u2:User {name: $user2}), p = shortestPath((u1)-[*]-(u2)) RETURN p',
            { user1, user2 }
        );
        const segments = result.records[0]?.get('p').segments.map(segment => ({
            start: segment.start.properties.name,
            end: segment.end.properties.name,
            type: segment.relationship.type
        })) || [];
        res.json(segments);
    } catch (error) {
        res.status(500).send(error);
    }
});
app.delete('/delete-user/:name', async (req, res) => {
    const { name } = req.params;
    try {
        await req.tx.run(
            `
            MATCH (u:User {name: $name})
            DETACH DELETE u
            `,
            { name }
        );
        res.status(200).send('User deleted');
    } catch (error) {
        res.status(500).send(error);
    }
});
app.delete('/delete-relationship', async (req, res) => {
    const { user1, user2, relationshipType, bidirectional } = req.body;

    if (user1 === user2) {
        return res.status(400).send('A user cannot unfriend themselves');
    }

    try {
        let query = `MATCH (u1:User {name: $user1})-[r:${relationshipType}]->(u2:User {name: $user2}) DELETE r`;
        if (bidirectional) {
            query += ` WITH u1, u2 MATCH (u2)-[r:${relationshipType}]->(u1) DELETE r`;
        }
        await req.tx.run(query, { user1, user2 });
        res.status(200).send('Relationship deleted');
    } catch (error) {
        res.status(500).send(error);
    }
});
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});