'use strict';

const weatherArray = [];
const express = require('express');
const cors = require('cors');
const { request, response } = require('express');
require('dotenv').config();

const app = express();
app.use(cors());

const PORT = process.env.PORT || 3001;
app.listen(PORT);
// , () => {
// console.log(`listening 0n ${PORT}`);
// });

app.get('/location', (request, response) => {
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

//console.log('outside everything');
// let weatherData = require('./data/weather.json');

// weatherData.data.forEach(day => {
//   new Weather(day);
// });

// console.log(weatherArray);
// const obj = new Weather(weatherData);

// console.log('obj:',obj)
// console.log('weatherdata:',weatherData);
// console.log('[0]:',weatherData.data[0].weather.description);


//==========================================
app.get('/weather', (request, response) => {

  let weatherData = require('./data/weather.json');

  weatherData.data.forEach(day => {
    new Weather(day);
  });
  response.send(weatherArray);
});

//     "forecast": "Partly cloudy until afternoon.",
//     "time": "Mon Jan 01 2001"
function Weather(weatherInfo)
{
  this.forecast = weatherInfo.weather.description;
  this.time = weatherInfo.valid_date;

  // let a = weatherInfo.valid_date;
  // b = a.split(' ');
  // let newDateString = `${b[0]} ${b[1]} ${b[2]} ${b[3]}`;
  // this.time = newDateString;
  weatherArray.push(this);
}

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





// response.status(200).send(weatherArray);

app.get('*', (request, response) => {

  response.status(404).send('Page not Found');
});
