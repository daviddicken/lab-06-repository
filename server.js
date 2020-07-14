'use strict';

const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());

const weatherArray = [];
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`listening 0n ${PORT}`);
});

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

//==========================================
app.get('/weather', (request, response) => {

  let weatherData = require('./data/weather.json');

  weatherData.data.forEach(day => {
    new Weather(day);
  });
  response.send(weatherArray);
});

function Weather(weatherInfo)
{
  this.forecast = weatherInfo.weather.description;
  this.time = new Date(weatherInfo.valid_date).toDateString();
  weatherArray.push(this);
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
