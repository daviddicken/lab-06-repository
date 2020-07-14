'use strict';

const express = require('express');
const app = express();
const cors = require('cors');
const superagent = require('superagent');
require('dotenv').config();

app.use(cors());

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`listening 0n ${PORT}`);
});



app.get('/location', handler);

function handler(req, res)
{
  let city = req.query.city;
  //let locData = require('./data/location.json');
  let url = 'https://us1.locationiq.com/v1/search.php';

  let queryParams = {
    key: process.env.GEOCODE_API_KEY,
    q: city,
    format: 'json',
    limit: 1
  }

  superagent.get(url).query(queryParams).then(results => {
    let locData = results.body;
    const obj = new Location(city, locData);
    res.send(obj);
  }).catch((error)=> {
    console.log('ERROR:', error);
    res.status(500).send('There has been an error.. RUN!!!');
  });
}
//==========================================
app.get('/weather', (request, response) => {

  let weatherData = require('./data/weather.json');

  const newWeatherArr = weatherData.data.map(day => {
    return new Weather(day);
  })
  response.send(newWeatherArr);
});

function Weather(weatherInfo)
{
  this.forecast = weatherInfo.weather.description;
  this.time = new Date(weatherInfo.valid_date).toDateString();
}

function Location(input, locData)
{
  this.search_query = input;
  this.formatted_query = locData[0].display_name;
  this.latitude = locData[0].lat;
  this.longitude = locData[0].lon;
}

// response.status(200).send(weatherArray);

app.get('*', (request, response) => {

  response.status(404).send('Page not Found');
});
