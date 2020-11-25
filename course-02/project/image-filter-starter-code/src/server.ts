import express from 'express';
import bodyParser from 'body-parser';
import {filterImageFromURL, deleteLocalFiles} from './util/util';
import {requireAuth} from './auth';
import {Request, Response} from 'express';

(async () => {

  // Init the Express application
  const app = express();

  // Set the network port
  const port = process.env.PORT || 8082;
  
  // Use the body parser middleware for post requests
  app.use(bodyParser.json());

  // @TODO1 IMPLEMENT A RESTFUL ENDPOINT
  // GET /filteredimage?image_url={{URL}}
  // endpoint to filter an image from a public url.
  // IT SHOULD
  //    1. validate the image_url query
  //    2. call filterImageFromURL(image_url) to filter the image
  //    3. send the resulting file in the response
  //    4. deletes any files on the server on finish of the response
  // QUERY PARAMATERS
  //    image_url: URL of a publicly accessible image
  // RETURNS
  //   the filtered image file [!!TIP res.sendFile(filteredpath); might be useful]

  /**************************************************************************** */

  //! END @TODO1
  
  // Root Endpoint
  // Displays a simple message to the user
  app.get( "/", async ( req: Request, res: Response ) => {
    const response_body: JSON = JSON.parse('{"message" : "try GET /filteredimage?image_url={{}}"}');
    console.log(response_body);
    res.send(response_body)
  });

  app.get("/filteredimage", async(req: Request, res: Response) => {
    const image_url: string = req.query['image_url'];
    if (image_url == null) {
      res.status(400).send('Please specify image url in query');
    }
    console.log('Got image url ' + image_url);
    const filtered_image_path: string = await filterImageFromURL(image_url);
    console.log('Filtered image saved at location ' + filtered_image_path);
    res.status(200).sendFile(filtered_image_path, function (err: Error) {
      if (err == undefined) {
        console.log('File sent with response');
      } else {
        console.log('Error occured while sending response ' + err.message);
      }
      console.log('Deleting the filtered image file');
      let local_files: Array<string> = new Array(filtered_image_path);
      deleteLocalFiles(local_files);
    });
  });
  

  // Start the Server
  app.listen( port, () => {
      console.log( `server running http://localhost:${ port }` );
      console.log( `press CTRL+C to stop server` );
  } );
})();
