const axios = require('axios');
const fs = require('fs');

const neo4jUrl = 'http://localhost:7474/db/data/transaction/commit';

var requireJSON = function (filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
};

async function cypher(params) {
  return await axios.post(neo4jUrl, params, {
    auth: {
      username: 'neo4j',
      password: 'admin'
    },
    headers: {
      'Accept': 'application/json; charset=UTF-8',
      'Content-Type': 'application/json'
    }
  })
    .then((response) => {
      console.log('cypher success');
    })
    .catch((error) => { console.log(error) });
}

async function importParliaments(dataset) {
  const statement = `WITH {json} as data
  UNWIND data.parliaments as parliament

  // create parliaments
  MERGE (p:Parliament {uuid: parliament.meta.uuid})
  ON CREATE SET p.name = parliament.name, p.uuid = parliament.meta.uuid`;

  return await cypher({
    statements: [{
      statement: statement,
      parameters: { json: requireJSON(__dirname + '/crawled-' + dataset + '/parliaments.json') }
    }]
  })
}

async function importDeputies(dataset) {
  const directory = __dirname + '/crawled-' + dataset;

  const statement = `WITH {json} as data
  UNWIND data.profile as deputy

  // create deputy
  MERGE (d:Deputy {username: deputy.meta.username})
  SET
  // ON CREATE SET
    d.username = deputy.meta.username,
    d.first_name = deputy.personal.first_name,
    d.last_name = deputy.personal.last_name,
    d.full_name = deputy.personal.first_name + ' ' + deputy.personal.last_name

  WITH d, deputy
  // get parliament and assign
  MATCH (parliament:Parliament {uuid: deputy.parliament.uuid})
  MERGE (d)-[:DEPUTY_IN]->(parliament)

  // create party
  MERGE (party:Party {name: deputy.party})
  SET party.name = deputy.party

  MERGE (d)-[:IS_MEMBER_OF]->(party)
  WITH d, deputy, party

  MATCH (parliament:Parliament {uuid: deputy.parliament.uuid})
  MERGE (party)-[:BELONGS_TO]->(parliament)

  FOREACH (committee IN deputy.committees |
    MERGE (com:ParliamentCommittee {uuid: committee.uuid})
    SET com.name = committee.name
    MERGE (d)-[:IS_COMITTEE_MEMBER_OF {
      role: committee.role
    }]->(com)
    // MERGE (comrole:CommitteeRole {name: committee.role})
    // MERGE (d)-[:HAS_COMMITTEE_ROLE]-(comrole)-[:IS_COMITTEE_MEMBER_OF]->(com)
  )

  FOREACH (sidejob IN deputy.sidejobs |
    MERGE (organization:Organization {name: sidejob.organization})

    MERGE (d)-[:HAS_SIDEJOB {
      job: CASE WHEN sidejob.job IS NULL THEN '' ELSE sidejob.job END,
      job_category: CASE WHEN sidejob.job_category IS NULL THEN '' ELSE sidejob.job_category END,
      paid: CASE WHEN exists(sidejob.income) THEN true ELSE false END
    }]->(organization)
  )

  WITH d, deputy, party
  RETURN d
  `;

  try {
    const files = fs.readdirSync(directory);

    for (file of files) {
      if (file.includes('profile')) {
        await cypher({
          statements: [{
            statement: statement,
            parameters: { json: requireJSON(__dirname + '/crawled-' + dataset + '/' + file) }
          }]
        })
      }
    }
  } catch (error) {
    console.log(error);
  }

  return;
}

async function startImport(dataset) {
  await importParliaments(dataset);

  await importDeputies(dataset);
}

startImport('bundestag');
startImport('bundestag-2013-2017');
