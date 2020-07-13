'use strict';

const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());

const PORT = process.env.PORT || 3001;
app.listen(PORT);
// , () => {
// console.log(`listening 0n ${PORT}`);
// });

app.get('/location', (request, response) => {
  console.log
  try{

    let city = request.query.city;
    let locData = require('./data/location.json');
    const obj = new Location(city, locData);

    response.send(obj);

  }catch(error)
  {
    console.log('ERROR:', error);
    response.status(500).send('There has been an error.. RUN!!!');
  }
})

function Location(input, locData)
{
  this.search_query = input;
  this.formatted_query = locData[0].display_name;
  this.latitude = locData[0].lat;
  this.longitude = locData[0].lon;
}

// {
//   "search_query": "seattle",
//   "formatted_query": "Seattle, WA, USA",
//   "latitude": "47.606210",
//   "longitude": "-122.332071"
// }





//response.status(200).send(array); ????

app.get('*', (request, response) => {

  response.status(404).send('Page not Found');
});
