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
      console.log(response.data.errors);
      console.log('cypher success');
    })
    .catch((error) => { console.log(error) });
}

async function importParliaments(dataset, uuid) {
  const statement = `WITH {json} as data
  UNWIND data.parliaments as parliament

  MERGE (p:Parliament {
    uuid: parliament.meta.uuid
  })
  ON CREATE SET p.name = parliament.name
  `;

  return await cypher({
    statements: [{
      statement: statement,
      parameters: { json: requireJSON(__dirname + '/crawled-' + dataset + '/parliaments.json') }
    }]
  })
}

async function importCommittees(dataset, uuid) {
  const statement = `WITH {json} as data
  UNWIND data.committees as committee

  MATCH (p:Parliament {uuid: '60d0787f-e311-4283-a7fd-85b9f62a9b33' })
  // MATCH (p:Parliament {uuid: {uuid} })

  MERGE (com:Committee {uuid: committee.committee.meta.uuid})
  ON CREATE SET
    com.title = committee.committee.title,
    com.summary = committee.committee.summary
  MERGE (com)-[:BELONGS_TO]->(p)

  FOREACH(topic in committee.committee.meta.topics |
    MERGE (nodeTopic:Topic {name: topic})
    MERGE (nodeTopic)<-[:HAS_TOPIC]-(com)
  )

  RETURN com
  `;

  return await cypher({
    statements: [{
      statement: statement,
      parameters: {
        json: requireJSON(__dirname + '/crawled-' + dataset + '/committees.json'),
        uuid: uuid
      }
    }]
  })
}

async function importDeputies(dataset, uuid) {
  const directory = __dirname + '/crawled-' + dataset;

  const statement = `WITH {json} as data
  UNWIND data.profile as deputy

  // create deputy
  MERGE (d:Deputy {uuid: deputy.meta.uuid})
  ON CREATE SET
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
  MERGE (d)-[:IS_MEMBER_OF {
    name: parliament.name,
    uuid: parliament.uuid
  }]->(party)
  WITH d, deputy, party

  MATCH (parliament:Parliament {uuid: deputy.parliament.uuid})
  MERGE (party)-[:BELONGS_TO]->(parliament)

  FOREACH (committee IN deputy.committees |
    MERGE (com:Committee {uuid: committee.uuid})
    // SET com.name = committee.name
    MERGE (d)-[:IS_COMITTEE_MEMBER_OF {
      role: committee.role
    }]->(com)
    // MERGE (comrole:CommitteeRole {name: committee.role})
    // MERGE (d)-[:HAS_COMMITTEE_ROLE]-(comrole)-[:IS_COMITTEE_MEMBER_OF]->(com)
  )

  FOREACH (sidejob IN deputy.sidejobs |
    //  {
    // 		meta: {
    // 			uuid: "210f6776-2863-429e-82af-bd88e72a21f6",
    // 			topics: ["Raumordnung, Bau- und Wohnungswesen", "Wirtschaft"]
    // 		},
    // 		organization: "Deutschland baut! e.V.",
    // 		job: "Beratung",
    // 		job_category: null,
    // 		income: {
    // 			total_min: 7000,
    // 			total_max: 15000,
    // 			date: "2017-10-24",
    // 			classification: "3",
    // 			interval: "einmalig"
    // 		}
    // 	}
    MERGE (organization:Organization {name: sidejob.organization})
    // MERGE (sj:DeputySidejob {uuid: sidejob.meta.uuid})
    // SET
    //  sj.name = sidejob.job, // TODO (node)
      // sj.organization = sidejob.organization // TODO (node)
      // TODO income -> (classification:node)
    //  sj.paid = CASE WHEN exists(sidejob.income) THEN true ELSE false END

    MERGE (d)-[:HAS_SIDEJOB {
      job: CASE WHEN sidejob.job IS NULL THEN '' ELSE sidejob.job END,
      job_category: CASE WHEN sidejob.job_category IS NULL THEN '' ELSE sidejob.job_category END,
      paid: CASE WHEN exists(sidejob.income) THEN true ELSE false END,
      interval: CASE WHEN exists(sidejob.income) THEN sidejob.income.interval ELSE false END
    }]->(organization)

    FOREACH(topic in sidejob.meta.topics |
      MERGE (nodeTopic:Topic {name: topic})
      MERGE (d)-[:HAS_SIDEJOB_TOPIC]->(nodeTopic)-[:HAS_SIDEJOB_TOPIC_FOR]->(organization)
    )
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

async function startImport(dataset, uuid) {
  await importParliaments(dataset, uuid);

  await importCommittees(dataset, uuid);

  await importDeputies(dataset, uuid);
}

startImport('bundestag', '60d0787f-e311-4283-a7fd-85b9f62a9b33');
startImport('bundestag-2013-2017', '42a23be2-83d8-4b71-a9fe-6470c4bf2531');
