WITH {
  committees: [
    {
	  committee: {
		  meta: {
			  uuid: "c0f8ef01-4f3c-41fe-bf7d-baa332e6135e",
			  edited: "2018-05-25 12:39",
			  topics: ["Medien, Kommunikation und Informationstechnik"]
			},
		  title: "Ausschuss Digitale Agenda",
		  summary: "Der Ausschuss \u0022Internet und digitale Agenda\u0022 widmet sich aktuellen netzpolitischen Themen. Aspekte der Digitalisierung und Vernetzung werden diskutiert, um den digitalen Wandel voranzutreiben."
		}
	}, {
	  committee: {
		  meta: {
			  uuid: "1195c03e-64ba-416b-a946-4f0b3fe0524b",
			  edited: "2018-05-07 15:52",
			  topics: ["Arbeit und Besch\u00e4ftigung", "Soziale Sicherung"]
			},
		  title: "Ausschuss f\u00fcr Arbeit und Soziales",
		  summary: "Der Ausschuss f\u00fcr Arbeit und Soziales behandelt grundlegend die Bereiche Erwerbsarbeit und soziale Sicherung. Als Beispiele seien hier genannt: die Hartz-Gesetze, der K\u00fcndigungsschutz, das Rentenalter und die Angleichung von Ost- und Westl\u00f6hnen sowie Staatszuwendungen und die Bek\u00e4mpfung von Schwarzarbeit."
		}
	}]
}
 as data
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
