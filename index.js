const express = require('express');
const app = express();

app.use(express.static(__dirname + '/public'))

app.listen(process.env.PORT || 3000, (err) => {
    if (err) throw err;

    console.log(`http://localhost:${process.env.PORT || 3000}/`);
});