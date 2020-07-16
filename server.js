'use strict';

const express = require('express');
const cors = require('cors');
const superagent = require('superagent');
const app = express();
require('dotenv').config();
const pg = require('pg');
//---------------------------------------
const client = new pg.Client(process.env.DATABASE_URL)
client.on('error', err =>
{
  console.log('Error was:', err)
})

//---------------------------------------
app.use(cors());

const PORT = process.env.PORT || 3001;

client.connect().then(() =>
{
  app.listen(PORT, () => console.log(`listening 0n ${PORT}`));
}).catch(err => console.log('Error connecting:', err))

// rewrite and remove these variables
let lattitude;
let longitude;

//========= add to database ==========
// app.get('/add', adder)

function adder(obj)
{
  let search_query = obj.search_query;
  let formatted_query = obj.formatted_query;
  let lat = obj.latitude;
  let lon = obj.longitude;

  let sql = 'INSERT INTO cities (city, formatted_query, lattitude, longitude) VALUES ($1, $2, $3, $4);';
  let safeValues = [search_query, formatted_query, lat, lon];

  client.query(sql, safeValues);
}

//========= location ==================
app.get('/location', handler);

function handler(req, res)
{
  let city = req.query.city; // input from user valid city


  let searchString = 'SELECT * FROM cities WHERE search_query=$1;'; //if broken change back to city
  let safeValues = [city];

  client.query(searchString, safeValues).then(place =>
  {
    console.log('place......', place);

    if(place.rowCount > 0){
      res.send(place.rows[0]);

    }else{

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
        adder(obj);
        res.send(obj);

      }).catch((error)=> {
        console.log('ERROR:', error);
        res.status(500).send('There has been an error.. RUN!!!');
      });
    }
  })
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
