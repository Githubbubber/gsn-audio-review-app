// Utilities
const express = require("express");
const app = express();
const cors = require('cors');
const path = require('path');
const bp = require('body-parser');
const fileupload = require("express-fileupload");
const {
  media_upload_query_statement,
  media_query_statement,
  insert_note_query,
  update_note_query,
  ratings_query_statement,
  notes_query_statement,
  notes_query_statement_insert,
  notes_query_statement_update,
  media_query_statement_retrieval,
  media_query_statement_insert
} = require("./server/database/query_strings.js");
const { Client } = require('pg');
const fs = require("fs");
require('dotenv').config();

app.use(express.json());
app.use(fileupload());
app.use(express.urlencoded({ extended: true }));
app.use(bp.json());
app.use(bp.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'client', 'public')));
app.use(express.static('./files'));
app.use(express.static('./files/logs'));
app.use(cors(require("./server/tools/cors_options")));

const client = new Client({
  connectionString: process.env.DATABASE_URL || process.env.PG_URI_APP,
  ssl: {
    rejectUnauthorized: false
  }
});

client.connect()
.then(() => console.log('Connection has been established successfully.'))
.catch((err) => {  
  logger({ 
    location: "pg_client_connect",
    req: "client variable: " + client + 
          " -|- process.env.PGUSER: " + process.env.PGUSER + 
          " -|- process.env.PGHOST: " + process.env.PGHOST + 
          " -|- process.env.PGPASSWORD: " + process.env.PGPASSWORD +
          " -|- process.env.PGDATABASE: " + process.env.PGDATABASE +
          " -|- process.env.PGPORT: " + process.env.PGPORT,
    message: err 
  });
  
  console.error('Unable to connect to the database:', err); 
});

const isProduction = process.env.NODE_ENV === "production";

console.log(` `);
console.log(` `);
console.log(` `);

// if (isProduction) {
  // console.log(`Production routes...`);
  app.use(express.static("client/build"));
// } else {  
  // console.log(`Development routes...`);
  const getQueryValues = (queryStatement, params = []) => {
    return new Promise((resolve, reject) => {
      client.query(queryStatement, params, (err, rows) => {                                                
          if (err || rows === undefined) {
            logger({
              location: "getQueryValues", 
              req: "Query statement: " + queryStatement +
                    " -|- Params: " + params, 
              res: "Rows: " + rows,
              message: err
            });

            reject(new Error(err));
          } else {
            resolve(rows);
          }
        }
      )}
    );
  };

  app.get("/api/usingle", (req, res) => {
    console.log(`Production routes...`);
    const media_id = parseInt(req.query.media_id) ? parseInt(req.query.media_id) : 1;

    const user_id = 1;
    let dataToSend = {};

    getQueryValues(media_query_statement, [ media_id ])
    .then((data) => {
      dataToSend = data.rows[0];

      return getQueryValues(notes_query_statement, [ media_id, user_id ]);
    })
    .then((data) => {
      dataToSend = {...dataToSend, "totalNotesFromServer": data.rows};

      res.status(200).send(dataToSend);
    })
    .catch((err) => {   
      logger({
        location: "get_usingle_mediaQuery", 
        req: "media_query_statement: " + media_query_statement + " -|- notes_query_statement: " + notes_query_statement, 
        res: "N/A",
        headers: req.rawHeaders[9] + " -|- " + 
                  req.rawHeaders[13] + " -|- " + 
                  req.rawHeaders[21] + " -|- " + 
                  req.rawHeaders[22] + "-" + 
                  req.rawHeaders[23],
        message: err
      });      
        
      console.error("Promise rejection error (Media): " + err);

      throw err;
    });
  });

  app.post("/usingle", (req, res) => {
    const {
      is_note_updated,
      note_id,
      note_body,            // notes: The written note
      note_timestamp,       // notes: Timestamp
      media_id,             // notes and media: media id
      user_id,               // notes and users: user id
    } = req.body;

    const converted_datetime = new Date();
    
    if (!is_note_updated) {
      const insert_values = [ 
        user_id, 
        media_id, 
        note_body, 
        note_timestamp, 
        converted_datetime,
        converted_datetime,
        converted_datetime
      ];

      getQueryValues(insert_note_query, insert_values)
        .then(data => {
          res.status(200).send({ message: "New note saved", data: { id: data.rows[0].id } });
        })
        .catch(err => {
          logger({
          location: "post_usingle_new_note", 
          req: "Body: " + JSON.stringify(req.body), 
          res: "New note not saved",
          headers: req.rawHeaders[9] + " -|- " + 
                    req.rawHeaders[13] + " -|- " + 
                    req.rawHeaders[21] + " -|- " + 
                    req.rawHeaders[22] + "-" + 
                    req.rawHeaders[23],
          message: JSON.stringify(err)
        }); 

        console.log(err);
        
        res.status(500).send({ message: "New note not saved", code: 200 });
        });
    } else {
      const update_values = [ 
        note_body, 
        note_timestamp,
        converted_datetime,
        converted_datetime, 
        note_id,
        media_id
      ];

      getQueryValues(update_note_query, update_values)
        .then(() => { 
          res.status(200).send({ message: "Updated note saved" });
        })
        .catch((err) => {
          logger({
            location: "post_usingle_updated_note", 
            req: req.query, 
            res: "Updated note not saved",
            headers: req.rawHeaders[9] + " -|- " + 
                      req.rawHeaders[13] + " -|- " + 
                      req.rawHeaders[21] + " -|- " + 
                      req.rawHeaders[22] + "-" + 
                      req.rawHeaders[23],
            message: err
          });
          
          res.status(500).send({ message: "Updated note not saved", code: 200 }); 
        });
    }
  });

  app.post("/media", (req, res) => {
    const { fileName, description, mediaType, projectName } = req.body;
    const { mediaFileToUpload } = req.files;

    const file_directory = __dirname + "/files/";
    const converted_datetime = new Date();

    mediaFileToUpload.mv(`${file_directory}${fileName}`, (err) => {
      if (err) {
        res.status(500).send({ message: "File upload failed", code: 200 });
      }
      
      const media_values = [ description, fileName, mediaType, projectName, converted_datetime, file_directory, converted_datetime, converted_datetime ];

      getQueryValues(media_upload_query_statement, media_values)
      .then(() => {
        res.status(200).send({ message: "File Uploaded" });
      })
      .catch((err) => {
        logger({
          location: "post_media", 
          req: req.query, 
          res: "Promise rejection error",
          headers: req.rawHeaders[9] + " -|- " + 
                    req.rawHeaders[13] + " -|- " + 
                    req.rawHeaders[21] + " -|- " + 
                    req.rawHeaders[22] + "-" + 
                    req.rawHeaders[23],
          message: err
        });
        
        console.error("Promise rejection error: " + err) 
      });
    });
  });  

  app.get("/*", function(req, res) {
    console.log(`Referring to the client...`);
    res.sendFile(path.join(__dirname, "./client/build/index.html"));
  });
// }

const logger = (details) => {
  let current = ((new Date()).toLocaleString()).replace(/\D*/g, "");
  let file_name = `${details.location}_${current}.log`;

  let log_data = {
    message: details.message,
    req: details.req ? details.req : "N/A",
    res: details.res ? details.res : "N/A",
    headers: details.headers ? details.headers : "N/A",
  };

  fs.writeFile(file_name, JSON.stringify(log_data, null, '\t') + "\n===============\n", "utf8", (error, data) => {
    console.log("Write complete"); console.log(error); console.log(data); 
  });
};

app.listen(process.env.PORT || 3001, function() {
  console.log(process.env.SERVER_PORT);
});
