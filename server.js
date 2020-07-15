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

  superagent.get(url).query(queryParams).then(results => {
    //console.log('result***', results.body[0].lat);
    let locData = results.body[0];
    const obj = new Location(city, locData);
    res.send(obj);
  }).catch((error)=> {
    console.log('ERROR:', error);
    res.status(500).send('There has been an error.. RUN!!!');
  });
}
// =============================================
//================= Weather =========================
app.get('/weather', (req, res) =>
{

  //console.log('rep.querry....',req.query);
  let city = req.query.search_query;

  let url = 'http://api.weatherbit.io/v2.0/forecast/daily';

  let queryParams =
  {
    key: process.env.WEATHER_API_KEY,
    city: city,
    //format: 'json',
    days: 8
  }


  superagent.get(url).query(queryParams).then(day =>
  {
    //console.log('day**********', day.body.data[0].valid_date);
    const newWeatherArr = day.body.data.map(anotherDay =>
    {
      //console.log('DAY!!!!', anotherDay);
      return new Weather(anotherDay);
    });
    //console.log('weatherArrau@@@@@@@@@@..', newWeatherArr);
    res.send(newWeatherArr);
  });
});

function Weather(info)
{
  this.forecast = info.weather.description;
  this.time = new Date(info.valid_date).toDateString();
}



//============================================
//============================================
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
