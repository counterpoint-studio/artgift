# Art Gift

_Short tagline, grab from the Helsinki Fest site._

GIF EXCERPT OF BOOKING PROCESS VIDEO

This repository contains the application source code for the Art Gift application and backend, as well as instructions for setting up Art Gifts in your own city.

TOC

## Conceptual Overview

The basic idea underlying Art Gifts is that you have a number of artists moving around a city, delivering gifts to people, meeting them at specific times at specific locations. People may book gifts for their loved ones for a specific time and place, but they will not know anything about the artist that will deliver them. That remains a surprise.

In Helsinki all the gifts were delivered during a single weekend, but the system can also support extended periods of time.

From a _gift giver's_ point of view, you enter the gift receiver's address and other information, choose an available time slot, await confirmation, and then just turn up at the address, taking the gift receiver with you.

From an _artist's_ point of view, you have an itinerary of gifts you must deliver during your "shift", all contained within a geographic region.

The central concepts you see in the application code as well as the database are:

- _Artists_ - people who deliver gifts.
- _Regions_ - geographic areas of the city, such as districts, neighbourhoods, or administrative regions.
- _Itineraries_ - time windows during which an artist is expected to be delivering gifts at a certain region.
- _Slots_ - A specific date and time at a specific region, for which a gift may be booked.
- _Gifts_ - A booking for a specific slot, to deliver a gift to an address within the region the slot is contained in.
- _Assignments_ - Within an Itinerary, the list of Gifts an Artist is meant to deliver.

## Process Overview

In a chronological order and from a technical point of view, the process of runnning an Art Gifts event has roughly the following timeline:

### 1. Preparation

1. Event producers design the parameters of the event: When, how many gifts, which geographic regions, which artists.
2. Technical staff set up the basic parameters as described in this guide, and deploy the system.
3. Event producers enter Slot and Artist information into the system.

### 2. Bookings

1. Event producers open the system for bookings.
2. The general public books gifts by using the application.
3. Event producers manually review all bookings, and confirm or reject them.
4. When all gifts are booked, or when a predefined booking period ends, event producers close the bookings.

### 3. Artist Invitations

Artists are sent invitations into the app, from which they may see the gifts assigned to them.

### 4. Deliveries

Artists deliver the gifts, following the itineraries they were assigned.

PHOTO OF AN ART GIFT?

## Development

The code as provided here was used for Art Gifts in Helsinki in August 2020. We believe it should localise to other cities and regions easily, and this guide provides the instructions for doing so.

We do, however, expect some further development work to be needed when the software is used in new kinds of circumstances. We hope you find the source code malleable to your situation, and we do also appreciate contributions in the form of Pull Requests and Issue reports to this repository.

## Technical Overview

![system diagram](/docs-assets/artgift-system-diagram.png)

The system is written in TypeScript, and consists of three main subsystems, which reside in three respective directories:

- `frontend` - The public-facing _frontend application_ used by the general public as well as by artists, built with Gatsby and React.
- `admin` - The back office _admin application_ for production staff, built with React.
- `functions` - Firebase backend functionality: Database triggers and indexes, scheduled jobs, security rules, and scripting.

In addition to the code contained in this repository, the system has 3-4 service dependencies:

