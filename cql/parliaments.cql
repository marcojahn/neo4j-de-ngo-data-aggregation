WITH {
	parliaments: [
  {
    name: "Bundestag 2009-2013",
    meta: {uuid:"6aaf1687-ea28-4eca-be5d-946a849ba35f"},
    dates: {start:"2009-10-27",end:"2013-09-22",election:"2009-09-27"}
  },
  {
		name: "Bundestag",
		meta: {uuid: "60d0787f-e311-4283-a7fd-85b9f62a9b33"},
		dates: {
			start: "2017-07-20",
			end: "2021-10-23",
			election: "2017-09-24"
		}
	}]
} as data
UNWIND data.parliaments as parliament

// create parliaments
// MERGE (p:Parliament {uuid: parliament.meta.uuid})
// ON CREATE SET p.name = parliament.name, p.uuid = parliament.meta.uuid

  // create parliaments
  MERGE (p:Parliament {
    uuid: parliament.meta.uuid
  })
  ON CREATE SET p.name = parliament.name
  // ON MATCH SET p.name = parliament.name, p.uuid = parliament.meta.uuid

WITH p
RETURN p
