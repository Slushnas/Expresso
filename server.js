const express = require('express');
const app = express();
const PORT = process.env.port || 4000;
const bodyParser = require('body-parser');
app.use(bodyParser.json());
const morgan = require('morgan');
app.use(morgan('tiny'));
const cors = require('cors');
app.use(cors());
const errorhandler = require('errorhandler');
app.use(errorhandler());

const apiRouter = require('./api/api');
app.use('/api', apiRouter);


app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}.`);
});

module.exports = app;