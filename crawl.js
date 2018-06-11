const axios = require('axios');
const fs = require('fs');

const URLS = {
  parliaments: 'https://www.abgeordnetenwatch.de/api/parliaments.json',
  baseParliament: 'https://www.abgeordnetenwatch.de/api/parliament'
};

const FILESTACK = [];

async function getJSON(resource, comparator, dataProperty) {
  FILESTACK.push(resource);
  try {
    const response = await axios.get(resource);
    const remoteData = response.data[dataProperty];

    if (dataProperty === 'parliaments') {
      return await remoteData.find(parliament => parliament.name === comparator);
    } else {
      return remoteData;
    }
  } catch (error) {
    console.log(error);
  }
}

async function startCrawl(rootParliament, normalizeFolderdName) {
  // const responseParliament = await getJSON(URLS.parliaments, rootParliament, 'parliaments');
  const responseParliamentRemote = await require('./crawled-bundestag/parliaments.json').parliaments;
  const responseParliament = await responseParliamentRemote.find(parliament => parliament.name === 'Bundestag');

  for (let [key, value] of Object.entries(responseParliament.datasets)) {
    /*if (value['by-uuid'].includes('deputies')) { // debuties
      const profilesResponse = await getJSON(value['by-uuid'], '*', 'profiles');

      for (let profile of profilesResponse) {
        const parliamentUUID = profile.parliament.uuid;
        const username = profile.meta.username;

        // example url
        // // https://www.abgeordnetenwatch.de/api/parliament/60d0787f-e311-4283-a7fd-85b9f62a9b33/profile/peter-ramsauer/profile.json
        FILESTACK.push(`${URLS.baseParliament}/${parliamentUUID}/profile/${username}/profile.json`);
      }
    }*/

    if (value['by-uuid'].includes('committees')) { // committees
      console.log(value['by-uuid']);
      FILESTACK.push(value['by-uuid']);
    }
  }

  console.log('=== FILESTACK count ===')
  console.log(FILESTACK.length);

  const dirname = __dirname + '/crawled-' + normalizeFolderdName;
  if (!fs.existsSync(dirname)){
    fs.mkdirSync(dirname);
  }
  fs.writeFileSync(dirname + '/wget_todo.txt', FILESTACK.join('\n'));
}

startCrawl('Bundestag', 'bundestag');
