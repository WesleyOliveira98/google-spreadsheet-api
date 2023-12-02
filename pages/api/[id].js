
import { GoogleSpreadsheet } from 'google-spreadsheet';
import { JWT } from 'google-auth-library';
import NextCors from 'nextjs-cors';

export default async function users(req, res) {
    await NextCors(req, res, {
        methods: ['GET','POST'],
        origin: '*',
        optionsSuccessStatus: 200,
    });

    const id = req.query.id;
    if (!id) {
        res.status(400).json({ error: 'Spreadsheet ID was not sent in the URL.' });
        return;
    }

    const serviceAccountAuth = new JWT({
        email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
        key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n"),
        scopes: [
            'https://www.googleapis.com/auth/spreadsheets',
        ],
    });

    switch (req.method) {

        case 'POST':
            try {
                const reqBody = req.body;
                if (!reqBody || Object.keys(reqBody).length === 0) throw new Error("Data was not sent!");
                const body = typeof reqBody === 'object' ? reqBody : JSON.parse(reqBody);

                console.log({ body });

                if (!body.sheet_name) throw new Error("Sheet name was not sent in the request body.");
                if (!body.rows || !body.rows.length || !Array.isArray(body.rows)) throw new Error("Rows was not sent in the request body.");

                const doc = new GoogleSpreadsheet(id, serviceAccountAuth);
                await doc.loadInfo();

                const sheet = doc.sheetsByTitle[body.sheet_name]
                await sheet.addRows(body.rows);

                res.status(201).json(body.rows);
            }
            catch (error) {
                res.status(400).json({ error: error.message });
            }

            break;

        default:
            res.status(405).json({ error: 'Method is not allowed' });
    }

}