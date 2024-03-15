// Copyright to AuNguyen@owlstanding.com

const express = require('express');
const admin = require('firebase-admin');
const geolib = require('geolib');

// Initialize Firebase Admin
const serviceAccount = require('./gme-fb-admin-key.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://rate-my-ex-default-rtdb.firebaseio.com/',
});

const db = admin.database();
const zipcodesRef = db.ref('zipcodes');

const app = express();
app.use(express.json());

app.get('/distance', async (req, res) => {
  try {
    const { zip1, zip2 } = req.query;

    const snapshot = await zipcodesRef.once('value');
    const zipcodes = snapshot.val();
    const zipcodeData = Object.values(zipcodes);

    const location1 = zipcodeData.find(z => z.zip_code == zip1);
    const location2 = zipcodeData.find(z => z.zip_code == zip2);

    if (!location1 || !location2) {
      return res.status(404).send({ error: 'One or both zip codes not found.' });
    }

    const distance = geolib.getDistance(
      { latitude: location1.latitude, longitude: location1.longitude },
      { latitude: location2.latitude, longitude: location2.longitude }
    );

    // Convert meters to miles (1 meter = 0.000621371 miles)
    const distanceInMiles = distance * 0.000621371;

    res.send({
      distance: `${distanceInMiles.toFixed(2)} miles`
    });
  } catch (error) {
    console.error(error);
    res.status(500).send({ error: 'Internal server error' });
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Server running on port ${port}`));

