# HSL Dta source

<https://www.hsl.fi/hsl/avoin-data>

Kaupunkipyöräasemien Origin-Destination (OD)-data sisältää kaikki Helsingin ja Espoon kaupunkipyörillä poljetut matkat. Aineisto sisältää tiedon yksittäisen matkan lähtö- ja päätösasemasta, lähtö- ja päätösajasta, pituudesta (metreinä) sekä kestosta (sekunteina). Aineistoa on saatavilla kaudesta 2016 lähtien, joko kuukausittain (csv) tai koko kausi (zip). Datan omistaa City Bike Finland.

Kuukausikohtainen aineistopaketti (2016-2017 touko-loka) & (2018 eteenpäin huhti-loka) : "dev.hsl.fi/citybikes/od-trips-[vuosi]/[vuosi]-[kk].csv". Esimerkiksi "dev.hsl.fi/citybikes/od-trips-2021/2021-04.csv"

Vuosittainen aineistopaketti: "dev.hsl.fi/citybikes/od-trips-[vuosi]/od-trips-[vuosi].zip". Esimerkiksi "dev.hsl.fi/citybikes/od-trips-2021/od-trips-2021.zip"

## 2024 Season

FOllowing stations were not found from digitransit API:

Fetching coordinates for 459 unique stations...
✅ Retrieved 583 stations from Digitransit API

⚠️ Warning: 6 stations not matched with API data:

- Kulttuuriaukio
- Pop-Up Kansalaistori
- Relay Box test station
- Säterinrinne
- Workshop Helsinki
- Yhdyskunnankuja
  ✅ Matched 453 / 459 stations

## Data filtering

- Filter out stations not found from Digitransit API

### Trips

- Speed must be less than 50 kmh
- Distance and duration must be greater than zero
- Filter out trips starting or ending at unknown stations
