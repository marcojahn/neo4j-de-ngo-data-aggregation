// create using postman
// http://localhost:7474/db/data/schema/index/

CREATE CONSTRAINT ON (parliament:Parliament) ASSERT parliament.uuid IS UNIQUE;
CREATE CONSTRAINT ON (deputy:Deputy) ASSERT deputy.uuid IS UNIQUE;
CREATE CONSTRAINT ON (party:Party) ASSERT party.name IS UNIQUE;
CREATE CONSTRAINT ON (committee:Committee) ASSERT committee.uuid IS UNIQUE;
CREATE CONSTRAINT ON (topic:Topic) ASSERT topic.name IS UNIQUE;