- _Firebase_, including a Firestore database, and Functions for backend business logic.
- _Mapbox_ for rendering map views and for address geocoding.
- _Mandrill_ for outgoing emails.
- An _SMS sending API_ for outgoing text messages. In Helsinki we interfaced with [https://tekstari.fi/](tekstari.fi) but this will need to be substituted with a local operator in your country.

## Setup Guide

The following steps describe the technical setup for getting the Art Gift system going, from setting up the necessary external dependencies to having everything running in a local development environment.

This technical setup keeps you in the original Helsinki geographic region, localisation, and visual style. Once you have the technical setup done, see the Localisation guide below on how to adapt the system to your own Art Gift event.

### Clone this repository and install

1. Make yourself a (public or private) clone of the repository on Github, and then clone it onto your local machine.
2. Make sure you have [Node.js](https://nodejs.org/en/) and [Yarn](https://yarnpkg.com/) installed on your local development machine.

### Prerequisites

#### Firebase

1. Go to [https://firebase.google.com/](firebase.google.com) and sign in with your Google account, if you have not already.
2. Click on "Get Started", then "Create a Project" and follow the on-screen instructions for setting up a Firebase project, until your through to the Dashboard of your new project.
3. Go to Settings -> Usage and Billing -> Details & Settings and enable the "Blaze" billing plan.
4. Go to Database -> Create database. Create a database in production mode, choosing the closest geographic location to you.
5. Go to Project Overview -> Add app. Register a _Web App_ called "Frontend".
   Once you've done so, find the values shown in the `firebaseConfig` object under the "Add Firebase SDK" section.

   In your local clone of this repository, create the [dotenv](https://www.npmjs.com/package/dotenv) file `frontend/.env.development`, and populate it with environment variables based on this Firebase configuration:

   ```
   FIREBASE_API_KEY=your api key
   FIREBASE_AUTH_DOMAIN=your auth domain
   FIREBASE_DATABASE_URL=your database url
   FIREBASE_PROJECT_ID=your project id
   FIREBASE_STORAGE_BUCKET=your storage bucket
   FIREBASE_MESSAGING_SENDER_ID=your messaging sender id
   FIREBASE_APP_ID=your app id
   ```

6. Go to Project Overview -> Add app again. Register a _Web App_ called "Admin".
   Once you've done so, find the values shown in the `firebaseConfig` object under the "Add Firebase SDK" section.

   In your local clone of this repository, create the [dotenv](https://www.npmjs.com/package/dotenv) file `admin/.env.development`, and populate it with environment variables based on this Firebase configuration:

   ```
   REACT_APP_FIREBASE_API_KEY=your api key
   REACT_APP_FIREBASE_AUTH_DOMAIN=your auth domain
   REACT_APP_FIREBASE_DATABASE_URL=your database url
   REACT_APP_FIREBASE_PROJECT_ID=your project id
   REACT_APP_FIREBASE_STORAGE_BUCKET=your storage bucket
   REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your messaging sender id
   REACT_APP_FIREBASE_APP_ID=your app id
   ```

7. Go to Authentication -> Set Up Sign In method. Enable the "Google" Sign-in provider. Under Authorized domains, be sure to include both `localhost` and the domain name under which you plan to deploy the Art Gift Admin user interface.
8. Go to Settings -> Service Accounts -> Firebase Admin SDK. Click "Generate new private key". This will download a Firebase Admin SDK private key file we'll need to run local scripts. Rename it to `/your/artgift/clone/dir/functions/art-gift-firebase-adminsdk-credentials.json`.

#### Mapbox

1. Go to [https://www.mapbox.com/](mapbox.com) and create an account.
2. Go to Access Tokens -> Create a Token. You can use the default Scopes provided. If you know what URLs your Art Gift application will be deployed in, enter those URLs to the Token Restrictions section, and be sure to also include `http://localhost:8000` and `http://localhost:3000`. You can also leave the URL restrictions empty.
3. Once the token has been created, copy it to the clipboard.
4. Paste the token onto a new environment variable in `frontend/.env.development`:
   ```
   GATSBY_MAPBOX_ACCESS_TOKEN=your access token
   ```
5. Also paste it to `admin/.env.development`
   ```
   REACT_APP_MAPBOX_ACCESS_TOKEN=your access token
   ```

#### MailChimp Mandrill

This section only applies if you wish to send emails (booking notifications, reminders) out from the system.

1. Go to [https://mailchimp.com/](mailchimp.com) and sign up.
2. Navigate to Automations -> Transactional Email.
3. Follow the instructions to enable the Mandrill plan if requested, until you're through to the Mandrill dashboard.
4. Go to Settings -> Domains -> Sending Domains. Add a Domain for the email address you will be using as the "From" address on your outgoing emails.
5. Get the Sending Domain verified following the instructions provided by Mandrill. You will need to modify your DNS settings, or work with someone who's able to do it for you.
6. Go to SMTP & API Info and create a New API Key. You'll need this in the next step when deploying Firebase.

### Deploy Firebase Functions, Indexes, and Authorization Rules

After having setup the Firebase Project and Applications as described above, you can deploy the Art Gift backend to that project. This includes backend business logic (from `functions/functions`), database indexes (from `functions/firestore.indexes.json`), and database security rules (from `functions/firestore.rules`).

1. Install the [Firebase CLI](https://firebase.google.com/docs/cli)
2. Log in to Firebase using the cli: `firebase login`
3. Go to the functions directory: `cd /your/artgift/clone/directory/functions`
4. Set the Firebase project created above as the default: `firebase use --add`, select the project from the list, and enter the alias `default`.
5. Set the following Firebase configuration variables, needed by the backend functions:
   ```
   firebase functions:config:set artgift.baseurl="the URL the frontend application will be deployed to"
   firebase functions:config:set artgift.emailapi.fromaddress="the sender email address used in outgoing Mandrill emails"
   firebase functions:config:set artgift.emailapi.fromname="the sender name used in outgoing Mandrill emails"
   firebase functions:config:set artgift.emailapi.apikey="the Mandrill API key generated in the previous section"
   ```
6. Install NPM dependencies for the backend functions: `cd functions && npm install`
7. Deploy everything to Firebase: `firebase deploy`

### Enable And Customise SMS Sending

The system is capable of sending out SMS notifications of bookings, confirmations, and reminders. But as the technical means of sending SMSs are specific to each country, you will likely need to do a bit of development work to implement one for an SMS provider in your country.

By default, SMS sending is disabled. Go to `functions/functions/src/sms/index.ts` to see how to enable them, and use the `tekstariFiSMSSender.ts` as an example for how to create a sender that works with the API of your SMS provider.

### Prepare And Apply Database Seed

Next, seed the Firestore database with initial data.

The project contains a database initialisation script that sets the database to an initial state, with an initial set of Admin users, Artists, Slots, and Itineraries. All of this information can also be managed in the Admin UI, so using this initialisation script is not strictly necessary, _except_ for populating the first Admin users, as otherwise no one will be able to access the Admin UI. This is what we're going to do now.

1. Go to the scripts directory `cd functions/scripts`
2. Install script dependencies: `npm install`
3. Find the file `databaseSeed.example.json` and open it in an editor. In the `admins` section, add the Gmail address of at least one admin user.
4. Initialise the database with this seed: `npm run prod:initDatabase databaseSeed.example.json`

### Launch Admin App

We now have everything ready to run locally.

1. Go to the admin directory: `cd admin`
2. Install dependencies: `yarn`
3. Start the local dev server: `yarn start`. This should also open a new browser tab for the admin.
4. Sign in using Google Authentication, with one of the email addresses used in the database seed above. Upon successful login you will be taken to the Admin UI. The features of this UI are described further below, in the Administration Guide.

### Launch Frontend App

1. Go to the frontend directory: `cd frontend`
2. Install dependencies: `yarn`
3. Start the local dev server: `yarn start`.
4. Open a browser tab at `http://localhost:8000` to see the app.

## Localisation Guide

After completing the steps in the Setup Guide, you should have fully functioning Art Gift system running locally, with a Firebase backend in the cloud. In this guide, you will customise the app to match the local circumstances of your Art Gift event.

### Geographic Regions

As described above, Art Gift Slots are divided into geographic regions within a city. These regions should be small enough that artists can move around in them from one gift location to the next. In Helsinki, we divided the city into its seven administrative regions, and you should find a similar division for your city.

Once you've decided on the regions, you'll need to obtain the geometries of these regions as a GeoJSON FeatureCollection. Many city authorities make such data openly available, and it can also be obtained from commercial providers. If you can't find anything else, you can draw your regions on a map yourself using the drawing tools at [geojson.io](https://geojson.io/).

When you've obtained your GeoJSON data, place it in the file `frontend/src/data/region_data.json`, replacing the Helsinki data.

Then inspect the data, and see which property in the "properties" section contains the name of the region. Make sure this property name matches the value of `REGION_NAME_PROPERTY` in `frontend/src/constants.ts`. For example, if the GeoJSON properties look like this:

```json
"properties": {
    "OBJECTID": 50,
    "Name": "South Boston",
    "Acres": 1439.8888073099999,
    "Neighborhood_ID": "17",
    "SqMiles": 2.25,
    "ShapeSTArea": 62721306.143917084,
    "ShapeSTLength": 64998.420282952466
},
```

The constant should be define like this:

```ts
export const REGION_NAME_PROPERTY = "Name";
```

Once you've done this, you should see the frontpage of the frontend app zoom into your city region.

On the admin side, also make sure the region names in `admin/src/constants.ts` match those found in your GeoJSON - e.g.

```ts
export const REGIONS = [
  "Roslindale",
  "Jamaica Plain",
  "Mission Hill",
  "Longwood",
  "Bay Village",
  "Leather District",
  "Chinatown",
  "North End",
  "Roxbury",
  "South End",
  "Back Bay",
];
```

### Schedule

To specify the dates and times during which your Art Gift event runs, open `admin/src/constants.ts`, and find the `DATES` constant. Edit it to include all the dates you'll be running Art Gifts on in `YYYYMMDD` format, e.g.

```ts
export const DATES = ["20200910", "20200911", "20200912", "20200913"];
```

To specify what times of day you will be creating slots for, find the `HOURS` and `MINUTES` constants in the same file. In `HOURS`, specify the hours of day you'll be running Art Gifts, and in `MINUTES` the minutes of each hour.

For example, to support slots between 10AM and 6PM, every hour, on the hour, specify:

```ts
export const HOURS = [10, 11, 12, 13, 14, 15, 16, 17, 18];
export const MINUTES = [0];
```

Or to support slots between 12PM and 3PM, one every fifteen minutes:

```ts
export const HOURS = [12, 13, 14];
export const MINUTES = [0, 15, 30, 45];
```

Note that changing these constants do not automatically generate any bookable gift slots. They merely specify the parameters by which admin users may create slots using the Admin UI.

### Language Strings and i18n

The frontend application and the outgoing email and SMS messages support multilingual use, and two languages are included out of the box: English (UK) and Finnnish.

You will certainly want to edit the language strings provided, as many of them contain information specific to the individual Art Gift event.

#### Editing UI Strings

To edit UI strings to match the specifics of your event and your preferred Tone of Voice, find the existing i18n files in `frontend/src/intl` and make any edits you want. Pay special attention to any URLs, email addresses, dates, and times included in them, to match the messaging of your event.

Note that after making edits, you'll need to restart the frontend app server (the `yarn start` command) before you can see them in your local development environment.

#### Editing Outgoing Email and SMS content

To edit the content of the outgoing messaging, find the file `functions/functions/lib/messages.json` and make your edits there.

Then redeploy the Firebase Functions to apply these changes:

```
cd functions
firebase deploy --only=functions
```

#### Removing a language

To remove a language you don't want to include (when e.g. you dont want Finnish to be included in the language choices), open `frontend/gatsby-config.js` and find the section for `gatsby-plugin-intl`. Edit it to contain only the languages you want, e.g.

```js
{
    resolve: `gatsby-plugin-intl`,
    options: {
    path: `${__dirname}/src/intl`,
    languages: [`en`],
    defaultLanguage: `en`,
    redirect: true,
    },
},
```

#### Adding a language

To add a new language, first add it to the `gatsby-plugin-intl` section of `frontend/gatsby-config.js`, e.g.:

```js
{
    resolve: `gatsby-plugin-intl`,
    options: {
    path: `${__dirname}/src/intl`,
    languages: [`en`, `is`],
    defaultLanguage: `en`,
    redirect: true,
    },
},
```

Then add a new language file to `frontend/src/intl`. We recommend you copy one of the existing language files, and then edit it to translate to the new language:

```
cp frontend/src/intl/en.json frontend/src/intl/is.json
```

Then edit _all_ the language files in `frontend/src/intl` to include a translation for the name of the new language. (We use this when letting users choose the language of the gift receiver - which may be different than the UI language of the gift giver.)

```json
  "toFormLabelLanguageis": "Icelandic",
```

Finally, add a new section to `functions/functions/lib/messages.json` for the new language, again first copying the section of one of the existing languages, and then translating it.

### Other Constants

#### Mapbox Geocoding Parameters

To help Mapbox autocomplete and geocode street addresses when users type them in, find the following constants in `frontend/src/constants.ts` and edit them to match the geographic region:

```ts
export const MAPBOX_COUNTRY_CODE = "US";
export const MAPBOX_REGION_PLACE_NAME = "Boston";
```

Also find the same constants in `admin/src/constants.src` to apply the same change to address lookup in the admin application as well.

#### Address And Phone Number Validation

To localise the input validation for phone numbers and addresses, open `frontend/src/constants.ts`.

Edit `PHONE_NUMBER_REGEX` into a regular expression that matches phone numbers in your local format.

Edit `ADRESSS_STREET_NUMBER_MATCH` into a regular expression that successfully tests whether a street address contains the necessary street number for the artist to find the address.

Edit `ADDRESS_GEOCODING_PREFIX` into a regular expression that extracts from a street address the part of it that is suitable for geocoordinate lookup. Although the Mapbox geocoding API generally accepts any form of valid street address, we've found that including apartment numbers, zip codes, and such may make it misfire, and it is safer to extract the street name and number only, when possible.

#### Date and Time Formats

If you want to change the format in which dates and times are shown, make the edits you want in `frontend/src/services/dates.ts` for the frontend application,, and `admin/src/util/dateUtils.ts` for the Admin UI.

### Visual Styles

Modifying the visual style of the Art Gift frontend app is done primarily via three routes: Imagery, UI styles, and map styles.

### Customising Imagery

You'll find the image assets used in the app, including the logo and hero images, from `frontend/src/images`. Replace your own brand assets here.

As a special case, the head sponsor (which in Helsinki was [Helsingin Sanomat](https://hs.fi)) link and logo reference can be found in `frontend/src/components/footer.tsx`. You'll want to update both the image reference and the link target for this, or remove them if you don't wish to display a sponsor.

### Customising UI Styles

You'll find all the CSS for the application in modular `.scss` files for each page and component. However, the most important customisation points you may need have been extracted to two master stylesheets:

- `frontend/src/components/variables.scss` for default fonts, colour palette, sizing, and animation timings.
- `frontend/src/component/typography.scss` for font definitions.

### Customising Map Styles

Since the map is one of the most dominant visual elements in the application, you may want to customise it to match your visual style.

Go to [Mapbox Studio](https://studio.mapbox.com/) with your Mapbox account, and author a style to your liking.
Then copy the style URL of your new style, and replace the constant `MAPBOX_STYLE_URL` in `frontend/src/constants.ts` with it.

## Deployment Guide

Can be anywhere, recommend easy deployment on Netlify.
Build environment variables.
DNS: Two domains. Firebase auth domain. Firebase config domain.

## Administration Guide

Store lifecycle.
Admin features overview.

## License

The source code and other assets in this repository are [licensed under ISC](LICENSE.md)
