'use strict';

const express = require('express');
const cors = require('cors');
const superagent = require('superagent');
const app = express();
require('dotenv').config();

app.use(cors());

const PORT = process.env.PORT || 3001;

app.listen(PORT, () =>
{
  console.log(`listening 0n ${PORT}`);
});

let lattitude;
let longitude;

//========= location ==================
app.get('/location', handler);

function handler(req, res)
{
  let city = req.query.city;
  let url = 'https://us1.locationiq.com/v1/search.php';

  let queryParams = {
    key: process.env.GEOCODE_API_KEY,
    q: city,
    format: 'json',
    limit: 1
  }

  superagent.get(url).query(queryParams).then(results =>
  {
    let locData = results.body[0];
    const obj = new Location(city, locData);
    res.send(obj);

  }).catch((error)=> {
    console.log('ERROR:', error);
    res.status(500).send('There has been an error.. RUN!!!');
  });
}

//================= Weather ================
app.get('/weather', (req, res) =>
{
  let city = req.query.search_query;
  let url = 'http://api.weatherbit.io/v2.0/forecast/daily';

  let queryParams =
  {
    key: process.env.WEATHER_API_KEY,
    city: city,
    days: 8
  }

  superagent.get(url).query(queryParams).then(day =>
  {
    const newWeatherArr = day.body.data.map(anotherDay =>
    {
      return new Weather(anotherDay);
    });
    res.send(newWeatherArr);

  }).catch((error)=> {
    console.log('ERROR:', error);
    res.status(500).send('There has been an error.. Rain!!!');
  });
});

//================= trails =====================
app.get('/trails', hiking);

function hiking(req, res)
{
  let url = 'https://www.hikingproject.com/data/get-trails'

  let queryParams =
  {
    key: process.env.TRAIL_API_KEY,
    lat: lattitude,
    lon: longitude,
    maxResults: 10,
    format: 'json'
  }

  superagent.get(url).query(queryParams).then(hikes =>
  {
    const outdoors = hikes.body.trails.map(fun =>
    {
      return new Trails(fun);
    })
    res.send(outdoors);

  }).catch((error)=> {
    console.log('ERROR:', error);
    res.status(500).send('There has been an error.. Hike!!!');
  });
}

//==============================================
function Trails(nature)
{
  this.name = nature.name;
  this.location = nature.location;
  this.length = nature.length;
  this.stars = nature.stars;
  this.star_votes = nature.starVotes;
  this.summary = nature.summary;
  this.trail_url = nature.url;
  this.conditions = nature.conditionDetails;
  let splitter = nature.conditionDate;
  splitter = splitter.split(' ');
  this.condition_date = splitter[0];
  this.condition_time = splitter[1];
}
//--------------------------------------

function Weather(info)
{
  this.forecast = info.weather.description;
  this.time = new Date(info.valid_date).toDateString();
}
//---------------------------------------

function Location(input, locData)
{
  this.search_query = input;
  this.formatted_query = locData.display_name;
  this.latitude = locData.lat;
  this.longitude = locData.lon;
  lattitude = locData.lat;
  longitude = locData.lon;
}

// res.status(200).send(weatherArray);

app.get('*', (req, res) => {
  res.status(404).send('Page not Found');
});
