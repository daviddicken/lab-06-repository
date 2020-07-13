'use strict';

const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());

const PORT = process.env.PORT || 3001;
app.listen(PORT);











app.get('*', (request, responce) => {

  responce.status(404).send('Page not Found');
});
