import { Router, Request, Response } from 'express';
import { FeedItem } from '../models/FeedItem';
import { requireAuth } from '../../users/routes/auth.router';
import * as AWS from '../../../../aws';

const router: Router = Router();

// Get all feed items
router.get('/', requireAuth, async (req: Request, res: Response) => {
    const items = await FeedItem.findAndCountAll({order: [['id', 'DESC']]});
    items.rows.map((item) => {
            if (item.url) {
                item.url = AWS.getGetSignedUrl(item.url);
            }
    });
    res.send(items);
});

router.get('/:id', async(req: Request, res: Response) => {
    // @ts-ignore
    const item: FeedItem = await FeedItem.findByPk(req.params['id']);
    res.send(item);
});

// update a specific resource
router.patch('/:id',
    requireAuth,
    async (req: Request, res: Response) => {
        const caption = req.body.caption;
        const url = req.body.url;
        const existing_item = await FeedItem.findByPk(req.params['id']);
        existing_item.caption = req.body.caption;
        existing_item.url = req.body.url;
        const saved_item = await existing_item.save();
        res.status(201).send(saved_item);
});


// Delete a specific resource
router.delete('/:id', async(req: Request, res: Response) => {
 const id = req.params['id'];
 const existing_item: FeedItem = await FeedItem.findByPk(id);
 const deleted_item = existing_item.destroy();

 res.status(201).send('Item with id ' +  id  + ' deleted');
});

// Batch delete - delete the feed items whose id lie in request json
router.post('/batchdelete', async(req: Request, res: Response) => {
    const id_list: number[]  = req.body.ids;
    for (const id of id_list) {
        console.log('Id ' + id);
        const existing_item: FeedItem = await FeedItem.findByPk(id);
        if (existing_item) {
            await existing_item.destroy().catch( err =>
                console.log('Delete item failed with error ' + err)
            );
            console.log('Entry for item ' + id + ' deleted');
        } else {
            console.log('Entry for item ' + id + ' doesnt exist');
        }
    }
    res.status(201).send('Items with ids ' + id_list + ' deleted');
} );


// Get a signed url to put a new item in the bucket
router.get('/signed-url/:fileName',
    requireAuth,
    async (req: Request, res: Response) => {
    const { fileName } = req.params;
    const url = AWS.getPutSignedUrl(fileName);
    res.status(201).send({url: url});
});

// Post meta data and the filename after a file is uploaded
// NOTE the file name is they key name in the s3 bucket.
// body : {caption: string, fileName: string};
router.post('/',
    requireAuth,
    async (req: Request, res: Response) => {
    const caption = req.body.caption;
    const fileName = req.body.url;

    // check Caption is valid
    if (!caption) {
        return res.status(400).send({ message: 'Caption is required or malformed' });
    }

    // check Filename is valid
    if (!fileName) {
        return res.status(400).send({ message: 'File url is required' });
    }

    const item = await new FeedItem({
            caption: caption,
            url: fileName
    });

    const saved_item = await item.save();

    saved_item.url = AWS.getGetSignedUrl(saved_item.url);
    res.status(201).send(saved_item);
});

export const FeedRouter: Router = router;
