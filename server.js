'use strict';

const express = require('express'); //    add dependencies
const superagent = require('superagent');
const cors = require('cors');
const pg = require('pg');
require('dotenv').config();
const PORT = process.env.PORT || 3001; // set port in var
const app = express(); //       put express in var to access
const client = new pg.Client(process.env.DATABASE_URL) // setup database
app.use(cors()); //             turn on cors

client.on('error', err =>
{
  console.log('Error was:', err)
})

client.connect().then(() => // connect to database
{
  app.listen(PORT, () => console.log(`listening 0n ${PORT}`)); //open port
}).catch(err => console.log('Error connecting:', err))



//========= location ==================
app.get('/location', handler);

function handler(req, res)
{
  let city = req.query.city; // input from user
  let searchString = 'SELECT * FROM cities WHERE search_query=$1;'; //string to search db
  let safeValues = [city]; // safeValues
//                        // combine string with safe values and run string
  client.query(searchString, safeValues).then(place =>
  {
    // Got some amazing help from Chance here:
    //if match is found item will be returned and rowCount will be 1 else 0
    if(place.rowCount > 0)
    {
      res.send(place.rows[0]); // send found data back to client
    }else
    {
      let url = 'https://us1.locationiq.com/v1/search.php'; //api url

      let queryParams = // query parameters
      {
        key: process.env.GEOCODE_API_KEY,
        q: city,
        format: 'json',
        limit: 1
      }
      // combine url with query parameters then proccess data returned
      superagent.get(url).query(queryParams).then(results =>
      {
        let locData = results.body[0]; //grab section needed from obj
        const obj = new Location(city, locData); // create new obj with data
        adder(obj); // add new data to db
        res.send(obj); // return data to client

      }).catch((error)=>{
        console.log('ERROR:', error);
        res.status(500).send('There has been an error.. RUN!!!');
      });
    }
  }).catch((err) =>{
    console.log('Error:', err);
    res.status(500).send('There has been a error in the query...');
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
    lat: req.query.latitude,
    lon: req.query.longitude,
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
//--------------------------------
// function to add info from api to the table
function adder(obj) // pass in object created by Location creator
{ //                   set data from object to variables
  let search_query = obj.search_query;
  let formatted_query = obj.formatted_query;
  let lat = obj.latitude;
  let lon = obj.longitude;
  //                        string to add data to db
  let sql = 'INSERT INTO cities (search_query, formatted_query, latitude, longitude) VALUES ($1, $2, $3, $4);';
  let safeValues = [search_query, formatted_query, lat, lon]; // safeValues

  client.query(sql, safeValues); // merge safeValues and 'sql' string then run string command
}

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
}

// res.status(200).send(weatherArray);

app.get('*', (req, res) => {
  res.status(404).send('Page not Found');
});
