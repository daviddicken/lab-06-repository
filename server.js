'use strict';

const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`listening 0n ${PORT}`);
});











app.get('*', (request, response) => {

  response.status(404).send('Page not Found');
});
