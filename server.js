require('dotenv').config();
const express = require('express');
const exphbs = require('express-handlebars');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');
const passport = require('passport');
const moment = require('moment');
const helmet = require('helmet');
const PORT = process.argv[2] || process.env.PORT || 3333;
const app = express();
const db = require('./models');

app.use(cookieParser());
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.engine('handlebars', exphbs({ defaultLayout: 'main' }));
app.set('view engine', 'handlebars');
app.use(morgan('dev')); // Hook up the HTTP logger
app.use(express.static('public'));

require('./config/passport')(db, app, passport); // pass passport for configuration

var my_var = 6;

// Define our routes
app.use(require('./routes/htmlRoutes')(db));
app.use('/api', require('./routes/apiRoutes')(passport, db));

// Secure express app
app.use(helmet.hsts({
  maxAge: moment.duration(1, 'years').asMilliseconds()
}));

// catch 404 and forward to error handler
if (app.get('env') !== 'development') {
  app.use((req, res, next) => {
    let err = new Error('Not Found: ' + req.url);
    err.status = 404;
    next(err);
  });
}

const syncOptions = {
  force: process.env.FORCE_SYNC === 'true'
};

if (app.get('env') === 'test') {
  syncOptions.force = true;
}

db.sequelize.sync({ force: process.env.FORCE_SYNC === 'true' }).then(() => {
  if (syncOptions.force || app.get('env') === 'test') {
    // console.log("RUNNIG SEEDS");
    require('./db/seed')(db);
  }
  if (!module.parent) {
    app.listen(PORT, () => {
      console.log(`App listening on port: ${PORT}`);
    });
  }
});

module.exports = app;
