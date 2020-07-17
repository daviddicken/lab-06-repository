'use strict';
//------ Libraries ---------------
const express = require('express'); 
const superagent = require('superagent');
const cors = require('cors');
const pg = require('pg');
require('dotenv').config();

//------ Global Variables ------
const PORT = process.env.PORT || 3001;
const app = express();
const client = new pg.Client(process.env.DATABASE_URL)

//------ Middleware -----------
app.use(cors());

//----- Listen for error -----
client.on('error', err =>
{
  console.log('Error was:', err)
})

//------- Listeners ------------
app.get('/location', locHandler);
app.get('/weather', weatherHandler);
app.get('/trails', hiking);
app.get('/movies', movieHandler);
app.get('/yelp', yelpHandler);

//-------- Functions -----------

//======== Location ============
function locHandler(req, res)
{
  let city = req.query.city; // input from user
  let searchString = 'SELECT * FROM cities WHERE search_query=$1;'; //string to search db
  let safeValues = [city];
  // combine string with safe values and run string
  client.query(searchString, safeValues).then(place =>
  {
    // Got some amazing help from Chance here:
    //if match is found item will be returned and rowCount will be 1 else 0
    if(place.rowCount > 0)
    {
      res.status(200).send(place.rows[0]); // send found data back to client
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

//======== Weather =============
function weatherHandler(req, res)
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
}
//======== Trails ==============
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

//======= Movies ==================

function movieHandler(req, res)
{
  //console.log('movie request==========', req)
  let url = 'https://api.themoviedb.org/3/movie/top_rated';
  let queryParams=
  {
    api_key: process.env.MOVIE_API_KEY,
    //total_results: 10, //don't think these two are working
    format: 'json',
  }

  superagent.get(url).query(queryParams).then(list =>
  {
    const movieList = list.body.results.map(mov =>
    {
      return new Movies(mov);
    }).catch((error)=> {
      console.log('ERROR:', error);
      res.status(500).send('There has been an error.. Catch a movie while we fix it!!!');
    });

    res.send(movieList);

  })
}

//========== Yelp =================
function yelpHandler(req, res)
{
  let url = 'https://api.yelp.com/v3/businesses/search';
  let queryParams=
  {
    
  }

}

//====== add object to database ===
// make dynamic and pass in obj, tableName with search query string ... nevermind
function adder(obj)
{
  let sql = 'INSERT INTO cities (search_query, formatted_query, latitude, longitude) VALUES ($1, $2, $3, $4);';
  let safeValues = [obj.search_query, obj.formatted_query, obj.latitude, obj.longitude];

  client.query(sql, safeValues);
}

//------- Consructors ---------
function Movies(list)
{
  this.title = list.title;
  this.overview = list.overview;
  this.average_votes = list.vote_average;
  this.total_votes = list.vote_count;
  let path = 'https://image.tmdb.org/t/p/w500';
  this.image_url = `${path}${list.poster_path}`;
  this.popularity = list.popularity;
  this.released_on = list.released_on;
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

client.connect().then(() => // connect to database
{
  app.listen(PORT, () => console.log(`listening 0n ${PORT}`)); //open port
}).catch(err => console.log('Error connecting:', err))
